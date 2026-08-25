/**
 * WordPress dependencies
 */
import { store, getContext, withScope, getElement, getConfig } from '@wordpress/interactivity';
/**
 * Internal dependencies
 */
import { isEmptyValue } from '../../contact-form/js/validate-helper.js';

// The file field lives in the shared form store, like every other field module. It keeps its own
// namespace only for `wp_interactivity_config()` — the upload endpoint, icon path and per-file
// error strings — which is the same split `jetpack/field-phone` uses.
const NAMESPACE = 'jetpack/form';
const CONFIG_NAMESPACE = 'jetpack/field-file';

// Long enough for the preview to be rendered and the dropzone hidden before focus moves.
const PREVIEW_FOCUS_DELAY_MS = 100;

/*
 * How many uploads may be in flight at once, across every file field on the page.
 *
 * A batch used to open one XMLHttpRequest per file the moment it was added, so selecting ten
 * 20MB files pushed 200MB at the network at once — each request starved of bandwidth, each
 * progress bar crawling, and the whole batch finishing later than if they had been sent in turn.
 */
const MAX_CONCURRENT_UPLOADS = 3;

/*
 * How long an upload may make no progress before it is treated as hung, in milliseconds.
 *
 * Deliberately measured against progress rather than total elapsed time, which is what
 * `XMLHttpRequest.timeout` offers. A 20MB file on a slow connection legitimately takes minutes, so
 * any total-time budget generous enough not to kill it is too generous to catch a stall — while a
 * request that has died silently, or whose response was swallowed by a proxy, reports no progress
 * at all. Without this, such a request never reaches readyState 4, never frees its slot, and takes
 * one of the page's three permanently: three of them stop uploads on every file field on the page,
 * showing nothing but previews stuck on "Uploading…".
 */
const UPLOAD_STALL_TIMEOUT_MS = 60 * 1000;

/*
 * How long to wait for a reply once the whole body has been sent, in milliseconds.
 *
 * A separate, longer budget because progress events stop at that point — `xhr.upload` fires
 * `loadend` and nothing more — so everything the server does after receiving the file counts as
 * silence. It is not: the endpoint stores the file onward, which for 20MB is real work. Measuring
 * that against the transfer budget aborts uploads that were about to succeed, and since the server
 * finishes storing a file whose response nobody reads, the visitor retries and pays for the
 * transfer twice — on an endpoint that was already slow enough to be the problem.
 */
const UPLOAD_RESPONSE_TIMEOUT_MS = 3 * 60 * 1000;

/*
 * How long to wait for an upload token, in milliseconds.
 *
 * The slot is claimed before the token is requested, so a token request that hangs holds one of
 * the page's three for as long as the browser keeps the socket — the same page-wide stall the
 * upload watchdog exists to prevent, in the one window it cannot see.
 */
const TOKEN_REQUEST_TIMEOUT_MS = 30 * 1000;

// Uploads waiting for a slot. Entries are `{ clientFileId, fieldId, start }`, where `start` is
// bound to the scope of the field that queued it — see `enqueueUpload()`.
const uploadQueue = [];

// Stall watchdogs by client file ID, reset on every progress event. See UPLOAD_STALL_TIMEOUT_MS.
const uploadStallTimers = new Map();

/*
 * Client file IDs whose upload has started and not yet settled. A Set rather than a counter so that
 * `finishUpload()` is idempotent: several code paths can report the same upload as finished.
 */
const activeUploadIds = new Set();

// The field each running upload belongs to, so `pumpUploadQueue()` can share slots between fields.
const activeUploadFieldIds = new Map();

/*
 * The client file ID of the one preview allowed to take focus, or null.
 *
 * `data-wp-init` runs once per rendered preview, so a batch runs the focus callback once per file,
 * each scheduling its own timer against the same 100ms deadline; whichever fired last won, which
 * is to say focus landed on an arbitrary preview.
 *
 * Naming the file rather than raising a flag matters, because file IDs are unique across the page.
 * A shared boolean can only express "nothing has claimed focus since it was last set", which is a
 * different question from "is this the first preview of this batch, in this field" — the two come
 * apart whenever previews from two batches, or from two file fields, mount in the same render.
 * Then whichever preview happens to mount first consumes the claim and the file the visitor just
 * chose is left unfocused. An ID cannot be claimed by the wrong preview, and a second batch simply
 * supersedes the first, which is what a visitor who just picked another file would expect.
 */
let focusClaimFileId = null;

let uploadToken = null;
let tokenExpiry = null;
// Set while a token request is in flight so several files added at once share a single request
// instead of each firing its own.
let pendingTokenRequest = null;

/**
 * Returns the upload token, fetching a new one if it expired or was never fetched.
 *
 * The token authorizes uploads for the whole site rather than for one field, so it is cached at
 * module scope and shared by every file field on the page.
 *
 * The cache is written inside the shared promise rather than by each awaiting caller. Writing it
 * in the continuation would leave a microtask-sized window where `pendingTokenRequest` has already
 * been cleared but `uploadToken` is not yet set, letting a second caller past both guards and
 * start a redundant request — and with two in flight the last one to resolve would win, which can
 * leave the cache holding the older token and the earlier expiry.
 *
 * @return {Promise<string|null>} The upload token, or null if one could not be obtained.
 */
const getUploadToken = async () => {
	// Check if the token exists and is not expired
	if ( uploadToken && tokenExpiry && Date.now() < tokenExpiry ) {
		return uploadToken;
	}

	if ( ! pendingTokenRequest ) {
		pendingTokenRequest = fetchUploadToken()
			.then( ( { token, expiresAt } ) => {
				uploadToken = token;
				// A non-numeric expiry would make every later `Date.now() < tokenExpiry` false and
				// silently disable the cache for the rest of the page, so treat it as expired now
				// and re-fetch next time instead.
				tokenExpiry = Number.isFinite( expiresAt ) ? expiresAt * 1000 : 0;
				return token;
			} )
			.finally( () => {
				pendingTokenRequest = null;
			} );
	}

	return pendingTokenRequest;
};

/**
 * Fetches the upload token from the server.
 *
 * @return {{ token: string, expiresAt: number }} The upload token and its expiration time.
 */
