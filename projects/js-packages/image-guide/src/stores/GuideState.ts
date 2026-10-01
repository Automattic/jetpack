import { readable, writable } from './facade.ts';
import { commands, selectors } from './store.ts';
import type { GuideState } from './store.ts';

export const guideState = {
	...writable( selectors.getGuideState, commands.setGuideState ),
	cycle: commands.cycleGuideState,
};

export const guideLabel = readable( selectors.getGuideLabel );
export type { GuideState };
