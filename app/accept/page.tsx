"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Image from "next/image"
import Confetti from "react-confetti"

export default function InviteAcceptPage() {
    const router = useRouter()
    const [windowSize, setWindowSize] = useState({ width: 0, height: 0 })
    const [showConfetti, setShowConfetti] = useState(true)

    useEffect(() => {
        setWindowSize({
            width: window.innerWidth,
            height: window.innerHeight,
        })

        const timer = setTimeout(() => {
            setShowConfetti(false)
        }, 5000)

        return () => clearTimeout(timer)
    }, [])

    const handleStartWork = () => {
        router.push("/dashboard")
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-4">
            {showConfetti && (
                <Confetti width={windowSize.width} height={windowSize.height} recycle={false} numberOfPieces={500} />
            )}

            <Card className="max-w-2xl w-full p-8 md:p-12 text-center space-y-8 shadow-2xl">
                <div className="space-y-4">
                    <h1 className="text-4xl md:text-5xl font-bold text-balance">Приглашение принято! 🔥</h1>

                </div>

                <div className="relative w-full max-w-md mx-auto aspect-square rounded-lg overflow-hidden bg-muted">
                    <Image
                        src="/horay.jpg"
                        alt="Success Kid celebration"
                        fill
                        className="object-cover"
                        priority
                    />
                </div>

                <Button size="lg" className="w-full md:w-auto text-lg px-8 py-6" onClick={handleStartWork}>
                    Начать работу!
                </Button>

                <div className="text-sm text-muted-foreground">Теперь вы можете просматривать проект и выполнять задачи</div>
            </Card>
        </div>
    )
}
