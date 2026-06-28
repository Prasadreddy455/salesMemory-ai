import { useParams } from "wouter";
import { 
  useGetClient, 
  useUpdateClient, 
  useGenerateEmail, 
  useCreateInteraction, 
  useDraftObjection,
  useSuggestSteps,
  useGenerateSummary,
  getGetClientQueryKey, 
  getListClientsQueryKey, 
  getGetPipelineSummaryQueryKey,
  getGetClientInteractionsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Bot, Mail, ShieldAlert, FastForward, FileText, History, Save, Edit2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const STAGES = ["Discovery", "Proposal", "Negotiation", "Won", "Lost"];

export default function ClientDetail() {
  const params = useParams();
  const id = params.id as string;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: client, isLoading } = useGetClient(id, { query: { enabled: !!id, queryKey: getGetClientQueryKey(id) } });
  const updateClient = useUpdateClient();
  const createInteraction = useCreateInteraction();
  
  const generateEmail = useGenerateEmail();
  const draftObjection = useDraftObjection();
  const suggestSteps = useSuggestSteps();
  const generateSummary = useGenerateSummary();

  const [aiResult, setAiResult] = useState<{content: string, model: string, cost: string, type: string} | null>(null);
  const [objectionContext, setObjectionContext] = useState("");
  
  // Edit mode for memory
  const [isEditingMemory, setIsEditingMemory] = useState(false);
  const [memoryForm, setMemoryForm] = useState({
    decision_makers: "",
    objections: "",
    notes: ""
  });

  useEffect(() => {
    if (client?.memory) {
      setMemoryForm({
        decision_makers: client.memory.decision_makers?.join(", ") || "",
        objections: client.memory.objections?.join("\n") || "",
        notes: client.memory.notes || ""
      });
    }
  }, [client?.memory]);

  const logInteractionAndRefresh = (type: string, content: string, model: string, costStr: string) => {
    setAiResult({ content, model, cost: costStr, type });
    createInteraction.mutate({
      data: {
        client_id: id,
        type,
        content,
        generated_by_model: model,
        cost: parseFloat(costStr)
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetClientQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: getGetClientInteractionsQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: getGetPipelineSummaryQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListClientsQueryKey() });
      }
    });
  };

  const handleAIAction = (action: 'email' | 'objection' | 'steps' | 'summary') => {
    setAiResult(null);
    if (action === 'email') {
      generateEmail.mutate({ data: { client_id: id } }, {
        onSuccess: (res) => logInteractionAndRefresh("email_sent", res.content, res.model, res.cost)
      });
    } else if (action === 'objection') {
      if (!objectionContext) {
        toast({ title: "Objection context needed", description: "Please enter the objection you want to handle.", variant: "destructive" });
        return;
      }
      draftObjection.mutate({ data: { client_id: id, objection: objectionContext } }, {
        onSuccess: (res) => logInteractionAndRefresh("objection_response", res.content, res.model, res.cost)
      });
    } else if (action === 'steps') {
      suggestSteps.mutate({ data: { client_id: id } }, {
        onSuccess: (res) => logInteractionAndRefresh("next_steps", res.content, res.model, res.cost)
      });
    } else if (action === 'summary') {
      generateSummary.mutate({ data: { client_id: id } }, {
        onSuccess: (res) => logInteractionAndRefresh("summary", res.content, res.model, res.cost)
      });
    }
  };

  const handleStageChange = (newStage: string) => {
    updateClient.mutate({ id, data: { deal_stage: newStage } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetClientQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: getListClientsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetPipelineSummaryQueryKey() });
        toast({ title: "Stage updated", description: `Moved to ${newStage}` });
      }
    });
  };

  const handleSaveMemory = () => {
    updateClient.mutate({
      id,
      data: {
        memory: {
          decision_makers: memoryForm.decision_makers.split(",").map(s => s.trim()).filter(Boolean),
          objections: memoryForm.objections.split("\n").map(s => s.trim()).filter(Boolean),
          notes: memoryForm.notes
        }
      }
    }, {
      onSuccess: () => {
        setIsEditingMemory(false);
        queryClient.invalidateQueries({ queryKey: getGetClientQueryKey(id) });
        toast({ title: "Memory updated", description: "Client details saved successfully." });
      }
    });
  };

  if (isLoading || !client) return <div><Skeleton className="h-8 w-64 mb-4" /><Skeleton className="h-64 w-full" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{client.name}</h1>
          <p className="text-xl text-muted-foreground">{client.company || "No Company"}</p>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-muted-foreground">Stage:</Label>
          <Select value={client.deal_stage} onValueChange={handleStageChange}>
            <SelectTrigger className="w-[180px] font-semibold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-primary/20 bg-card/50 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Bot className="w-5 h-5" /> Intelligence Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <Button variant="secondary" onClick={() => handleAIAction('email')} disabled={generateEmail.isPending} className="justify-start">
                  {generateEmail.isPending ? "Generating..." : <><Mail className="w-4 h-4 mr-2" /> Draft Email</>}
                </Button>
                <Button variant="secondary" onClick={() => handleAIAction('steps')} disabled={suggestSteps.isPending} className="justify-start">
                  {suggestSteps.isPending ? "Thinking..." : <><FastForward className="w-4 h-4 mr-2" /> Suggest Next Steps</>}
                </Button>
                <Button variant="secondary" onClick={() => handleAIAction('summary')} disabled={generateSummary.isPending} className="justify-start">
                  {generateSummary.isPending ? "Summarizing..." : <><FileText className="w-4 h-4 mr-2" /> Generate Summary</>}
                </Button>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Objection to handle..." 
                    value={objectionContext}
                    onChange={(e) => setObjectionContext(e.target.value)}
                    className="flex-1 bg-background"
                  />
                  <Button variant="secondary" onClick={() => handleAIAction('objection')} disabled={draftObjection.isPending} className="px-3">
                    {draftObjection.isPending ? "..." : <ShieldAlert className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              
              {aiResult && (
                <div className="mt-4 p-5 border border-border rounded-md bg-background relative animate-in fade-in zoom-in duration-300">
                  <div className="absolute top-2 right-3 text-xs font-mono text-muted-foreground bg-secondary/50 px-2 py-1 rounded">
                    {aiResult.model} • ${aiResult.cost}
                  </div>
                  <h4 className="font-semibold mb-3 text-sm text-primary uppercase tracking-wider">{aiResult.type.replace('_', ' ')}</h4>
                  <div className="whitespace-pre-wrap text-sm text-foreground/90 leading-relaxed font-serif">{aiResult.content}</div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><History className="w-5 h-5 text-muted-foreground" /> Interaction History</CardTitle>
            </CardHeader>
            <CardContent>
              {client.interactions && client.interactions.length > 0 ? (
                <div className="space-y-4">
                  {client.interactions.map((interaction, i) => (
                    <div key={interaction.id} className={`p-4 rounded-md bg-secondary/20 border border-border/50 animate-in slide-in-from-bottom-2`} style={{animationDelay: `${i * 50}ms`}}>
                      <div className="flex justify-between items-center text-xs text-muted-foreground mb-2">
                        <Badge variant="outline" className="uppercase tracking-wider font-mono text-[10px]">{interaction.type.replace('_', ' ')}</Badge>
                        <span className="font-mono">{new Date(interaction.timestamp || "").toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm line-clamp-3 font-serif">{interaction.content}</p>
                      {interaction.generated_by_model && (
                        <div className="mt-2 text-[10px] text-muted-foreground font-mono">
                          AI: {interaction.generated_by_model} {interaction.cost ? `($${interaction.cost.toFixed(4)})` : ''}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-8 border border-dashed border-border rounded-md">
                  <p className="text-muted-foreground text-sm">No interactions recorded yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Deal Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between items-center border-b border-border/50 pb-2">
                <span className="text-muted-foreground">Budget</span>
                <span className="font-mono font-medium">{client.budget || "-"}</span>
              </div>
              <div className="flex justify-between items-center border-b border-border/50 pb-2">
                <span className="text-muted-foreground">Timeline</span>
                <span className="font-medium">{client.timeline || "-"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Industry</span>
                <span className="font-medium">{client.industry || "-"}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Memory Profile</CardTitle>
              {!isEditingMemory ? (
                <Button variant="ghost" size="sm" onClick={() => setIsEditingMemory(true)} className="h-8 px-2 text-muted-foreground hover:text-primary"><Edit2 className="w-4 h-4" /></Button>
              ) : (
                <Button variant="default" size="sm" onClick={handleSaveMemory} disabled={updateClient.isPending} className="h-8 px-2"><Save className="w-4 h-4 mr-1" /> Save</Button>
              )}
            </CardHeader>
            <CardContent className="space-y-5">
              {isEditingMemory ? (
                <div className="space-y-4 animate-in fade-in">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground uppercase">Decision Makers (comma separated)</Label>
                    <Input value={memoryForm.decision_makers} onChange={e => setMemoryForm({...memoryForm, decision_makers: e.target.value})} className="bg-background" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground uppercase">Objections (one per line)</Label>
                    <Textarea value={memoryForm.objections} onChange={e => setMemoryForm({...memoryForm, objections: e.target.value})} className="min-h-[80px] bg-background" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground uppercase">Notes</Label>
                    <Textarea value={memoryForm.notes} onChange={e => setMemoryForm({...memoryForm, notes: e.target.value})} className="min-h-[120px] bg-background" />
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Decision Makers</h4>
                    {client.memory?.decision_makers?.length ? (
                      <div className="flex flex-wrap gap-1.5">
                        {client.memory.decision_makers.map((dm, i) => (
                          <Badge key={i} variant="secondary" className="bg-secondary/50 text-foreground hover:bg-secondary">{dm}</Badge>
                        ))}
                      </div>
                    ) : <span className="text-sm text-muted-foreground italic">None recorded</span>}
                  </div>
                  
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Known Objections</h4>
                    {client.memory?.objections?.length ? (
                      <ul className="space-y-1">
                        {client.memory.objections.map((obj, i) => (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <ShieldAlert className="w-3 h-3 text-destructive mt-1 shrink-0" />
                            <span className="leading-snug">{obj}</span>
                          </li>
                        ))}
                      </ul>
                    ) : <span className="text-sm text-muted-foreground italic">None recorded</span>}
                  </div>
                  
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Critical Notes</h4>
                    {client.memory?.notes ? (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap font-serif text-foreground/80 bg-secondary/20 p-3 rounded-md border border-border/50">{client.memory.notes}</p>
                    ) : <span className="text-sm text-muted-foreground italic">No notes</span>}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
