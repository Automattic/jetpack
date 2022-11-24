import { TrackProps, VideoGUID } from '../../types';

export type TrackItemProps = {
	track: TrackProps;
	guid: VideoGUID;
};

export type TrackListProps = {
	tracks: TrackProps[];
	guid: VideoGUID;
};
