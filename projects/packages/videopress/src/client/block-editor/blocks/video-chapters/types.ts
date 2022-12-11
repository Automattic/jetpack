import { VideoGUID, VideoId } from '../video/types';

export type PersistentBlockLinkIdProp = `link-{ string }`;

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
