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

// Stable id for every "that isn't a video" notice, so a user who drops four
// bad files in a row is told once rather than handed four identical black
// bars: the notices store replaces an existing notice with the same id instead
// of stacking a second one. Same technique as the delete notices in
// routes/video/stage.tsx and routes/library/stage.tsx. Shared across surfaces
// deliberately — /upload, Home and the Library are all saying the same thing,
// and only one of them is on screen at a time.
export const INVALID_FILE_NOTICE_ID = 'vp-upload-invalid-file';

// How much of the file to read for the container check. Every signature below
// lives in the first 12 bytes; 64 leaves headroom without pulling any real
// amount of a video into memory. `File.slice()` doesn't read the disk, so the
// cost is one read of this many bytes per dropped file.
const HEADER_BYTES = 64;

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
 * Read a fixed-width ASCII field out of a header.
 *
 * @param bytes - The file's leading bytes.
 * @param start - First byte of the field.
 * @param end   - One past the last byte of the field.
 * @return The field as an ASCII string (empty when the header is too short).
 */
function ascii( bytes: Uint8Array, start: number, end: number ): string {
	return String.fromCharCode( ...bytes.subarray( start, end ) );
}

/**
 * Test a header against a literal byte signature.
 *
 * @param bytes     - The file's leading bytes.
 * @param signature - The expected leading bytes.
 * @return Whether the header opens with that signature.
 */
function startsWith( bytes: Uint8Array, signature: number[] ): boolean {
	return (
		bytes.length >= signature.length &&
		signature.every( ( byte, index ) => bytes[ index ] === byte )
	);
}

// Top-level ISO-BMFF / QuickTime atom types. The modern brand box is `ftyp`,
// but QuickTime-era `.mov` files legitimately open with another top-level atom
// (a `wide`/`free` pad, or `mdat` outright), and refusing those would be a
// false reject on a real video — the one outcome this check must never
// produce. Anything in this set counts as "this really is that container".
const ISO_BMFF_ATOMS = new Set( [
	'ftyp',
	'moov',
	'mdat',
	'free',
	'skip',
	'wide',
	'pnot',
	'junk',
	'uuid',
	'pict',
] );

/**
 * ISO base media file format — mp4, m4v, mov, and the 3gp family. The 4-byte
 * atom type sits at offset 4, after the atom's big-endian size.
 *
 * @param bytes - The file's leading bytes.
 * @return Whether the header is an ISO-BMFF/QuickTime container.
 */
function isIsoBmff( bytes: Uint8Array ): boolean {
	return bytes.length >= 8 && ISO_BMFF_ATOMS.has( ascii( bytes, 4, 8 ) );
}

/**
 * Matroska / WebM — the EBML header magic every file of either type opens with.
 *
 * @param bytes - The file's leading bytes.
 * @return Whether the header is an EBML (Matroska/WebM) container.
 */
function isMatroska( bytes: Uint8Array ): boolean {
	return startsWith( bytes, [ 0x1a, 0x45, 0xdf, 0xa3 ] );
}

/**
 * Ogg — the 'OggS' capture pattern that opens every page, including the first.
 *
 * @param bytes - The file's leading bytes.
 * @return Whether the header is an Ogg container.
 */
function isOgg( bytes: Uint8Array ): boolean {
	return ascii( bytes, 0, 4 ) === 'OggS';
}

// Extension → the container its bytes must actually be. Only formats we can
// identify with confidence appear here: an accepted extension with no entry
// (`.avi`, `.wmv`, `.mpg`…) is taken on its extension alone. That asymmetry is
// the point — a signature we half-remember would reject real videos, and a
// false reject on someone's holiday footage is far worse than the false accept
// the backend will catch anyway.
const CONTAINER_CHECKS: Record< string, ( bytes: Uint8Array ) => boolean > = {
	'3g2': isIsoBmff,
	'3gp': isIsoBmff,
	'3gp2': isIsoBmff,
	'3gpp': isIsoBmff,
	m4v: isIsoBmff,
	mov: isIsoBmff,
	mp4: isIsoBmff,
	mkv: isMatroska,
	webm: isMatroska,
	ogg: isOgg,
	ogv: isOgg,
};

/**
 * Read a slice's bytes, preferring `Blob.arrayBuffer()` and falling back to
 * `FileReader`. The fallback is not theoretical: `Blob.arrayBuffer` is absent
 * from the jsdom build these tests run under (and from Safari before 14), while
 * `FileReader` has been everywhere for a decade.
 *
 * @param blob - The slice to read.
 * @return Its bytes.
 */
