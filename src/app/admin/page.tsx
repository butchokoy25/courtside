import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Trophy, Shield, Users, CalendarDays } from 'lucide-react'

const stats = [
  { label: 'Leagues', value: '0', icon: Trophy },
  { label: 'Teams', value: '0', icon: Shield },
  { label: 'Players', value: '0', icon: Users },
  { label: 'Games', value: '0', icon: CalendarDays },
]

export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <p className="mt-1 text-muted-foreground">
        Welcome to the admin panel. Manage your leagues, teams, players, and
        schedules from here.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <Icon className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