const fetchUploadToken = async () => {
	const { endpoint } = getConfig( CONFIG_NAMESPACE );

	const tokenError = {
		token: null, // Assuming the token is in the `token` field
		expiresAt: 0,
	};
	try {
		const response = await fetch( `${ endpoint }/token`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify( { context: 'file-upload' } ),
			// See TOKEN_REQUEST_TIMEOUT_MS. Guarded because AbortSignal.timeout is relatively recent
			// and a missing signal only costs the timeout, not correctness.
			...( typeof AbortSignal?.timeout === 'function'
				? { signal: AbortSignal.timeout( TOKEN_REQUEST_TIMEOUT_MS ) }
				: {} ),
		} );

		if ( ! response.ok ) {
			return tokenError;
		}

		const data = await response.json();
		return {
			token: data.token, // Assuming the token is in the `token` field
			expiresAt: data.expiration,
		};
	} catch ( error ) {
		if ( error ) {
			return tokenError;
		}
	}
	return tokenError;
};

/**
 * Format the file size to a human-readable string.
 *
 * @param {number} size         - The size of the file in bytes.
 * @param {number} [decimals=2] - The number of decimals to include.
 *
 * @return {string} The formatted file size.
 */
const formatBytes = ( size, decimals = 2 ) => {
	const config = getConfig( CONFIG_NAMESPACE );
	if ( size === 0 ) return config.i18n.zeroBytes;
	const k = 1024;
	const dm = decimals < 0 ? 0 : decimals;
	const sizes = config.i18n.fileSizeUnits || [ 'Bytes', 'KB', 'MB', 'GB', 'TB' ];
	const i = Math.floor( Math.log( size ) / Math.log( k ) );
	const formattedSize = parseFloat( ( size / Math.pow( k, i ) ).toFixed( dm ) );
	const numberFormat = new Intl.NumberFormat( config.i18n.locale, {
		minimumFractionDigits: dm,
		maximumFractionDigits: dm,
	} );
	return `${ numberFormat.format( formattedSize ) } ${ sizes[ i ] }`;
};

const getFileIcon = file => {
	const config = getConfig( CONFIG_NAMESPACE );
	const fileType = file.type.split( '/' )[ 0 ];
	const fileExtension = file.name.split( '.' ).pop().toLowerCase();

	const iconMap = {
		image: 'png',
		video: 'mp4',
		audio: 'mp3',
		document: 'pdf',
		application: 'txt',
	};

	const extensionMap = {
		pdf: 'pdf',
		doc: 'doc',
		docx: 'doc',
		txt: 'txt',
		ppt: 'ppt',
		pptx: 'ppt',
		xls: 'xls',
		xlsx: 'xls',
		csv: 'xls',
		zip: 'zip',
		sql: 'sql',
		cal: 'cal',
	};
	const iconName = extensionMap[ fileExtension ] || iconMap[ fileType ] || 'txt';
	return 'url(' + config.iconsPath + iconName + '.svg)';
};

/**
 * Reads the file field's configuration from the standard `fieldExtra` context entry, the same
 * place the date field finds its format and the number field its min/max.
 *
 * @return {{ maxFiles: number, allowedMimeTypes: string[] }} The field's configuration.
 */
const getFileFieldExtra = () => {
	const { maxFiles, allowedMimeTypes } = getContext().fieldExtra || {};
	return {
		maxFiles: maxFiles ?? 1,
		allowedMimeTypes: allowedMimeTypes ?? [],
	};
};

/**
 * Whether this field's markup has somewhere to show a field-level notice.
 *
 * Only true for markup rendered by the current PHP. Runs inside an action's scope, so `getElement()`
 * resolves to the element the visitor interacted with — the file input or the container, both of
 * which sit inside `.jetpack-form-file-field__container`.
 *
 * @return {boolean} True when the notice element is present.
 */
const hasNoticeElement = () => {
	const { ref } = getElement();

	return !! ref
		?.closest?.( '.jetpack-form-file-field__container' )
		?.querySelector( '.jetpack-form-file-field__notice' );
};

/**
 * Whether the dropzone is currently shown.
 *
 * Tests the one thing that actually hides it — `is-hidden`, bound to `state.isFileFieldFull` — in
 * preference to a general visibility probe. `checkVisibility()` and `offsetParent` both require
 * layout, which means they answer differently under a test renderer than in a browser, and this
 * question has a definite answer that does not need layout to find.
 *
 * @param {HTMLElement} dropzoneInner - The dropzone's inner button element.
 *
 * @return {boolean} True when the dropzone is visible.
 */
const isDropzoneVisible = dropzoneInner =>
	! dropzoneInner
		.closest( '.jetpack-form-file-field__dropzone' )
		?.classList.contains( 'is-hidden' );

/**
 * The files currently held by the field.
 *
 * @return {Array} The field's files.
 */
const getFileFieldFiles = () => getContext().files ?? [];

/**
 * Why this file cannot be uploaded, if it cannot be.
 *
 * Deliberately excludes the max-file check: whether there is room for a file is a property of the
 * batch being added rather than of the file itself, and `addFiles()` owns it.
 *
 * The type check comes first so that it still wins for a file that is both oversized and of a
 * disallowed type. That is the precedence the two sequential assignments this replaced happened to
 * produce — the type check ran second and overwrote the size message — and it is the better of the
 * two to report, since no smaller version of that file would be accepted either.
 *
 * @param {File} file - The file to check.
 *
 * @return {string|null} The error message, or null when the file is acceptable.
 */
const getFileError = file => {
	const config = getConfig( CONFIG_NAMESPACE );
	const { allowedMimeTypes } = getFileFieldExtra();

	if ( ! allowedMimeTypes.includes( file.type ) ) {
		return config.i18n.invalidType;
	}

	if ( file.size > config.maxUploadSize ) {
		return config.i18n.fileTooLarge;
	}

	return null;
};

/**
 * How many more files the field will accept.
 *
 * Counts every entry, including those that failed their own type or size check.
 *
 * Excluding errored entries reads as kinder — a rejected file was never uploaded, so why should it
 * hold a place? — but it leaves nothing bounding them. They would neither consume capacity nor
 * hide the dropzone, so picking a disallowed file over and over would pile up previews without
 * limit, and `validators.file` reports `invalid_file_has_errors` for every one of them: the same
 * unsubmittable form this batch work exists to prevent, reached by a different route. A visitor
 * who needs to replace a rejected file dismisses it with its own × button, which is one click and
 * was already the established behaviour.
 *
 * @return {number} The number of files that can still be added.
 */
