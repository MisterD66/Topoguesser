/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CampaignFile, CampaignMeta } from '../types/campaign';
import { CuratedPlace } from '../types/game';
import { SavedCampaignProgress } from './cookieStorage';

const CUSTOM_CAMPAIGNS_KEY = 'topoguesser_custom_campaigns_v1';
const CAMPAIGN_PROGRESS_PREFIX = 'topoguesser_progress_';

// Automatically import all .campaign.json and .json files in /src/campaigns/ at compile time via Vite
const builtInModules = import.meta.glob<CampaignFile | { default: CampaignFile }>(
  '/src/campaigns/*.{campaign.json,json}',
  { eager: true }
);

// Cache for runtime-loaded campaigns (e.g. from docs/campaigns/ via HTTP fetch)
let externalCampaignsCache: CampaignMeta[] = [];

/**
 * Parses and normalizes raw JSON data into a valid CampaignFile
 */
export function normalizeCampaign(raw: any, fallbackId?: string): CampaignFile | null {
  if (!raw || typeof raw !== 'object') return null;

  // Unpack default export if present
  const data = raw.default && typeof raw.default === 'object' ? raw.default : raw;

  const places: CuratedPlace[] = Array.isArray(data.places)
    ? data.places.filter(
        (p: any) =>
          p &&
          typeof p.name === 'string' &&
          p.observerPos &&
          typeof p.observerPos.lat === 'number' &&
          typeof p.observerPos.lng === 'number'
      )
    : [];

  if (places.length === 0) return null;

  const id =
    (typeof data.id === 'string' && data.id.trim()) ||
    fallbackId ||
    `campaign-${Date.now()}`;

  const title =
    (typeof data.title === 'string' && data.title.trim()) ||
    'Unbenannte Kampagne';

  return {
    version: 1,
    id,
    title,
    subtitle: typeof data.subtitle === 'string' ? data.subtitle : undefined,
    description: typeof data.description === 'string' ? data.description : undefined,
    region: typeof data.region === 'string' ? data.region : places[0]?.bundesland || 'Österreich',
    difficulty: data.difficulty === 'hard' ? 'hard' : 'standard',
    author: typeof data.author === 'string' ? data.author : undefined,
    createdAt: typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString(),
    places,
  };
}

/**
 * Returns all built-in compile-time campaigns discovered automatically from /src/campaigns/
 */
export function getBuiltInCampaigns(): CampaignMeta[] {
  const campaigns: CampaignMeta[] = [];

  for (const path in builtInModules) {
    const raw = builtInModules[path];
    const filename = path.split('/').pop() || '';
    const fallbackId = filename.replace(/\.(campaign\.json|json)$/, '');

    const parsed = normalizeCampaign(raw, fallbackId);
    if (parsed) {
      campaigns.push({
        ...parsed,
        isBuiltIn: true,
        totalPointsPossible: parsed.places.length * 5000,
      });
    }
  }

  // Sort: Put Salzkammergut Playtest first, then alphabetical
  campaigns.sort((a, b) => {
    if (a.id === 'salzkammergut-playtest') return -1;
    if (b.id === 'salzkammergut-playtest') return 1;
    return a.title.localeCompare(b.title);
  });

  return campaigns;
}

/**
 * Loads custom user-imported campaigns from localStorage
 */
export function getCustomCampaigns(): CampaignMeta[] {
  try {
    const stored = localStorage.getItem(CUSTOM_CAMPAIGNS_KEY);
    if (!stored) return [];
    const list = JSON.parse(stored);
    if (!Array.isArray(list)) return [];

    return list
      .map((item, idx) => normalizeCampaign(item, `custom-${idx}`))
      .filter((c): c is CampaignFile => c !== null)
      .map((c) => ({
        ...c,
        isBuiltIn: false,
        totalPointsPossible: c.places.length * 5000,
      }));
  } catch (err) {
    console.error('Failed to load custom campaigns:', err);
    return [];
  }
}

/**
 * Saves a custom campaign into localStorage
 */
export function saveCustomCampaign(campaign: CampaignFile): void {
  try {
    const current = getCustomCampaigns().filter((c) => c.id !== campaign.id);
    current.unshift({
      ...campaign,
      isBuiltIn: false,
      totalPointsPossible: campaign.places.length * 5000,
    });
    localStorage.setItem(CUSTOM_CAMPAIGNS_KEY, JSON.stringify(current));
  } catch (err) {
    console.error('Failed to save custom campaign:', err);
  }
}

/**
 * Deletes a custom campaign from localStorage
 */
export function deleteCustomCampaign(campaignId: string): void {
  try {
    const current = getCustomCampaigns().filter((c) => c.id !== campaignId);
    localStorage.setItem(CUSTOM_CAMPAIGNS_KEY, JSON.stringify(current));
  } catch (err) {
    console.error('Failed to delete custom campaign:', err);
  }
}

