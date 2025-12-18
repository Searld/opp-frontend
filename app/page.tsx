"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { CreateProjectDialog } from "@/components/create-project-dialog"
import { redirect } from "next/navigation"

export default function HomePage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [userLoggedIn, setUserLoggedIn] = useState(false)
  const [currentUserEmail, setCurrentUserEmail] = useState("")

  useEffect(() => {
    // Mock check for user login status
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true"
    setUserLoggedIn(isLoggedIn)

    const userEmail = localStorage.getItem("userEmail") || ""
    setCurrentUserEmail(userEmail)

    if (!isLoggedIn) {
      redirect("/auth/login")
    }
  }, [])

  // Mock data - будут заменены на реальные проекты из API
  const projects = [
    {
      id: 1,
      name: "Веб-приложение для университета",
      subject: "Веб-разработка",
      deadline: "2025-12-15",
      taskCount: 5,
      completedTasks: 2,
    },
    {
      id: 2,
      name: "Система управления базой данных",
      subject: "Базы данных",
      deadline: "2025-11-30",
      taskCount: 8,
      completedTasks: 3,
    },
  ]

  return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold">Мои проекты</h1>
            <div className="flex gap-4">
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Создать проект
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          {projects.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-xl text-muted-foreground mb-4">У вас пока нет проектов</p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Создать первый проект
                </Button>
              </div>
          ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {projects.map((project) => (
                    <a
                        key={project.id}
                        href={`/projects/${project.id}`}
                        className="block p-6 rounded-lg border border-border hover:shadow-lg transition-shadow bg-card"
                    >
                      <h3 className="text-xl font-semibold mb-2">{project.name}</h3>
                      <p className="text-sm text-muted-foreground mb-4">Предмет: {project.subject}</p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Задач:</span>
                          <span className="font-medium">
                      {project.completedTasks} / {project.taskCount}
                    </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Дедлайн:</span>
                          <span className="font-medium">{new Date(project.deadline).toLocaleDateString("ru")}</span>
                        </div>
                      </div>
                    </a>
                ))}
              </div>
          )}
        </main>

        <CreateProjectDialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
            currentUserEmail={currentUserEmail}
        />
      </div>
  )
}
