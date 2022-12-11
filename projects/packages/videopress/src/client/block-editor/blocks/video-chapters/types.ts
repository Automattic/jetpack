import { VideoGUID, VideoId } from '../video/types';

export type VideoChaptersBlockAttributes = {
	id?: VideoId;
	guid?: VideoGUID;
};

export type VideoChaptersBlockPropertiesProps = {
	attributes: VideoChaptersBlockAttributes;
	setAttributes: ( attributes: VideoChaptersBlockAttributes ) => void;
};
