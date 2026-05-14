export type LibraryItemType = 'videopress' | 'local';
export type LibraryItemPrivacy = 'public' | 'private' | 'site-default';
export type UploadStatus = 'idle' | 'uploading' | 'failed';
export type VideoRating = 'G' | 'PG-13' | 'R';

export interface UploadState {
	status: UploadStatus;
	progress: number;
}

export interface MockLibraryItem {
	id: string;
	type: LibraryItemType;
	title: string;
	filename: string;
	thumbnailUrl: string | null;
	durationSeconds: number;
	uploadDate: string;
	privacy: LibraryItemPrivacy;
	fileSizeBytes: number;
	upload: UploadState;
	description: string;
	rating: VideoRating;
	allowSharing: boolean;
	allowDownloads: boolean;
	shortcode: string;
}

export type VideoDetailsPatch = Partial<
	Pick<
		MockLibraryItem,
		'title' | 'description' | 'privacy' | 'allowSharing' | 'allowDownloads' | 'rating'
	>
>;
