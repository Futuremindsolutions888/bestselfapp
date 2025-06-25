
import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { MessageCircle } from "lucide-react";

/* =====================================================================
  BestSelfApp – MVP v0.1
  ▸ Auth: magic-link (email)
  ▸ Data: Supabase (Postgres + Realtime)
  ▸ Features
      – Orientation / Daily / Weekly tasks (initial seed)
      – Tick checkboxes per day (stored in completions table)
      – Per-task notes
      – Mastermind comments realtime feed (channel per user)
  ===================================================================== */

const supabase = createClientComponentClient({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});

export default function BestSelfApp() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [completions, setCompletions] = useState({});
  const [email, setEmail] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) setUser(data.user);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data, error } = await supabase.from("tasks").select("id,title,freq");
      if (!error) setTasks(data || []);
      const { data: done } = await supabase
        .from("completions")
        .select("task_id, note")
        .eq("user_id", user.id)
        .eq("date", new Date().toISOString().slice(0, 10));
      const map = {};
      done?.forEach((c) => (map[c.task_id] = { done: true, note: c.note }));
      setCompletions(map);
    })();
  }, [user]);

  const toggleTask = async (taskId) => {
    const today = new Date().toISOString().slice(0, 10);
    const exists = completions[taskId]?.done;
    if (exists) {
      await supabase
        .from("completions")
        .delete()
        .match({ task_id: taskId, user_id: user.id, date: today });
      setCompletions((prev) => ({ ...prev, [taskId]: { done: false, note: "" } }));
    } else {
      await supabase.from("completions").insert({ task_id: taskId, user_id: user.id, date: today });
      setCompletions((prev) => ({ ...prev, [taskId]: { done: true, note: "" } }));
    }
  };

  const saveNote = async (taskId, note) => {
    const today = new Date().toISOString().slice(0, 10);
    await supabase
      .from("completions")
      .upsert({ task_id: taskId, user_id: user.id, date: today, note });
    setCompletions((prev) => ({ ...prev, [taskId]: { ...(prev[taskId] || {}), note } }));
  };

  if (loading) return <p className="text-center mt-10">Loading…</p>;
  if (!user)
    return (
      <div className="flex flex-col items-center mt-20 space-y-4">
        <h1 className="text-2xl font-bold">Best-Self Protocol</h1>
        <Input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="max-w-sm"
        />
        <Button
          onClick={async () => {
            const { error } = await supabase.auth.signInWithOtp({ email });
            if (error) alert(error.message);
            else alert("Magic link sent! Check your inbox.");
          }}
        >
          Send Magic Link
        </Button>
      </div>
    );

  const grouped = {
    orientation: tasks.filter((t) => t.freq === "orientation"),
    daily: tasks.filter((t) => t.freq === "daily"),
    weekly: tasks.filter((t) => t.freq === "weekly"),
  };

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <header className="my-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Welcome, {user.email}</h1>
        <Button variant="secondary" onClick={() => supabase.auth.signOut()}>
          Sign out
        </Button>
      </header>

      {Object.entries(grouped).map(([label, arr]) => (
        <Card key={label} className="mb-6">
          <CardContent className="p-4">
            <h2 className="font-semibold capitalize mb-2">{label} tasks</h2>
            {arr.map((task) => (
              <div key={task.id} className="flex items-start space-x-3 mb-2">
                <Checkbox
                  checked={!!completions[task.id]?.done}
                  onCheckedChange={() => toggleTask(task.id)}
                />
                <div className="flex-1">
                  <p>{task.title}</p>
                  <Textarea
                    placeholder="Note for mastermind…"
                    value={completions[task.id]?.note || ""}
                    onChange={(e) => saveNote(task.id, e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardContent className="p-4">
          <h2 className="font-semibold mb-2 flex items-center">
            <MessageCircle className="w-4 h-4 mr-2" /> Mastermind Feed
          </h2>
          <p className="text-sm text-muted-foreground">Coming soon…</p>
        </CardContent>
      </Card>
    </div>
  );
}
