import { useCreateClient, getListClientsQueryKey, getGetPipelineSummaryQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

export default function ClientNew() {
  const [_, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const createClient = useCreateClient();

  const [formData, setFormData] = useState({
    name: "",
    company: "",
    industry: "",
    budget: "",
    timeline: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createClient.mutate({
      data: {
        ...formData,
        deal_stage: "Discovery"
      }
    }, {
      onSuccess: (client) => {
        queryClient.invalidateQueries({ queryKey: getListClientsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetPipelineSummaryQueryKey() });
        setLocation(`/clients/${client.id}`);
      }
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">New Deal</h1>
        <p className="text-muted-foreground">Add a new client to your pipeline.</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Contact Name</Label>
              <Input id="name" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Jane Doe" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input id="company" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} placeholder="Acme Corp" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="budget">Budget</Label>
                <Input id="budget" value={formData.budget} onChange={e => setFormData({...formData, budget: e.target.value})} placeholder="$50k" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timeline">Timeline</Label>
                <Input id="timeline" value={formData.timeline} onChange={e => setFormData({...formData, timeline: e.target.value})} placeholder="Q3 2025" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Input id="industry" value={formData.industry} onChange={e => setFormData({...formData, industry: e.target.value})} placeholder="SaaS" />
            </div>
            
            <div className="pt-4 flex justify-end">
              <Button type="submit" disabled={createClient.isPending}>
                {createClient.isPending ? "Saving..." : "Create Deal"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
