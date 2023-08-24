import {
  $query,
  $update,
  Record,
  StableBTreeMap,
  Vec,
  match,
  Result,
  nat64,
  ic,
  Opt,
} from "azle";
import { v4 as uuidv4 } from "uuid";

type Exercise = Record<{
  id: string;
  name: string;
  durationMinutes: number;
  caloriesBurned: number;
  date: nat64;
}>;

type ExercisePayload = Record<{
  name: string;
  durationMinutes: number;
  caloriesBurned: number;
}>;

const exerciseStorage = new StableBTreeMap<string, Exercise>(0, 44, 1024);

$query;
export function getExercises(): Result<Vec<Exercise>, string> {
  return Result.Ok(exerciseStorage.values());
}

$query;
export function getExercise(id: string): Result<Exercise, string> {
  return exerciseStorage.get(id)?.map(Result.Ok) ?? Result.Err(`An exercise with id=${id} not found`);
}

$update;
export function addExercise(
  payload: ExercisePayload
): Result<Exercise, string> {
  const exercise = { id: uuidv4(), date: ic.time(), ...payload };
  return exerciseStorage.insert(exercise.id, exercise)
    ?.map(Result.Ok)
    : Result.Err(`An exercise with id=${exercise.id} already exists`);
}

$update;
export function updateExercise(
  id: string,
  payload: ExercisePayload
): Result<Exercise, string> {
  const exercise = exerciseStorage.get(id);
  if (!exercise) {
    return Result.Err(`Couldn't update an exercise with id=${id}. Exercise not found`);
  }

  const updatedExercise = { ...exercise, ...payload };
  return exerciseStorage.insert(updatedExercise.id, updatedExercise)
    ?.map(Result.Ok)
    : Result.Err(`Couldn't update an exercise with id=${id}. Exercise not found`);
}

$update;
export function deleteExercise(id: string): Result<Exercise, string> {
  const exercise = exerciseStorage.get(id);
  if (!exercise) {
    return Result.Err(`Couldn't delete an exercise with id=${id}. Exercise not found.`);
  }

  return exerciseStorage.remove(id)
    ?.map(Result.Ok)
    : Result.Err(`Couldn't delete an exercise with id=${id}. Exercise not found.`);
}

export function calculateTotalCaloriesBurned(): Result<number, string> {
  const exercises = exerciseStorage.values();
  const totalCalories = exercises.reduce(
    (total, exercise) => total + exercise.caloriesBurned,
    0
  );
  return Result.Ok(totalCalories);
}

// Workaround for generating UUIDs
globalThis.crypto = {
  getRandomValues: () => {
    let array = new Uint8Array(32);
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  },
};
