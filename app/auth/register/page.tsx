"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { apiClient } from "@/lib/api-client"

export default function RegisterPage() {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("Пароли не совпадают")
      return
    }

    setLoading(true)

    try {
      await apiClient.registerStudent({
        firstName,
        lastName,
        email,
        password,
      })

      // Redirect to login after successful registration
      window.location.href = "/auth/login"
    } catch (err) {
      console.error("[v0] Registration error:", err)
      setError("Ошибка регистрации. Возможно, пользователь с таким email уже существует")
    } finally {
      setLoading(false)
    }
  }

  return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Регистрация</CardTitle>
            <CardDescription className="text-center">Создайте аккаунт для управления проектами</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
              <div className="space-y-2">
                <Label htmlFor="firstName">Имя</Label>
                <Input
                    id="firstName"
                    type="text"
                    placeholder="Иван"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Фамилия</Label>
                <Input
                    id="lastName"
                    type="text"
                    placeholder="Иванов"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                    id="email"
                    type="email"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Пароль</Label>
                <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Подтвердите пароль</Label>
                <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Регистрация..." : "Зарегистрироваться"}
              </Button>
            </form>
            <div className="mt-4 text-center text-sm">

              <span className="text-muted-foreground">Уже есть аккаунт? </span>
              <Link href="/auth/login" className="text-primary hover:underline">
                Войти
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
  )
}
