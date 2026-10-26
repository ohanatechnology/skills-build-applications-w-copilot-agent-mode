import { CapabilityCard } from './CapabilityCard.js';

type Team = { name: string; mascot?: string };

export default function Teams() {
  return (
    <CapabilityCard<Team>
      title="Teams"
      description="Manage teams and members."
      path="/api/teams"
      collection="teams"
      emptyMessage="No teams yet."
      renderItem={(team) => team.mascot ? `${team.name} (${team.mascot})` : team.name}
    />
  );
}
