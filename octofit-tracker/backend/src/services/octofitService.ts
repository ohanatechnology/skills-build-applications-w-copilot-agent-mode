import { Types } from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

type Input = Record<string, unknown>;

function badRequest(message: string): never {
  throw Object.assign(new Error(message), { status: 400 });
}

function notFound(message: string): never {
  throw Object.assign(new Error(message), { status: 404 });
}

function readInput(input: unknown): Input {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return badRequest('A JSON object is required');
  }
  return input as Input;
}

function readObjectId(value: unknown, field: string): Types.ObjectId {
  if (typeof value !== 'string' || !Types.ObjectId.isValid(value)) {
    return badRequest(`${field} must be a valid ID`);
  }
  return new Types.ObjectId(value);
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(rawInput: unknown) {
  const input = readInput(rawInput);
  const userId = readObjectId(input.userId, 'userId');
  const teamId = readObjectId(input.teamId, 'teamId');
  if (typeof input.type !== 'string' || !input.type.trim()) {
    return badRequest('type is required');
  }
  if (typeof input.minutes !== 'number' || !Number.isFinite(input.minutes) || input.minutes < 1) {
    return badRequest('minutes must be a positive number');
  }
  if (!await User.exists({ _id: userId })) notFound('User not found');
  if (!await Team.exists({ _id: teamId })) notFound('Team not found');

  return Activity.create({
    user: userId,
    team: teamId,
    type: input.type,
    minutes: input.minutes,
    points: input.minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(rawInput: unknown) {
  const input = readInput(rawInput);
  if (typeof input.name !== 'string' || !input.name.trim()) {
    return badRequest('name is required');
  }
  if (typeof input.mascot !== 'string' || !input.mascot.trim()) {
    return badRequest('mascot is required');
  }
  if (input.members !== undefined && !Array.isArray(input.members)) {
    return badRequest('members must be an array of user IDs');
  }
  const members = (input.members ?? []).map((member) => readObjectId(member, 'member'));
  return Team.create({ name: input.name, mascot: input.mascot, members });
}

export async function getLeaderboard() {
  const teams = await Team.aggregate<{ teamName: string; totalPoints: number }>([
    {
      $lookup: {
        from: Activity.collection.name,
        localField: '_id',
        foreignField: 'team',
        as: 'activities',
      },
    },
    {
      $project: {
        _id: 0,
        teamName: '$name',
        totalPoints: { $sum: { $map: { input: '$activities', as: 'activity', in: '$$activity.points' } } },
      },
    },
    { $sort: { totalPoints: -1, teamName: 1 } },
  ]);
  return teams.map((team, index) => ({ ...team, rank: index + 1 }));
}

function focusForActivity(type: string) {
  switch (type.toLowerCase()) {
    case 'run':
    case 'cycle':
    case 'cardio':
      return 'endurance';
    case 'strength':
    case 'weightlifting':
      return 'strength';
    case 'walk':
      return 'mobility';
    case 'yoga':
    case 'stretch':
      return 'flexibility';
    default:
      return type.toLowerCase();
  }
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).lean();
  if (!user) notFound('User not found');

  const recentActivities = await Activity.find({
    user: user._id,
    occurredAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
  }).sort({ occurredAt: -1 }).limit(20).lean();
  const focusCounts = new Map<string, number>();
  for (const activity of recentActivities) {
    const focus = focusForActivity(activity.type);
    focusCounts.set(focus, (focusCounts.get(focus) ?? 0) + 1);
  }
  const recentFocus = [...focusCounts.entries()].sort((first, second) => second[1] - first[1])[0]?.[0];
  let focus = recentFocus ?? user.fitnessGoal;
  let workouts = await Workout.find({ focus }).sort({ minutes: 1, title: 1 }).lean();
  if (!workouts.length && focus !== user.fitnessGoal) {
    focus = user.fitnessGoal;
    workouts = await Workout.find({ focus }).sort({ minutes: 1, title: 1 }).lean();
  }

  const matchingActivities = recentActivities.filter((activity) => focusForActivity(activity.type) === focus);
  const reason = matchingActivities.length
    ? `Recommended based on your recent ${matchingActivities[0].type} activity.`
    : `Recommended for your ${user.fitnessGoal} fitness goal.`;
  return workouts.map((workout) => ({ ...workout, reason }));
}

export { User };
