import type { VideoGUID, VideoId } from '../../block-editor/blocks/video/types';

export type ChapterManagerModalProps = {
	isOpen: boolean;
	guid: VideoGUID;
	/** Attachment id of the video, for the description meta POST. */
	attachmentId: VideoId;
	/**
	 * The video description — the single source of truth for chapters. The
	 * modal parses its timestamp lines on open and serializes edits back into
	 * it on save (byte-preserving the surrounding prose).
	 */
	description: string;
	title?: string;
	isPrivate?: boolean;
	onClose: () => void;
	/**
	 * Called with the just-saved description after the meta POST succeeds, so
	 * hosts can move their own copy (e.g. the block's `description`
	 * attribute) and refresh previews. Not called when the save fails.
	 */
	onSaved: ( nextDescription: string ) => void;
};
