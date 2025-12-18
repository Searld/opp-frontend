"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, X, Check, ChevronsUpDown } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { cn } from "@/lib/utils"
import { apiClient, type SubjectDto } from "@/lib/api-client"

interface CreateProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentUserId: string
  onProjectCreated?: () => void
}

export function CreateProjectDialog({ open, onOpenChange, currentUserId, onProjectCreated }: CreateProjectDialogProps) {
  const [name, setName] = useState("")
  const [selectedSubjectId, setSelectedSubjectId] = useState("")
  const [description, setDescription] = useState("")
  const [deadline, setDeadline] = useState("")
  const [emails, setEmails] = useState<string[]>([])
  const [emailInput, setEmailInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [subjects, setSubjects] = useState<SubjectDto[]>([])
  const [openCombobox, setOpenCombobox] = useState(false)
  const [customSubjectName, setCustomSubjectName] = useState("")

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const data = await apiClient.getAllSubjects()
        setSubjects(data)
      } catch (error) {
        console.error("[v0] Failed to fetch subjects:", error)
        setSubjects([])
      }
    }

    if (open) {
      fetchSubjects()
    }
  }, [open])

  const handleAddEmail = () => {
    if (emailInput && emailInput.includes("@") && !emails.includes(emailInput)) {
      setEmails([...emails, emailInput])
      setEmailInput("")
    }
  }

  const handleRemoveEmail = (emailToRemove: string) => {
    setEmails(emails.filter((email) => email !== emailToRemove))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      // Определяем имя предмета для отправки
      let subjectNameToSend: string

      // Если пользователь выбрал предмет из списка
      if (selectedSubjectId) {
        const selectedSubject = subjects.find((s) => s.id === selectedSubjectId)
        if (selectedSubject) {
          subjectNameToSend = selectedSubject.name
        } else {
          setError("Выбранный предмет не найден")
          setLoading(false)
          return
        }
      }
      // Если пользователь ввел свой предмет
      else if (customSubjectName.trim()) {
        subjectNameToSend = customSubjectName.trim()
      }
      // Если ничего не выбрано и не введено
      else {
        setError("Пожалуйста, выберите или введите предмет")
        setLoading(false)
        return
      }

      // Create project
      const project = await apiClient.createProject({
        name,
        creatorId: currentUserId,
        description,
        deadline,
        subjectName: subjectNameToSend, // Отправляем имя предмета
      })


      onProjectCreated?.()
      onOpenChange(false)

      // Reset form
      setName("")
      setSelectedSubjectId("")
      setCustomSubjectName("")
      setDescription("")
      setDeadline("")
      setEmails([])
      setEmailInput("")
    } catch (err) {
      console.error("[v0] Failed to create project:", err)
      setError("Ошибка при создании проекта")
    } finally {
      setLoading(false)
    }
  }

  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId)

  return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Создать новый проект</DialogTitle>
            <DialogDescription>Заполните информацию о проекте и добавьте участников</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}


            <div className="space-y-2">
              <Label htmlFor="name">Название проекта</Label>
              <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Например: Веб-приложение для университета"
                  required
              />
            </div>

            <div className="space-y-2">
              <Label>Предмет</Label>
              <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                <PopoverTrigger asChild>
                  <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openCombobox}
                      className="w-full justify-between bg-transparent"
                  >
                    {selectedSubject?.name || customSubjectName || "Выберите предмет или введите свой"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput
                        placeholder="Поиск предмета..."
                        onValueChange={(value) => setCustomSubjectName(value)}
                    />
                    <CommandList>
                      <CommandEmpty>
                        <div className="p-2 text-sm">
                          <p className="mb-2">Предмет не найден</p>
                          {customSubjectName && (
                              <Button
                                  size="sm"
                                  className="w-full"
                                  onClick={() => {
                                    setSelectedSubjectId("")
                                    setOpenCombobox(false)
                                  }}
                              >
                                Использовать "{customSubjectName}"
                              </Button>
                          )}
                        </div>
                      </CommandEmpty>
                      <CommandGroup>
                        {subjects.map((subject) => (
                            <CommandItem
                                key={subject.id}
                                value={subject.name}
                                onSelect={() => {
                                  setSelectedSubjectId(subject.id)
                                  setCustomSubjectName("")
                                  setOpenCombobox(false)
                                }}
                            >
                              <Check
                                  className={cn(
                                      "mr-2 h-4 w-4",
                                      selectedSubjectId === subject.id ? "opacity-100" : "opacity-0",
                                  )}
                              />
                              {subject.name}
                            </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {customSubjectName && !selectedSubjectId && (
                  <p className="text-sm text-muted-foreground">Вы вводите свой предмет: "{customSubjectName}"</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Описание проекта</Label>
              <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Краткое описание целей и задач проекта"
                  rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline">Дедлайн проекта</Label>
              <Input id="deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} required />
            </div>


            <div className="space-y-2">
              <Label htmlFor="email">Участники проекта (приглашение по email)</Label>
              <div className="flex gap-2">
                <Input
                    id="email"
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleAddEmail()
                      }
                    }}
                    placeholder="Введите email участника"
                />
                <Button type="button" onClick={handleAddEmail} variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {emails.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {emails.map((email) => (
                        <div key={email} className="flex items-center gap-2 px-3 py-1 bg-secondary rounded-full text-sm">
                          <span>{email}</span>
                          <button type="button" onClick={() => handleRemoveEmail(email)} className="hover:text-destructive">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                    ))}
                  </div>
              )}
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                Отмена
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Создание..." : "Создать проект"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
  )
}
