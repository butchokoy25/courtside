'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { updateUserRole } from '@/lib/actions/admin'
import { useTransition } from 'react'

export function UserRoleSelect({
  userId,
  currentRole,
}: {
  userId: string
  currentRole: string
}) {
  const [isPending, startTransition] = useTransition()

  return (
    <Select
      defaultValue={currentRole}
      disabled={isPending}
      onValueChange={(value) => {
        startTransition(async () => {
          await updateUserRole(userId, value as 'admin' | 'scorer' | 'player')
        })
      }}
    >
      <SelectTrigger className="w-32">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="admin">Admin</SelectItem>
        <SelectItem value="scorer">Scorer</SelectItem>
        <SelectItem value="player">Player</SelectItem>
      </SelectContent>
    </Select>
  )
}
