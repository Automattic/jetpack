/**
 * Types for the unified media section component
 */

import type {
	AttachedMedia,
	FocalPoint,
	JetpackSocialOptions,
	SIGSettings,
} from '../../utils/types';

/**
 * Media source types
 */
export type MediaSourceType = 'featured-image' | 'media-library' | 'upload-video' | 'sig' | null;

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
	 * Optional attached media array. In controlled mode (when `onMediaChange` is provided),
	 * this value is used instead of fetching from the store. Falls back to empty array if not provided.
	 */
	attachedMedia?: Array< AttachedMedia >;

	/**
	 * Optional image generator settings. In controlled mode, this value is used instead of
	 * fetching from the store. Falls back to `{ enabled: false }` if not provided.
	 */
	imageGeneratorSettings?: SIGSettings;

	/**
	 * Optional media source value. In controlled mode, this value is used instead of
	 * fetching from the store. Falls back to store value if not provided.
	 */
	mediaSource?: JetpackSocialOptions[ 'media_source' ];

	/**
	 * Optional callback to update media-related options. When provided, the component
	 * operates in "controlled" mode and uses the media props above instead of fetching from the store.
	 */
	onMediaChange?: ( updates: Partial< JetpackSocialOptions > ) => void;

	/**
	 * Controls the "Share as attachment" toggle.
	 * 'visible' (default): toggle is rendered and user-controlled.
	 * 'hidden': toggle is not rendered; attachment mode is implied by the selected source.
	 * Per-network customization passes 'hidden' so the dropdown alone decides media behavior.
	 */
	attachmentToggleMode?: 'visible' | 'hidden';
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
	 * Featured image ID - used to disable "Use featured image" option when not available
	 */
	featuredImageId?: number;

	/**
	 * Whether to surface the "Default" option in the dropdown. Only used by per-network
	 * customization, where the attachment toggle is hidden and the dropdown alone decides
	 * media behavior — Default is the link-preview-only choice.
	 */
	includeDefaultOption?: boolean;

	/**
	 * Optional children render function that receives open function
	 */
	children?: ( { open }: { open: () => void } ) => React.ReactNode;
}

/**
 * Props for MediaFocalPoint component
 */
export interface MediaFocalPointProps {
	/**
	 * URL of the image to pick the focal point on
	 */
	url: string;

	/**
	 * The current focal point (both axes 0-1).
	 */
	value: FocalPoint;

	/**
	 * Called with the rounded focal point when the user commits it (release,
	 * click, or keyboard).
	 */
	onChange: ( point: FocalPoint ) => void;

	/**
	 * Called with the rounded focal point while dragging, before it is committed.
	 */
	onDrag?: ( point: FocalPoint ) => void;
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
}
