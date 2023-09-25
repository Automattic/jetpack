import { z } from 'zod';
import { jetpack_boost_ds } from './data-sync-client';

export const dismissedScorePrompt = jetpack_boost_ds.createAsyncStore(
	'dismissed_score_prompt',
	z.enum( [ 'score-increase', 'score-decrease' ] ).nullable()
);

export const dismissedScorePromptStore = dismissedScorePrompt.store;
