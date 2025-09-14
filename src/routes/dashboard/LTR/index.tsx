import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import UnidadesView from '@/features/ltr/tabs/unidades-view'
import OperadoresView from '@/features/ltr/tabs/operadores-view'

function LTRPage() {
  const [tab, setTab] = React.useState<'unidades' | 'operadores'>('unidades')

  return (
    <div className="p-6 space-y-4">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">LTR — Flota y Personal</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={(v) => setTab(v as 'unidades' | 'operadores')}>
            <div className="flex items-center justify-between gap-3">
              <TabsList>
                <TabsTrigger value="unidades">Unidades</TabsTrigger>
                <TabsTrigger value="operadores">Operadores</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="unidades" className="mt-4">
              <UnidadesView />
            </TabsContent>
            <TabsContent value="operadores" className="mt-4">
              <OperadoresView />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

// Ruta derivada del path del archivo: /Dashboard/LTR/
export const Route = createFileRoute('/dashboard/LTR/')({
  component: LTRPage,
})
