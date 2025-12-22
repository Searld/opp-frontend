"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import { use } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Plus, Edit, ChevronDown, ChevronRight } from 'lucide-react'
import { CreateTaskDialog } from "@/components/create-task-dialog"
import { TaskDetailDialog } from "@/components/task-detail-dialog"
import { apiClient } from "@/lib/api-client"

interface Task {
  id: string
  title: string
  description?: string
  responsible: string
  responsibleStudentId?: string
  deadline: string
  completed: boolean
  subtasks: Task[]
  prerequisites?: string[]
  dependentTaskId?: string | null
}

interface Project {
  id: string
  name: string
  subject: string
  description: string
  deadline: string
  owner: string
  participants: string[]
  tasks: Task[]
}

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const projectId = resolvedParams.id
  return <ProjectPageContent key={projectId} projectId={projectId} />
}

function ProjectPageContent({projectId} : { projectId: string }) {
  const [isCreateTaskDialogOpen, setIsCreateTaskDialogOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteLoading, setInviteLoading] = useState(false)
  const [project, setProject] = useState<Project | null>(null)
  const [students, setStudents] = useState<Map<string, string>>(new Map())
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set())

  // ====== Вспомогательные мапперы между DTO и локальной моделью ======
  const dtoToTask = (dto: any): Task => ({
    id: dto.id,
    title: dto.name,
    description: dto.result,
    responsible: getStudentName(dto.responsibleStudentId) || dto.responsibleStudentId, // пока показываем id студента
    responsibleStudentId: dto.responsibleStudentId,
    deadline: dto.deadline,
    completed: !!dto.isCompleted,
    subtasks: [],
    prerequisites: dto.prerequisites || [],
    dependentTaskId: dto.dependentTaskId ?? null,
  })

  const taskToDtoPartial = (task: Task) => ({
    name: task.title,
    result: task.description ?? "",
    deadline: task.deadline,
    isCompleted: task.completed,
    responsibleStudentId: task.responsibleStudentId ?? task.responsible,
    prerequisites: task.prerequisites ?? [],
    dependentTaskId: task.dependentTaskId ?? null,
    projectId: project?.id,
  })

  // Построить древовидную структуру задач из плоского списка DTO (dependentTaskId -> parent id)
  const buildTaskTree = (dtos: any[]): Task[] => {
    const map = new Map<string, Task>()
    dtos.forEach(dto => map.set(dto.id, dtoToTask(dto)))

    const roots: Task[] = []
    map.forEach((task) => {
      const parentId = task.dependentTaskId
      if (parentId && map.has(parentId)) {
        map.get(parentId)!.subtasks.push(task)
      } else {
        roots.push(task)
      }
    })

    return roots
  }

  // ====== Загрузка проекта и задач с сервера ======
  useEffect(() => {
    let mounted = true

    const load = async () => {
      try {
        // Получаем проект (ProjectDto -> локальный Project)
        const projDto = await apiClient.getProject(projectId)
        const taskDtos = await apiClient.getProjectTasks(projectId)
        if (!mounted) return

        const tasks = buildTaskTree(taskDtos)

        const studentIds = [
          projDto.creatorId,
          ...(projDto.members || [])
        ].filter(id => id) as string[]

        const studentMap = new Map<string, string>()

        for (const studentId of studentIds) {
          try {
            const student = await apiClient.getStudentById(studentId) // или специальный эндпоинт для получения по id
            studentMap.set(studentId, `${student.firstName} ${student.lastName}`)
          } catch (err) {
            console.error(`Failed to load student ${studentId}:`, err)
            studentMap.set(studentId, studentId) // fallback на id
          }
        }

        const mappedProject: Project = {
          id: projDto.id,
          name: projDto.name,
          subject: projDto.subjectName ?? "", // если нужен subject name — нужен отдельный вызов
          description: projDto.description,
          deadline: projDto.deadline,
          owner: projDto.creatorId ?? "",
          participants: projDto.members ?? [],
          tasks,
        }
        console.log(mappedProject.tasks)
        setProject(mappedProject)
        setStudents(studentMap)
      } catch (err) {
        console.error("Failed to load project or tasks:", err)
        // Можно показать UI-ошибку; пока оставляем консоль
      }
    }

    load()

    return () => { mounted = false }
  }, [projectId])

  const areAllSubtasksCompleted = (task: Task): boolean => {
    if (task.subtasks.length === 0) return true
    return task.subtasks.every(subtask => subtask.completed && areAllSubtasksCompleted(subtask))
  }

  const getParticipantMapping = (): Map<string, string> => {
    const mapping = new Map<string, string>()

    if (!project) return mapping
    mapping.set(getStudentName(project.owner), project.owner)

    project.participants.forEach(participantId => {
      mapping.set(getStudentName(participantId), participantId)
    })

    return mapping
  }

  const getStudentName = (studentId: string): string => {
    return students.get(studentId) || studentId
  }

  // ====== Тоггл завершения задачи (оптимистичный UI + синхронизация с сервером) ======
  const toggleTaskCompleted = async (taskId: string, parentTaskId?: string) => {
    if (!project) return

    // обновляем локально
    const updateCompleted = (tasks: Task[]): Task[] => {
      return tasks.map(task => {
        if (task.id === taskId) {
          const canToggle = areAllSubtasksCompleted(task)
          if (!task.completed && !canToggle) {
            return task
          }
          return { ...task, completed: !task.completed }
        }
        if (task.subtasks.length > 0) {
          return { ...task, subtasks: updateCompleted(task.subtasks) }
        }
        return task
      })
    }

    const updatedProject = { ...project, tasks: updateCompleted(project.tasks) }
    setProject(updatedProject)

    // на сервер: обновляем конкретный таск (PUT)
    try {
      // находим задачу в локальной структуре чтобы получить её текущее состояние
      const findTask = (tasks: Task[]): Task | null => {
        for (const t of tasks) {
          if (t.id === taskId) return t
          if (t.subtasks.length > 0) {
            const res = findTask(t.subtasks)
            if (res) return res
          }
        }
        return null
      }
      const task = findTask(updatedProject.tasks)
      if (task) {
        await apiClient.updateTask(task.id, taskToDtoPartial(task))
      }
    } catch (err) {
      console.error("Failed to patch task completed state:", err)
      // откатить локальную смену статуса — безопаснее сделать рефетч с сервера:
      try {
        const taskDtos = await apiClient.getProjectTasks(project.id)
        const tasks = buildTaskTree(taskDtos)
        setProject({ ...project, tasks })
      } catch (e) {
        console.error("Failed to reload tasks after failed update:", e)
      }
    }
  }

  const handleInviteParticipant = async (email: string) => {
    if (!project || !email.trim()) return

    setInviteLoading(true)

    try {
      const student = await apiClient.getStudentByEmail(email)
      await apiClient.inviteStudent({
        email: email.trim(),
        projectId: project.id,
        studentId: student.id
      })

      // Можно показать уведомление об успехе
      alert(`Приглашение отправлено на ${email}`)
      setInviteEmail("")
      setIsInviteDialogOpen(false)

      // Опционально: обновить список участников
      // Либо перезагрузить проект, либо добавить оптимистично
      // const updatedProject = await apiClient.getProject(projectId)
      // setProject(updatedProject)

    } catch (err) {
      console.error("Failed to invite participant:", err)
      alert("Не удалось отправить приглашение. Проверьте email и попробуйте снова.")
    } finally {
      setInviteLoading(false)
    }
  }

  // ====== Создание задачи (через CreateTaskDialog) ======
  const handleTaskCreated = async (taskData: any) => {
    if (!project) return

    const findStudentIdByName = (name: string): string => {
      for (const [id, studentName] of students.entries()) {
        if (studentName === name) return id
      }
      return name // fallback если не нашли
    }
    const responsibleStudentId = findStudentIdByName(taskData.responsible)

    // Формируем локальную задачу (временно)
    const localNewTask: Task = {
      id: `temp_${Date.now()}`,
      title: taskData.title,
      description: taskData.description,
      responsible: taskData.responsible, // имя
      responsibleStudentId: responsibleStudentId, // id
      deadline: taskData.deadline,
      completed: false,
      subtasks: [],
      prerequisites: taskData.prerequisites ?? [],
      dependentTaskId: taskData.dependentTaskId ?? null,
    }

    // оптимистично добавляем в UI
    const updatedProject = { ...project, tasks: [...project.tasks, localNewTask] }
    setProject(updatedProject)

    // Отправляем на сервер — API ожидает поля name/result и т.д.
    try {
      const createdDto = await apiClient.createTask({
        name: localNewTask.title,
        result: localNewTask.description ?? "",
        deadline: localNewTask.deadline,
        projectId: project.id,
        responsibleStudentId: localNewTask.responsibleStudentId ?? localNewTask.responsible,
        dependentTaskId: localNewTask.dependentTaskId ?? null,
      })

      // заменяем временный id на реальный id сервера
      const createdTask = dtoToTask(createdDto)
      function replaceTemp(tasks: Task[]): Task[] {
        return tasks.map(t =>
            t.id === localNewTask.id
                ? createdTask
                : { ...t, subtasks: replaceTemp(t.subtasks) }
        )
      }

      setProject(prev => prev ? { ...prev, tasks: replaceTemp(prev.tasks) } : prev)
    } catch (err) {
      console.error("Failed to create task on server:", err)
      // откат: убрать локальную временную задачу и можно показать ошибку пользователю
      setProject(prev => prev ? { ...prev, tasks: prev.tasks.filter(t => t.id !== localNewTask.id) } : prev)
    }
  }

  // ====== Обновление задачи (вызывается из TaskDetailDialog) ======
  const updateTaskInArray = (tasks: Task[], targetId: string, newData: Task): Task[] => {
    return tasks.map(task => {
      if (task.id === targetId) {
        return newData
      }
      if (task.subtasks.length > 0) {
        return { ...task, subtasks: updateTaskInArray(task.subtasks, targetId, newData) }
      }
      return task
    })
  }


  // Добавьте функцию для удаления участника
  const handleDeleteParticipant = async (studentId: string) => {
    if (!project) return

    // Подтверждение удаления
    const participantName = getStudentName(studentId)
    const confirmDelete = window.confirm(`Вы уверены, что хотите удалить участника "${participantName}" из проекта?`)

    if (!confirmDelete) return

    try {
      // Отправляем запрос на удаление
      await apiClient.deleteStudentFromProject({
        projectId: project.id,
        studentId: studentId
      })

      // Оптимистично обновляем UI
      const updatedParticipants = project.participants.filter(id => id !== studentId)
      setProject({
        ...project,
        participants: updatedParticipants
      })

      // Показываем уведомление об успехе
      alert(`Участник "${participantName}" успешно удален из проекта`)

    } catch (err) {
      console.error("Failed to delete participant:", err)
      alert("Не удалось удалить участника. Попробуйте снова.")

      // В случае ошибки перезагружаем данные с сервера
      try {
        const projDto = await apiClient.getProject(projectId)
        setProject(prev => prev ? {
          ...prev,
          participants: projDto.members || []
        } : prev)
      } catch (e) {
        console.error("Failed to reload project after delete error:", e)
      }
    }
  }

