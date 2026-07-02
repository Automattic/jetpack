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
	/**
	 * Browser-playable URL: the best transcoded H.264 MP4 rendition
	 * (hd → dvd → std). `sourceUrl` points at the ORIGINAL upload, which for
	 * e.g. iPhone HEVC .mov files most browsers refuse to decode — playback
	 * surfaces should prefer this and fall back to `sourceUrl`.
	 */
	playbackUrl?: string;
	isProcessing: boolean;
	/**
	 * Playlist term IDs assigned to this attachment (the `videopress-playlists`
	 * taxonomy). Empty when the Studio flag is off — the taxonomy isn't
	 * registered then, so /wp/v2/media omits the property entirely.
	 */
	playlistIds: number[];
}

export type VideoDetailsPatch = Partial<
	Pick<
		LibraryItem,
		'title' | 'description' | 'privacy' | 'displayEmbed' | 'allowDownloads' | 'rating'
	>
>;
