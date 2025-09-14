import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/ltr')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/dashboard/ltr"!</div>
}
