/**
 * Internal dependencies
 */
import type { MediaItem } from '../../types.ts';

export type MediaRenderer = {
	type: 'image' | 'video' | 'audio' | 'application';
	component: ( props: { post?: MediaItem } ) => JSX.Element | null;
};
