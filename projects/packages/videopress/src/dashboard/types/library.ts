import type { VideoTextTrack } from '../../client/lib/video-tracks/types';

export type LibraryItemType = 'videopress' | 'local';
export type LibraryItemPrivacy = 'public' | 'private' | 'site-default';
// `upload.status` doubles as the row's single in-flight-operation slot:
// 'deleting' isn't an upload state, but riding this channel means every
// render site that keys interactivity off `status === 'idle'` (title link,
// thumbnail button, action eligibility) handles it without extra plumbing.
export type UploadStatus = 'idle' | 'uploading' | 'promoting' | 'deleting' | 'failed';
export type VideoRating = 'G' | 'PG-13' | 'R';

export interface UploadState {
	status: UploadStatus;
	progress: number;
}

export interface LibraryItem {
	id: string;
	guid: string;
	type: LibraryItemType;
	title: string;
	filename: string;
	thumbnailUrl: string | null;
	durationSeconds: number;
	uploadDate: string;
	privacy: LibraryItemPrivacy;
	isPrivate: boolean;
	fileSizeBytes: number;
	upload: UploadState;
	description: string;
	rating: VideoRating;
	displayEmbed: boolean;
	allowDownloads: boolean;
	shortcode: string;
	sourceUrl?: string;
	isProcessing: boolean;
	tracks: VideoTextTrack[];
}

export type VideoDetailsPatch = Partial<
	Pick<
		LibraryItem,
		'title' | 'description' | 'privacy' | 'displayEmbed' | 'allowDownloads' | 'rating'
	>
>;
