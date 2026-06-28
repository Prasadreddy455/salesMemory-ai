import { useGetMonthSummary, useGetDailyCosts } from "@workspace/api-client-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line } from "recharts";

export default function Analytics() {
  const { data: monthSummary, isLoading: summaryLoading } = useGetMonthSummary();
  const { data: dailyCosts, isLoading: dailyLoading } = useGetDailyCosts();

  const BUDGET = 100; // Mock budget for now
  const cost = monthSummary?.total_cost || 0;
  const percentUsed = Math.min((cost / BUDGET) * 100, 100);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Cost Analytics</h1>
        <p className="text-muted-foreground">Monitor your AI usage and budget.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-primary/20 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Month Cost</CardTitle>
          </CardHeader>
          <CardContent>
            {summaryLoading ? <Skeleton className="h-12 w-24" /> : (
              <div>
                <div className="text-4xl font-bold font-mono tracking-tight text-primary">${cost.toFixed(2)}</div>
                <div className="mt-4 space-y-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span className={percentUsed > 70 ? "text-destructive" : "text-muted-foreground"}>{percentUsed.toFixed(1)}% of budget</span>
                    <span className="text-muted-foreground font-mono">${BUDGET.toFixed(2)}</span>
                  </div>
                  <Progress value={percentUsed} className={percentUsed > 70 ? "[&>div]:bg-destructive" : ""} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            {summaryLoading ? <Skeleton className="h-12 w-16" /> : <div className="text-4xl font-bold font-mono">{monthSummary?.task_count || 0}</div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Avg Cost / Task</CardTitle>
          </CardHeader>
          <CardContent>
            {summaryLoading ? <Skeleton className="h-12 w-24" /> : <div className="text-4xl font-bold font-mono">${(monthSummary?.avg_cost || 0).toFixed(4)}</div>}
          </CardContent>
        </Card>
      </div>

      {dailyCosts && dailyCosts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Daily Spend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyCosts} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(val) => {
                      const d = new Date(val);
                      return `${d.getMonth()+1}/${d.getDate()}`;
                    }}
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `$${val}`}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'Cost']}
                    labelFormatter={(label) => new Date(label).toLocaleDateString()}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="daily_cost" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3} 
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }} 
                    activeDot={{ r: 6 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Model Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {summaryLoading ? <Skeleton className="h-48 w-full" /> : (
              <div className="space-y-4">
                {monthSummary?.by_model?.map((model, i) => (
                  <div key={model.model_used} className="flex items-center justify-between p-3 rounded-md bg-secondary/30 animate-in slide-in-from-left-2" style={{animationDelay: `${i*100}ms`}}>
                    <div>
                      <div className="font-semibold text-primary">{model.model_used}</div>
                      <div className="text-xs text-muted-foreground">{model.count} tasks</div>
                    </div>
                    <div className="font-mono font-medium">${model.total_cost.toFixed(3)}</div>
                  </div>
                ))}
                {(!monthSummary?.by_model || monthSummary.by_model.length === 0) && (
                  <div className="text-center p-4 text-muted-foreground text-sm">No model data available</div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Task Type Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {summaryLoading ? <Skeleton className="h-48 w-full" /> : (
              <div className="space-y-4">
                {monthSummary?.by_type?.map((type, i) => (
                  <div key={type.task_type} className="flex items-center justify-between p-3 rounded-md border border-border/50 animate-in slide-in-from-right-2" style={{animationDelay: `${i*100}ms`}}>
                    <div>
                      <div className="font-semibold uppercase tracking-wider text-xs mb-1">{type.task_type.replace('_', ' ')}</div>
                      <div className="text-xs text-muted-foreground">{type.count} tasks</div>
                    </div>
                    <div className="font-mono font-medium">${type.total_cost.toFixed(3)}</div>
                  </div>
                ))}
                {(!monthSummary?.by_type || monthSummary.by_type.length === 0) && (
                  <div className="text-center p-4 text-muted-foreground text-sm">No task data available</div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
