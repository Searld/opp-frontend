"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, ChevronRight } from 'lucide-react'
import {apiClient} from "@/lib/api-client";

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

interface TaskDetailDialogProps {
  task: Task
  onClose: () => void
  participantNameToIdMap?: Map<string, string>
  projectParticipants: string[]
  projectDeadline: string
  onTaskUpdated: (task: Task) => void
}

export function TaskDetailDialog({
  task,
  onClose, participantNameToIdMap,
  projectParticipants,
  projectDeadline,
  onTaskUpdated
}: TaskDetailDialogProps) {
  const [currentTask, setCurrentTask] = useState<Task>(task)
  const [taskHistory, setTaskHistory] = useState<Task[]>([])

  const [editedTask, setEditedTask] = useState<Task>(currentTask)
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("")
  const [newSubtaskResponsible, setNewSubtaskResponsible] = useState("")
  const [newSubtaskDeadline, setNewSubtaskDeadline] = useState("")
  const [showSubtaskForm, setShowSubtaskForm] = useState(false)

  const areAllSubtasksCompleted = (task: Task): boolean => {
    if (task.subtasks.length === 0) return true
    return task.subtasks.every(subtask => subtask.completed && areAllSubtasksCompleted(subtask))
  }

  const canCompleteTask = areAllSubtasksCompleted(editedTask)

  const openSubtask = (subtask: Task) => {
    setTaskHistory([...taskHistory, editedTask])
    setCurrentTask(subtask)
    setEditedTask(subtask)
    setShowSubtaskForm(false)
  }

  const goBack = () => {
    if (taskHistory.length > 0) {
      const previousTask = taskHistory[taskHistory.length - 1]
      setTaskHistory(taskHistory.slice(0, -1))
      setCurrentTask(previousTask)
      setEditedTask(previousTask)
      setShowSubtaskForm(false)
    }
  }

  const handleAddSubtask = () => {
    if (!newSubtaskTitle || !newSubtaskResponsible || !newSubtaskDeadline) return

    if (new Date(newSubtaskDeadline) > new Date(editedTask.deadline)) {
      alert(`Дедлайн подзадачи не может быть позже дедлайна родительской задачи (${new Date(editedTask.deadline).toLocaleDateString("ru")})`)
      return
    }

    const responsibleStudentId = participantNameToIdMap?.get(newSubtaskResponsible)

    const newSubtask: Task = {
      id: `temp_${Date.now()}`,
      title: newSubtaskTitle,
      description: "",
      responsible: newSubtaskResponsible, // имя
      responsibleStudentId: responsibleStudentId,
      deadline: newSubtaskDeadline,
      completed: false,
      prerequisites: [],
      subtasks: [],
      dependentTaskId: currentTask.id,
    }

    const updatedTask = {
      ...editedTask,
      subtasks: [...editedTask.subtasks, newSubtask]
    }

    setEditedTask(updatedTask)
    setNewSubtaskTitle("")
    setNewSubtaskResponsible("")
    setNewSubtaskDeadline("")
    setShowSubtaskForm(false)
  }

  const handleDeleteSubtask = (subtaskId: string) => {
    const updatedTask = {
      ...editedTask,
      subtasks: editedTask.subtasks.filter(st => st.id !== subtaskId)
    }
    setEditedTask(updatedTask)
  }

  const handleToggleSubtask = (subtask: Task) => {
    const canToggle = areAllSubtasksCompleted(subtask)
    if (!subtask.completed && !canToggle) {
      return
    }

    const updatedTask = {
      ...editedTask,
      subtasks: editedTask.subtasks.map(st =>
        st.id === subtask.id ? { ...st, completed: !st.completed } : st
      )
    }
    setEditedTask(updatedTask)
  }

  const handleSave = () => {
    const updateTaskRecursively = (taskToUpdate: Task, targetId: string, newData: Task): Task => {
      if (taskToUpdate.id === targetId) {
        return newData
      }
      return {
        ...taskToUpdate,
        subtasks: taskToUpdate.subtasks.map(st => updateTaskRecursively(st, targetId, newData))
      }
    }

    let finalTask = editedTask

    for (let i = taskHistory.length - 1; i >= 0; i--) {
      const parentTask = taskHistory[i]
      finalTask = updateTaskRecursively(parentTask, editedTask.id, editedTask)
    }

    onTaskUpdated(finalTask)
    onClose()
  }

  const getMaxDeadline = () => {
    if (taskHistory.length > 0) {
      return taskHistory[taskHistory.length - 1].deadline
    }
    return projectDeadline
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          {taskHistory.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={goBack}
              className="w-fit mb-2"
            >
              ← Назад к родительской задаче
            </Button>
          )}
          <DialogTitle>Детали задачи</DialogTitle>
          <DialogDescription>Просмотр и редактирование задачи, управление подзадачами</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Название задачи</Label>
            <Input
              id="edit-title"
              value={editedTask.title}
              onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Описание</Label>
            <Textarea
              id="edit-description"
              value={editedTask.description || ""}
              onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-responsible">Ответственный</Label>
              <Select
                value={editedTask.responsible}
                onValueChange={(value) => setEditedTask({ ...editedTask, responsible: value })}
              >
                <SelectTrigger id="edit-responsible">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from(new Set(projectParticipants)).map((participant, index) => (
                      <SelectItem key={`${participant}-${index}`} value={participant}>
                        {participant}
                      </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-deadline">Дедлайн</Label>
              <Input
                id="edit-deadline"
                type="date"
                value={editedTask.deadline}
                onChange={(e) => setEditedTask({ ...editedTask, deadline: e.target.value })}
                max={getMaxDeadline()}
              />
              <p className="text-xs text-muted-foreground">
                Дедлайн не может быть позже {new Date(getMaxDeadline()).toLocaleDateString("ru")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={editedTask.completed}
              onChange={() => setEditedTask({ ...editedTask, completed: !editedTask.completed })}
              disabled={!editedTask.completed && !canCompleteTask}
              className={`h-4 w-4 ${!editedTask.completed && !canCompleteTask ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            />
            <Label className={!editedTask.completed && !canCompleteTask ? 'text-muted-foreground' : ''}>
              Задача выполнена
              {!editedTask.completed && !canCompleteTask && editedTask.subtasks.length > 0 && (
                <span className="text-xs ml-2 text-destructive">
                  (сначала завершите все подзадачи)
                </span>
              )}
            </Label>
          </div>

          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Подзадачи ({editedTask.subtasks.length})</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowSubtaskForm(!showSubtaskForm)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Добавить подзадачу
              </Button>
            </div>

            {showSubtaskForm && (
              <div className="mb-4 p-4 border rounded-lg bg-muted/50 space-y-3">
                <Input
                  placeholder="Название подзадачи"
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-2">
                  <Select value={newSubtaskResponsible} onValueChange={setNewSubtaskResponsible}>
                    <SelectTrigger>
                      <SelectValue placeholder="Ответственный" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from(new Set(projectParticipants)).map((participant, index) => (
                          <SelectItem key={`${participant}-${index}`} value={participant}>
                            {participant}
                          </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="date"
                    value={newSubtaskDeadline}
                    onChange={(e) => setNewSubtaskDeadline(e.target.value)}
                    max={editedTask.deadline}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Дедлайн подзадачи не может быть позже {new Date(editedTask.deadline).toLocaleDateString("ru")}
                </p>
                <div className="flex gap-2">
                  <Button type="button" onClick={handleAddSubtask} size="sm">
                    Добавить
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowSubtaskForm(false)
                      setNewSubtaskTitle("")
                      setNewSubtaskResponsible("")
                      setNewSubtaskDeadline("")
                    }}
                  >
                    Отмена
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {editedTask.subtasks.length === 0 ? (
                <p className="text-center text-muted-foreground py-4 text-sm">
                  Подзадачи отсутствуют. Добавьте первую подзадачу.
                </p>
              ) : (
                editedTask.subtasks.map((subtask) => {
                  const subtaskCanComplete = areAllSubtasksCompleted(subtask)
                  return (
                    <div
                      key={subtask.id}
                      className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50"
                    >
                      <input
                        type="checkbox"
                        checked={subtask.completed}
                        onChange={() => handleToggleSubtask(subtask)}
                        disabled={!subtask.completed && !subtaskCanComplete}
                        className={`mt-1 h-4 w-4 ${!subtask.completed && !subtaskCanComplete ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        title={!subtask.completed && !subtaskCanComplete ? 'Сначала завершите все подзадачи' : ''}
                      />
                      <div className="flex-1 cursor-pointer" onClick={() => openSubtask(subtask)}>
                        <div className="flex items-center gap-2">
                          <h4 className={`font-medium text-sm hover:underline ${subtask.completed ? "line-through text-muted-foreground" : ""}`}>
                            {subtask.title}
                          </h4>
                          {subtask.subtasks.length > 0 && (
                            <span className="text-xs text-muted-foreground">
                              ({subtask.subtasks.filter(st => st.completed).length}/{subtask.subtasks.length})
                            </span>
                          )}
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                          <span>{subtask.responsible}</span>
                          <span>{new Date(subtask.deadline).toLocaleDateString("ru")}</span>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteSubtask(subtask.id)
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button type="button" onClick={handleSave}>
              Сохранить изменения
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