const getRemainingCapacity = () => {
	const { maxFiles } = getFileFieldExtra();

	return Math.max( maxFiles - getFileFieldFiles().length, 0 );
};

/**
 * Drop the oldest entry that failed, to make room for a file that did not.
 *
 * Skips the stand-in entry that markup without a notice element gets instead of a message. That
 * one sits past the limit by construction, so treating it as an ordinary rejected file would hand
 * back a slot the field never had — and since a fresh stand-in is added whenever a batch is
 * declined, every drop would net one more entry.
 *
 * @param {string} noticeMessage - The message the stand-in entry carries.
 *
 * @return {boolean} True when an entry was removed.
 */
const evictFailedFile = noticeMessage => {
	const context = getContext();
	const index = context.files.findIndex(
		fileInfo => fileInfo.error && fileInfo.error !== noticeMessage
	);

	if ( index === -1 ) {
		return false;
	}

	releaseFile( context.files[ index ] );
	context.files.splice( index, 1 );

	return true;
};

/**
 * Add one file to the context and queue its upload.
 *
 * Does not touch the field's value or the notice: `addFiles()` reports the whole batch once, so
 * that a ten-file drop runs one validation pass rather than ten.
 *
 * @param {File}        file  - The file to add.
 * @param {string|null} error - Why the file cannot be uploaded, or null.
 *
 * @return {string} The client file ID of the entry that was added.
 */
const addFileToContext = ( file, error ) => {
	const context = getContext();

	const clientFileId = performance.now() + '-' + Math.random();
	const hasImage =
		[ 'image/gif', 'image/jpg', 'image/png', 'image/jpeg' ].includes( file.type ) &&
		URL.createObjectURL;
	const fileUrl = hasImage ? 'url(' + URL.createObjectURL( file ) + ')' : getFileIcon( file );
	context.files.push( {
		name: file.name,
		formattedSize: formatBytes( file.size, 2 ),
		hasIcon: ! hasImage,
		isUploaded: false,
		hasError: !! error,
		id: clientFileId,
		url: hasImage ? fileUrl : null,
		mask: ! hasImage ? fileUrl : null,
		error,
	} );

	// Start the upload if we don't have any errors.
	! error && enqueueUpload( file, clientFileId );

	return clientFileId;
};

/**
 * Add a batch of files to the field.
 *
 * Every entry point hands its files here rather than adding them one at a time, because the
 * max-file limit can only be applied to a batch as a whole. Adding one at a time meant each file
 * past the limit got its own preview carrying the "too many files" message — and since
 * `validators.file` reports `invalid_file_has_errors` for any errored entry, dropping ten files on
 * a field that accepts one produced nine previews that all had to be dismissed by hand before the
 * form could be submitted. Overflow is now declined outright and reported once.
 *
 * Files that fail their own validation are still added, with their own message on their own
 * preview: those are about the file, and the visitor has to see which one to replace.
 *
 * @param {File[]} files - The files to add.
 *
 * @return {number} How many files were declined for want of room.
 */
const addFiles = files => {
	const context = getContext();
	const { i18n } = getConfig( CONFIG_NAMESPACE );

	let remainingCapacity = getRemainingCapacity();
	let firstDeclined = null;
	let declinedCount = 0;
	let firstAddedId = null;

	for ( const file of files ) {
		if ( ! file ) {
			continue;
		}

		const error = getFileError( file );

		/*
		 * Capacity is spent before the file is examined, so a file rejected for its type or size
		 * occupies a place like any other. It has to: an entry that consumed nothing could be added
		 * again and again, and each one blocks submission through `validators.file`.
		 */
		if ( remainingCapacity === 0 ) {
			/*
			 * Except that a file the field can actually take may replace one it could not. Without
			 * this, a single-file field holding one rejected file is "full", so the replacement the
			 * visitor is being asked for is refused with "too many files" — next to a single visible
			 * file. Only a usable file earns the eviction; one bad file cannot displace another.
			 */
			if ( error || ! evictFailedFile( i18n.maxFiles ) ) {
				declinedCount++;
				firstDeclined = firstDeclined ?? file;
				continue;
			}

			remainingCapacity++;
		}

		remainingCapacity--;

		const addedId = addFileToContext( file, error );

		if ( firstAddedId === null ) {
			firstAddedId = addedId;
		}
	}

	// Nominate this batch's first file, by id, as the one preview that may take focus.
	focusClaimFileId = firstAddedId;

	if ( ! declinedCount ) {
		context.fileNotice = '';
	} else if ( hasNoticeElement() ) {
		context.fileNotice = i18n.maxFiles;
	} else if ( ! context.files.some( fileInfo => fileInfo.error === i18n.maxFiles ) ) {
		/*
		 * Markup cached before the notice element existed, served against this bundle — the window
		 * the back-compat shim at the bottom of this file covers. There is nowhere to render
		 * `fileNotice`, so declining silently would make the visitor's files simply vanish. Fall
		 * back to what that markup did understand: a preview carrying the message.
		 *
		 * Guarded on one already being present rather than on capacity, because this entry is added
		 * past the limit by definition — the batch was declined for want of room. Without the guard
		 * every further drop appends another, which is the pile-up this work exists to end, reached
		 * through the back-compat door.
		 */
		addFileToContext( firstDeclined, i18n.maxFiles );
	}

	actions.updateField( context.fieldId, context.files );

	return declinedCount;
};

// Map to store AbortControllers for each file upload
const uploadControllers = new Map();

/**
 * Queue a file's upload, to start as soon as there is a free slot.
 *
 * The starter is wrapped with `withScope()` here rather than being called plainly at pump time.
 * The pump runs from whichever upload settled last, which may belong to a different file field on
 * the page; without capturing this field's scope now, `uploadFile()` would resolve `getContext()`
 * against that other field and look for the file in the wrong list.
 *
 * @param {File}   file         - The file to upload.
 * @param {string} clientFileId - The client file ID.
 */
