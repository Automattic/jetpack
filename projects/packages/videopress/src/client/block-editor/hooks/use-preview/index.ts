/*
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
/*
 * Types
 */
import { videoPreviewPropsDefaults } from '../../../block-editor/blocks/video/types';
import type { VideoPreviewProps } from '../../../block-editor/blocks/video/types';

export type UsePreviewProps = {
	preview: VideoPreviewProps;
	isRequestingEmbedPreview: boolean;
};

const defaultPreview: VideoPreviewProps = {
	...videoPreviewPropsDefaults,
	html: null,
	scripts: [],
	width: null,
	height: null,
	thumbnail_height: null,
	thumbnail_width: null,
	title: null,
};

export const usePreview = ( videoPressUrl?: string ): UsePreviewProps => {
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
