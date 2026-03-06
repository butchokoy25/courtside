import { createClient } from "@/lib/supabase/server"
import { Navbar } from "./navbar"

export async function NavbarWrapper() {
  const supabase = await createClient()

  const { data: leagues } = await supabase
    .from("leagues")
    .select("slug, name")
    .order("name")

  return <Navbar leagues={leagues ?? []} />
}