// ====== Обновление задачи (вызывается из TaskDetailDialog) ======
  const handleTaskUpdated = async (updatedTask: Task) => {
    if (!project) return

    try {
      // Сначала обновляем основную задачу
      await apiClient.patchTask(updatedTask.id, taskToDtoPartial(updatedTask))

      // Проверяем, есть ли новые подзадачи (с временными id)
      const newSubtasks = updatedTask.subtasks.filter(st =>
          st.id.startsWith('temp_') || // если используется временный префикс
          /^\d+$/.test(st.id) // или если id состоит только из цифр (Date.now())
      )
      for (const subtask of newSubtasks) {
        try {
          const createdDto = await apiClient.createTask({
            name: subtask.title,
            result: subtask.description ?? "",
            deadline: subtask.deadline,
            projectId: project.id,
            responsibleStudentId: subtask.responsibleStudentId ?? subtask.responsible,
            dependentTaskId: updatedTask.id, // родительская задача
          })

          // Заменяем временный id в локальной структуре
          updatedTask.subtasks = updatedTask.subtasks.map(st =>
              st.id === subtask.id ? dtoToTask(createdDto) : st
          )
        } catch (err) {
          console.error(`Failed to create subtask "${subtask.title}":`, err)
          // Можно продолжить создание остальных подзадач
        }
      }

      // Теперь обновляем локальную структуру с правильными id
      const updatedTasks = updateTaskInArray(project.tasks, updatedTask.id, updatedTask)
      setProject({ ...project, tasks: updatedTasks })

    } catch (err) {
      console.error("Failed to update task on server:", err)
      // В случае ошибки — перезагружаем таски с сервера чтобы синхронизироваться
      try {
        const taskDtos = await apiClient.getProjectTasks(project.id)
        const tasks = buildTaskTree(taskDtos)
        setProject({ ...project, tasks })
      } catch (e) {
        console.error("Failed to reload tasks after failed update:", e)
      }
    }
  }


  const toggleTaskExpanded = (taskId: string) => {
    setExpandedTasks(prev => {
      const newSet = new Set(prev)
      if (newSet.has(taskId)) {
        newSet.delete(taskId)
      } else {
        newSet.add(taskId)
      }
      return newSet
    })
  }

  const renderTask = (task: Task, level: number = 0, key?: string) => {
    const canCompleteTask = areAllSubtasksCompleted(task)
    const isExpanded = expandedTasks.has(task.id)
    const hasSubtasks = task.subtasks.length > 0

    return (
        <div key={key} className={level > 0 ? "mt-2" : ""}>
          <div className={`border border-border rounded-lg bg-card shadow-sm ${level > 0 ? 'ml-8 border-l-4 border-l-primary/30' : ''}`}>
            <div className="p-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-start gap-3">
                {hasSubtasks && (
                    <button
                        onClick={() => toggleTaskExpanded(task.id)}
                        className="mt-0.5 hover:bg-muted rounded p-1 transition-colors flex-shrink-0"
                        aria-label={isExpanded ? "Свернуть подзадачи" : "Развернуть подзадачи"}
                    >
                      {isExpanded ? (
                          <ChevronDown className="h-5 w-5 text-primary" />
                      ) : (
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      )}
                    </button>
                )}
                {!hasSubtasks && <div className="w-8" />}

                <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleTaskCompleted(task.id)}
                    disabled={!task.completed && !canCompleteTask}
                    className={`mt-1 h-4 w-4 rounded border-2 flex-shrink-0 ${!task.completed && !canCompleteTask ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    title={!task.completed && !canCompleteTask ? 'Сначала завершите все подзадачи' : ''}
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3
                            className={`font-medium cursor-pointer hover:text-primary transition-colors ${task.completed ? "line-through text-muted-foreground" : ""}`}
                            onClick={() => setSelectedTask(task)}
                        >
                          {task.title}
                        </h3>
                        {hasSubtasks && (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                canCompleteTask
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            }`}>
                        {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length}
                      </span>
                        )}
                      </div>
                      {task.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {task.description}
                          </p>
                      )}
                      <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <span className="font-medium">Ответственный:</span> {getStudentName(task.responsible)}
                    </span>
                        <span className="flex items-center gap-1">
                      <span className="font-medium">Дедлайн:</span> {new Date(task.deadline).toLocaleDateString("ru")}
                    </span>
                      </div>
                      {hasSubtasks && !canCompleteTask && (
                          <div className="mt-2 text-xs text-destructive font-medium">
                            Завершите все подзадачи, чтобы отметить эту задачу выполненной
                          </div>
                      )}
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedTask(task)}
                        className="flex-shrink-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {hasSubtasks && isExpanded && (
              <div className="space-y-2 mt-2">
                {task.subtasks.map((subtask, index) => (
                    renderTask(subtask, level + 1, `${subtask.id}-${index}`)
                ))}
              </div>
          )}
        </div>
    )
  }

  if (!project) {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <p className="text-muted-foreground">Загрузка проекта...</p>
        </div>
    )
  }

  const allParticipants = [project.owner, ...project.participants]

  return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                  <Link href="/dashboard">
                    <ArrowLeft className="h-5 w-5" />
                  </Link>
                </Button>
                <div>
                  <h1 className="text-2xl font-bold">{project.name}</h1>
                  <p className="text-sm text-muted-foreground">Предмет: {project.subject}</p>
                </div>
              </div>
              <Button onClick={() => setIsCreateTaskDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Создать задачу
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-card rounded-lg border border-border p-6">
                <h2 className="text-lg font-semibold mb-3">Описание проекта</h2>
                <p className="text-muted-foreground">{project.description || "Описание отсутствует"}</p>
              </div>

              <div className="bg-card rounded-lg border border-border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Задачи</h2>
                  <span className="text-sm text-muted-foreground">
                {project.tasks.filter(t => t.completed).length} / {project.tasks.length} выполнено
              </span>
                </div>

                <div className="space-y-3">
                  {project.tasks.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        Пока нет задач. Создайте первую задачу для проекта.
                      </p>
                  ) : (
                      project.tasks.map((task, index) => (
                          renderTask(task, 0, `task-${task.id}-${index}`)
                      ))
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-card rounded-lg border border-border p-6">
                <h2 className="text-lg font-semibold mb-4">Информация о проекте</h2>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Дедлайн:</span>
                    <p className="font-medium">{new Date(project.deadline).toLocaleDateString("ru")}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Ответственный:</span>
                    <p className="font-medium">{getStudentName(project.owner)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-lg border border-border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Участники ({project.participants.length})</h2>
                  <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsInviteDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Пригласить
                  </Button>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-2 rounded bg-primary/10">
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium">
                      {getStudentName(project.owner)[0].toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <span className="text-sm">{getStudentName(project.owner)}</span>
                      <span className="text-xs text-muted-foreground ml-2">(Создатель)</span>
                    </div>
                  </div>

                  {project.participants
                      .filter(participantId => participantId !== project.owner)
                      .map((participantId) => (
                          <div key={participantId} className="flex items-center justify-between gap-3 p-2 rounded hover:bg-muted/50 group">
                            <div className="flex items-center gap-3 flex-1">
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                                {getStudentName(participantId)[0].toUpperCase()}
                              </div>
                              <span className="text-sm">{getStudentName(participantId)}</span>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteParticipant(participantId)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/20 hover:text-destructive"
                                title="Удалить участника"
                            >
                              <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                              >
                                <path d="M3 6h18" />
                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                <line x1="10" y1="11" x2="10" y2="17" />
                                <line x1="14" y1="11" x2="14" y2="17" />
                              </svg>
                            </Button>
                          </div>
                      ))}
                </div>
              </div>
            </div>
          </div>
        </main>

        <CreateTaskDialog
            open={isCreateTaskDialogOpen}
            onOpenChange={setIsCreateTaskDialogOpen}
            projectParticipants={allParticipants.map(id => getStudentName(id))}
            projectDeadline={project.deadline}
            onTaskCreated={handleTaskCreated}
        />

        {selectedTask && (
            <TaskDetailDialog
                task={selectedTask}
                participantNameToIdMap={getParticipantMapping()}
                onClose={() => setSelectedTask(null)}
                projectParticipants={allParticipants.map(id => getStudentName(id))}
                projectDeadline={project.deadline}
                onTaskUpdated={handleTaskUpdated}
            />
        )}

        <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Пригласить участника</DialogTitle>
              <DialogDescription>
                Отправьте приглашение на email. Пользователь получит уведомление.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="invite-email">Email участника</Label>
                <Input
                    id="invite-email"
                    type="email"
                    placeholder="example@university.edu"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Участник получит приглашение присоединиться к проекту
                </p>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsInviteDialogOpen(false)}
              >
                Отмена
              </Button>
              <Button
                  type="button"
                  onClick={() => handleInviteParticipant(inviteEmail)}
                  disabled={!inviteEmail.trim() || inviteLoading}
              >
                {inviteLoading ? "Отправка..." : "Отправить приглашение"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
  )
}
