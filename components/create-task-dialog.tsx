"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, X } from 'lucide-react'

interface CreateTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectParticipants: string[]
  projectDeadline: string
  parentTaskId?: number
  onTaskCreated: (taskData: any) => void
}

export function CreateTaskDialog({ 
  open, 
  onOpenChange, 
  projectParticipants, 
  projectDeadline,
  parentTaskId, 
  onTaskCreated 
}: CreateTaskDialogProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [responsible, setResponsible] = useState("")
  const [deadline, setDeadline] = useState("")
  const [subtasks, setSubtasks] = useState<string[]>([])
  const [subtaskInput, setSubtaskInput] = useState("")

  const handleAddSubtask = () => {
    if (subtaskInput.trim()) {
      setSubtasks([...subtasks, subtaskInput.trim()])
      setSubtaskInput("")
    }
  }

  const handleRemoveSubtask = (index: number) => {
    setSubtasks(subtasks.filter((_, i) => i !== index))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (new Date(deadline) > new Date(projectDeadline)) {
      alert(`Дедлайн задачи не может быть позже дедлайна проекта (${new Date(projectDeadline).toLocaleDateString("ru")})`)
      return
    }
    
    onTaskCreated({
      title,
      description,
      responsible,
      deadline,
      subtasks,
      parentTaskId
    })
    
    onOpenChange(false)
    // Сброс формы
    setTitle("")
    setDescription("")
    setResponsible("")
    setDeadline("")
    setSubtasks([])
    setSubtaskInput("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{parentTaskId ? "Создать подзадачу" : "Создать задачу"}</DialogTitle>
          <DialogDescription>Заполните информацию о задаче и назначьте ответственного</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Название задачи</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например: Разработать главную страницу"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Описание задачи</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Детальное описание задачи и требований"
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="responsible">Ответственный</Label>
            <Select value={responsible} onValueChange={setResponsible} required>
              <SelectTrigger id="responsible">
                <SelectValue placeholder="Выберите ответственного" />
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
            <Label htmlFor="deadline">Дедлайн задачи</Label>
            <Input 
              id="deadline" 
              type="date" 
              value={deadline} 
              onChange={(e) => setDeadline(e.target.value)} 
              max={projectDeadline}
              required 
            />
            <p className="text-xs text-muted-foreground">
              Дедлайн не может быть позже {new Date(projectDeadline).toLocaleDateString("ru")}
            </p>
          </div>

          {!parentTaskId && (
            <div className="space-y-2">
              <Label htmlFor="subtask">Подзадачи (опционально)</Label>
              <div className="flex gap-2">
                <Input
                  id="subtask"
                  value={subtaskInput}
                  onChange={(e) => setSubtaskInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleAddSubtask()
                    }
                  }}
                  placeholder="Введите название подзадачи"
                />
                <Button type="button" onClick={handleAddSubtask} variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {subtasks.length > 0 && (
                <div className="space-y-2 mt-3">
                  {subtasks.map((subtask, index) => (
                    <div key={index} className="flex items-center justify-between px-3 py-2 bg-secondary rounded-lg">
                      <span className="text-sm">{subtask}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSubtask(index)}
                        className="hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit">Создать задачу</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
