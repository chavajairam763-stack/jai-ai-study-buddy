import { createFileRoute } from "@tanstack/react-router";
import { BookOpen } from "lucide-react";

export const Route = createFileRoute("/_authenticated/papers")({ component: Papers });

const branches = ["CSE", "ECE", "EEE", "Mech", "Civil", "IT"];
const sems = ["Sem 1", "Sem 2", "Sem 3", "Sem 4", "Sem 5", "Sem 6", "Sem 7", "Sem 8"];
const subjects = ["Data Structures", "DBMS", "Operating Systems", "Computer Networks", "Machine Learning", "Compiler Design"];
const years = [2024, 2023, 2022, 2021];

function Papers() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Previous Papers</h1>
        <p className="mt-1 text-muted-foreground">Organized by branch, semester, subject and year — plus AI-predicted questions.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Filter title="Branch" items={branches} />
        <Filter title="Semester" items={sems} />
        <Filter title="Subject" items={subjects} />
        <Filter title="Year" items={years.map(String)} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {subjects.slice(0, 6).map((s, i) => (
          <div key={s} className="glass rounded-2xl p-5">
            <BookOpen className="h-5 w-5 text-primary" />
            <div className="mt-3 font-semibold">{s}</div>
            <div className="text-xs text-muted-foreground">CSE · Sem {(i % 4) + 3} · {years[i % 4]}</div>
            <button className="mt-4 w-full rounded-xl bg-gradient-primary py-2 text-xs font-semibold text-primary-foreground glow-sm">Open paper</button>
          </div>
        ))}
      </div>
    </div>
  );
}
function Filter({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="mb-2 text-xs font-semibold text-muted-foreground uppercase">{title}</div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((i) => <button key={i} className="glass rounded-full px-3 py-1 text-xs hover:bg-white/10">{i}</button>)}
      </div>
    </div>
  );
}
