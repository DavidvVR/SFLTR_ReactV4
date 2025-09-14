import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ListadoAsignacionesView from "./tabs/listado-view";

export default function AsignacionView() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Asignación de Viajes</h1>
      <Tabs defaultValue="listado" className="space-y-4">
        <TabsList>
          <TabsTrigger value="listado">Listado</TabsTrigger>
        </TabsList>
        <TabsContent value="listado">
          <ListadoAsignacionesView />
        </TabsContent>
      </Tabs>
    </div>
  );
}