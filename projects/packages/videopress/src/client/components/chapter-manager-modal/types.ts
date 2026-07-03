import type { VideoGUID } from '../../block-editor/blocks/video/types';
import type { VideoTextTrack } from '../../lib/video-tracks/types';

export type ChapterManagerModalProps = {
	isOpen: boolean;
	guid: VideoGUID;
	title?: string;
	/** The current description; parsed into chapter rows when the modal opens. */
	description: string;
	videoSrc?: string;
	poster?: string | null;
	isPrivate?: boolean;
	/**
	 * Track list already known to the host, used until the modal fetches the
	 * authoritative list itself. Hosts without one may omit it.
	 */
	tracks?: VideoTextTrack[];
	/** Video duration in milliseconds, used for the last chapter's VTT end time. */
	durationMs?: number;
	onClose: () => void;
	/**
	 * Called after a successful save with the rewritten description and the
	 * updated track list. The host persists the description its own way.
	 */
	onSaved: ( description: string, tracks: VideoTextTrack[] ) => void;
};
