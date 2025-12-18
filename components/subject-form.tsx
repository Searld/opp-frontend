"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface SubjectFormProps {
  initialData?: {
    name: string
    description: string
  }
  onSubmit: (data: { name: string; description: string }) => void
  onCancel: () => void
}

export function SubjectForm({ initialData, onSubmit, onCancel }: SubjectFormProps) {
  const [name, setName] = useState(initialData?.name || "")
  const [description, setDescription] = useState(initialData?.description || "")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ name, description })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initialData ? "Редактировать предмет" : "Создать предмет"}</CardTitle>
        <CardDescription>
          {initialData ? "Измените информацию о предмете" : "Введите название и описание предмета"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Название предмета</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например: Веб-разработка"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Краткое описание предмета"
              rows={4}
              required
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onCancel}>
              Отмена
            </Button>
            <Button type="submit">{initialData ? "Сохранить изменения" : "Создать предмет"}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
