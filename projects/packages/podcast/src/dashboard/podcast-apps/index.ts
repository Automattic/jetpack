/**
 * Podcast directory app registry.
 *
 * Each entry is a `PodcastApp` config that combines the directory's metadata
 * with its logo and any per-app UI overrides (extra step content, full modal
 * replacement, etc.). Entries are ordered as they appear in the Distribution
 * tab — alphabetical except Pocket Casts surfaces first since it's
 * historically the smoothest one-click submit on wpcom.
 */

import { amazon } from './amazon';
import { apple } from './apple';
import { pocketcasts } from './pocketcasts';
import { podcastindex } from './podcastindex';
import { spotify } from './spotify';
import { youtube } from './youtube';
import type { PodcastApp } from './types';

export const PODCAST_APPS: readonly PodcastApp[] = [
	pocketcasts,
	apple,
	spotify,
	youtube,
	amazon,
	podcastindex,
] as const;

export type { PodcastApp, PodcastAppModalProps } from './types';
