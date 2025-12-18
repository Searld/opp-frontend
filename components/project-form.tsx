"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ProjectFormProps {
  initialData?: {
    name: string
    description: string
    subjectId: string
    deadline: string
  }
  subjects: { id: number; name: string }[]
  onSubmit: (data: { name: string; description: string; subjectId: string; deadline: string }) => void
  onCancel: () => void
}

export function ProjectForm({ initialData, subjects, onSubmit, onCancel }: ProjectFormProps) {
  const [name, setName] = useState(initialData?.name || "")
  const [description, setDescription] = useState(initialData?.description || "")
  const [subjectId, setSubjectId] = useState(initialData?.subjectId || "")
  const [deadline, setDeadline] = useState(initialData?.deadline || "")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ name, description, subjectId, deadline })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initialData ? "Редактировать проект" : "Создать проект"}</CardTitle>
        <CardDescription>
          {initialData ? "Измените информацию о проекте" : "Введите данные для нового проекта"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Название проекта</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например: E-commerce платформа"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Краткое описание проекта"
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Предмет</Label>
            <Select value={subjectId} onValueChange={setSubjectId} required>
              <SelectTrigger id="subject">
                <SelectValue placeholder="Выберите предмет" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={String(subject.id)}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deadline">Итоговый дедлайн</Label>
            <Input id="deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} required />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onCancel}>
              Отмена
            </Button>
            <Button type="submit">{initialData ? "Сохранить изменения" : "Создать проект"}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
