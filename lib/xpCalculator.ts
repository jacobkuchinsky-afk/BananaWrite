/**
 * XP calculation for BananaWrite.
 *
 * Core equation:
 *   XP = round(EXPECTED_WEIGHT * expectedMinutes + ACTIVE_WEIGHT * clampedActiveMinutes)
 *
 * Where:
 *   clampedActiveMinutes = clamp(activeMinutes, expectedMinutes * MIN_TIME_FACTOR, expectedMinutes * MAX_TIME_FACTOR)
 *
 * This produces a 1 XP ≈ 1 minute ratio while blending expected task
 * duration (40%) with activity-verified actual time (60%).
 */

const WRITING_SPEED_WPM = 18
const MINUTES_PER_QUESTION = 1.5
const EXPECTED_WEIGHT = 0.4
const ACTIVE_WEIGHT = 0.6
const MIN_TIME_FACTOR = 0.3
const MAX_TIME_FACTOR = 2.0

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function calculateEssayXP(wordCount: number, activeMinutes: number): number {
  const expectedMinutes = wordCount / WRITING_SPEED_WPM
  const clamped = clamp(activeMinutes, expectedMinutes * MIN_TIME_FACTOR, expectedMinutes * MAX_TIME_FACTOR)
  return Math.max(1, Math.round(EXPECTED_WEIGHT * expectedMinutes + ACTIVE_WEIGHT * clamped))
}

export function calculateQuizXP(questionCount: number, activeMinutes: number): number {
  const expectedMinutes = questionCount * MINUTES_PER_QUESTION
  const clamped = clamp(activeMinutes, expectedMinutes * MIN_TIME_FACTOR, expectedMinutes * MAX_TIME_FACTOR)
  return Math.max(1, Math.round(EXPECTED_WEIGHT * expectedMinutes + ACTIVE_WEIGHT * clamped))
}
