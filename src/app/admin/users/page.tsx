import { createClient } from '@/lib/supabase/server'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { UserRoleSelect } from '@/components/admin/user-role-select'

function roleBadgeVariant(role: string) {
  switch (role) {
    case 'admin':
      return 'default' as const
    case 'scorer':
      return 'secondary' as const
    default:
      return 'outline' as const
  }
}

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const { data: profiles, error: profilesError } = await supabase.from('profiles').select('*')
  if (profilesError) console.error('[ADMIN] Failed to fetch profiles:', profilesError.message)

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">User Management</h1>

      {profiles && profiles.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Display Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {profiles.map((profile) => (
              <TableRow key={profile.id}>
                <TableCell className="font-medium">
                  {profile.display_name || 'Unknown'}
                </TableCell>
                <TableCell>
                  <Badge variant={roleBadgeVariant(profile.role)}>
                    {profile.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  <UserRoleSelect
                    userId={profile.id}
                    currentRole={profile.role}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p className="text-muted-foreground">No users found.</p>
      )}
    </div>
  )
}
