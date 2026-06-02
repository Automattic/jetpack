import type { VideoGUID } from '../../block-editor/blocks/video/types';
import type { VideoTextTrack } from '../../lib/video-tracks/types';

export type CaptionManagerModalProps = {
	isOpen: boolean;
	guid: VideoGUID;
	title?: string;
	tracks: VideoTextTrack[];
	onClose: () => void;
	onTracksChange: ( tracks: VideoTextTrack[] ) => void;
};
