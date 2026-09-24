/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AlpineLocation, DailyStats, RoundResult } from '../types/game';
import { AUSTRIAN_LOCATIONS } from '../data/austrianLocations';

/**
 * Linear Congruential Generator (LCG) for deterministic daily seeds.
 */
class SeededPRNG {
  private seed: number;

  constructor(seedStr: string) {
    let h = 2166136261;
    for (let i = 0; i < seedStr.length; i++) {
      h ^= seedStr.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    this.seed = h >>> 0;
  }

  next(): number {
    this.seed = (this.seed * 1664525 + 1013904223) >>> 0;
    return this.seed / 4294967296;
  }
}

/**
 * Returns today's date in YYYY-MM-DD format based on Europe/Vienna timezone.
 */
export function getAustrianTodayDateStr(): string {
  const now = new Date();
  const viennaDateStr = now.toLocaleDateString('en-CA', {
    timeZone: 'Europe/Vienna',
  });
  return viennaDateStr; // Format: YYYY-MM-DD
}

/**
 * Selects 5 deterministic locations for the daily challenge.
 */
export function getDailyChallengeLocations(dateStr: string = getAustrianTodayDateStr()): AlpineLocation[] {
  const prng = new SeededPRNG(`topoguesser-austria-${dateStr}`);
  const pool = [...AUSTRIAN_LOCATIONS];
  
  // Fisher-Yates shuffle with seeded PRNG
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(prng.next() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return pool.slice(0, Math.min(5, pool.length));
}

const STORAGE_KEY_DAILY_STATS = 'topoguesser_daily_stats_v1';

export function loadDailyStats(): DailyStats {
  const today = getAustrianTodayDateStr();
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DAILY_STATS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.date === today) {
        return parsed;
      } else {
        // Different day - maintain streak if played yesterday
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yestStr = yesterday.toLocaleDateString('en-CA', { timeZone: 'Europe/Vienna' });
        const streak = (parsed.date === yestStr && parsed.played) ? parsed.streak : 0;

        return {
          date: today,
          played: false,
          score: 0,
          rounds: [],
          streak,
          bestScore: parsed.bestScore || 0,
          totalGames: parsed.totalGames || 0,
        };
      }
    }
  } catch {
    // ignore parse errors
  }

  return {
    date: today,
    played: false,
    score: 0,
    rounds: [],
    streak: 0,
    bestScore: 0,
    totalGames: 0,
  };
}

export function saveDailyStats(stats: DailyStats): void {
  try {
    localStorage.setItem(STORAGE_KEY_DAILY_STATS, JSON.stringify(stats));
  } catch {
    // local storage unavailable
  }
}

/**
 * Generate shareable text summary for clipboard.
 */
export function generateShareText(stats: DailyStats, rounds: RoundResult[]): string {
  const totalScore = rounds.reduce((acc, r) => acc + r.score, 0);
  const maxScore = rounds.length * 5000;

  const scoreEmoji = (score: number) => {
    if (score >= 4800) return '🟩'; // Gold/green
    if (score >= 4000) return '🟨'; // Yellow
    if (score >= 2500) return '🟧'; // Orange
    return '🟥'; // Red
  };

  const roundEmojis = rounds.map(r => scoreEmoji(r.score)).join('');

  return `Topoguesser Austria #${stats.date}
Score: ${totalScore.toLocaleString()} / ${maxScore.toLocaleString()} pts
Streak: ${stats.streak} day${stats.streak === 1 ? '' : 's'}
${roundEmojis}

Play online: https://ais-dev-kqpxtuapwwiomx2lhhue2o-133320680030.europe-west1.run.app`;
}
