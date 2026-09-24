/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SavedCampaignProgress {
  roundIndex: number;
  totalScore: number;
  roundsHistory: Array<{
    roundNumber: number;
    locationId: string;
    locationName: string;
    score: number;
    distanceKm: number;
    guessLatLng: { lat: number; lng: number } | null;
    timeSpentSec?: number;
  }>;
  completed?: boolean;
}

const COOKIE_NAME = 'topoguesser_campaign_playtest_v1';

export function setCookie(name: string, value: string, days = 30): void {
  try {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
  } catch (err) {
    console.error('Failed to set cookie:', err);
  }
}

export function getCookie(name: string): string | null {
  try {
    const match = document.cookie.match(new RegExp('(^|;\\s*)' + encodeURIComponent(name) + '=([^;]*)'));
    return match ? decodeURIComponent(match[2]) : null;
  } catch (err) {
    console.error('Failed to get cookie:', err);
    return null;
  }
}

export function deleteCookie(name: string): void {
  try {
    document.cookie = `${encodeURIComponent(name)}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;SameSite=Lax`;
  } catch (err) {
    console.error('Failed to delete cookie:', err);
  }
}

export function saveCampaignCookie(data: SavedCampaignProgress): void {
  try {
    const jsonStr = JSON.stringify(data);
    setCookie(COOKIE_NAME, jsonStr, 60);
  } catch (err) {
    console.error('Failed to save campaign cookie:', err);
  }
}

export function loadCampaignCookie(): SavedCampaignProgress | null {
  try {
    const val = getCookie(COOKIE_NAME);
    if (!val) return null;
    const parsed = JSON.parse(val);
    if (parsed && typeof parsed.roundIndex === 'number' && typeof parsed.totalScore === 'number') {
      return parsed as SavedCampaignProgress;
    }
  } catch (err) {
    console.error('Failed to load campaign cookie:', err);
  }
  return null;
}

export function clearCampaignCookie(): void {
  deleteCookie(COOKIE_NAME);
}
