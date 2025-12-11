/**
 * Types for the unified media section component
 */

/**
 * Media source types
 */
export type MediaSourceType = 'featured-image' | 'media-library' | 'upload-video' | 'sig' | null;

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
	id: MediaSourceType;
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