const enqueueUpload = ( file, clientFileId ) => {
	uploadQueue.push( {
		clientFileId,
		fieldId: getContext().fieldId,
		start: withScope( () => actions.uploadFile( file, clientFileId ) ),
	} );

	pumpUploadQueue();
};

/**
 * Start queued uploads until the concurrency limit is reached.
 *
 * Picks the waiting file whose field has the fewest uploads running, rather than simply the one
 * that has waited longest. Strict arrival order is fine while a field accepts a single file, but
 * once it accepts several, a visitor who fills the first field before reaching the second would
 * leave the second field's file waiting behind the whole of the first field's batch — and a
 * preview stuck at 0% is indistinguishable from a broken field, since nothing on screen says it is
 * waiting on another field's traffic. Ties keep arrival order, so a single field still uploads in
 * the order its files were added.
 */
const pumpUploadQueue = () => {
	while ( activeUploadIds.size < MAX_CONCURRENT_UPLOADS && uploadQueue.length ) {
		const activePerField = new Map();

		for ( const fieldId of activeUploadFieldIds.values() ) {
			activePerField.set( fieldId, ( activePerField.get( fieldId ) ?? 0 ) + 1 );
		}

		let index = 0;

		for ( let candidate = 1; candidate < uploadQueue.length; candidate++ ) {
			const best = activePerField.get( uploadQueue[ index ].fieldId ) ?? 0;
			const here = activePerField.get( uploadQueue[ candidate ].fieldId ) ?? 0;

			if ( here < best ) {
				index = candidate;
			}
		}

		const { clientFileId, fieldId, start } = uploadQueue.splice( index, 1 )[ 0 ];

		activeUploadIds.add( clientFileId );
		activeUploadFieldIds.set( clientFileId, fieldId );
		start();
	}
};

/**
 * Report an upload as settled and let the next one start.
 *
 * Idempotent: an upload can be reported as finished both by its own `readystatechange` handler and
 * by a removal racing it, and freeing the same slot twice would let the queue run over the limit.
 *
 * @param {string} clientFileId - The client file ID.
 */
const finishUpload = clientFileId => {
	clearStallWatchdog( clientFileId );
	activeUploadFieldIds.delete( clientFileId );

	if ( ! activeUploadIds.delete( clientFileId ) ) {
		return;
	}

	pumpUploadQueue();
};

/**
 * (Re)start the stall watchdog for an upload. See UPLOAD_STALL_TIMEOUT_MS.
 *
 * Aborting on expiry rather than just freeing the slot is deliberate: the abort drives the request
 * to readyState 4 with status 0, which is already handled as a failed upload, so the visitor gets
 * an error they can act on instead of a preview that sits at its last percentage forever.
 *
 * @param {string} clientFileId - The client file ID.
 * @param {number} [timeout]    - How long to wait, defaulting to the transfer budget.
 */
const startStallWatchdog = ( clientFileId, timeout = UPLOAD_STALL_TIMEOUT_MS ) => {
	clearStallWatchdog( clientFileId );

	uploadStallTimers.set(
		clientFileId,
		setTimeout( () => {
			uploadStallTimers.delete( clientFileId );
			uploadControllers.get( clientFileId )?.abort();
			// The abort settles the request, but free the slot here too in case it does not.
			finishUpload( clientFileId );
		}, timeout )
	);
};

/**
 * Stop watching an upload for a stall.
 *
 * @param {string} clientFileId - The client file ID.
 */
const clearStallWatchdog = clientFileId => {
	const timer = uploadStallTimers.get( clientFileId );

	if ( timer !== undefined ) {
		clearTimeout( timer );
		uploadStallTimers.delete( clientFileId );
	}
};

/**
 * Read an upload response body, tolerating one that is not JSON.
 *
 * @param {string} responseText - The raw response body.
 *
 * @return {object|null} The parsed body, or null when it could not be read.
 */
const parseUploadResponse = responseText => {
	try {
		return JSON.parse( responseText );
	} catch {
		return null;
	}
};

/**
 * Drop a file's upload from the queue, if it has not started yet.
 *
 * @param {string} clientFileId - The client file ID.
 */
const dequeueUpload = clientFileId => {
	const index = uploadQueue.findIndex( entry => entry.clientFileId === clientFileId );

	if ( index !== -1 ) {
		uploadQueue.splice( index, 1 );
	}
};

/**
 * Responsible for updating the progress circle.
 * Gets called on the progress upload.
 *
 * @param {string}        clientFileId - The client file ID.
 * @param {ProgressEvent} event        - The progress event object.
 */
const onProgress = ( clientFileId, event ) => {
	/*
	 * A request that fails mid-body emits a trailing progress event *after* readyState 4, so this
	 * runs for uploads that have already settled. Re-arming there would leave a timer running for
	 * an upload nothing will ever finish.
	 */
	if ( activeUploadIds.has( clientFileId ) ) {
		// Evidence the request is alive, so the stall watchdog starts over.
		startStallWatchdog( clientFileId );
	}

	const progress = ( event.loaded / event.total ) * 100;
	// We don't want to show 100% progress, as it's misleading.
	updateFileContext( { progress: Math.min( progress, 97 ) }, clientFileId );
};

/**
 * React to the onReadyStateChange event when the endpoint returns.
 *
 * @param {string} clientFileId - The file ID.
 * @param {Event}  event        - The event object.
 */
const onReadyStateChange = ( clientFileId, event ) => {
	const xhr = event.target;
	if ( xhr.readyState === 4 ) {
		// The request has settled either way, so its controller can never abort anything again.
		// Dropping it here keeps the map from growing for the lifetime of the page.
		uploadControllers.delete( clientFileId );
		finishUpload( clientFileId );

		/*
		 * A proxy, a WAF interstitial or a PHP fatal can all answer 200 with something that is not
		 * JSON. Letting SyntaxError out of an event handler would leave the entry on "Uploading…"
		 * for good, and `validators.file` blocks submission on any file that never finished — so a
		 * body we cannot read is reported as a failed upload, which the visitor can act on.
		 */
		const response = parseUploadResponse( xhr.responseText );

		if ( response === null ) {
			const config = getConfig( CONFIG_NAMESPACE );
			updateFileContext( { error: config.i18n.uploadFailed, hasError: true }, clientFileId );
			return;
		}

		if ( xhr.status === 200 ) {
			if ( response.success ) {
				updateFileContext(
					{
						file_id: response.data.file_id,
						isUploaded: true,
						name: response.data.name,
						type: response.data.type,
						size: response.data.size,
						fileJson: JSON.stringify( {
							file_id: response.data.file_id,
							name: response.data.name,
							size: response.data.size,
							type: response.data.type,
						} ),
					},
					clientFileId
				);
				return;
			}
		} else {
			const config = getConfig( CONFIG_NAMESPACE );
			updateFileContext( { error: config.i18n.uploadFailed, hasError: true }, clientFileId );
			return;
		}
		if ( xhr.responseText ) {
			updateFileContext( { error: response.message, hasError: true }, clientFileId );
		}
	}
};

