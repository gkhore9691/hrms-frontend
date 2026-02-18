"use client";

import { useAuthStore } from "@/stores/authStore";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BENEFITS_LIST } from "@/data/benefitsData";
import { Gift } from "lucide-react";

export default function BenefitsPage() {
  const session = useAuthStore((s) => s.session);

  if (!session) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Benefits"
        description="Company benefits and eligibility"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {BENEFITS_LIST.map((b) => (
          <Card key={b.id} className="rounded-xl shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Gift className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-base">{b.name}</CardTitle>
              </div>
              <p className="text-xs font-medium text-slate-500">{b.category}</p>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">{b.description}</p>
              <p className="mt-2 text-xs text-slate-500">Eligibility: {b.eligibility}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