function readBytes( blob: Blob ): Promise< ArrayBuffer > {
	if ( typeof blob.arrayBuffer === 'function' ) {
		return blob.arrayBuffer();
	}
	return new Promise( ( resolve, reject ) => {
		const reader = new FileReader();
		reader.onload = () => resolve( reader.result as ArrayBuffer );
		reader.onerror = () => reject( reader.error );
		reader.readAsArrayBuffer( blob );
	} );
}

/**
 * Read the leading bytes of a file.
 *
 * @param file - The dropped or picked file.
 * @return The header, or null when the file could not be read — in which case the caller must let it through.
 */
async function readHeader( file: File ): Promise< Uint8Array | null > {
	// Nothing here is worth assuming, and every failure ends the same way: a
	// `File` we cannot read — an older engine without these APIs, a test
	// double, a file moved or unmounted between the drop and this read — has to
	// be accepted rather than refused, because "we couldn't look" is not
	// evidence. Hence one try/catch around the whole read.
	try {
		if ( typeof file.slice !== 'function' ) {
			return null;
		}
		const head = file.slice( 0, HEADER_BYTES );
		if ( typeof head.arrayBuffer !== 'function' && typeof FileReader === 'undefined' ) {
			return null;
		}
		return new Uint8Array( await readBytes( head ) );
	} catch {
		return null;
	}
}

/**
 * Decide whether one file is a video this backend accepts.
 *
 * @param file    - The dropped or picked file.
 * @param allowed - The accepted extensions for this site.
 * @return Whether the file should be uploaded.
 */
async function isAcceptedVideo( file: File, allowed: Set< string > ): Promise< boolean > {
	// A reported MIME type must be a video type — cheap, and it blocks the
	// honest cases (an `application/pdf` dragged in by mistake) before any read.
	// It is NOT sufficient on its own: see filterVideoFiles.
	if ( file.type && ! file.type.startsWith( 'video/' ) ) {
		return false;
	}

	const name = file.name.toLowerCase();
	const dot = name.lastIndexOf( '.' );
	const extension = dot === -1 ? '' : name.slice( dot + 1 );
	if ( ! allowed.has( extension ) ) {
		return false;
	}

	const check = CONTAINER_CHECKS[ extension ];
	if ( ! check ) {
		// A format we hold no signature for. Accept: see CONTAINER_CHECKS.
		return true;
	}

	const header = await readHeader( file );
	if ( header === null ) {
		return true;
	}

	// From here we DO know what this container has to look like, so a mismatch
	// is a confident "not that format" — including a file too short to hold the
	// header it claims.
	return check( header );
}

/**
 * Filter a dropped file set down to the video types the VideoPress backend
 * accepts. A file qualifies when its extension is in the server's allow-list
 * (so we accept exactly what the backend supports — e.g. `.mov`, but not
 * `.webm`, rather than guessing client-side), its reported MIME type doesn't
 * contradict that, AND its leading bytes are the container the extension
 * claims. Keeps the drop handler from trying to upload images, PDFs, or
 * unsupported video containers.
 *
 * The byte check is the load-bearing part, and it is why this is async.
 * `File.type` cannot do this job: Chromium derives it FROM THE EXTENSION, so a
 * text file renamed `something.mp4` reports `video/mp4` and satisfies any
 * MIME-only guard. Two testers proved it — the file uploaded end to end, landed
 * on a real edit screen, sat at "Processing" forever and burned the free plan's
 * only video slot. Reading the first {@link HEADER_BYTES} bytes off the file
 * settles it before the upload starts.
 *
 * The check FAILS OPEN by design: an extension we hold no signature for, or a
 * file we could not read, is accepted. A false reject on someone's real video
 * is a far worse outcome than a false accept the backend will refuse anyway.
 *
 * Lives beside the dropzone rather than in a route so /upload, Home's
 * emptied-library state and the Library's DropZone all reject the same set of
 * files, without any of them importing another route's bundle.
 *
 * @param files - The files dropped onto (or picked for) a dropzone.
 * @return Only the files the backend accepts.
 */
export async function filterVideoFiles( files: File[] ): Promise< File[] > {
	const allowed = getAllowedExtensions();
	// In parallel: a multi-file drop shouldn't pay for one header read after
	// another, and each file's verdict is independent of the rest.
	const verdicts = await Promise.all( files.map( file => isAcceptedVideo( file, allowed ) ) );
	return files.filter( ( _, index ) => verdicts[ index ] );
}
