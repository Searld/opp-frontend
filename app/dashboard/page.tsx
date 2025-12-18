"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus, LogOut, User } from "lucide-react"
import { CreateProjectDialog } from "@/components/create-project-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { apiClient, type ProjectDto, type StudentDto } from "@/lib/api-client"

export default function DashboardPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<StudentDto | null>(null)
  const [myProjects, setMyProjects] = useState<ProjectDto[]>([])
  const [participantProjects, setParticipantProjects] = useState<ProjectDto[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadUserAndProjects = async () => {
      try {
        // Get current user
        const user = await apiClient.getCurrentStudent()
        setCurrentUser(user)

        // Get all projects
        const allProjects = await apiClient.getAllProjects()

        // Filter projects where user is creator
        const my = allProjects.filter((p) => p.creatorId === user.id)

        // Filter projects where user is participant
        const participant = allProjects.filter((p) => p.creatorId !== user.id && p.members.includes(user.id))

        setMyProjects(my)
        setParticipantProjects(participant)
      } catch (error) {
        console.error("[v0] Failed to load user and projects:", error)
        // Fallback to localStorage if backend fails
        const storedUser = localStorage.getItem("currentUser")
        if (storedUser) {
          setCurrentUser(JSON.parse(storedUser))
        }
      } finally {
        setLoading(false)
      }
    }

    loadUserAndProjects()
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("currentUser")
    localStorage.removeItem("userEmail")
    window.location.href = "/auth/login"
  }

  const handleProjectCreated = async () => {
    try {
      const allProjects = await apiClient.getAllProjects()
      if (currentUser) {
        const my = allProjects.filter((p) => p.creatorId === currentUser.id)
        setMyProjects(my)
      }
    } catch (error) {
      console.error("[v0] Failed to refresh projects:", error)
    }
  }

  if (loading) {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
    )
  }

  if (!currentUser) {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <p className="text-muted-foreground">Пожалуйста, войдите в систему</p>
        </div>
    )
  }

  return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold">Система управления проектами</h1>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Проекты</h2>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Создать проект
            </Button>
          </div>


          <Tabs defaultValue="my-projects" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="my-projects">Мои проекты</TabsTrigger>
              <TabsTrigger value="participant-projects">Проекты, где я участник</TabsTrigger>
            </TabsList>

            <TabsContent value="my-projects" className="mt-6">
              {myProjects.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-xl text-muted-foreground mb-4">У вас пока нет проектов</p>
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Создать первый проект
                    </Button>
                  </div>
              ) : (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {myProjects.map((project) => (
                        <a
                            key={project.id}
                            href={`/projects/${project.id}`}
                            className="block p-6 rounded-lg border border-border hover:shadow-lg transition-shadow bg-card"
                        >
                          <h3 className="text-xl font-semibold mb-2">{project.name}</h3>
                          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{project.description}</p>
                          <div className="space-y-2 text-sm">

                            <div className="flex justify-between">
                              <span>Дедлайн:</span>
                              <span className="font-medium">{new Date(project.deadline).toLocaleDateString("ru")}</span>
                            </div>
                          </div>
                        </a>
                    ))}
                  </div>
              )}
            </TabsContent>

            <TabsContent value="participant-projects" className="mt-6">
              {participantProjects.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-xl text-muted-foreground">Вы пока не участвуете ни в одном проекте</p>
                  </div>
              ) : (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {participantProjects.map((project) => (
                        <a
                            key={project.id}
                            href={`/projects/${project.id}`}
                            className="block p-6 rounded-lg border border-border hover:shadow-lg transition-shadow bg-card"
                        >
                          <h3 className="text-xl font-semibold mb-2">{project.name}</h3>
                          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{project.description}</p>
                          <div className="space-y-2 text-sm">

                            <div className="flex justify-between">
                              <span>Дедлайн:</span>
                              <span className="font-medium">{new Date(project.deadline).toLocaleDateString("ru")}</span>
                            </div>
                          </div>
                        </a>
                    ))}
                  </div>
              )}
            </TabsContent>
          </Tabs>
        </main>

        <CreateProjectDialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
            currentUserId={currentUser.id}
            onProjectCreated={handleProjectCreated}
        />
      </div>
  )
}
