/**
 * Types for the unified media section component
 */

import type { AttachedMedia, JetpackSocialOptions, SIGSettings } from '../../utils/types';

/**
 * Media source types
 */
export type MediaSourceType = 'featured-image' | 'media-library' | 'sig' | null;

/**
 * Menu option IDs - includes all menu items including 'ai-image' which is handled specially
 */
export type MenuOptionId = MediaSourceType | 'ai-image';

/**
 * WordPress media object from MediaUpload
 */
export interface WPMediaObject {
	id: number;
	url: string;
	mime: string;
}

/**
 * Menu group types for categorizing media sources
 */
export type MenuGroupType = 'link-preview' | 'attachment';

/**
 * Media source option definition
 */
export interface MediaSourceOption {
	id: MenuOptionId;
	label: string;
	description: string;
	icon: JSX.Element;
	group: MenuGroupType;
	attachmentDescription?: string;
}

/**
 * Media preview data structure
 */
export interface MediaPreviewData {
	id: number;
	url: string;
	type: 'image' | 'video';
	width?: number;
	height?: number;
}

/**
 * Props for MediaSectionV2 component
 */
export interface MediaSectionV2Props {
	/**
	 * Analytics data to be passed to tracking events
	 */
	analyticsData?: Record< string, unknown >;

	/**
	 * Whether the section is disabled
	 */
	disabled?: boolean;

	/**
	 * Callback when the edit template action is triggered
	 */
	onEditTemplate?: VoidFunction;

	/**
	 * Optional attached media array. When provided along with `onMediaChange`,
	 * the component uses these values instead of fetching from the store.
	 */
	attachedMedia?: Array< AttachedMedia >;

	/**
	 * Optional image generator settings. Used with per-connection customization.
	 */
	imageGeneratorSettings?: SIGSettings;

	/**
	 * Optional media source value.
	 */
	mediaSource?: JetpackSocialOptions[ 'media_source' ];

	/**
	 * Optional callback to update media-related options.
	 * When provided, the component operates in "controlled" mode.
	 */
	onMediaChange?: ( updates: Partial< JetpackSocialOptions > ) => void;
}

/**
 * Props for MediaSourceMenu component
 */
export interface MediaSourceMenuProps {
	/**
	 * Currently selected media source
	 */
	currentSource: MediaSourceType;

	/**
	 * Callback when a media source is selected
	 */
	onSelect: ( source: MediaSourceType ) => void;

	/**
	 * Callback when Media Library option is clicked
	 */
	onMediaLibraryClick?: () => void;

	/**
	 * Callback when Generate with AI option is clicked
	 */
	onAiImageClick?: () => void;

	/**
	 * Whether the menu is disabled
	 */
	disabled?: boolean;

	/**
	 * Optional children render function that receives open function
	 */
	children?: ( { open }: { open: () => void } ) => React.ReactNode;
}

/**
 * Props for MediaPreview component
 */
export interface MediaPreviewProps {
	/**
	 * Media preview data
	 */
	media: MediaPreviewData | null;

	/**
	 * Whether the preview is in loading state
	 */
	isLoading?: boolean;

	/**
	 * Callback to replace the media
	 */
	onReplace?: () => void;

	/**
	 * Callback to remove the media
	 */
	onRemove?: () => void;

	/**
	 * Whether the actions are disabled
	 */
	disabled?: boolean;
}
