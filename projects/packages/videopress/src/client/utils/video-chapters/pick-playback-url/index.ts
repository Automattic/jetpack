/**
 * Best-playable-rendition picker, shared by the chapters editing surfaces:
 * the dashboard maps it onto every LibraryItem, and the Editor tab and the
 * chapter manager modal apply it to raw v1.1 `videos/{guid}` items.
 */

/**
 * Pick the best browser-playable MP4 rendition for an item.
 *
 * The original upload (`source_url`) may be an HEVC .mov most browsers can't
 * decode; VideoPress always transcodes an H.264 ladder, so prefer hd → dvd →
 * std under the HTTPS file URL base.
 *
 * @param vp                     - The `media_details.videopress` block from the REST response, or
 *                               a v1.1 `videos/{guid}` item (same `file_url_base`/`files` shape) —
 *                               the Editor tab and the chapter manager modal derive playback URLs
 *                               from the latter, e.g. on WordPress.com Simple, where
 *                               `media_details.videopress` is absent.
 * @param vp.file_url_base       - Per-scheme base URLs for the video's files.
 * @param vp.file_url_base.https - The HTTPS base URL.
 * @param vp.files               - Rendition descriptors keyed by size (std/dvd/hd/…).
 * @return The rendition URL, or undefined when none is available yet.
 */
export function pickPlaybackUrl( vp?: {
	file_url_base?: { https?: string };
	files?: Record< string, { mp4?: string } >;
} ): string | undefined {
	const base = vp?.file_url_base?.https;
	if ( ! base || ! vp?.files ) {
		return undefined;
	}
	for ( const rendition of [ 'hd', 'dvd', 'std' ] ) {
		const mp4 = vp.files[ rendition ]?.mp4;
		if ( mp4 ) {
			return base + mp4;
		}
	}
	return undefined;
}
