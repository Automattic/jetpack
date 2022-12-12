import { VideoGUID, VideoId } from '../video/types';

// We'd like to type `link-${ string }` but it's not possible?
export type PersistentBlockLinkIdProp = string;

export type VideoChaptersBlockAttributes = {
	id?: VideoId;
	guid?: VideoGUID;

	/*
	 * Persistent ID to link the block with the other blocks.
	 */
	persistentBlockLinkId?: PersistentBlockLinkIdProp;
};

export type VideoChaptersBlockPropertiesProps = {
	attributes: VideoChaptersBlockAttributes;
	setAttributes: ( attributes: VideoChaptersBlockAttributes ) => void;
};
