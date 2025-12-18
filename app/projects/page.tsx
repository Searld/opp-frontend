"use client"

import { useState, useEffect } from "react"
import { use } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Plus, Edit, ChevronDown, ChevronRight } from 'lucide-react'
import { CreateTaskDialog } from "@/components/create-task-dialog"
import { TaskDetailDialog } from "@/components/task-detail-dialog"

interface Task {
  id: string
  title: string
  description?: string
  responsible: string
  deadline: string
  completed: boolean
  subtasks: Task[]
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
  const [isCreateTaskDialogOpen, setIsCreateTaskDialogOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [project, setProject] = useState<Project | null>(null)
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set())

  useEffect(() => {
    const stored = localStorage.getItem("projects")
    if (stored) {
      const projects = JSON.parse(stored)
      const found = projects.find((p: Project) => p.id === resolvedParams.id)
      if (found) {
        setProject(found)
      }
    }
  }, [resolvedParams.id])

  const toggleTaskCompleted = (taskId: string, parentTaskId?: string) => {
    if (!project) return

    const areAllSubtasksCompleted = (task: Task): boolean => {
      if (task.subtasks.length === 0) return true
      return task.subtasks.every(subtask => subtask.completed && areAllSubtasksCompleted(subtask))
    }

    const updateTaskInArray = (tasks: Task[]): Task[] => {
      return tasks.map(task => {
        if (task.id === taskId) {
          const canToggle = areAllSubtasksCompleted(task)
          if (!task.completed && !canToggle) {
            return task
          }
          return { ...task, completed: !task.completed }
        }
        if (task.subtasks.length > 0) {
          return { ...task, subtasks: updateTaskInArray(task.subtasks) }
        }
        return task
      })
    }

    const updatedProject = { ...project, tasks: updateTaskInArray(project.tasks) }
    setProject(updatedProject)

    const stored = localStorage.getItem("projects")
    if (stored) {
      const projects = JSON.parse(stored)
      const index = projects.findIndex((p: Project) => p.id === project.id)
      if (index !== -1) {
        projects[index] = updatedProject
        localStorage.setItem("projects", JSON.stringify(projects))
      }
    }
  }

  const handleTaskCreated = (taskData: any) => {
    if (!project) return

    const newTask: Task = {
      id: Date.now().toString(),
      title: taskData.title,
      description: taskData.description,
      responsible: taskData.responsible,
      deadline: taskData.deadline,
      completed: false,
      subtasks: []
    }

    const updatedProject = { ...project, tasks: [...project.tasks, newTask] }
    setProject(updatedProject)

    const stored = localStorage.getItem("projects")
    if (stored) {
      const projects = JSON.parse(stored)
      const index = projects.findIndex((p: Project) => p.id === project.id)
      if (index !== -1) {
        projects[index] = updatedProject
        localStorage.setItem("projects", JSON.stringify(projects))
      }
    }
  }

  const handleTaskUpdated = (updatedTask: Task) => {
    if (!project) return

    const updateTaskInArray = (tasks: Task[]): Task[] => {
      return tasks.map(task => {
        if (task.id === updatedTask.id) {
          return updatedTask
        }
        if (task.subtasks.length > 0) {
          return { ...task, subtasks: updateTaskInArray(task.subtasks) }
        }
        return task
      })
    }

    const updatedProject = { ...project, tasks: updateTaskInArray(project.tasks) }
    setProject(updatedProject)

    const stored = localStorage.getItem("projects")
    if (stored) {
      const projects = JSON.parse(stored)
      const index = projects.findIndex((p: Project) => p.id === project.id)
      if (index !== -1) {
        projects[index] = updatedProject
        localStorage.setItem("projects", JSON.stringify(projects))
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

  const renderTask = (task: Task, level: number = 0) => {
    const allParticipants = project ? [project.owner, ...project.participants] : []

    const areAllSubtasksCompleted = (task: Task): boolean => {
      if (task.subtasks.length === 0) return true
      return task.subtasks.every(subtask => subtask.completed && areAllSubtasksCompleted(subtask))
    }

    const canCompleteTask = areAllSubtasksCompleted(task)
    const isExpanded = expandedTasks.has(task.id)
    const hasSubtasks = task.subtasks.length > 0

    return (
        <div key={task.id} className={level > 0 ? "mt-2" : ""}>
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
                        <span className="font-medium">Ответственный:</span> {task.responsible}
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
                {task.subtasks.map(subtask => renderTask(subtask, level + 1))}
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
                      project.tasks.map(task => renderTask(task))
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
                    <p className="font-medium">{project.owner}</p>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-lg border border-border p-6">
                <h2 className="text-lg font-semibold mb-4">Участники ({project.participants.length + 1})</h2>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-2 rounded bg-primary/10">
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium">
                      {project.owner[0].toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <span className="text-sm">{project.owner}</span>
                      <span className="text-xs text-muted-foreground ml-2">(Создатель)</span>
                    </div>
                  </div>
                  {project.participants.map((participant, index) => (
                      <div key={index} className="flex items-center gap-3 p-2 rounded hover:bg-muted/50">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                          {participant[0].toUpperCase()}
                        </div>
                        <span className="text-sm">{participant}</span>
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
            projectParticipants={allParticipants}
            projectDeadline={project.deadline}
            onTaskCreated={handleTaskCreated}
        />

        {selectedTask && (
            <TaskDetailDialog
                task={selectedTask}
                onClose={() => setSelectedTask(null)}
                projectParticipants={allParticipants}
                projectDeadline={project.deadline}
                onTaskUpdated={handleTaskUpdated}
            />
        )}
      </div>
  )
}