/**
 * Update the context with the new updatedFile object based on the file ID.
 *
 * XHR events can outlive the entry they describe — `resetFiles` empties the list without waiting
 * for anything in flight — so a missing file is an expected outcome here, not an error. Without
 * the guard, `findIndex` returns -1 and `Object.assign( undefined, … )` throws out of a progress
 * handler and takes the rest of the upload's reporting with it.
 *
 * @param {object} updatedFile  - The updated file object.
 * @param {string} clientFileId - The client file ID.
 */
const updateFileContext = ( updatedFile, clientFileId ) => {
	const context = getContext();
	const index = context.files.findIndex( file => file.id === clientFileId );

	if ( index === -1 ) {
		return;
	}

	context.files[ index ] = Object.assign( context.files[ index ], updatedFile );

	actions.updateField( context.fieldId, context.files );
};

/**
 * Ask the server to drop an already-uploaded file.
 *
 * Deliberately not awaited by the caller: the field's own state is updated first so the UI never
 * waits on the network. Safe to run after the interactivity scope is gone, since `getConfig()`
 * with an explicit namespace reads the global config map rather than the current scope.
 *
 * @param {string} fileId - The server-side file ID.
 */
const deleteUploadedFile = async fileId => {
	const token = await getUploadToken();

	if ( ! token ) {
		return;
	}

	const { endpoint } = getConfig( CONFIG_NAMESPACE );
	const formData = new FormData();
	formData.append( 'token', token );
	formData.append( 'file_id', fileId );

	try {
		await fetch( `${ endpoint }/remove`, { method: 'POST', body: formData } );
	} catch {
		// The file is already gone from the field either way; a failed cleanup call is not
		// something the visitor can act on.
	}
};

/**
 * Release everything attached to a file: its in-flight upload and its preview object URL.
 *
 * Shared by `removeFile` and `resetFiles` so the two cannot drift — a reset that skipped this
 * left the XHR running against a file nothing referenced any more, pinned the blob URL for the
 * life of the page, and leaked the controller into `uploadControllers`.
 *
 * @param {object} file - The file entry to release.
 */
const releaseFile = file => {
	if ( ! file ) {
		return;
	}

	/*
	 * The file may be waiting for a slot rather than uploading, in which case there is no
	 * controller to abort and nothing else would ever take it off the queue.
	 */
	dequeueUpload( file.id );
	clearStallWatchdog( file.id );

	const abortController = uploadControllers.get( file.id );
	if ( abortController ) {
		abortController.abort();
		uploadControllers.delete( file.id );
	}

	if ( file.url ) {
		// Strip the `url(…)` wrapper the style binding needs to get back to the blob URL.
		URL.revokeObjectURL( file.url.substring( 4, file.url.length - 1 ) );
	}

	// Freed last, because it starts the next queued upload: doing it before the abort above would
	// briefly run one request over the limit.
	finishUpload( file.id );
};

