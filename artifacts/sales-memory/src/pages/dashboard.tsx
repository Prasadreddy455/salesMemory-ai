import { useListClients, useGetPipelineSummary } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

const STAGES = ["Discovery", "Proposal", "Negotiation", "Won", "Lost"];

export default function Dashboard() {
  const { data: clients, isLoading: clientsLoading } = useListClients();
  const { data: summary, isLoading: summaryLoading } = useGetPipelineSummary();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Pipeline</h1>
        <p className="text-muted-foreground">Manage your deals and track progress.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Deals</CardTitle>
          </CardHeader>
          <CardContent>
            {summaryLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-3xl font-bold font-mono">{summary?.total_deals || 0}</div>}
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Won This Month</CardTitle>
          </CardHeader>
          <CardContent>
            {summaryLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-3xl font-bold font-mono text-primary">{summary?.won_this_month || 0}</div>}
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pipeline Value</CardTitle>
          </CardHeader>
          <CardContent>
            {summaryLoading ? <Skeleton className="h-8 w-24" /> : <div className="text-3xl font-bold font-mono">{summary?.total_pipeline_value || "$0"}</div>}
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">AI Cost</CardTitle>
          </CardHeader>
          <CardContent>
            {summaryLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-3xl font-bold font-mono">${summary?.monthly_cost?.toFixed(2) || "0.00"}</div>}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {STAGES.map((stage) => {
          const stageClients = clients?.filter(c => c.deal_stage === stage) || [];
          return (
            <div key={stage} className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">{stage}</h3>
                <Badge variant="secondary" className="font-mono">{stageClients.length}</Badge>
              </div>
              {clientsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : (
                stageClients.map(client => (
                  <Link key={client.id} href={`/clients/${client.id}`} className="block">
                    <Card className="hover:bg-secondary/50 transition-colors cursor-pointer border-border">
                      <CardContent className="p-4">
                        <div className="font-semibold">{client.name}</div>
                        <div className="text-sm text-muted-foreground truncate">{client.company}</div>
                        {client.budget && <div className="mt-2 text-xs font-mono text-primary">{client.budget}</div>}
                      </CardContent>
                    </Card>
                  </Link>
                ))
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
