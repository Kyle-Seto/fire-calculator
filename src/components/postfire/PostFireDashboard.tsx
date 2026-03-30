import { YieldShieldCard } from "@/components/postfire/YieldShieldCard";
import { WithdrawalStrategy } from "@/components/postfire/WithdrawalStrategy";

export function PostFireDashboard() {
  return (
    <div className="space-y-6 pt-2">
      <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">
        Retirement Planning
      </span>
      <YieldShieldCard />
      <WithdrawalStrategy />
    </div>
  );
}