const { state, actions, callbacks } = store( NAMESPACE, {
	state: {
		validators: {
			/**
			 * Validates the file field's value: the array of files held in context.
			 *
			 * Mirrors `validators.phone` — a registered validator owns its own empty/required
			 * handling rather than leaning on the shared `validateField()` helper.
			 *
			 * @param {Array}   value      - The field's files.
			 * @param {boolean} isRequired - Whether the field is required.
			 * @return {string} The validation result.
			 */
			file: ( value, isRequired ) => {
				if ( isEmptyValue( value ) ) {
					return isRequired ? 'is_required' : 'yes';
				}

				if ( value.some( file => file.error ) ) {
					return 'invalid_file_has_errors';
				}

				if ( value.some( file => ! file.isUploaded ) ) {
					return 'invalid_file_uploading';
				}

				return 'yes';
			},
		},

		// Both getters tolerate a missing `files`: they live in the shared form store now, so a
		// stray binding from a non-file field would otherwise throw rather than read as "empty".
		get hasFileFieldFiles() {
			return getFileFieldFiles().length > 0;
		},

		// Hidden exactly when there is no room, on the same count `getRemainingCapacity()` uses.
		get isFileFieldFull() {
			return getRemainingCapacity() === 0;
		},

		// Whether the field-level notice — currently only "too many files" — has something to say.
		get hasFileFieldNotice() {
			return !! getContext().fileNotice;
		},
	},

	actions: {
		onFileDropzoneKeyDown: event => {
			// Holding the key down would otherwise reopen the picker on every auto-repeat.
			if ( event.repeat ) {
				return;
			}

			if ( event.key === 'Enter' || event.key === ' ' ) {
				event.preventDefault();
				actions.openFilePicker( event );
			}
		},

		/**
		 * Open the file picker dialog.
		 */
		openFilePicker() {
			const { ref } = getElement();
			const fileInput = ref.parentNode.querySelector( '.jetpack-form-file-field' );

			if ( fileInput ) {
				fileInput.value = ''; // Reset the field so that we always get the onchange event.
				fileInput.click();
			}
		},

		/**
		 * Handle file added event.
		 *
		 * @param {Event} event - The event object.
		 */
		fileAdded( event ) {
			addFiles( Array.from( event.target.files ) );
		},

		/**
		 * Handle file dropped event.
		 *
		 * @param {DragEvent} event - The drag event object.
		 */
		fileDropped: event => {
			event.preventDefault();
			// A drop fires no focus event, so the form's `focusin` handler never sees it.
			// Without this, dropping a file and submitting would report the fill as starting
			// at the submit button rather than at the drop.
			actions.trackFirstInteraction();
			if ( event.dataTransfer ) {
				const droppedFiles = [];
				let skippedDirectory = false;

				for ( const item of Array.from( event.dataTransfer.items ) ) {
					// Dragging selected text, a link or an image from another tab yields items with
					// `kind === 'string'`. Those return null from both `webkitGetAsEntry()` and
					// `getAsFile()`, so they have to be filtered before either is dereferenced.
					if ( item.kind !== 'file' ) {
						continue;
					}
					// Directories are skipped rather than aborting the whole drop: returning here
					// discarded every remaining file in a mixed selection and left `isDropping`
					// set, stranding the dropzone in its drag-hover style.
					if ( item.webkitGetAsEntry()?.isDirectory ) {
						skippedDirectory = true;
						continue;
					}
					// `getAsFile()` can still return null for a `file` item, and a batch of nothing but
					// nulls would otherwise clear an existing notice and re-nominate a focus target.
					const droppedFile = item.getAsFile();

					if ( droppedFile ) {
						droppedFiles.push( droppedFile );
					}
				}

				/*
				 * A drop carrying nothing this field can take — only directories, or only dragged
				 * text — leaves the files alone rather than reporting an empty batch.
				 */
				const declinedCount = droppedFiles.length ? addFiles( droppedFiles ) : 0;

				/*
				 * Say so when a folder was dropped and this drop had nothing more pressing to report.
				 * Ignoring it in silence leaves the visitor watching for an upload that will never
				 * start, and any notice still up from an earlier drop would appear to describe the
				 * folder. The string has been in the config since the field shipped, unused.
				 */
				if ( skippedDirectory && ! declinedCount && hasNoticeElement() ) {
					getContext().fileNotice = getConfig( CONFIG_NAMESPACE ).i18n.folderNotSupported;
				}
			}
			const context = getContext();
			context.isDropping = false;
		},

		/**
		 * Handle drag over event.
		 *
		 * @param {DragEvent} event - The drag event object.
		 */
		onFileDragOver: event => {
			const context = getContext();
			context.isDropping = true;
			event.preventDefault();
		},

		/**
		 * Handle drag leave event.
		 */
		onFileDragLeave: () => {
			const context = getContext();
			context.isDropping = false;
		},

		/**
		 * Make the endpoint request.
		 * This function is a generator so that we can use the withScope function.
		 * And the context gets passed to the onProgress and onReadyStateChange functions.
		 *
		 * @param {File}   file         - The file to upload.
		 * @param {string} clientFileId - The client file ID.
		 * @yield {Promise<string>} The upload token.
		 */
		uploadFile: function* ( file, clientFileId ) {
			const { endpoint, i18n } = getConfig( CONFIG_NAMESPACE );

			/*
			 * The slot was claimed before this generator was started, and until `readystatechange` is
			 * wired up nothing else would ever report this upload as finished. Anything that throws in
			 * between — `xhr.open()` or `xhr.send()`, both of which the XHR spec allows, or a rejection
			 * out of the token request — would leave the ID in `activeUploadIds` for the life of the
			 * page, shrinking the page-wide limit by one every time, with no error anywhere.
			 *
			 * The token request is inside this on purpose even though `fetchUploadToken()` resolves on
			 * every branch it currently has. That is a property of today's implementation, not of the
			 * contract, and it reads `getConfig()` before its own try — the guard should not depend on
			 * either staying true.
			 */
			try {
				const token = yield getUploadToken();

				if ( ! token ) {
					updateFileContext( { error: i18n.uploadFailed, hasError: true }, clientFileId );
					finishUpload( clientFileId );
					return;
				}

				/*
				 * The token round-trip suspends this generator, and there is no AbortController
				 * registered yet — so a removal during that window has nothing to cancel and returns as
				 * though it worked. Without this check the upload would resume and send a file the
				 * visitor already deleted. Sharing one token request across a batch widens the window,
				 * since files now queue behind a single fetch rather than each firing their own.
				 */
				const context = getContext();
				if ( ! context.files.some( fileObject => fileObject.id === clientFileId ) ) {
					finishUpload( clientFileId );
					return;
				}

				const xhr = new XMLHttpRequest();
				const formData = new FormData();

				// Create an AbortController for this upload
				const abortController = new AbortController();
				uploadControllers.set( clientFileId, abortController );

				xhr.open( 'POST', endpoint, true );
				xhr.upload.addEventListener(
					'progress',
					withScope( onProgress.bind( this, clientFileId ) )
				);
				// The body is out; everything from here is the server's time. See the two budgets.
				xhr.upload.addEventListener( 'loadend', () => {
					if ( activeUploadIds.has( clientFileId ) ) {
						startStallWatchdog( clientFileId, UPLOAD_RESPONSE_TIMEOUT_MS );
					}
				} );
				xhr.addEventListener(
					'readystatechange',
					withScope( onReadyStateChange.bind( this, clientFileId ) )
				);

				// Handle abort signal
				abortController.signal.addEventListener( 'abort', () => {
					xhr.abort();
				} );

				formData.append( 'file', file );
				formData.append( 'token', token );

				// Armed before the send, so a request that dies before its first progress event is
				// still caught.
				startStallWatchdog( clientFileId );
				xhr.send( formData );
			} catch {
				/*
				 * Registered before `open()`, and nothing else would remove it: the readystatechange
				 * listener is only attached once `open()` has returned.
				 */
				uploadControllers.delete( clientFileId );
				updateFileContext( { error: i18n.uploadFailed, hasError: true }, clientFileId );
				finishUpload( clientFileId );
			}
		},

		/**
		 * Reset the field, releasing anything the files still hold. See `releaseFile()`.
		 */
		resetFiles: () => {
			const context = getContext();
			context.files.forEach( releaseFile );
			/*
			 * Empty in place rather than reassigning. The legacy back-compat alias
			 * (`bridgeLegacyContext`) points the old markup's context at this same array by
			 * reference, so a reassignment would strand the old `data-wp-each--file` binding on the
			 * previous array and leave removed files visible.
			 */
			context.files.splice( 0 );
			context.fileNotice = '';

			/*
			 * Re-validate, the way `removeFile` does. Without this the field keeps whatever error it
			 * held before the reset: `releaseFile()` aborts each upload, an abort settles the request
			 * synchronously as readyState 4 / status 0, and that path records `invalid_file_has_errors`
			 * against the field on its way out. The files are then gone but the error is not, so the
			 * form refuses to submit and asks the visitor to remove file errors from a field showing
			 * no files at all.
			 */
			actions.updateField( context.fieldId, context.files );
		},

		/**
		 * Remove a file from the context and cancel its upload if in progress.
		 *
		 * The UI update happens first and the server-side delete is fired without blocking it.
		 * Waiting on a token round-trip before removing the entry left the preview in place and
		 * the dropzone hidden — `state.isFileFieldFull` still counted the file — so a slow or
		 * failed network made the field look stuck with no way to add a replacement.
		 *
		 * @param {Event} event - The event object.
		 */
		removeFile: event => {
			event.preventDefault();

			const context = getContext();
			const clientFileId = event.target.dataset.id;
			const file = context.files.find( fileObject => fileObject.id === clientFileId );

			// A second activation while the first is still settling would revoke an already-revoked
			// URL and POST a duplicate delete.
			if ( ! file ) {
				return;
			}

			releaseFile( file );

			/*
			 * Remove in place rather than reassigning `context.files`. The legacy back-compat alias
			 * (`bridgeLegacyContext`) shares this array with the old markup's context by reference, so
			 * a reassignment would leave the old `data-wp-each--file` binding on the stale array,
			 * keeping a removed file visible. An empty array is a legitimate value here — the
			 * registered validator turns it into `is_required` or `yes` as appropriate.
			 */
			const index = context.files.indexOf( file );
			if ( index !== -1 ) {
				context.files.splice( index, 1 );
			}

			// There is room again, so a "too many files" notice from an earlier batch is now wrong.
			context.fileNotice = '';

			actions.updateField( context.fieldId, context.files );

			if ( file.file_id ) {
				deleteUploadedFile( file.file_id );
			}
		},

		removeFileKeydown: event => {
			// Holding the key down would otherwise fire a second removal at the repeat rate.
			if ( event.repeat ) {
				return;
			}

			if ( event.key === 'Enter' || event.key === ' ' ) {
				event.preventDefault();
				actions.removeFile( event );
			}
		},
	},

	callbacks: {
		/**
		 * Move focus to a newly added file preview.
		 *
		 * The preview carries `tabindex="0"` and an `aria-label` of the file name, so it is the
		 * only meaningful focus target once a file is added — the dropzone is hidden as soon as
		 * `state.isFileFieldFull` becomes true, and focusing a hidden element strands keyboard users.
		 *
		 * The returned function is the effect cleanup: `data-wp-init` resolves the callback without
		 * invoking it, calls it once, and hands whatever it returns to Preact's `useEffect` as the
		 * teardown. So this runs when the preview unmounts — that is, when the file is removed —
		 * and hands focus back to the dropzone, which is visible again by then. Without it, removal
		 * destroys the focused element and focus falls to `<body>`.
		 *
		 * The container is captured while the preview is still attached: by cleanup time the node
		 * is detached, so `ref.closest()` would return null and querying it would throw.
		 *
		 * @return {Function} Cleanup that cancels the pending focus and restores it to the dropzone.
		 */
		focusFilePreview: () => {
			const { ref } = getElement();
			const container = ref.closest( '.jetpack-form-file-field__container' );

			/*
			 * Only the preview for the file this batch nominated takes focus; see `focusClaimFileId`.
			 * The rest still return the cleanup below, so removing any of them restores focus normally.
			 */
			/*
			 * `data-wp-each` puts the item under the namespace of the element that declared it, which
			 * is the legacy one on cached markup — while this callback resolves `getContext()` against
			 * `jetpack/form`, because the shim delegates through that store's proxy. Reading only the
			 * shared context would mean no preview ever claims focus on that markup.
			 */
			const previewFile = getContext().file ?? getContext( CONFIG_NAMESPACE )?.file;

			const claimsFocus = focusClaimFileId !== null && previewFile?.id === focusClaimFileId;

			if ( claimsFocus ) {
				focusClaimFileId = null;
			}

			// `isConnected` guards the case where the file is removed inside the delay: focusing a
			// detached node is a silent no-op that would strand focus on `<body>`.
			const focusTimer = claimsFocus
				? setTimeout( () => {
						/*
						 * Only move focus that is not already somewhere deliberate. A file dragged from
						 * the desktop never moves document focus, so a visitor mid-sentence in the message
						 * box would otherwise lose their caret — and the next keystrokes — to a preview
						 * appearing 100ms later. The restore path below already reasons this way.
						 */
						const { activeElement, body } = ref.ownerDocument;
						const focusIsIdle =
							! activeElement || activeElement === body || !! container?.contains( activeElement );

						if ( ref.isConnected && focusIsIdle ) {
							ref.focus( { focusVisible: true } );
						}
				  }, PREVIEW_FOCUS_DELAY_MS )
				: null;

			return () => {
				clearTimeout( focusTimer );

				const dropzone = container?.querySelector( '.jetpack-form-file-field__dropzone-inner' );

				/*
				 * Nothing cancels this second timer, so check at fire time that focus is still
				 * the orphan this callback exists to rescue. Destroying the focused preview drops
				 * focus to `<body>`; if the visitor has since tabbed or clicked to a real element,
				 * moving them to the dropzone would be stealing focus rather than restoring it.
				 */
				setTimeout( () => {
					if ( ! dropzone?.isConnected ) {
						return;
					}

					const { activeElement, body } = dropzone.ownerDocument;

					if ( activeElement && activeElement !== body ) {
						return;
					}

					/*
					 * `isConnected` is not enough: the dropzone is hidden with `display: none` while the
					 * field is full, and a hidden element is still connected. Calling focus() on it is a
					 * silent no-op, which would leave focus on <body> — precisely what this is here to
					 * prevent. Fall back to whatever preview remains.
					 */
					const target = isDropzoneVisible( dropzone )
						? dropzone
						: container?.querySelector( '.jetpack-form-file-field__preview' );

					target?.focus( { focusVisible: true } );
				}, PREVIEW_FOCUS_DELAY_MS );
			};
		},
	},
} );

