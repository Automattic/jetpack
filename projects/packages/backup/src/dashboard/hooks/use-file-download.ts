import { useMutation } from '@tanstack/react-query';
import { useCallback } from '@wordpress/element';
import { fetchFileDownloadUrl } from '../data/api/file-download-url';
import { useAnalytics } from './use-analytics';
import { encodeManifestPath } from './use-file-contents';

/**
 * Downloads one file of a backup: fetches a fresh signed URL on click, then saves it.
 *
 * @param filePeriod   - The file's own snapshot timestamp from `/ls`.
 * @param manifestPath - The volume-prefixed manifest path.
 * @return The click handler and its state.
 */
export function useFileDownload(
	filePeriod: string | undefined,
	manifestPath: string | undefined
) {
	const { tracks } = useAnalytics();
	const mutation = useMutation( {
		mutationFn: () =>
			fetchFileDownloadUrl( filePeriod ?? '', encodeManifestPath( manifestPath ?? '' ) ),
		onSuccess: url => {
			// The URL carries `disposition=attachment`, so this saves rather than navigates.
			const link = document.createElement( 'a' );
			link.href = url;
			link.rel = 'noopener';
			document.body.appendChild( link );
			link.click();
			link.remove();
		},
	} );
	const { mutate, reset } = mutation;

	const download = useCallback( () => {
		reset();
		tracks.recordEvent( 'jetpack_backup_browser_download_file_click' );
		mutate();
	}, [ mutate, reset, tracks ] );

	return {
		download,
		isDownloading: mutation.isPending,
		downloadFailed: mutation.isError,
		canDownload: Boolean( filePeriod ) && Boolean( manifestPath ),
	};
}
