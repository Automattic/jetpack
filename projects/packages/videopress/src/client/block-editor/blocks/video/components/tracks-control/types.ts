import { TrackProps, VideoGUID } from '../../types';

export type TrackItemProps = {
	track: TrackProps;
	guid: VideoGUID;
};

export type TrackListProps = {
	tracks: TrackProps[];
	guid: VideoGUID;
};

export type TrackFormProps = {
	onCancel: () => void;
	tracks: TrackProps[];
};
