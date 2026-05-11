export type LibraryItemType = 'videopress' | 'local';
export type LibraryItemPrivacy = 'public' | 'private' | 'site-default';
export type UploadStatus = 'idle' | 'uploading' | 'failed';

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
}
