import { __, sprintf } from '@wordpress/i18n';

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

// The sentence that goes with that id when the file simply is not a video.
// Lives here, next to the check that decides it, because two surfaces raise it
// — the shared dropzone and the Library's DropZone — and both used to carry
// their own copy of the string. See `describeRefusal` for when it is NOT the
// right sentence.
export const NOT_A_VIDEO_MESSAGE = __(
	'Only video files can be uploaded.',
	'jetpack-videopress-pkg'
);

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
 * The `accept` value for a video file input, built from the same allow-list the
 * filter enforces.
 *
 * `accept="video/*"` was the bug: the OS dialog offered every container the
 * system knows is a video — `.webm` and `.mkv` prominently — and both testers
 * picked one, only to be told the file they had just been offered could not be
 * uploaded. A picker must not offer what the drop handler will refuse. Dotted
 * extensions rather than MIME types, because the allow-list is keyed by
 * extension and that is what the backend checks; `video/webm` in this attribute
 * would re-open the same hole.
 *
 * Called at render (not computed once at import) so it tracks the same lazily
 * read initial state as {@link getAllowedExtensions}.
 *
 * @return A comma-joined `accept` list, e.g. `.mp4,.mov,…`.
 */
export function videoFileAccept(): string {
	return [ ...getAllowedExtensions() ].map( extension => `.${ extension }` ).join( ',' );
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

// Extension → the container its bytes must actually be. This table does two
// jobs. For an extension the backend ACCEPTS it is the impostor check (a `.txt`
// renamed `.mp4`). For one it REFUSES it is how we tell a genuine video we
// cannot take from a file that was never a video at all — which is the whole
// difference between "convert this to MP4" and "that isn't a video".
//
// Only formats we can identify with confidence appear here: an accepted
// extension with no entry (`.avi`, `.wmv`, `.mpg`, `.mpeg`) is taken on its
// extension alone. That asymmetry is the point — a signature we half-remember
// would reject real videos, and a false reject on someone's holiday footage is
// far worse than the false accept the backend will catch anyway. The same gap
// applies on the refusal side: a REFUSED extension with no entry (`.flv`,
// `.ts`…) has no byte evidence either way, so the reported MIME type is all
// `verdictFor` has to decide the wording with.
//
// `mkv`/`webm`/`ogg` read as dead code against the default allow-list, which
// omits all three, and they are not. The keys are matched against whatever
// `allowedVideoExtensions` carries, so a backend that advertises `.webm` gets it
// verified like any other (covered in the tests) — and on the refusal path all
// three are load-bearing today: they are exactly the containers a customer is
// most likely to have and this backend most likely to turn away.
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
 * The extension of a file name, lower-cased and without the leading dot.
 *
 * @param file - The dropped or picked file.
 * @return The extension, or '' when the name has none.
 */
function extensionOf( file: File ): string {
	const name = file.name.toLowerCase();
	const dot = name.lastIndexOf( '.' );
	return dot === -1 ? '' : name.slice( dot + 1 );
}

/**
 * What one file is, as far as this dropzone is concerned.
 *
 * `unsupported-format` exists only so the refusal can be true. It is still a
 * refusal — the backend would fail the upload — but both testers dropped a
 * genuine `.webm` and were answered "Only video files can be uploaded", which is
 * false, and false in the most discouraging way available: it tells someone
 * their video isn't a video and gives them nothing to do about it.
 */
type FileVerdict = 'accepted' | 'unsupported-format' | 'not-a-video';

/**
 * Decide what one file is: accepted, a real video in a container this backend
 * refuses, or not a video.
 *
 * @param file    - The dropped or picked file.
 * @param allowed - The accepted extensions for this site.
 * @return The verdict.
 */
async function verdictFor( file: File, allowed: Set< string > ): Promise< FileVerdict > {
	// A reported MIME type must be a video type — cheap, and it blocks the
	// honest cases (an `application/pdf` dragged in by mistake) before any read.
	// It is NOT sufficient on its own: see filterVideoFiles.
	if ( file.type && ! file.type.startsWith( 'video/' ) ) {
		return 'not-a-video';
	}

	const extension = extensionOf( file );
	const check = CONTAINER_CHECKS[ extension ];

	if ( ! allowed.has( extension ) ) {
		// Refused either way; all that is left to settle is which sentence is
		// true. The bytes when we hold the signature — that is the confident
		// answer, and it is why the `webm`/`mkv`/`ogg` entries above are worth
		// keeping. Otherwise the type the browser derived FROM the extension,
		// which is the OS's own extension→container map: not evidence about the
		// contents (see filterVideoFiles), but the best available guide to what
		// kind of file the user believes they picked, and a wrong guess here
		// changes only the wording of a refusal that stands regardless.
		if ( check ) {
			const header = await readHeader( file );
			return header === null || check( header ) ? 'unsupported-format' : 'not-a-video';
		}
		return file.type.startsWith( 'video/' ) ? 'unsupported-format' : 'not-a-video';
	}

	if ( ! check ) {
		// A format we hold no signature for. Accept: see CONTAINER_CHECKS.
		return 'accepted';
	}

	const header = await readHeader( file );
	if ( header === null ) {
		return 'accepted';
	}

	// From here we DO know what this container has to look like, so a mismatch
	// is a confident "not that format" — including a file too short to hold the
	// header it claims.
	return check( header ) ? 'accepted' : 'not-a-video';
}

/**
 * Verdicts for a whole selection, in the order the files were given.
 *
 * @param files - The files dropped onto (or picked for) a dropzone.
 * @return One verdict per file.
 */
function verdictsFor( files: File[] ): Promise< FileVerdict[] > {
	const allowed = getAllowedExtensions();
	// In parallel: a multi-file drop shouldn't pay for one header read after
	// another, and each file's verdict is independent of the rest.
	return Promise.all( files.map( file => verdictFor( file, allowed ) ) );
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
 * Says only WHICH files survive. When none do, {@link describeRefusal} says why
 * — the two are separate because the message needs a distinction the upload
 * decision does not.
 *
 * @param files - The files dropped onto (or picked for) a dropzone.
 * @return Only the files the backend accepts.
 */
export async function filterVideoFiles( files: File[] ): Promise< File[] > {
	const verdicts = await verdictsFor( files );
	return files.filter( ( _, index ) => verdicts[ index ] === 'accepted' );
}

/**
 * The notice for a selection {@link filterVideoFiles} accepted nothing from.
 *
 * Two sentences are possible and choosing between them is the entire job. A
 * genuine video in a container this backend refuses is NAMED and told what to do
 * instead; anything else gets the plain "that isn't a video". The picker no
 * longer offers `.webm` (see {@link videoFileAccept}), but a DROP has no
 * `accept` to lean on, so this path stays the one that has to be right.
 *
 * MP4 and MOV rather than the whole allow-list: thirteen extensions including
 * `.3gp2` and `.mpe` in a snackbar is noise, and these two are what every phone,
 * camera and converter produces. Both are in the server list and in the fallback
 * above, so the advice cannot be wrong about them on any site.
 *
 * Reads the same headers `filterVideoFiles` just read, rather than having that
 * function return a richer result. Deliberate: this only ever runs after a
 * refusal, `File.slice()` doesn't touch the disk, and one shared verdict
 * function is cheaper to keep honest than a wider return type threaded through
 * both dropzones and the Library's drop planner.
 *
 * @param files - The files that were refused.
 * @return The message to show.
 */
export async function describeRefusal( files: File[] ): Promise< string > {
	const verdicts = await verdictsFor( files );
	// The first genuine-but-unsupported video in the selection. A mixed drop of
	// a `.webm` and a PDF is answered about the `.webm`: it is the file the user
	// meant to upload, and the only one with anything to do about it.
	const unsupported = files.find( ( _, index ) => verdicts[ index ] === 'unsupported-format' );
	if ( ! unsupported ) {
		return NOT_A_VIDEO_MESSAGE;
	}

	const extension = extensionOf( unsupported );
	if ( ! extension ) {
		// A video with no extension at all to name.
		return __(
			'That video format can’t be uploaded. Convert your video to MP4 or MOV, then try again.',
			'jetpack-videopress-pkg'
		);
	}

	return sprintf(
		/* translators: %s: an upper-cased video file extension, e.g. "WEBM". */
		__(
			'%s files can’t be uploaded. Convert your video to MP4 or MOV, then try again.',
			'jetpack-videopress-pkg'
		),
		extension.toUpperCase()
	);
}