/*
 * Back-compatibility shim for markup cached before this change. Remove one release after this
 * ships, along with the `@deprecated` note in the changelog.
 *
 * A page cache can serve HTML carrying `data-wp-interactive="jetpack/field-file"` against this
 * bundle, and that fails silently: the runtime auto-creates an empty store for an unknown
 * namespace rather than erroring, so every directive in the container becomes a no-op with no
 * console output outside SCRIPT_DEBUG. On a *required* file field it is unrecoverable — the
 * wrapper is still `jetpack/form`, so `registerField` records `is_required`, no file can ever be
 * added to clear it, and the submit gate blocks the form permanently.
 *
 * (The mirror case, new markup against a stale bundle, is handled by the content-hash suffix in
 * `enqueue_file_field_assets()` rather than here.)
 */
/**
 * Point the shared context at the legacy one so the new implementation can run against old markup.
 *
 * Old markup declared `files` under `jetpack/field-file` and carried `maxFiles`/`allowedMimeTypes`
 * as loose context keys rather than in `fieldExtra`. Assigning the same array reference rather than
 * a copy matters: the old template's `data-wp-each--file` still binds to the legacy context, so
 * both bindings have to observe the same underlying object to stay in step.
 */
const bridgeLegacyContext = () => {
	const legacy = getContext( CONFIG_NAMESPACE );
	const shared = getContext( NAMESPACE );

	if ( ! legacy || ! shared ) {
		return;
	}

	if ( shared.files === undefined ) {
		shared.files = legacy.files;
	}

	/*
	 * Test for the key rather than for a truthy value or for `fieldExtra` itself.
	 *
	 * `! shared.fieldExtra` never fires: the wrapper carrying old markup is the unchanged PHP of
	 * the previous release, which emitted `fieldExtra` for a file field as `get_field_extra()`'s
	 * untouched `$extra_attrs` — an empty array, which `wp_json_encode()` writes as `[]` and JS
	 * reads as truthy. The allowlist then stays empty and every file is rejected as a disallowed
	 * type.
	 *
	 * Testing the value (`! shared.fieldExtra?.allowedMimeTypes`) fixes that but is not idempotent:
	 * this runs inside the `hasFiles`/`hasMaxFiles` getters, which the runtime evaluates in a
	 * computed, and a legacy context with no usable list would assign a fresh object on every
	 * evaluation, invalidating the computed that just read it and spinning the main thread. Keying
	 * on the property means the second call is always a no-op.
	 */
	if ( ! shared.fieldExtra || ! ( 'allowedMimeTypes' in shared.fieldExtra ) ) {
		shared.fieldExtra = {
			maxFiles: legacy.maxFiles,
			allowedMimeTypes: legacy.allowedMimeTypes,
		};
	}
};

