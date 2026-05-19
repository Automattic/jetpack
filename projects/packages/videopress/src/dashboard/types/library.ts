export type LibraryItemType = 'videopress' | 'local';
export type LibraryItemPrivacy = 'public' | 'private' | 'site-default';
export type UploadStatus = 'idle' | 'uploading' | 'promoting' | 'failed';
export type VideoRating = 'G' | 'PG-13' | 'R';

export interface UploadState {
	status: UploadStatus;
	progress: number;
}

export interface MockLibraryItem {
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
}

export type VideoDetailsPatch = Partial<
	Pick<
		MockLibraryItem,
		'title' | 'description' | 'privacy' | 'displayEmbed' | 'allowDownloads' | 'rating'
	>
>;
