import type { VideoGUID } from '../../../block-editor/blocks/video/types';

export type VideoDetailsProps = {
	/**
	 * VideoPress GUID.
	 */
	guid?: VideoGUID;

	/**
	 * Video filename.
	 */
	filename: string;

	/**
	 * Video source file URL.
	 */
	src?: string;

	/**
	 * VideoPress embed shortcode.
	 */
	shortcode: string;

	/**
	 * Video uploaded date
	 */
	uploadDate: string;

	/**
	 * Loading mode
	 */
	loading?: boolean;

	isPrivate?: boolean;
};
