/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CuratedPlace, DifficultyLevel } from './game';

export interface CampaignFile {
  version: 1;
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  region?: string;
  difficulty?: 'standard' | 'hard';
  author?: string;
  createdAt?: string;
  places: CuratedPlace[];
}

export interface CampaignMeta extends CampaignFile {
  isBuiltIn: boolean;
  totalPointsPossible: number;
}