/*
 * Look the delegate up by name at call time rather than closing over it.
 *
 * `actions` and `callbacks` are store proxies, and the proxy's `get` trap is what binds a
 * function to a scope: it returns `withScope( fn )`, and `withScope()` captures `getScope()` at
 * the moment of the property read. Reading `actions.removeFile` while this module is still
 * evaluating captures an empty scope stack, so every later call would run `setScope( undefined )`
 * and the first `getContext()` inside would throw on `scope.context`. Deferring the read to call
 * time means the proxy binds the scope the runtime has already pushed for the directive.
 */
const withLegacyContext =
	actionName =>
	( ...args ) => {
		bridgeLegacyContext();
		return actions[ actionName ]( ...args );
	};

/*
 * The names above are strings, so renaming a shared action would not update them and nothing would
 * notice until a visitor on stale cached HTML hit a `TypeError`. Reading each one here (without
 * calling it) turns that into a console warning on every page load carrying the field. Reading is
 * safe: the proxy's `get` trap only binds a scope for the caller it returns, and this discards it.
 */
const assertLegacyDelegatesExist = names => {
	if ( ! globalThis.SCRIPT_DEBUG ) {
		return;
	}

	const missing = names.filter( name => typeof actions[ name ] !== 'function' );

	if ( missing.length ) {
		// eslint-disable-next-line no-console
		console.warn(
			`jetpack/field-file back-compat shim: no such action(s) on jetpack/form: ${ missing.join(
				', '
			) }`
		);
	}
};

store( CONFIG_NAMESPACE, {
	state: {
		get hasFiles() {
			bridgeLegacyContext();
			return state.hasFileFieldFiles;
		},
		get hasMaxFiles() {
			bridgeLegacyContext();
			return state.isFileFieldFull;
		},
	},
	actions: {
		handleKeyDown: withLegacyContext( 'onFileDropzoneKeyDown' ),
		openFilePicker: withLegacyContext( 'openFilePicker' ),
		fileAdded: withLegacyContext( 'fileAdded' ),
		/*
		 * Delegating is not enough here. The shared implementation ends by clearing `isDropping`
		 * on the shared context, but the old template binds `is-dropping` to the legacy one — the
		 * same reason `dragOver`/`dragLeave` below stay local. Without this the dropzone keeps its
		 * drag-hover highlight after a drop and only sheds it on the next `dragleave`.
		 */
		fileDropped: ( ...args ) => {
			bridgeLegacyContext();
			const result = actions.fileDropped( ...args );
			getContext( CONFIG_NAMESPACE ).isDropping = false;
			return result;
		},
		removeFile: withLegacyContext( 'removeFile' ),
		removeFileKeydown: withLegacyContext( 'removeFileKeydown' ),
		resetFiles: withLegacyContext( 'resetFiles' ),

		// The old template binds `is-dropping` to the legacy context, so these write there directly
		// rather than delegating to handlers that would set the flag on the shared context.
		dragOver: event => {
			getContext( CONFIG_NAMESPACE ).isDropping = true;
			event.preventDefault();
		},
		dragLeave: () => {
			getContext( CONFIG_NAMESPACE ).isDropping = false;
		},
	},
	callbacks: {
		// Read through the proxy at call time, for the reason given on `withLegacyContext()`.
		focusElement: ( ...args ) => callbacks.focusFilePreview( ...args ),
	},
} );

assertLegacyDelegatesExist( [
	'onFileDropzoneKeyDown',
	'openFilePicker',
	'fileAdded',
	'fileDropped',
	'removeFile',
	'removeFileKeydown',
	'resetFiles',
] );
