import { CapabilityCard } from './CapabilityCard.js';

type Workout = { title: string; focus?: string; reason?: string };

export default function Workouts() {
  return (
    <CapabilityCard<Workout>
      title="Workout suggestions"
      description="Recommend workouts from activity patterns."
      path={`/api/workouts/suggestions/${encodeURIComponent('mona@example.com')}`}
      collection="suggestions"
      emptyMessage="No workout suggestions available."
      renderItem={(workout) => [workout.title, workout.focus, workout.reason].filter(Boolean).join(' — ')}
    />
  );
}
