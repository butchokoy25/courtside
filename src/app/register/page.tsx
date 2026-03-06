'use client'

import { useActionState, useState } from 'react'
import { register } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import Link from 'next/link'

type AuthState = { error: string } | null

async function registerAction(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const result = await register(formData)
  return result ?? null
}

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(registerAction, null)
  const [clientError, setClientError] = useState<string | null>(null)

  function handleSubmit(formData: FormData) {
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (password !== confirmPassword) {
      setClientError('Passwords do not match')
      return
    }

    setClientError(null)
    formAction(formData)
  }

  const displayError = clientError ?? state?.error ?? null

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Create Account</CardTitle>
          <CardDescription>
            Sign up to start tracking your league stats
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            {displayError && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
                {displayError}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                placeholder="Choose a password"
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                placeholder="Confirm your password"
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-4">
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-primary underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