/**
 * Fetches campaigns dynamically from docs/campaigns/ (or public/campaigns/ in dev).
 * This allows adding new campaigns to the compiled build by simply copying
 * a .campaign.json file into docs/campaigns/ and listing it in docs/campaigns/index.json,
 * without recompiling the app!
 */
export async function fetchExternalCampaigns(): Promise<CampaignMeta[]> {
  const tryIndexUrls = [
    './campaigns/index.json',
    'campaigns/index.json',
    '/campaigns/index.json',
  ];

  let indexData: any = null;
  let resolvedBaseUrl = './campaigns/';

  for (const url of tryIndexUrls) {
    try {
      const res = await fetch(url, { cache: 'no-cache' });
      if (res.ok) {
        indexData = await res.json();
        resolvedBaseUrl = url.replace(/index\.json$/, '');
        break;
      }
    } catch {
      // Continue trying next relative/absolute path
    }
  }

  const loadedFiles: string[] = [];
  const directCampaigns: CampaignMeta[] = [];

  if (Array.isArray(indexData)) {
    for (const item of indexData) {
      if (typeof item === 'string') {
        loadedFiles.push(item);
      } else if (item && typeof item === 'object') {
        const parsed = normalizeCampaign(item);
        if (parsed) {
          directCampaigns.push({
            ...parsed,
            isBuiltIn: true,
            totalPointsPossible: parsed.places.length * 5000,
          });
        }
      }
    }
  } else if (indexData && typeof indexData === 'object' && Array.isArray(indexData.campaigns)) {
    for (const item of indexData.campaigns) {
      if (typeof item === 'string') {
        loadedFiles.push(item);
      }
    }
  }

  // Auto-probe candidate filenames so users can even just drop a file like custom.campaign.json
  const autoProbes = [
    'custom.campaign.json',
    'meine-runde.campaign.json',
    'kampagne.campaign.json',
  ];
  for (const probe of autoProbes) {
    if (!loadedFiles.includes(probe)) {
      loadedFiles.push(probe);
    }
  }

  const fetchedList: CampaignMeta[] = [...directCampaigns];

  for (const file of loadedFiles) {
    try {
      const res = await fetch(`${resolvedBaseUrl}${file}`, { cache: 'no-cache' });
      if (res.ok) {
        const json = await res.json();
        const fallbackId = file.replace(/\.(campaign\.json|json)$/, '');
        const parsed = normalizeCampaign(json, fallbackId);
        if (parsed) {
          fetchedList.push({
            ...parsed,
            isBuiltIn: true,
            totalPointsPossible: parsed.places.length * 5000,
          });
        }
      }
    } catch {
      // File not found / optional probe
    }
  }

  externalCampaignsCache = fetchedList;
  return getAllCampaigns();
}

/**
 * Returns all available campaigns (built-in folder campaigns + runtime external files + custom imported ones)
 */
export function getAllCampaigns(): CampaignMeta[] {
  const builtIn = getBuiltInCampaigns();
  const custom = getCustomCampaigns();

  // Combine: Built-in serves as initial baseline.
  // externalCampaignsCache (from docs/campaigns/) takes priority for same IDs or adds new campaigns.
  const campaignMap = new Map<string, CampaignMeta>();

  for (const b of builtIn) {
    campaignMap.set(b.id, b);
  }

  for (const ext of externalCampaignsCache) {
    campaignMap.set(ext.id, ext);
  }

  for (const c of custom) {
    if (!campaignMap.has(c.id)) {
      campaignMap.set(c.id, c);
    }
  }

  const all = Array.from(campaignMap.values());

  // Sort: Put Salzkammergut Playtest first, then alphabetical
  all.sort((a, b) => {
    if (a.id === 'salzkammergut-playtest') return -1;
    if (b.id === 'salzkammergut-playtest') return 1;
    return a.title.localeCompare(b.title);
  });

  return all;
}

/**
 * Downloads a campaign object as a `.campaign.json` file to the user's computer
 */
export function downloadCampaignFile(campaign: CampaignFile): void {
  const cleanId = (campaign.id || 'alpen-kampagne')
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const filename = `${cleanId}.campaign.json`;
  const jsonContent = JSON.stringify(campaign, null, 2);

  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * Load progress for a specific campaign
 */
export function loadCampaignProgress(campaignId: string): SavedCampaignProgress | null {
  try {
    const raw = localStorage.getItem(`${CAMPAIGN_PROGRESS_PREFIX}${campaignId}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Save progress for a specific campaign
 */
export function saveCampaignProgress(campaignId: string, progress: SavedCampaignProgress): void {
  try {
    localStorage.setItem(
      `${CAMPAIGN_PROGRESS_PREFIX}${campaignId}`,
      JSON.stringify(progress)
    );
  } catch (err) {
    console.error('Failed to save campaign progress:', err);
  }
}

/**
 * Clear progress for a specific campaign
 */
export function clearCampaignProgress(campaignId: string): void {
  try {
    localStorage.removeItem(`${CAMPAIGN_PROGRESS_PREFIX}${campaignId}`);
  } catch (err) {
    console.error('Failed to clear campaign progress:', err);
  }
}
