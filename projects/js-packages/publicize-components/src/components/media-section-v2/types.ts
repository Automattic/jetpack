/**
 * Types for the unified media section component
 */

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
 * Attached media item structure (matches AttachedMedia from utils/types)
 */
export interface AttachedMediaItem {
	id: number;
	url: string;
	type: string;
}

/**
 * Image generator settings structure
 */
export interface ImageGeneratorSettings {
	enabled: boolean;
	custom_text?: string;
	image_type?: string;
	image_id?: number;
	template?: string;
	token?: string;
	default_image_id?: number;
}

/**
 * Media source value type
 */
export type MediaSourceValue = 'featured-image' | 'sig' | 'media-library' | 'upload-video' | 'none';

/**
 * Jetpack social options for media updates
 */
export interface MediaOptions {
	attached_media?: Array< AttachedMediaItem >;
	image_generator_settings?: ImageGeneratorSettings;
	media_source?: MediaSourceValue;
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
	attachedMedia?: Array< AttachedMediaItem >;

	/**
	 * Optional image generator settings. Used with per-connection customization.
	 */
	imageGeneratorSettings?: ImageGeneratorSettings;

	/**
	 * Optional media source value.
	 */
	mediaSource?: MediaSourceValue;

	/**
	 * Optional callback to update media-related options.
	 * When provided, the component operates in "controlled" mode.
	 */
	onMediaChange?: ( updates: Partial< MediaOptions > ) => void;
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
