// Fallback accepted-upload extensions, used only when the server-provided
// allow-list is absent (unit tests, or a render before the initial state is
// inlined). Mirrors the server's `Admin_UI::get_allowed_video_extensions()`
// keys so behaviour matches the backend even on the fallback path. The live
// list is read from `JPVIDEOPRESS_INITIAL_STATE.allowedVideoExtensions`.
const FALLBACK_VIDEO_EXTENSIONS = [
	'3g2',
	'3gp',
	'3gp2',
	'3gpp',
	'avi',
	'm4v',
	'mov',
	'mp4',
	'mpe',
	'mpeg',
	'mpg',
	'ogv',
	'wmv',
];

/**
 * The set of accepted upload extensions, sourced from the server's
 * authoritative allow-list (`Admin_UI::get_allowed_video_extensions()`, inlined
 * as `JPVIDEOPRESS_INITIAL_STATE.allowedVideoExtensions`). Falls back to the
 * static list when the initial state isn't present (tests / pre-hydration).
 * Read lazily so it always reflects the current initial state.
 *
 * @return Lower-cased accepted extensions (without the leading dot).
 */
function getAllowedExtensions(): Set< string > {
	const map =
		typeof JPVIDEOPRESS_INITIAL_STATE !== 'undefined'
			? JPVIDEOPRESS_INITIAL_STATE?.allowedVideoExtensions
			: undefined;
	const extensions =
		map && Object.keys( map ).length ? Object.keys( map ) : FALLBACK_VIDEO_EXTENSIONS;
	return new Set( extensions.map( extension => extension.toLowerCase() ) );
}

/**
 * Filter a dropped file set down to the video types the VideoPress backend
 * accepts. A file qualifies when its extension is in the server's allow-list
 * (so we accept exactly what the backend supports — e.g. `.mov`, but not
 * `.webm`, rather than guessing client-side). A reported MIME type is also
 * required to be `video/*`, so a non-video file renamed to a video extension
 * (e.g. a `.mp4`-renamed PDF) is rejected. Keeps the drop handler from trying
 * to upload images, PDFs, or unsupported video containers.
 *
 * The browser's own sniff (`File.type`) is as far as this goes: reading magic
 * bytes off the file would mean a FileReader round-trip on every drop for a
 * case the backend rejects anyway. What it buys is the common accident — a
 * document or a `.txt` renamed `.mp4` — caught before it burns an upload slot.
 *
 * Lives beside the dropzone rather than in a route so /upload, Home's
 * emptied-library state and the Library's DropZone all reject the same set of
 * files, without any of them importing another route's bundle.
 *
 * @param files - The files dropped onto (or picked for) a dropzone.
 * @return Only the files the backend accepts.
 */
export function filterVideoFiles( files: File[] ): File[] {
	const allowed = getAllowedExtensions();
	return files.filter( file => {
		// A reported MIME type must be a video type — blocks a non-video file
		// (e.g. application/pdf) renamed to a video extension.
		if ( file.type && ! file.type.startsWith( 'video/' ) ) {
			return false;
		}
		const name = file.name.toLowerCase();
		const dot = name.lastIndexOf( '.' );
		const extension = dot === -1 ? '' : name.slice( dot + 1 );
		return allowed.has( extension );
	} );
}
