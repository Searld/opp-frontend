"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, User } from "lucide-react"

interface TaskCardProps {
  task: {
    id: number
    name: string
    description: string
    deadline: string
    status: "todo" | "in-progress" | "completed"
    assignee?: {
      id: number
      name: string
    }
  }
  onEdit: () => void
  onAssignResponsible: () => void
}

export function TaskCard({ task, onEdit, onAssignResponsible }: TaskCardProps) {
  const statusColors = {
    todo: "bg-slate-500",
    "in-progress": "bg-blue-500",
    completed: "bg-green-500",
  }

  const statusLabels = {
    todo: "К выполнению",
    "in-progress": "В процессе",
    completed: "Завершено",
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{task.name}</CardTitle>
            <CardDescription>{task.description}</CardDescription>
          </div>
          <Badge className={statusColors[task.status]}>{statusLabels[task.status]}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Дедлайн: {new Date(task.deadline).toLocaleDateString("ru-RU")}</span>
          </div>
          {task.assignee && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>Ответственный: {task.assignee.name}</span>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onEdit}>
            Редактировать
          </Button>
          <Button variant="outline" size="sm" onClick={onAssignResponsible}>
            {task.assignee ? "Изменить ответственного" : "Назначить ответственного"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
