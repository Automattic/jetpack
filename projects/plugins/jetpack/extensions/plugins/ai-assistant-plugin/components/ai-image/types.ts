export const FEATURED_IMAGE_FEATURE_NAME = 'featured-post-image' as const;
export const GENERAL_IMAGE_FEATURE_NAME = 'general-image' as const;
export const IMAGE_GENERATION_MODEL_STABLE_DIFFUSION = 'stable-diffusion' as const;
export const IMAGE_GENERATION_MODEL_DALL_E_3 = 'dall-e-3' as const;
export const PLACEMENT_MEDIA_SOURCE_DROPDOWN = 'media-source-dropdown' as const;
export const PLACEMENT_BLOCK_PLACEHOLDER_BUTTON = 'block-placeholder-button' as const;

export interface EditorSelectors {
	// actually getEditedPostAttribute can bring different values, but for our current use, number is fine (media ID)
	getEditedPostAttribute: ( attribute: string ) => number;
	isEditorPanelOpened: ( panel: string ) => boolean;
}

export interface CoreSelectors {
	getMedia: ( mediaId: number ) => {
		id: number;
		source_url: string;
	} | null;
}
