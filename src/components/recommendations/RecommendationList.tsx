import { useMemo } from "react";
import { useFireStore } from "@/store/useFireStore";
import { generateRecommendations } from "@/engine/recommendations";
import { RecommendationCard } from "@/components/recommendations/RecommendationCard";

export function RecommendationList() {
  const persona = useFireStore((s) => s.persona);
  const results = useFireStore((s) => s.results);

  const recommendations = useMemo(
    () => (results ? generateRecommendations(persona, results) : []),
    [persona, results],
  );

  if (!results) return null;

  if (recommendations.length === 0) {
    return (
      <div className="space-y-3 pt-2">
        <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">
          Your Next Moves
        </span>
        <div className="bg-slate-50 rounded-xl p-5">
          <p className="text-sm text-slate-500">
            You're in great shape — no major adjustments needed right now. Keep
            it up!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 pt-2">
      <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">
        Your Next Moves
      </span>
      <div className="space-y-3">
        {recommendations.map((rec) => (
          <RecommendationCard key={rec.id} rec={rec} />
        ))}
      </div>
    </div>
  );
}
