// Order is the rendering order in the Distribution tab. Pocket Casts first
// since it's historically the smoothest one-click submit on wpcom.

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
