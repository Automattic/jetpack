import type { BlockEditorSelectors } from '@automattic/jetpack-ai-client';

export interface BlockEditorStore {
	selectors: {
		[ key in keyof BlockEditorSelectors ]: BlockEditorSelectors[ key ];
	};
}
