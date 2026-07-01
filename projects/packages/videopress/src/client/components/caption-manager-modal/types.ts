import type { VideoGUID } from '../../block-editor/blocks/video/types';
import type { VideoTextTrack } from '../../lib/video-tracks/types';

export type CaptionManagerModalProps = {
	isOpen: boolean;
	guid: VideoGUID;
	title?: string;
	videoSrc?: string;
	poster?: string | null;
	isPrivate?: boolean;
	/**
	 * Track list already known to the host, shown until the modal fetches the
	 * authoritative list itself. Hosts without one may omit it.
	 */
	tracks?: VideoTextTrack[];
	onClose: () => void;
	/**
	 * Called with the updated track list after a mutation. Hosts that keep
	 * their own copy of the video (e.g. a query cache) may ignore the payload
	 * and simply invalidate/refetch.
	 */
	onTracksChange: ( tracks: VideoTextTrack[] ) => void;
};
