import type { UploadItem } from '../hooks/use-upload';
import type { LibraryItem } from '../types/library';

/**
 * Give an upload draft the same fields as the details form and library.
 *
 * @param item - The queued upload.
 * @return The temporary video record.
 */
export function uploadToLibraryItem( item: UploadItem ): LibraryItem {
	return {
		id: item.id,
		guid: '',
		type: 'local',
		title: item.file.name.replace( /\.[^.]+$/, '' ),
		filename: item.file.name,
		thumbnailUrl: null,
		durationSeconds: 0,
		uploadDate: new Date().toISOString(),
		privacy: 'site-default',
		isPrivate: false,
		fileSizeBytes: item.file.size,
		upload: {
			status: item.status === 'failed' || item.detailsError ? 'failed' : 'uploading',
			progress: Math.round( item.progress * 100 ),
			failureReason: item.detailsError ? 'details' : undefined,
		},
		description: '',
		rating: 'G',
		displayEmbed: false,
		allowDownloads: false,
		shortcode: '',
		isProcessing: false,
		orientation: null,
		tracks: [],
		...item.details,
	};
}
