import { VideoGUID, VideoId } from '../video/types';

export interface VideoChaptersBlockAttributes {
	id?: VideoId;
	guid?: VideoGUID;
}

export interface VideoChaptersBlockPropertiesProps {
	attributes: VideoChaptersBlockAttributes;
	setAttributes: ( attributes: VideoChaptersBlockAttributes ) => void;
}
