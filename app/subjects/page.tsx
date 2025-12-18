import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, ArrowLeft } from "lucide-react"

export default function SubjectsPage() {
  // Mock data - will be replaced with API calls
  const subjects = [
    { id: 1, name: "Веб-разработка", description: "Изучение современных веб-технологий", projectCount: 3 },
    { id: 2, name: "Базы данных", description: "SQL и NoSQL базы данных", projectCount: 2 },
    { id: 3, name: "Мобильная разработка", description: "Разработка мобильных приложений", projectCount: 1 },
  ]

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <h1 className="text-2xl font-bold">Предметы</h1>
            </div>
            <Button asChild>
              <Link href="/subjects/new">
                <Plus className="h-4 w-4 mr-2" />
                Создать предмет
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((subject) => (
            <Card key={subject.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>{subject.name}</CardTitle>
                <CardDescription>{subject.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">Проектов: {subject.projectCount}</p>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 bg-transparent" asChild>
                    <Link href={`/subjects/${subject.id}`}>Открыть</Link>
                  </Button>
                  <Button variant="outline" className="flex-1 bg-transparent" asChild>
                    <Link href={`/subjects/${subject.id}/edit`}>Изменить</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
