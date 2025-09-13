// src/features/auth/sign-in-form.tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { loginLocal } from "@/features/auth/auth"   // 👈 agregado

export default function SignInForm() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [usernameOrEmail, setUsernameOrEmail] = useState("")
  const [password, setPassword] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      setIsLoading(true)

      if (loginLocal(usernameOrEmail, password)) {
        navigate({ to: "/dashboard" })
      } else {
        alert("Usuario o contraseña incorrectos")
      }

    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full border">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl">Inicia sesión</CardTitle>
        <CardDescription>
          Accede con tu usuario o correo y contraseña.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form className={cn("flex w-full flex-col gap-4")} onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="usernameOrEmail">Usuario o email</Label>
            <Input
              id="usernameOrEmail"
              type="text"
              placeholder="usuario o tu@correo.com"
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              autoComplete="username"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Ingresar
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex flex-col gap-2 text-xs text-muted-foreground">
        <p>
          Al continuar aceptas nuestros{" "}
          <a href="#" className="underline underline-offset-4">
            Términos
          </a>{" "}
          y{" "}
          <a href="#" className="underline underline-offset-4">
            Aviso de Privacidad
          </a>
          .
        </p>
      </CardFooter>
    </Card>
  )
}

