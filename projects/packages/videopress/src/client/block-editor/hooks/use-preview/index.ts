/*
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
/*
 * Types
 */
import type { VideoPreview } from '../../../block-editor/blocks/video/types';

export type UsePreviewResult = {
	preview: VideoPreview;
	isRequestingEmbedPreview: boolean;
};

const defaultPreview: VideoPreview = { html: null, scripts: [], width: null, height: null };

export const usePreview = ( videoPressUrl?: string ): UsePreviewResult => {
	return useSelect(
		select => {
			if ( ! videoPressUrl ) {
				return { preview: defaultPreview, isRequestingEmbedPreview: false };
			}
			return {
				preview: select( coreStore ).getEmbedPreview( videoPressUrl ) || defaultPreview,
				isRequestingEmbedPreview:
					select( coreStore ).isRequestingEmbedPreview( videoPressUrl ) || false,
			};
		},
		[ videoPressUrl ]
	);
};
