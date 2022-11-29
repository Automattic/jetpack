/**
 * External dependencies
 */
import { UploadTrackDataProps } from '../../../../../lib/video-tracks/types';
import { TrackProps, VideoGUID } from '../../types';

export type TrackItemProps = {
	track: TrackProps;
	guid: VideoGUID;
	onDelete?: ( track: TrackProps ) => void;
};

export type TrackListProps = {
	tracks: TrackProps[];
	guid: VideoGUID;
	onTrackListUpdate?: ( tracks: TrackProps[] ) => void;
};

export type TrackFormProps = {
	onCancel: () => void;
	onSave: ( track: UploadTrackDataProps ) => void;
	tracks: TrackProps[];
};
