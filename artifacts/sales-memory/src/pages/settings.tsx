import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const [budget, setBudget] = useState("100");
  const { toast } = useToast();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate save
    toast({
      title: "Settings saved",
      description: "Your monthly budget has been updated."
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Configure your workspace preferences.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>AI Budget Limit</CardTitle>
          <CardDescription>Set a soft limit for monthly AI API costs.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="budget">Monthly Budget ($)</Label>
              <Input 
                id="budget" 
                type="number" 
                value={budget} 
                onChange={e => setBudget(e.target.value)} 
              />
            </div>
            <div className="pt-2">
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
