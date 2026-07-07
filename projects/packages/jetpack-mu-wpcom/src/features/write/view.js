/**
 * Write — WordPress.com — Interactivity API Store
 *
 * A distraction-free front-end writing experience.
 * Creates WordPress posts with proper block markup via the REST API.
 */

/* eslint-disable @wordpress/no-global-get-selection -- Write serves a full page, not an iframe or shadow DOM. */

// eslint-disable-next-line import/no-unresolved -- Provided by WordPress at runtime via wp_register_script_module.
import { store, getElement } from '@wordpress/interactivity';
// eslint-disable-next-line import/no-unresolved -- Provided by WordPress at runtime via wp_register_script_module.
import { createUndoHistory } from 'wpcom-write/undo-history';

// Translated strings passed from PHP via wp_print_inline_script_tag.
const i18n = window.wpcomWriteStrings || {};

// Tracks the blockquote currently containing the cursor, for citation placeholder lifecycle.
let activeBlockquote = null;

// Autosave configuration.
const AUTOSAVE_INTERVAL_MS = 30000; // 30 seconds.
const AUTOSAVE_MESSAGE_DURATION_MS = 2000;
const AUTOSAVE_STORAGE_KEY = 'wpcom-write-autosave-draft';
const ANON_DRAFT_STORAGE_KEY = 'wpcom-write-anon-draft';
const DISCLAIMER_STORAGE_KEY = 'wpcom-write-disclaimer-dismissed';

/**
 * Whether the editor is running on a logged-out page that opts into the
 * anonymous flow by setting `window.wpcomWriteIsAnon = true` before the module
 * loads. All anon branches in this file are gated on this — when the flag is
 * absent, every code path below behaves exactly as it did before.
 *
 * @return {boolean} True if the host page set the anon flag.
 */
function isAnon() {
	return typeof window !== 'undefined' && window.wpcomWriteIsAnon === true;
}

// Approximates the anon editor open — the module loads immediately after the
// server rendered the page (and fired `wpcom_write_editor_open`). Used as the
// baseline for `time_to_publish_ms` on the anon publish-click event.
const ANON_EDITOR_OPENED_AT = typeof Date !== 'undefined' ? Date.now() : 0;

// Guards `wpcom_write_editor_anon_write_start` to once per session.
let anonWriteStartTracked = false;

/**
 * Fire a client-side Tracks event via the `_tkq` queue. Anon callers share the
 * `tk_ai` cookie, so these stitch to the eventual user at signup completion.
 *
 * @param {string} name    - Tracks event name.
 * @param {object} [props] - Optional event properties.
 */
function recordTracksEvent( name, props ) {
	try {
		window._tkq = window._tkq || [];
		window._tkq.push( [ 'recordEvent', name, props || {} ] );
	} catch {
		// Tracks unavailable — nothing useful to do; swallow.
	}
}

// How long to let a Tracks pixel leave the browser before a redirect. wpcom's
// Tracks client sends via `new Image()`, and the browser cancels in-flight
// image GETs on unload — so an event fired immediately before navigation can be
// dropped. 250ms is imperceptible ahead of a full-page handoff to the signup
// flow, and well within the round-trip a fire-and-forget pixel needs.
const TRACKS_BEACON_FLUSH_MS = 250;

/**
 * Fire a Tracks event, then resolve once the pixel has had time to leave the
 * browser — for events recorded immediately before navigating away (e.g. the
 * anon publish handoff), where a synchronous redirect would otherwise cancel
 * the in-flight `new Image()` beacon. Best-effort and bounded: if the Tracks
 * client hasn't upgraded the queue (nothing will send), it resolves at once so
 * the handoff is never delayed for a beacon that won't fire.
 *
 * @param {string} name    - Tracks event name.
 * @param {object} [props] - Optional event properties.
 * @return {Promise<void>} Resolves when it is safe to navigate.
 */
function recordTracksEventBeforeUnload( name, props ) {
	recordTracksEvent( name, props );

	// The real Tracks client replaces `_tkq.push`; until it does, pushes just
	// pile up in a plain array and no pixel is sent, so there's nothing to wait
	// for. (This is exactly the pre-loader state we saw on the anon surface.)
	const tracksActive =
		typeof window !== 'undefined' && !! window._tkq && window._tkq.push !== Array.prototype.push;

	if ( ! tracksActive || typeof setTimeout === 'undefined' ) {
		return Promise.resolve();
	}

	return new Promise( resolve => {
		setTimeout( resolve, TRACKS_BEACON_FLUSH_MS );
	} );
}

/**
 * Fire `wpcom_write_editor_anon_write_start` once, the first time an anon
 * visitor types real content. Keeps the funnel's write-through step honest —
 * an empty editor that's opened and abandoned shouldn't count as a write.
 *
 * @param {string} text - Current plain-text content of the editor.
 */
function maybeTrackAnonWriteStart( text ) {
	if ( anonWriteStartTracked || ! isAnon() ) {
		return;
	}
	if ( ! text || ! text.trim() ) {
		return;
	}
	anonWriteStartTracked = true;
	recordTracksEvent( 'wpcom_write_editor_anon_write_start' );
}

/**
 * Persist the current draft snapshot to localStorage under the anon key.
 *
 * Failures (quota, blocked storage, undefined `localStorage`) are caught and
 * surfaced as a Tracks event so silent draft loss doesn't read as abandonment.
 *
 * @param {string} title   - Current post title.
 * @param {string} content - Current post content (block-formatted markup).
 */
function saveDraftToLocalStorage( title, content ) {
	try {
		window.localStorage.setItem(
			ANON_DRAFT_STORAGE_KEY,
			JSON.stringify( { title, content, ts: Date.now() } )
		);
	} catch ( err ) {
		const errorName = ( err && err.name ) || 'UnknownError';
		try {
			window._tkq = window._tkq || [];
			window._tkq.push( [
				'recordEvent',
				'wpcom_write_editor_anon_draft_persist_failed',
				{ error_name: errorName },
			] );
		} catch {
			// Tracks failed too — nothing useful to do here; swallow.
		}
	}
}

/**
 * Read the persisted anon draft snapshot, or `null` if missing/unreadable.
 *
 * @return {{title: string, content: string, ts: number} | null} Snapshot or null.
 */
function readAnonDraft() {
	try {
		const raw = window.localStorage.getItem( ANON_DRAFT_STORAGE_KEY );
		if ( ! raw ) {
			return null;
		}
		const parsed = JSON.parse( raw );
		if ( ! parsed || typeof parsed !== 'object' ) {
			return null;
		}
		return {
			title: typeof parsed.title === 'string' ? parsed.title : '',
			content: typeof parsed.content === 'string' ? parsed.content : '',
			ts: typeof parsed.ts === 'number' ? parsed.ts : 0,
		};
	} catch {
		return null;
	}
}

/**
 * Capture the current editor content as a block-formatted snapshot and persist
 * it to localStorage. Reads from `.bw-content-inner` (the editable wrapper) so
 * the outer `.bw-content` element's chrome attributes don't leak in, and runs
 * the inner HTML through `convertToBlocks` so the signup-flow handoff lands a
 * clean block draft instead of raw contenteditable markup.
 */
function captureAnonSnapshot() {
	const contentEl = getContent();
	const html = contentEl ? contentEl.innerHTML : '';
	saveDraftToLocalStorage( state.title, html ? convertToBlocks( html ) : '' );
}

/**
 * Discard the persisted anon draft snapshot. Safe to call when absent.
 */
function clearAnonDraft() {
	try {
		window.localStorage.removeItem( ANON_DRAFT_STORAGE_KEY );
	} catch {
		// No-op: if we can't clear it, the worst case is a stale recovery banner next visit.
	}
}

/**
 * Remove a stale `wpcom_user_id` left in localStorage by a previous Calypso
 * session.
 *
 * The anon editor only renders for logged-out visitors, so any `wpcom_user_id`
 * persisted under this origin is stale. Calypso bootstraps "is this visitor
 * logged in?" from that key, and the `/setup/write-on` signup flow blocks entry
 * and bails to My Home when it thinks the visitor is already authenticated — so
 * a stale id (e.g. a logout that didn't clear it) silently drops the anon draft
 * handed off on Publish. Clearing it keeps the persisted auth state in sync with
 * the real, logged-out session. See READ-574.
 *
 * Scoped to the single key on purpose: clearing the whole store would also wipe
 * the `wpcom-write-anon-draft` snapshot the editor just persisted.
 *
 * @return {boolean} True if a stale id was present and removed.
 */
function clearStaleWpcomUserId() {
	try {
		const hadStaleId = window.localStorage.getItem( 'wpcom_user_id' ) !== null;
		window.localStorage.removeItem( 'wpcom_user_id' );
		return hadStaleId;
	} catch {
		// localStorage unavailable/blocked — nothing to clear.
		return false;
	}
}

// Mark the page as anonymous so style.css can hide UI that has no anon
// equivalent (back button, more-menu, the standalone Save-draft button,
// unsupported-content "Open in editor" buttons). Set as early as the
// module loads so the initial render doesn't flash the hidden surfaces.
if ( isAnon() && typeof document !== 'undefined' && document.documentElement ) {
	document.documentElement.classList.add( 'bw-anon' );
}

// Drop a stale `wpcom_user_id` from a prior Calypso session so the Publish
// handoff to `/setup/write-on` doesn't mistake this logged-out visitor for an
// authenticated one and discard their draft. See READ-574.
if ( isAnon() ) {
	const hadStaleId = clearStaleWpcomUserId();
	if ( hadStaleId ) {
		window._tkq = window._tkq || [];
		window._tkq.push( [ 'recordEvent', 'wpcom_write_editor_anon_stale_user_cleared' ] );
	}
}

/**
 * Inject the brand label on the left of the top bar and the "Not signed in"
 * indicator before the Publish button. Both are anon-only; the strings come
 * from window.wpcomWriteStrings (with English fallbacks) so translations land
 * via the same path as the rest of the editor UI.
 */
function injectAnonTopbarLabels() {
	const topbar = document.querySelector( '.bw-topbar' );
	if ( ! topbar || topbar.querySelector( '.bw-anon-brand' ) ) {
		return;
	}

	const brand = document.createElement( 'span' );
	brand.className = 'bw-anon-brand';
	brand.textContent = i18n.anonBrand || 'WordPress.com · Write';
	topbar.prepend( brand );

	const status = document.createElement( 'span' );
	status.className = 'bw-anon-status';
	status.textContent = i18n.anonStatus || 'Not signed in';
	const publishBtn = topbar.querySelector( '.bw-btn-publish' );
	if ( publishBtn && publishBtn.parentNode ) {
		publishBtn.parentNode.insertBefore( status, publishBtn );
	} else {
		topbar.appendChild( status );
	}
}

if ( isAnon() && typeof document !== 'undefined' ) {
	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', injectAnonTopbarLabels );
	} else {
		injectAnonTopbarLabels();
	}
}

// Autosave state — tracked outside the store to avoid triggering reactivity.
let lastSavedSnapshot = { title: '', content: '' };
let autosaveTimer = null;
let allowLeave = false;

// Undo/redo history — tracked outside the store to avoid triggering reactivity.
const undoHistory = createUndoHistory();
let undoPendingTimer = null;

/**
 * Get the current content snapshot for dirty-state comparison.
 *
 * @return {{ title: string, content: string }} The current title and content.
 */
function getContentSnapshot() {
	const contentEl = getContent();
	return {
		title: state.title || '',
		content: contentEl ? contentEl.innerHTML : '',
	};
}

/**
 * Check whether the editor content has changed since the last save.
 *
 * @return {boolean} True if there are unsaved changes.
 */
function isDirty() {
	const current = getContentSnapshot();
	return current.title !== lastSavedSnapshot.title || current.content !== lastSavedSnapshot.content;
}

/**
 * Update the saved snapshot to reflect the current content.
 */
function updateSavedSnapshot() {
	lastSavedSnapshot = getContentSnapshot();
}

/**
 * Format a date string as a relative time ("2 hours ago", "Yesterday", etc.).
 *
 * @param {string} dateStr - A date string parseable by Date (e.g. MySQL datetime).
 * @return {string} Human-readable relative time.
 */
function formatRelativeDate( dateStr ) {
	const then = new Date( dateStr ).getTime();
	if ( isNaN( then ) || then <= 0 ) return '';
	const now = Date.now();
	const diffSec = Math.max( 0, Math.round( ( now - then ) / 1000 ) );

	const rtf = new Intl.RelativeTimeFormat( undefined, { numeric: 'auto' } );

	if ( diffSec < 60 ) return rtf.format( -diffSec, 'second' );
	const diffMin = Math.round( diffSec / 60 );
	if ( diffMin < 60 ) return rtf.format( -diffMin, 'minute' );
	const diffHr = Math.round( diffMin / 60 );
	if ( diffHr < 24 ) return rtf.format( -diffHr, 'hour' );
	const diffDay = Math.round( diffHr / 24 );
	if ( diffDay < 7 ) return rtf.format( -diffDay, 'day' );
	const diffWk = Math.round( diffDay / 7 );
	if ( diffWk <= 4 ) return rtf.format( -diffWk, 'week' );

	return new Intl.DateTimeFormat( undefined, {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	} ).format( new Date( dateStr ) );
}

/**
 * Check whether raw user input is a bare numeric post ID.
 *
 * @param {string} input - Raw user input from the post picker URL field.
 * @return {number|null} Post ID or null if not a bare numeric string.
 */
function parsePostId( input ) {
	const trimmed = input.trim();
	if ( /^\d+$/.test( trimmed ) ) return parseInt( trimmed, 10 );
	return null;
}

// Save/restore the selection so we can insert images after the modal closes.
let savedRange = null;

// Stored references for dropdown close handlers to prevent listener leaks.
let headingMenuCloseHandler = null;
let textColorMenuCloseHandler = null;
let linkPopoverCloseHandler = null;

// Track the previous slash filter so checkSlashCommand only resets the active
// menu item when the filter text changes, not when the user is navigating.
let prevSlashFilter = null;

// Prevent enterKeyboardNav from stacking multiple mousemove listeners.
let keyboardNavListenerActive = false;

// Skip one checkSlashCommand cycle after the user dismisses the menu with Escape,
// preventing the keyup event from immediately reopening it.
let slashMenuEscaped = false;

// Track which toolbar button currently holds tabindex="0" for roving tabindex.
// Focus memory persists across Tab-in / Tab-out cycles.
let lastFocusedToolbarButton = null;

// Track the figure currently "selected" by the first Backspace/Delete press.
// A second press on the same figure deletes it.
let selectedFigure = null;

// The cursor range saved before a figure is selected so it can be restored
// if the user cancels the selection (Escape, click, or typing a letter).
let preFigureSelectionRange = null;

// The figure currently open in the image properties panel. Set by editImage()
// and cleared by closeImageModal(); changes made in the panel apply to this
// figure live.
let editingFigure = null;

// The element that triggered the edit panel (typically the per-image Edit
// pencil button) — focus returns here when the panel closes for a11y.
let editTriggerEl = null;

let cachedContent = null;

// --- Undo/redo helpers ---

/**
 * Serialise the current selection as a root-relative node path so it can be
 * restored after innerHTML is replaced.
 *
 * @param {Element} root - The contenteditable container.
 * @return {Object|null} Cursor descriptor, or null when there is no selection.
 */
function serializeCursor( root ) {
	const sel = window.getSelection();
	if ( ! sel || sel.rangeCount === 0 ) return null;
	const range = sel.getRangeAt( 0 );
	if ( ! root.contains( range.startContainer ) ) return null;

	/**
	 * Walk from node up to root, recording child indices at each level.
	 *
	 * @param {Node} node - The node to build a path for.
	 * @return {number[]|null} Child-index path from root to node, or null if node is not inside root.
	 */
	function getNodePath( node ) {
		const path = [];
		let current = node;
		while ( current !== root ) {
			const parent = current.parentNode;
			if ( ! parent ) return null;
			path.unshift( Array.prototype.indexOf.call( parent.childNodes, current ) );
			current = parent;
		}
		return path;
	}

	const anchorPath = getNodePath( range.startContainer );
	const focusPath = getNodePath( range.endContainer );
	if ( ! anchorPath || ! focusPath ) return null;

	return {
		anchorPath,
		anchorOffset: range.startOffset,
		focusPath,
		focusOffset: range.endOffset,
	};
}

/**
 * Restore a cursor position previously captured by serializeCursor.
 * Falls back to the first paragraph when the serialised path can no longer
 * be resolved (e.g. after a large structural undo).
 *
 * @param {Element}     root       - The contenteditable container.
 * @param {Object|null} cursorInfo - Descriptor returned by serializeCursor, or null.
 * @return {void}
 */
function restoreUndoCursor( root, cursorInfo ) {
	/** Place the cursor at the start of the first paragraph as a safe fallback. */
	function fallback() {
		const p = root.querySelector( 'p' );
		if ( p ) placeCursorAt( p );
	}

	/**
	 * Resolve a root-relative node path to a { node, offset } pair.
	 *
	 * @param {number[]} path   - Child-index path from root to the target node.
	 * @param {number}   offset - Character or child offset within that node.
	 * @return {Object|null} Resolved node + clamped offset, or null when path is stale.
	 */
	function resolvePath( path, offset ) {
		let node = root;
		for ( const idx of path ) {
			node = node.childNodes[ idx ];
			if ( ! node ) return null;
		}
		const maxOffset = node.nodeType === Node.TEXT_NODE ? node.length : node.childNodes.length;
		return { node, offset: Math.min( offset, maxOffset ) };
	}

	if ( ! cursorInfo ) return fallback();

	const anchor = resolvePath( cursorInfo.anchorPath, cursorInfo.anchorOffset );
	const focus = resolvePath( cursorInfo.focusPath, cursorInfo.focusOffset );
	if ( ! anchor || ! focus ) return fallback();

	try {
		const sel = window.getSelection();
		const range = document.createRange();
		range.setStart( anchor.node, anchor.offset );
		range.setEnd( focus.node, focus.offset );
		sel.removeAllRanges();
		sel.addRange( range );
	} catch {
		fallback();
	}
}

/**
 * Strip runtime-injected figure controls from a content subtree.
 *
 * The img-controls wrapper and the delete / alt / caption buttons are added
 * at runtime by addDeleteButtons() with live event listeners attached. Those
 * listeners do not survive an innerHTML round-trip, so we drop the markup
 * before serialising — the MutationObserver in addDeleteButtons() will
 * re-add buttons (with listeners) when the figure reappears after undo/redo.
 *
 * @param {Element} root - Detached root (typically a clone of .bw-content-inner).
 */
function stripRuntimeFigureControls( root ) {
	root.querySelectorAll( '.bw-img-controls' ).forEach( wrapper => {
		const img = wrapper.querySelector( 'img' );
		if ( img ) wrapper.before( img );
		wrapper.remove();
	} );
	root
		.querySelectorAll( '.bw-img-delete, .bw-img-caption-btn, .bw-img-edit' )
		.forEach( el => el.remove() );
}

/**
 * Capture the current editor state as an undo snapshot.
 *
 * @return {object} Snapshot containing html, title, and cursor.
 */
function captureUndoSnapshot() {
	const content = getContent();
	if ( ! content ) {
		return { html: '', title: state.title || '', cursor: null };
	}
	const clone = content.cloneNode( true );
	stripRuntimeFigureControls( clone );
	return {
		html: clone.innerHTML,
		title: state.title || '',
		cursor: serializeCursor( content ),
	};
}

/**
 * Restore editor content and cursor from an undo snapshot.
 *
 * @param {object} snapshot - Snapshot previously created by captureUndoSnapshot.
 */
function applyUndoSnapshot( snapshot ) {
	const content = getContent();
	if ( content ) {
		content.innerHTML = snapshot.html;
		ensureBlockStructure();
		restoreUndoCursor( content, snapshot.cursor );
	}
	const titleEl = document.querySelector( '.bw-title' );
	if ( titleEl ) {
		titleEl.value = snapshot.title;
		state.title = snapshot.title;
		titleEl.style.height = 'auto';
		titleEl.style.height = titleEl.scrollHeight + 'px';
	}
}

/** Mirror undoHistory.canUndo/canRedo into reactive store state so buttons update. */
function syncUndoState() {
	state.canUndo = undoHistory.canUndo;
	state.canRedo = undoHistory.canRedo;
}

/** Push the current editor state onto the undo stack (no-op when content is unchanged). */
function pushToUndoHistory() {
	undoPendingTimer = null;
	const snapshot = captureUndoSnapshot();
	const last = undoHistory.current;
	if ( last && last.html === snapshot.html && last.title === snapshot.title ) return;
	undoHistory.push( snapshot );
	syncUndoState();
}

/** Schedule a history push 500 ms after the last keystroke. */
function pushToUndoHistoryDebounced() {
	if ( undoPendingTimer ) clearTimeout( undoPendingTimer );
	undoPendingTimer = setTimeout( pushToUndoHistory, 500 );
}

/** Commit any pending debounced snapshot immediately. */
function flushUndoDebounce() {
	if ( undoPendingTimer ) {
		clearTimeout( undoPendingTimer );
		pushToUndoHistory();
	}
}

/** Flush pending text input then step back one entry in the undo stack. */
function performUndo() {
	flushUndoDebounce();
	if ( ! undoHistory.canUndo ) return;
	const snap = undoHistory.undo();
	if ( snap ) applyUndoSnapshot( snap );
	syncUndoState();
}

/** Discard pending text input and step forward one entry in the undo stack. */
function performRedo() {
	if ( undoPendingTimer ) {
		clearTimeout( undoPendingTimer );
		undoPendingTimer = null;
	}
	if ( ! undoHistory.canRedo ) return;
	const snap = undoHistory.redo();
	if ( snap ) applyUndoSnapshot( snap );
	syncUndoState();
}

/**
 * Get the content editable element, caching the reference.
 *
 * @return {Element|null} The .bw-content element.
 */
function getContent() {
	if ( ! cachedContent || ! cachedContent.isConnected ) {
		// The inner wrapper holds user-editable content. The outer .bw-content
		// keeps Preact's reactive bindings (event handlers, aria attributes),
		// while .bw-content-inner has data-wp-ignore so Preact treats its
		// children as opaque — preventing the reconciler from re-attaching
		// stale Preact-tracked nodes after we replace innerHTML during undo.
		cachedContent = document.querySelector( '.bw-content-inner' );
	}
	return cachedContent;
}

// Image size presets we ship. Wide/full layouts and custom widths stay in the
// block editor (see RSM-3472).
const IMAGE_SIZE_SLUGS = [ 'thumbnail', 'medium', 'large', 'full' ];

// Image alignment values we ship. All three are made explicit on save —
// every image gets an `align*` class on the figure and an `align`
// attribute in the block JSON, including center, so themes can rely on
// the class to position the figure (many don't center unaligned figures
// by default).
const IMAGE_ALIGNS = [ 'left', 'center', 'right' ];

// Cache of media library size lookups keyed by attachment ID.  Populated
// at upload time from the API response, then again lazily when the user
// changes the size of a figure loaded from a saved post.
const mediaSizesCache = new Map();

/**
 * Read the attachment ID embedded in `wp-image-<id>` on an `<img>`.
 *
 * @param {HTMLImageElement} img - The image element.
 * @return {number|null} Numeric attachment ID, or null when the class is absent.
 */
function getMediaIdFromImg( img ) {
	if ( ! img ) return null;
	const match = img.className.match( /(?:^|\s)wp-image-(\d+)(?:\s|$)/ );
	return match ? parseInt( match[ 1 ], 10 ) : null;
}

/**
 * Get the registered media-library sizes for an attachment, caching the
 * result. Returns null for images without a media library ID (e.g. inserted
 * from an external URL).
 *
 * The Promise is cached (not just the resolved value) so two rapid size
 * changes on the same image share one REST request instead of racing.
 *
 * @param {number} id - Attachment ID.
 * @return {Promise<Object|null>} Resolves to the sizes object, or null.
 */
function fetchMediaSizes( id ) {
	if ( mediaSizesCache.has( id ) ) return mediaSizesCache.get( id );
	const promise = window.wp
		.apiFetch( { path: `/wp/v2/media/${ id }` } )
		.then( media => media.media_details?.sizes || null )
		.catch( () => null );
	mediaSizesCache.set( id, promise );
	return promise;
}

/**
 * Swap an image's src to the registered media-library URL for the given
 * size, plus update width/height attributes so the rendered size is right
 * everywhere — block editor, published page, RSS.
 *
 * No-op if the image isn't in the media library or the requested size
 * isn't registered (theme/plugin chose not to generate it).
 *
 * @param {Element} fig  - The figure element.
 * @param {string}  slug - A size slug ('thumbnail' / 'medium' / 'large' / 'full').
 */
async function applyMediaSizeToFigure( fig, slug ) {
	const img = fig.querySelector( 'img' );
	const id = getMediaIdFromImg( img );
	if ( ! id ) return;
	const sizes = await fetchMediaSizes( id );
	const target = sizes?.[ slug ] || sizes?.full;
	if ( ! target?.source_url ) return;
	img.src = target.source_url;
	if ( target.width ) img.setAttribute( 'width', target.width );
	if ( target.height ) img.setAttribute( 'height', target.height );
}

// In-flight applyMediaSizeToFigure promises. savePost awaits these before
// cloning content so a save fired between a size click and the REST
// response doesn't serialize the new size class with the old src.
const pendingMediaSizeSwaps = new Set();

/**
 * Register an in-flight applyMediaSizeToFigure promise so savePost can wait
 * for it before serializing.
 *
 * @param {Promise} promise - The applyMediaSizeToFigure call.
 * @return {Promise} The same promise, for chaining.
 */
function trackMediaSizeSwap( promise ) {
	pendingMediaSizeSwaps.add( promise );
	promise.finally( () => pendingMediaSizeSwaps.delete( promise ) );
	return promise;
}

/**
 * Toggle a size class on a figure, replacing any existing one.
 *
 * @param {Element} fig  - The figure element.
 * @param {string}  slug - A size slug or '' (clear).
 */
function setFigureSize( fig, slug ) {
	IMAGE_SIZE_SLUGS.forEach( s => fig.classList.remove( 'size-' + s ) );
	if ( slug ) fig.classList.add( 'size-' + slug );
}

/**
 * Infer a size slug for a figure by matching the img's current src against
 * the media library's registered sizes. Used when a figure loaded from
 * outside Write (e.g. block-editor default insert) has no `size-X` class
 * but the img URL matches a known preset — Write's panel should show that
 * preset as the active selection instead of a blank state.
 *
 * Asynchronous because the registered sizes come from a REST request that's
 * cached in memory after the first call.
 *
 * @param {Element} fig - The figure element.
 * @return {Promise<string>} Slug ('thumbnail'/'medium'/'large'/'full') or '' when no match (custom size, external URL, etc).
 */
async function inferSizeFromImgSrc( fig ) {
	const img = fig.querySelector( 'img' );
	if ( ! img ) return '';
	const id = getMediaIdFromImg( img );
	if ( ! id ) return '';
	const sizes = await fetchMediaSizes( id );
	if ( ! sizes ) return '';
	const src = img.src;
	for ( const slug of IMAGE_SIZE_SLUGS ) {
		if ( sizes[ slug ]?.source_url === src ) return slug;
	}
	return '';
}

/**
 * Toggle an alignment class on a figure, replacing any existing one.  Always
 * adds one of alignleft/aligncenter/alignright so the published view centers
 * reliably (themes key off these classes; unaligned figures don't center
 * consistently across themes).
 *
 * @param {Element} fig   - The figure element.
 * @param {string}  align - 'left', 'center', or 'right'.
 */
function setFigureAlignment( fig, align ) {
	fig.classList.remove( 'alignleft', 'alignright', 'aligncenter' );
	if ( align === 'left' ) fig.classList.add( 'alignleft' );
	else if ( align === 'right' ) fig.classList.add( 'alignright' );
	else fig.classList.add( 'aligncenter' );
}

/**
 * Read the current alignment from a figure's class list. Returns 'center'
 * when no align class is set.
 *
 * @param {Element} fig - The figure element.
 * @return {string} 'left', 'center', or 'right'.
 */
function getFigureAlignment( fig ) {
	if ( fig.classList.contains( 'alignleft' ) ) return 'left';
	if ( fig.classList.contains( 'alignright' ) ) return 'right';
	return 'center';
}

/**
 * Deselect the currently-selected figure, if any, and optionally
 * restore the cursor position saved before the figure was selected.
 *
 * @param {boolean} restoreCursor - Whether to restore the saved cursor
 *                                position. Pass false when the caller sets its own cursor (e.g. click).
 */
function clearFigureSelection( restoreCursor = true ) {
	if ( selectedFigure ) {
		selectedFigure.classList.remove( 'bw-figure-selected' );
		selectedFigure = null;
	}
	if ( restoreCursor && preFigureSelectionRange ) {
		const sel = window.getSelection();
		sel.removeAllRanges();
		sel.addRange( preFigureSelectionRange );
	}
	preFigureSelectionRange = null;
}

// Deselect figure on any click — don't restore the saved cursor
// because the click itself places the caret where the user wants it.
document.addEventListener( 'click', () => clearFigureSelection( false ) );

/**
 * Whether the editor has anything worth saving — non-empty title, any
 * text content, or a media/separator block. Used by actions that need a
 * real post to navigate to before they can do their job, and by the
 * client-side empty-save guard.
 *
 * Checks textContent rather than innerHTML so structural-only markup
 * like <p><br></p> doesn't count as content. Figures and separators
 * have no textContent but are still valid content, so check for them
 * too.
 *
 * @return {boolean} True when there's title, text, or a media/separator block.
 */
function hasWritableContent() {
	if ( state.title && state.title.trim() ) {
		return true;
	}
	const content = getContent();
	if ( ! content ) {
		return false;
	}
	if ( content.textContent.trim() ) {
		return true;
	}
	return !! content.querySelector( 'figure, hr' );
}

/**
 * If the cursor is at the edge of a block adjacent to a figure, return
 * that figure. Otherwise return null.
 *
 * @param {string} key - 'Backspace' or 'Delete'.
 * @return {Element|null} The adjacent figure element, or null if none.
 */
function getFigureAdjacentToCursor( key ) {
	const sel = window.getSelection();
	if ( ! sel.rangeCount || ! sel.isCollapsed ) return null;

	const range = sel.getRangeAt( 0 );
	let block = range.startContainer;
	const contentEl = getContent();
	if ( ! contentEl ) return null;

	// Walk up to the direct child of .bw-content.
	while ( block && block.parentNode !== contentEl ) {
		block = block.parentNode;
	}
	if ( ! block || block.nodeType !== Node.ELEMENT_NODE ) return null;

	// Detect whether the cursor is at the very start or end of the
	// block by checking if there is any text content before/after it.
	// This handles arbitrary nesting (e.g. <blockquote><p>text|</p>
	// </blockquote>) where compareBoundaryPoints would report the
	// cursor as "before the end" even though no content follows.
	if ( key === 'Backspace' ) {
		const before = document.createRange();
		before.selectNodeContents( block );
		before.setEnd( range.startContainer, range.startOffset );
		const atStart = before.toString().trim() === '';
		if ( atStart ) {
			const prev = block.previousElementSibling;
			if ( prev && prev.tagName === 'FIGURE' && ! ( 'bwDeleting' in prev.dataset ) ) return prev;
		}
	} else if ( key === 'Delete' ) {
		const after = range.cloneRange();
		after.selectNodeContents( block );
		after.setStart( range.startContainer, range.startOffset );
		const atEnd = after.toString().trim() === '';
		if ( atEnd ) {
			const next = block.nextElementSibling;
			if ( next && next.tagName === 'FIGURE' && ! ( 'bwDeleting' in next.dataset ) ) return next;
		}
	}

	return null;
}

/**
 * Save the current text selection so it can be restored after a modal closes.
 */
function saveSelection() {
	const sel = window.getSelection();
	if ( sel.rangeCount > 0 ) {
		savedRange = sel.getRangeAt( 0 ).cloneRange();
	}
}

/**
 * Restore a previously saved text selection.
 */
function restoreSelection() {
	if ( ! savedRange ) return;
	const sel = window.getSelection();
	sel.removeAllRanges();
	sel.addRange( savedRange );
}

/**
 * Move roving tabindex to a toolbar button and focus it.
 *
 * @param {HTMLElement} button - The toolbar button to focus.
 */
function setToolbarFocus( button ) {
	if ( lastFocusedToolbarButton ) {
		lastFocusedToolbarButton.tabIndex = -1;
	}
	button.tabIndex = 0;
	button.focus();
	lastFocusedToolbarButton = button;
}

/**
 * Visually highlight the current selection using the CSS Custom Highlight API.
 *
 * This avoids mutating the DOM (which would invalidate the saved range),
 * so the selection can be cleanly restored when the link popover closes.
 */
function highlightSelection() {
	if ( ! self.Highlight || ! CSS.highlights ) return;

	const sel = window.getSelection();
	if ( ! sel.rangeCount || sel.isCollapsed ) return;

	const range = sel.getRangeAt( 0 ).cloneRange();
	CSS.highlights.set( 'bw-link-highlight', new Highlight( range ) );
}

/**
 * Remove the visual link-highlight overlay.
 */
function clearHighlight() {
	if ( CSS.highlights ) {
		CSS.highlights.delete( 'bw-link-highlight' );
	}
}

/**
 * Apply a link to the current selection. When the selection is collapsed
 * (no text selected), insert the URL as visible text first so the link
 * is created consistently across browsers — Firefox's createLink is a
 * no-op on collapsed selections, while Chrome inserts the URL as text.
 *
 * @param {string} url - The URL to link to.
 */
function createLinkFromUrl( url ) {
	const sel = window.getSelection();
	if ( sel.isCollapsed ) {
		// Insert the URL as text, then select it so createLink can wrap it.
		document.execCommand( 'insertText', false, url );
		const r = sel.getRangeAt( 0 );
		r.setStart( r.startContainer, r.startOffset - url.length );
		sel.removeAllRanges();
		sel.addRange( r );
	}
	document.execCommand( 'createLink', false, url );
}

/**
 * End an in-progress edit-panel session: commit changes as a discrete undo
 * entry and reset edit-only state. Returns the trigger element that opened
 * the panel so the caller can decide whether to return focus there.
 *
 * No-op when no edit session is in progress.
 *
 * @return {Element|null} The Edit pencil that opened the panel, or null.
 */
function endEditSession() {
	if ( ! state.isEditMode ) return null;
	const trigger = editTriggerEl;
	if ( editingFigure ) {
		editingFigure.classList.remove( 'bw-figure-editing' );
	}
	editingFigure = null;
	editTriggerEl = null;
	state.isEditMode = false;
	state.editingImageAlign = 'center';
	state.editingImageSize = '';
	state.editingImageHasMediaId = false;
	pushToUndoHistory();
	return trigger;
}

/**
 * Focus the first visible input inside the image insert overlay or the edit
 * panel after it becomes visible. Uses requestAnimationFrame so the element
 * is no longer hidden.
 */
function focusModalInput() {
	requestAnimationFrame( () => {
		const target = document.querySelector(
			'.bw-image-edit-panel:not([hidden]) input:not([hidden]), .bw-image-overlay:not([hidden]) input:not([hidden])'
		);
		if ( target ) target.focus();
	} );
}

/**
 * Escape a string for safe interpolation into an HTML attribute value.
 *
 * @param {string} str - Raw string value.
 * @return {string} HTML-attribute-safe string.
 */
function escapeAttr( str ) {
	return str.replace( /&/g, '&amp;' ).replace( /"/g, '&quot;' );
}

/**
 * Convert an rgb() color string to hex (#rrggbb). Returns the input
 * unchanged if it is not in rgb() format.
 *
 * @param {string} rgb - A CSS color value, e.g. "rgb(214, 54, 56)".
 * @return {string} Hex color string, e.g. "#d63638".
 */
function rgbToHex( rgb ) {
	const m = rgb.match( /^rgb\(\s*(\d+),\s*(\d+),\s*(\d+)\s*\)$/ );
	if ( ! m ) return rgb;
	const hex = i => ( '0' + parseInt( m[ i ], 10 ).toString( 16 ) ).slice( -2 );
	return '#' + hex( 1 ) + hex( 2 ) + hex( 3 );
}

/**
 * Normalize color markup from contentEditable before block serialization.
 *
 * Write edits colors as spans (via foreColor), saves colors as Gutenberg marks.
 * Three passes: font→span, mark→span, span→mark.
 *
 * @param {HTMLElement} container - The container to normalize in place.
 */
function normalizeColorMarkup( container ) {
	// Pass 1: <font color> → <span style="color:"> for uniform handling.
	container.querySelectorAll( 'font[color]' ).forEach( font => {
		const color = font.getAttribute( 'color' );
		const span = document.createElement( 'span' );
		if ( color && color.toLowerCase() !== '#1a1a1a' ) {
			span.style.color = color;
		}
		span.innerHTML = font.innerHTML;
		font.replaceWith( span );
	} );

	// Pass 2: existing <mark class="has-inline-color"> → <span> so the
	// span pass handles all colored elements uniformly.
	container.querySelectorAll( 'mark.has-inline-color' ).forEach( mark => {
		const span = document.createElement( 'span' );
		if ( mark.style.color ) {
			span.style.color = mark.style.color;
		}
		span.innerHTML = mark.innerHTML;
		mark.replaceWith( span );
	} );

	// Pass 3: colored spans → Gutenberg <mark> format. Default color stripped.
	container.querySelectorAll( 'span' ).forEach( span => {
		const color = span.style.color;
		if ( ! color ) return;
		const isDefault = color === '#1a1a1a' || color === 'rgb(26, 26, 26)';
		if ( isDefault ) {
			span.replaceWith( ...span.childNodes );
			return;
		}
		const hexColor = rgbToHex( color );
		const mark = document.createElement( 'mark' );
		mark.className = 'has-inline-color';
		// Raw string avoids CSS OM normalizing hex back to rgb().
		// rgba(0, 0, 0, 0) is Gutenberg's exact transparent sentinel.
		mark.setAttribute( 'style', 'background-color:rgba(0, 0, 0, 0);color:' + hexColor );
		mark.innerHTML = span.innerHTML;
		// Preserve other styles (e.g. text-decoration) by nesting the mark.
		span.style.color = '';
		if ( span.getAttribute( 'style' )?.trim() ) {
			span.innerHTML = '';
			span.appendChild( mark );
		} else {
			span.replaceWith( mark );
		}
	} );
}

/**
 * Normalize inline formatting tags before block serialization.
 *
 * document.execCommand produces legacy tags (<b>, <i>, <u>, <strike>) that
 * Gutenberg's rich text system flags as unknown formatting. Convert them to
 * the tags Gutenberg's default formats use: <strong>, <em>, <s>, and a span
 * with text-decoration:underline for <u>.
 *
 * @param {HTMLElement} container - The container to normalize in place.
 */
function normalizeFormattingTags( container ) {
	const replacements = [
		[ 'b', 'strong' ],
		[ 'i', 'em' ],
		[ 'strike', 's' ],
	];
	for ( const [ from, to ] of replacements ) {
		container.querySelectorAll( from ).forEach( oldEl => {
			const newEl = document.createElement( to );
			newEl.innerHTML = oldEl.innerHTML;
			oldEl.replaceWith( newEl );
		} );
	}

	// <u> has no dedicated tag in Gutenberg's core formats; the core/underline
	// format uses <span style="text-decoration:underline"> instead.
	container.querySelectorAll( 'u' ).forEach( u => {
		const span = document.createElement( 'span' );
		span.style.textDecoration = 'underline';
		span.innerHTML = u.innerHTML;
		u.replaceWith( span );
	} );
}

// Tags whose subtree is preserved on paste. Anything not listed here and not
// in PASTE_DROP_TAGS is unwrapped — its children stay, but the element itself
// is removed along with every attribute it carried.
const PASTE_ALLOWED_TAGS = new Set( [
	'P',
	'BR',
	'H1',
	'H2',
	'H3',
	'H4',
	'H5',
	'H6',
	'UL',
	'OL',
	'LI',
	'BLOCKQUOTE',
	'A',
	'STRONG',
	'B',
	'EM',
	'I',
	'U',
	'S',
	'STRIKE',
	'CODE',
] );

// Tags whose subtree is discarded entirely on paste — they carry no useful
// content for the editor and unwrapping would dump CSS or script source as text.
const PASTE_DROP_TAGS = new Set( [
	'SCRIPT',
	'STYLE',
	'META',
	'LINK',
	'HEAD',
	'TITLE',
	'NOSCRIPT',
] );

/**
 * Sanitize pasted HTML in place inside `container`.
 *
 * Source-document typography (font-size, font-family, color, background,
 * line-height, font-weight) leaks into the editor via `style` attributes
 * and wrapper tags, producing visible mismatches with the editor's own
 * styling. This walks the tree depth-first, drops non-content subtrees
 * (script/style/meta/etc.), unwraps tags that aren't in the allowlist
 * (keeping their text and children), and strips every attribute except
 * `href` on links.
 *
 * Google Docs wraps copied content in an outer `<b id="docs-internal-guid-…">`
 * with a counteracting `style="font-weight:normal"`. Once we strip that style
 * the bare `<b>` would bold the entire paste, so we unwrap any element with
 * a `docs-internal-guid` id before deciding what to do with its tag.
 *
 * @param {Element} container - The container to sanitize in place.
 */
function sanitizePasteFragment( container ) {
	for ( const child of Array.from( container.childNodes ) ) {
		if ( child.nodeType === Node.ELEMENT_NODE ) {
			sanitizePasteNode( child );
		}
	}
}

/**
 * Promote inline-style formatting on pasted elements to semantic tags.
 *
 * Google Docs and Word commonly express bold/italic/underline/strikethrough
 * as inline `font-weight`, `font-style`, and `text-decoration` styles on
 * <span>s rather than as semantic tags. The main sanitize pass strips style
 * attributes and unwraps <span>, which would lose the formatting. This walks
 * every styled element once before sanitization and wraps its children in
 * <strong>/<em>/<u>/<s> so the formatting survives the unwrap.
 *
 * @param {Element} container - The container to walk.
 */
function promotePasteFormatting( container ) {
	for ( const el of container.querySelectorAll( '[style]' ) ) {
		const fontWeight = el.style.fontWeight;
		if ( fontWeight === 'bold' || fontWeight === 'bolder' || parseInt( fontWeight, 10 ) >= 600 ) {
			wrapPasteChildren( el, 'strong' );
		}
		if ( el.style.fontStyle === 'italic' || el.style.fontStyle === 'oblique' ) {
			wrapPasteChildren( el, 'em' );
		}
		// `text-decoration` is the legacy/shorthand property; `text-decoration-line`
		// is what the CSSOM exposes when the parser splits the shorthand. Check
		// both — sources vary.
		const decoration = el.style.textDecorationLine || el.style.textDecoration || '';
		if ( decoration.includes( 'underline' ) ) {
			wrapPasteChildren( el, 'u' );
		}
		if ( decoration.includes( 'line-through' ) ) {
			wrapPasteChildren( el, 's' );
		}
	}
}

/**
 * Move every child of `el` into a freshly created `<tagName>` wrapper, then
 * re-attach the wrapper as `el`'s sole child. No-op when `el` has no children.
 *
 * @param {Element} el      - Element whose children should be wrapped.
 * @param {string}  tagName - Wrapper element tag name.
 */
function wrapPasteChildren( el, tagName ) {
	if ( ! el.firstChild ) return;
	const wrapper = document.createElement( tagName );
	while ( el.firstChild ) {
		wrapper.appendChild( el.firstChild );
	}
	el.appendChild( wrapper );
}

/**
 * Sanitize a single element from a pasted fragment in place. Called by
 * sanitizePasteFragment for each element child; see that function for the
 * tag/attribute policy.
 *
 * @param {Element} el - Element to sanitize.
 */
function sanitizePasteNode( el ) {
	// Normalize to uppercase: HTML-namespaced elements already report uppercase
	// tagNames, but SVG/MathML-namespaced ones preserve the source casing — so
	// a pasted <svg><script> would slip past the DROP_TAGS check otherwise.
	const tag = el.tagName.toUpperCase();

	if ( PASTE_DROP_TAGS.has( tag ) ) {
		el.remove();
		return;
	}

	// Recurse first so children are already cleaned before we unwrap.
	sanitizePasteFragment( el );

	const id = el.getAttribute( 'id' );
	if ( id && id.startsWith( 'docs-internal-guid' ) ) {
		el.replaceWith( ...el.childNodes );
		return;
	}

	if ( ! PASTE_ALLOWED_TAGS.has( tag ) ) {
		el.replaceWith( ...el.childNodes );
		return;
	}

	for ( const attr of Array.from( el.attributes ) ) {
		if ( tag === 'A' && attr.name === 'href' && isSafePasteHref( attr.value ) ) continue;
		el.removeAttribute( attr.name );
	}
}

/**
 * Whether `href` is safe to preserve on a pasted link. Allows http(s),
 * mailto, tel, and same-document/relative URLs; everything else (notably
 * `javascript:`, `vbscript:`, and `data:`) is rejected so a pasted link
 * can't smuggle script execution past the sanitizer.
 *
 * @param {string} href - The href value to check.
 * @return {boolean} True when the href is safe to keep.
 */
function isSafePasteHref( href ) {
	if ( ! href ) return false;
	const trimmed = href.trim();
	if ( ! trimmed ) return false;
	// Relative / same-document / query / fragment URLs have no scheme.
	if ( /^[#/?]/.test( trimmed ) || trimmed.startsWith( './' ) || trimmed.startsWith( '../' ) ) {
		return true;
	}
	return /^(https?:|mailto:|tel:)/i.test( trimmed );
}

/**
 * Convert contentEditable HTML into WordPress block markup.
 *
 * @param {string} html - The innerHTML from the contenteditable area.
 * @return {string} Serialized Gutenberg block markup.
 */
function convertToBlocks( html ) {
	const tmp = document.createElement( 'div' );
	tmp.innerHTML = html;

	// Normalize color markup before serialization.
	normalizeColorMarkup( tmp );

	// Normalize inline formatting tags (<b>/<i>/<u>/<strike>) to the tags
	// Gutenberg's rich text system expects.
	normalizeFormattingTags( tmp );

	const blocks = [];

	for ( const node of tmp.childNodes ) {
		if ( node.nodeType === Node.TEXT_NODE ) {
			const text = node.textContent.trim();
			if ( text ) {
				blocks.push( `<!-- wp:paragraph -->\n<p>${ text }</p>\n<!-- /wp:paragraph -->` );
			}
			continue;
		}

		if ( node.nodeType !== Node.ELEMENT_NODE ) continue;

		const tag = node.tagName.toLowerCase();
		// Strip lone <br> placeholders left by contentEditable so empty
		// blocks are not serialized with stale markup.
		const inner = node.innerHTML.trim().replace( /^<br\s*\/?>$/, '' );

		if (
			! inner &&
			! [ 'figure', 'img', 'hr', 'blockquote', 'ul', 'ol' ].includes( tag ) &&
			! /^h[1-6]$/.test( tag )
		)
			continue;

		// Check for text alignment. Justify is paragraph-only — headings and
		// quotes stay L/C/R because browser justification on display type and
		// narrow quote columns produces large word-spacing gaps.
		// Justify uses the canonical wpcom form (className + style.typography.textAlign);
		// L/C/R uses the legacy `align` attribute + inline style.
		const align = node.style && node.style.textAlign;
		const isLcrAlign = align && [ 'left', 'center', 'right' ].includes( align );
		const isJustify = align === 'justify';
		const isHeadingAlign = isLcrAlign;
		let paragraphAlignJson = '';
		let paragraphStyleAttr = '';
		let paragraphClassAttr = '';
		if ( isLcrAlign ) {
			paragraphAlignJson = `,"align":"${ align }"`;
			paragraphStyleAttr = ` style="text-align:${ align }"`;
		} else if ( isJustify ) {
			paragraphAlignJson =
				',"align":"justify","className":"has-text-align-justify","style":{"typography":{"textAlign":"justify"}}';
			paragraphClassAttr = ' class="has-text-align-justify"';
			// Inline style fallback for consumers that don't ship the
			// .has-text-align-justify rule (theme exports, RSS, etc.).
			paragraphStyleAttr = ' style="text-align:justify"';
		}
		const headingAlignAttr = isHeadingAlign ? ` style="text-align:${ align }"` : '';
		const headingAlignJson = isHeadingAlign ? `,"align":"${ align }"` : '';

		if ( tag === 'p' || tag === 'div' ) {
			blocks.push(
				`<!-- wp:paragraph${
					paragraphAlignJson ? ` {${ paragraphAlignJson.slice( 1 ) }}` : ''
				} -->\n<p${ paragraphClassAttr }${ paragraphStyleAttr }>${ inner }</p>\n<!-- /wp:paragraph -->`
			);
		} else if ( /^h[1-6]$/.test( tag ) ) {
			const level = parseInt( tag.charAt( 1 ), 10 );
			blocks.push(
				`<!-- wp:heading {"level":${ level }${ headingAlignJson }} -->\n<${ tag } class="wp-block-heading"${ headingAlignAttr }>${ inner }</${ tag }>\n<!-- /wp:heading -->`
			);
		} else if ( tag === 'figure' && node.querySelector( 'iframe' ) ) {
			const iframe = node.querySelector( 'iframe' );
			const src = iframe.getAttribute( 'src' ) || '';
			// Convert embed URL back to watch URL for wp:embed.
			let originalUrl = src;
			let provider = 'youtube';
			const ytMatch = src.match( /youtube\.com\/embed\/([a-zA-Z0-9_-]+)/ );
			if ( ytMatch ) originalUrl = 'https://www.youtube.com/watch?v=' + ytMatch[ 1 ];
			const vimeoMatch = src.match( /player\.vimeo\.com\/video\/(\d+)/ );
			if ( vimeoMatch ) {
				originalUrl = 'https://vimeo.com/' + vimeoMatch[ 1 ];
				provider = 'vimeo';
			}
			blocks.push(
				`<!-- wp:embed {"url":"${ originalUrl }","type":"video","providerNameSlug":"${ provider }","responsive":true} -->\n<figure class="wp-block-embed is-type-video is-provider-${ provider } wp-block-embed-${ provider }"><div class="wp-block-embed__wrapper">\n${ originalUrl }\n</div></figure>\n<!-- /wp:embed -->`
			);
		} else if ( tag === 'figure' && node.querySelector( 'img' ) ) {
			const img = node.querySelector( 'img' );
			const src = img.getAttribute( 'src' ) || '';
			const alt = img.getAttribute( 'alt' ) || '';
			const figcaption = node.querySelector( 'figcaption' );
			const captionHtml = figcaption
				? `<figcaption class="wp-element-caption">${ figcaption.innerHTML }</figcaption>`
				: '';

			// Read figure size + alignment classes plus the `wp-image-<id>`
			// class for the media-library attachment ID.  These map to core
			// wp:image attributes so the published markup matches what the
			// block editor would emit, and the block editor can re-open
			// these images without surprises.
			const imageSizeSlug = IMAGE_SIZE_SLUGS.find( s => node.classList.contains( 'size-' + s ) );
			// Always emit an explicit align attr + class.  Without aligncenter
			// many themes don't center the figure in the published view, and
			// the block editor reads "no align" as "default" (which renders
			// differently from explicit center).  Match the block editor's
			// convention so the published post centers reliably.
			let imageAlign = 'center';
			if ( node.classList.contains( 'alignleft' ) ) {
				imageAlign = 'left';
			} else if ( node.classList.contains( 'alignright' ) ) {
				imageAlign = 'right';
			}
			const mediaId = getMediaIdFromImg( img );

			const imageAttrs = [];
			if ( mediaId ) imageAttrs.push( `"id":${ mediaId }` );
			if ( imageSizeSlug ) imageAttrs.push( `"sizeSlug":"${ imageSizeSlug }"` );
			imageAttrs.push( `"align":"${ imageAlign }"` );
			const imageAttrsJson = imageAttrs.length ? ` {${ imageAttrs.join( ',' ) }}` : '';

			const figureClasses = [ 'wp-block-image' ];
			if ( imageSizeSlug ) figureClasses.push( 'size-' + imageSizeSlug );
			figureClasses.push( 'align' + imageAlign );

			const imgClassAttr = mediaId ? ` class="wp-image-${ mediaId }"` : '';

			// Preserve the img's width/height attrs so the browser knows the
			// intrinsic size in the published view.  Without them, themes
			// that don't constrain `.size-thumbnail` etc. let the img stretch
			// to fill its container — even when the URL points at a
			// 150x150 resized file.  applyMediaSizeToFigure sets these on
			// every media-library size swap; we just need to keep them.
			const imgWidth = img.getAttribute( 'width' );
			const imgHeight = img.getAttribute( 'height' );
			const imgWidthAttr = imgWidth ? ` width="${ escapeAttr( imgWidth ) }"` : '';
			const imgHeightAttr = imgHeight ? ` height="${ escapeAttr( imgHeight ) }"` : '';

			blocks.push(
				`<!-- wp:image${ imageAttrsJson } -->\n<figure class="${ figureClasses.join(
					' '
				) }"><img src="${ escapeAttr( src ) }" alt="${ escapeAttr(
					alt
				) }"${ imgClassAttr }${ imgWidthAttr }${ imgHeightAttr }/>${ captionHtml }</figure>\n<!-- /wp:image -->`
			);
		} else if ( tag === 'blockquote' ) {
			// Extract citation from <cite> if present.
			// Strip lone <br> tags that contentEditable inserts into empty elements.
			const citeEl = node.querySelector( 'cite' );
			const citationHtml = citeEl ? citeEl.innerHTML.trim().replace( /^<br\s*\/?>$/, '' ) : '';

			// Remove <cite> and any trailing <br> from the DOM so they don't
			// end up inside the serialized <p> tags.
			if ( citeEl ) {
				citeEl.remove();
			}
			// Strip trailing <br> elements left between quote text and removed <cite>.
			while (
				node.lastChild &&
				node.lastChild.nodeType === Node.ELEMENT_NODE &&
				node.lastChild.tagName === 'BR'
			) {
				node.lastChild.remove();
			}
			const bodyInner = node.innerHTML.trim().replace( /^<br\s*\/?>$/, '' );
			const quoteInner = bodyInner.startsWith( '<p' ) ? bodyInner : `<p>${ bodyInner }</p>`;

			const hasQuoteAlign = align && [ 'center', 'right' ].includes( align );
			const quoteAlignAttr = hasQuoteAlign ? ` style="text-align:${ align }"` : '';

			// Build JSON attrs.
			const attrs = {};
			if ( hasQuoteAlign ) {
				attrs.align = align;
			}
			if ( citationHtml ) {
				attrs.citation = citationHtml;
			}
			// Escape characters that WordPress core escapes inside block
			// comment attributes (see serializeAttributes in @wordpress/blocks).
			const jsonAttr = Object.keys( attrs ).length
				? ' ' +
				  JSON.stringify( attrs )
						.replaceAll( '\\\\', '\\u005c' )
						.replaceAll( '--', '\\u002d\\u002d' )
						.replaceAll( '<', '\\u003c' )
						.replaceAll( '>', '\\u003e' )
						.replaceAll( '&', '\\u0026' )
						.replaceAll( '\\"', '\\u0022' )
				: '';

			const citeHtml = citationHtml ? `<cite>${ citationHtml }</cite>` : '';

			blocks.push(
				`<!-- wp:quote${ jsonAttr } -->\n<blockquote class="wp-block-quote"${ quoteAlignAttr }>${ quoteInner }${ citeHtml }</blockquote>\n<!-- /wp:quote -->`
			);
		} else if ( tag === 'ul' || tag === 'ol' ) {
			// Wrap each <li> in wp:list-item block comments.
			const liNodes = Array.from( node.querySelectorAll( ':scope > li' ) );
			const listItems = liNodes.length
				? liNodes
						.map(
							li =>
								`<!-- wp:list-item -->\n<li>${ li.innerHTML.trim() }</li>\n<!-- /wp:list-item -->`
						)
						.join( '\n' )
				: '<!-- wp:list-item -->\n<li></li>\n<!-- /wp:list-item -->';
			const listTag = tag === 'ol' ? 'ol' : 'ul';
			const attrs = tag === 'ol' ? ' {"ordered":true}' : '';
			blocks.push(
				`<!-- wp:list${ attrs } -->\n<${ listTag } class="wp-block-list">${ listItems }</${ listTag }>\n<!-- /wp:list -->`
			);
		} else if ( tag === 'hr' ) {
			blocks.push(
				'<!-- wp:separator -->\n<hr class="wp-block-separator has-alpha-channel-opacity"/>\n<!-- /wp:separator -->'
			);
		} else {
			// Fallback: wrap in paragraph.
			blocks.push( `<!-- wp:paragraph -->\n<p>${ inner }</p>\n<!-- /wp:paragraph -->` );
		}
	}

	return blocks.join( '\n\n' );
}

/**
 * Position the slash command menu below the current cursor.
 */
function positionSlashMenu() {
	const sel = window.getSelection();
	if ( ! sel.rangeCount ) return;

	const menu = document.querySelector( '.bw-slash-menu' );
	if ( ! menu ) return;

	const range = sel.getRangeAt( 0 );
	const rect = range.getBoundingClientRect();
	const menuWidth = menu.offsetWidth;
	let left = rect.left;
	left = Math.max( 8, Math.min( left, window.innerWidth - menuWidth - 8 ) );
	const top = rect.bottom + 8 + window.scrollY;

	menu.style.position = 'absolute';
	menu.style.left = left + 'px';
	menu.style.top = top + 'px';
}

/**
 * Mark the slash menu as keyboard-navigated to suppress hover highlights,
 * then restore hover behaviour on the next mousemove.
 */
function enterKeyboardNav() {
	const menu = document.querySelector( '.bw-slash-menu' );
	if ( ! menu ) return;
	menu.classList.add( 'bw-slash-menu--keyboard' );
	if ( ! keyboardNavListenerActive ) {
		keyboardNavListenerActive = true;
		menu.addEventListener(
			'mousemove',
			() => {
				keyboardNavListenerActive = false;
				menu.classList.remove( 'bw-slash-menu--keyboard' );
				clearSlashActive();
			},
			{ once: true }
		);
	}
}

/**
 * Set the active slash menu item, updating aria-selected and aria-activedescendant.
 *
 * Clears aria-selected on every item, then marks the given item as selected and
 * updates state.slashActiveId so the content area's aria-activedescendant reflects
 * the highlighted option for screen readers.
 *
 * @param {Element|null} item - The slash menu item to activate, or null to clear.
 */
function setSlashActiveItem( item ) {
	document.querySelectorAll( '.bw-slash-item' ).forEach( el => {
		el.setAttribute( 'aria-selected', 'false' );
		el.classList.remove( 'bw-slash-item-active' );
	} );
	if ( item ) {
		item.setAttribute( 'aria-selected', 'true' );
		item.classList.add( 'bw-slash-item-active' );
		state.slashActiveId = item.id || '';
	} else {
		state.slashActiveId = '';
	}
}

/**
 * Clear the slash menu active item and reset aria state.
 */
function clearSlashActive() {
	setSlashActiveItem( null );
}

/**
 * Remove the slash text from the current line before inserting a block.
 */
function clearSlashText() {
	const sel = window.getSelection();
	if ( ! sel.rangeCount ) return;

	const node = sel.anchorNode;
	if ( node && node.nodeType === Node.TEXT_NODE && node.textContent.trim().startsWith( '/' ) ) {
		// Replace the text with <br> so the parent <p> doesn't collapse
		// to zero height (an empty text node has no rendered height).
		const parent = node.parentNode;
		node.remove();
		if ( parent && parent.nodeType === Node.ELEMENT_NODE && ! parent.firstChild ) {
			parent.innerHTML = '<br>';
		}
	}
}

/**
 * Convert a YouTube/Vimeo URL to an embeddable URL.
 *
 * @param {string} url - The video URL to convert.
 * @return {string|null} The embeddable URL, or null if not recognized.
 */
function getEmbedUrl( url ) {
	// YouTube
	let match = url.match(
		/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/
	);
	if ( match ) return 'https://www.youtube.com/embed/' + match[ 1 ];

	// Vimeo
	match = url.match( /vimeo\.com\/(\d+)/ );
	if ( match ) return 'https://player.vimeo.com/video/' + match[ 1 ];

	return null;
}

/**
 * Place the cursor at the start of a DOM element.
 *
 * @param {Element} el - The element to place the cursor in.
 */
function placeCursorAt( el ) {
	const range = document.createRange();
	range.setStart( el, 0 );
	range.collapse( true );
	const sel = window.getSelection();
	sel.removeAllRanges();
	sel.addRange( range );
}

/**
 * If the cursor is inside a list item, extract its content into a new
 * block-level element and remove the list item. If the list becomes
 * empty, remove the list too. Returns the new element so the caller
 * can place the cursor, or null if the cursor was not inside a list.
 *
 * @param {string} tag - The HTML tag for the replacement element (e.g. 'p', 'h2').
 * @return {Element|null} The newly created element, or null if not in a list.
 */
function exitListAndApplyBlock( tag ) {
	const sel = window.getSelection();
	if ( ! sel.rangeCount ) return null;

	// Walk up from the cursor to find a <li> inside a <ul>/<ol>.
	let li = null;
	let node = sel.anchorNode;
	while ( node && node !== document.body ) {
		if ( node.nodeType === Node.ELEMENT_NODE && node.tagName === 'LI' ) {
			li = node;
			break;
		}
		node = node.parentNode;
	}

	if ( ! li ) return null;

	const list = li.parentNode; // <ul> or <ol>
	const content = getContent();
	if ( ! list || ! content ) return null;

	const newEl = document.createElement( tag );
	newEl.innerHTML = li.innerHTML || '<br>';

	// Collect items before and after this <li> so we can split the list.
	const items = Array.from( list.children );
	const idx = items.indexOf( li );
	const before = items.slice( 0, idx );
	const after = items.slice( idx + 1 );

	if ( before.length > 0 && after.length > 0 ) {
		// Middle item: split the list into two with the new element between.
		const newList = document.createElement( list.tagName );
		after.forEach( item => newList.appendChild( item ) );
		list.after( newEl );
		newEl.after( newList );
	} else if ( after.length > 0 ) {
		// First item: insert new element before the list.
		list.before( newEl );
	} else {
		// Last (or only) item: insert new element after the list.
		list.after( newEl );
	}

	li.remove();
	if ( list.children.length === 0 ) {
		list.remove();
	}

	placeCursorAt( newEl );
	updateFormattingState();
	return newEl;
}

/**
 * If the cursor is inside a heading or blockquote, replace it with a
 * list containing the block's content as the first item. Returns true
 * if a conversion happened, false otherwise.
 *
 * @param {string} listTag - 'ul' or 'ol'.
 * @return {boolean} Whether a block was converted to a list.
 */
function exitBlockAndApplyList( listTag ) {
	const sel = window.getSelection();
	if ( ! sel.rangeCount ) return false;

	let block = null;
	let node = sel.anchorNode;
	const content = getContent();
	while ( node && node !== content && node !== document.body ) {
		if (
			node.nodeType === Node.ELEMENT_NODE &&
			( /^H[1-6]$/.test( node.tagName ) || node.tagName === 'BLOCKQUOTE' )
		) {
			block = node;
			break;
		}
		node = node.parentNode;
	}

	if ( ! block ) return false;

	const list = document.createElement( listTag );
	const li = document.createElement( 'li' );
	li.innerHTML = block.innerHTML || '<br>';
	list.appendChild( li );

	block.replaceWith( list );

	placeCursorAt( li );
	state.formatHeading = false;
	state.formatQuote = false;
	state.headingLabel = i18n.normal || 'Normal';
	updateFormattingState();
	return true;
}

/**
 * If the cursor is inside a list whose tag differs from `listTag`, replace
 * the parent <ul>/<ol> with the requested tag while keeping every <li> in
 * place. Avoids the browser's `execCommand('insert*List')` behavior, which
 * pulls only the current <li> out into a new list and leaves siblings behind.
 *
 * @param {string} listTag - 'ul' or 'ol'.
 * @return {boolean} Whether the parent list's tag was changed.
 */
function changeListTagAtCursor( listTag ) {
	const sel = window.getSelection();
	if ( ! sel.rangeCount ) return false;

	const content = getContent();
	let node = sel.anchorNode;
	let li = null;
	while ( node && node !== content && ! node.classList?.contains( 'bw-content' ) ) {
		if ( node.nodeType === Node.ELEMENT_NODE && node.tagName === 'LI' ) {
			li = node;
			break;
		}
		node = node.parentNode;
	}
	if ( ! li ) return false;

	const list = li.parentNode;
	if ( ! list || ! /^(UL|OL)$/i.test( list.tagName ) ) return false;
	if ( list.tagName.toLowerCase() === listTag.toLowerCase() ) return false;

	const range = sel.getRangeAt( 0 );
	const startContainer = range.startContainer;
	const startOffset = range.startOffset;
	const endContainer = range.endContainer;
	const endOffset = range.endOffset;

	const newList = document.createElement( listTag );
	while ( list.firstChild ) {
		newList.appendChild( list.firstChild );
	}
	list.replaceWith( newList );

	try {
		const newRange = document.createRange();
		newRange.setStart( startContainer, startOffset );
		newRange.setEnd( endContainer, endOffset );
		sel.removeAllRanges();
		sel.addRange( newRange );
	} catch {
		placeCursorAt( li );
	}
	return true;
}

/**
 * Indent or outdent a list item by nesting/unnesting it in a sub-list.
 *
 * Indent: moves the <li> into a new sub-list appended to the previous sibling <li>.
 * Outdent: moves the <li> out of its nested list back into the parent list.
 *
 * @param {Element} li        - The list item to indent/outdent.
 * @param {string}  direction - 'indent' or 'outdent'.
 */
function indentListItem( li, direction ) {
	const list = li.parentNode;
	if ( ! list || ! /^(UL|OL)$/i.test( list.tagName ) ) return;

	if ( direction === 'indent' ) {
		// Can only indent if there's a previous sibling to nest under.
		const prev = li.previousElementSibling;
		if ( ! prev || prev.tagName !== 'LI' ) return;

		// Look for an existing sub-list inside the previous <li>, or create one.
		let subList = prev.querySelector( ':scope > ul, :scope > ol' );
		if ( ! subList ) {
			subList = document.createElement( list.tagName );
			prev.appendChild( subList );
		}
		subList.appendChild( li );
	} else {
		// Outdent: the list must be nested inside another <li>.
		const parentLi = list.parentNode;
		if ( ! parentLi || parentLi.tagName !== 'LI' ) return;

		const parentList = parentLi.parentNode;
		if ( ! parentList ) return;

		// Move any siblings after this <li> into a new sub-list kept inside the current list.
		const siblingsAfter = [];
		let next = li.nextElementSibling;
		while ( next ) {
			siblingsAfter.push( next );
			next = next.nextElementSibling;
		}
		if ( siblingsAfter.length > 0 ) {
			const tailList = document.createElement( list.tagName );
			siblingsAfter.forEach( s => tailList.appendChild( s ) );
			li.appendChild( tailList );
		}

		// Insert the <li> after its parent <li> in the outer list.
		parentLi.after( li );

		// Clean up empty lists.
		if ( list.children.length === 0 ) {
			list.remove();
		}
	}

	placeCursorAt( li );
}

/**
 * Place the cursor at the end of a DOM element's content.
 *
 * @param {Element} el - The element to place the cursor in.
 */
function placeCursorAtEnd( el ) {
	const range = document.createRange();
	range.selectNodeContents( el );
	range.collapse( false );
	const sel = window.getSelection();
	sel.removeAllRanges();
	sel.addRange( range );
}

/**
 * Animate a figure element out and remove it from the DOM.
 * After removal, repairs block structure and places the cursor.
 *
 * @param {Element} fig - The figure element to delete.
 */
function animateAndDeleteFigure( fig ) {
	// If the edit panel is open for this figure, close it first — the
	// figure is about to disappear and the panel's target is gone.
	if ( editingFigure === fig ) {
		const { actions } = store( 'wpcom-write' );
		actions.closeImageModal();
	}
	// Mark as deleting so getFigureAdjacentToCursor skips it during
	// the animation delay (prevents rapid Backspace from re-selecting).
	fig.dataset.bwDeleting = '';
	const next = fig.nextElementSibling;
	const prev = fig.previousElementSibling;
	fig.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
	fig.style.opacity = '0';
	fig.style.transform = 'scale(0.95)';
	setTimeout( () => {
		fig.remove();
		ensureBlockStructure();
		placeCursorAfterFigureDelete( next, prev );
		pushToUndoHistory();
	}, 200 );
}

/**
 * Place the cursor in the nearest text-editable block after a figure
 * has been removed from the DOM.
 *
 * @param {Element|null} next - The element that was the figure's nextElementSibling before removal.
 * @param {Element|null} prev - The element that was the figure's previousElementSibling before removal.
 */
function placeCursorAfterFigureDelete( next, prev ) {
	const c = getContent();
	if ( ! c ) return;

	const isDirectChild = el => el && el.parentNode === c;
	const safeNext = isDirectChild( next ) ? next : null;
	const safePrev = isDirectChild( prev ) ? prev : null;
	// Prefer the block before the deleted figure so the cursor lands
	// directly adjacent to any remaining figure — this lets the two-step
	// Backspace handler detect it on the very next keypress.
	let dest = null;
	let atEnd = false;

	if ( safePrev && EDITABLE_BLOCK_TAGS.test( safePrev.tagName ) ) {
		dest = safePrev;
		atEnd = true;
	} else if ( safeNext && EDITABLE_BLOCK_TAGS.test( safeNext.tagName ) ) {
		dest = safeNext;
	}

	// No editable sibling — walk outward from the
	// deletion point to find the nearest editable block.
	if ( ! dest ) {
		let after = safeNext;
		let before = safePrev;
		while ( after || before ) {
			if ( after && EDITABLE_BLOCK_TAGS.test( after.tagName ) ) {
				dest = after;
				break;
			}
			if ( before && EDITABLE_BLOCK_TAGS.test( before.tagName ) ) {
				dest = before;
				atEnd = true;
				break;
			}
			after = after ? after.nextElementSibling : null;
			before = before ? before.previousElementSibling : null;
		}
	}

	if ( ! dest ) {
		if ( safeNext || safePrev ) {
			const p = document.createElement( 'p' );
			p.innerHTML = '<br>';
			( safePrev || safeNext ).after( p );
			dest = p;
		} else {
			dest = c.firstElementChild;
		}
	}

	if ( dest ) {
		if ( atEnd ) {
			placeCursorAtEnd( dest );
		} else {
			placeCursorAt( dest );
		}
	}
}

/**
 * Add delete buttons to image/video figures in the content area.
 */
function addDeleteButtons() {
	const content = getContent();
	if ( ! content ) return;

	content.querySelectorAll( 'figure, .bw-image-figure, .bw-video-figure' ).forEach( fig => {
		if ( fig.querySelector( '.bw-img-delete' ) ) return;

		// Prevent native contentEditable from modifying figure internals.
		fig.contentEditable = 'false';

		// Wrap img in a positioning container so buttons stay anchored to the image.
		const img = fig.querySelector( 'img' );
		if ( img && ! img.parentElement.classList.contains( 'bw-img-controls' ) ) {
			const wrapper = document.createElement( 'div' );
			wrapper.className = 'bw-img-controls';
			img.before( wrapper );
			wrapper.appendChild( img );
		}
		const controls = fig.querySelector( '.bw-img-controls' ) || fig;

		// Delete button.
		const btn = document.createElement( 'button' );
		btn.className = 'bw-img-delete';
		btn.innerHTML = '&times;';
		btn.contentEditable = 'false';
		btn.addEventListener( 'click', e => {
			e.preventDefault();
			e.stopPropagation();
			clearFigureSelection();
			animateAndDeleteFigure( fig );
		} );
		controls.appendChild( btn );

		// Skip the rest (caption, edit) for non-image figures — videos use
		// only the delete control.
		const imgEl = controls.querySelector( 'img' );
		if ( ! imgEl ) return;

		// Captions saved by the editor come back from the server with class
		// `wp-element-caption` and no `contentEditable`, so without this any
		// reloaded caption would be uneditable and left-aligned (missing the
		// `bw-figcaption` style).
		const existingFigcaption = fig.querySelector( 'figcaption' );
		if ( existingFigcaption ) {
			existingFigcaption.classList.add( 'bw-figcaption' );
			existingFigcaption.contentEditable = 'true';
			existingFigcaption.setAttribute(
				'data-placeholder',
				i18n.writeCaption || 'Write a caption...'
			);
			existingFigcaption.addEventListener( 'click', ev => ev.stopPropagation() );
		}

		// Caption button.
		const capBtn = document.createElement( 'button' );
		capBtn.className = 'bw-img-caption-btn';
		capBtn.textContent = i18n.caption || 'Caption';
		capBtn.contentEditable = 'false';
		capBtn.addEventListener( 'click', e => {
			e.preventDefault();
			e.stopPropagation();

			let figcaption = fig.querySelector( 'figcaption' );
			if ( figcaption ) {
				figcaption.focus();
				return;
			}

			figcaption = document.createElement( 'figcaption' );
			figcaption.className = 'bw-figcaption';
			figcaption.contentEditable = 'true';
			figcaption.setAttribute( 'data-placeholder', i18n.writeCaption || 'Write a caption...' );
			figcaption.addEventListener( 'click', ev => ev.stopPropagation() );
			fig.appendChild( figcaption );
			figcaption.focus();
		} );
		controls.appendChild( capBtn );

		// Edit button — opens the image properties modal (alt, size, align,
		// featured). Anchored to the bottom-right so it doesn't stack
		// horizontally with the Caption button on narrow (Thumbnail / Medium)
		// images (RSM-3980).
		const editBtn = document.createElement( 'button' );
		editBtn.className = 'bw-img-edit';
		editBtn.innerHTML = '<span class="dashicons dashicons-edit" aria-hidden="true"></span>';
		editBtn.contentEditable = 'false';
		editBtn.setAttribute( 'aria-label', i18n.editImage || 'Edit image' );
		editBtn.setAttribute( 'title', i18n.editImage || 'Edit image' );
		editBtn.addEventListener( 'click', e => {
			e.preventDefault();
			e.stopPropagation();
			const { actions } = store( 'wpcom-write' );
			actions.editImage( fig, e.currentTarget );
		} );
		controls.appendChild( editBtn );

		// Enter inside the figcaption exits to the next block. Attached on every
		// figure init (not just on first caption-button click) so it survives an
		// undo that restored a figure with a pre-existing figcaption — the
		// MutationObserver re-runs addDeleteButtons, and the early-return at the
		// top of this loop keeps the listener from being attached twice.
		fig.addEventListener( 'keydown', ev => {
			const figcaption = fig.querySelector( 'figcaption' );
			if (
				ev.key === 'Enter' &&
				figcaption &&
				figcaption.contains( document.getSelection().anchorNode )
			) {
				ev.preventDefault();
				ev.stopImmediatePropagation();
				let next = fig.nextElementSibling;
				if ( ! next || next.tagName === 'FIGURE' ) {
					next = document.createElement( 'p' );
					next.innerHTML = '<br>';
					fig.after( next );
				}
				placeCursorAt( next );
			}
		} );
	} );
}

// Tell the browser to use <p> tags for new paragraphs in contentEditable.
document.execCommand( 'defaultParagraphSeparator', false, 'p' );

// Seed the content area with an empty <p> so the cursor starts inside a paragraph.
// This ensures Enter creates proper <p> tags from the very first line.
const contentReady2 = setInterval( () => {
	const contentEl = getContent();
	if ( ! contentEl ) return;
	clearInterval( contentReady2 ); // cleared before init runs, so the block below executes exactly once

	if ( ! contentEl.innerHTML.trim() ) {
		contentEl.innerHTML = '<p><br></p>';
	}
	// When reopening a media-only post, the content may contain only
	// non-editable blocks (e.g. figures) with no editable paragraphs.
	// Run the block-structure audit immediately so gap paragraphs are
	// inserted and the user can start editing right away.
	ensureBlockStructure();

	// Wire up existing <cite> elements in blockquotes with the placeholder
	// attribute so the CSS placeholder appears if the user clears the text.
	contentEl.querySelectorAll( 'blockquote cite' ).forEach( cite => {
		if ( ! cite.hasAttribute( 'data-placeholder' ) ) {
			cite.setAttribute( 'data-placeholder', i18n.addCitation || 'Add citation\u2026' );
		}
		if ( ! cite.hasAttribute( 'aria-label' ) ) {
			cite.setAttribute( 'aria-label', i18n.citation || 'Citation' );
		}
	} );

	if ( ! contentEl.textContent.trim() && ! contentEl.querySelector( 'img, video, figure' ) ) {
		// bw-is-empty drives the CSS ::before placeholder on the outer .bw-content.
		// Input events from the inner contenteditable bubble up to the outer,
		// so a single listener on the outer is enough to detect the first edit.
		const outerContentEl = document.querySelector( '.bw-content' );
		outerContentEl?.classList.add( 'bw-is-empty' );
		outerContentEl?.addEventListener(
			'input',
			() => outerContentEl.classList.remove( 'bw-is-empty' ),
			{ once: true }
		);
	}
}, 200 );

// Watch for new figures being added, and set up paste-to-link.
if ( typeof MutationObserver !== 'undefined' ) {
	const contentReady = setInterval( () => {
		const content = getContent();
		if ( ! content ) return;
		clearInterval( contentReady );
		addDeleteButtons();
		new MutationObserver( addDeleteButtons ).observe( content, { childList: true, subtree: true } );

		content.addEventListener( 'paste', event => {
			const sel = window.getSelection();
			if ( ! sel.rangeCount ) return;

			// Highlight text + paste URL → create a link. Only fires when
			// something is selected; with a collapsed cursor a pasted URL
			// should land as plain link text via the sanitizer path below.
			if ( ! sel.isCollapsed ) {
				const pastedText = event.clipboardData.getData( 'text/plain' );
				if ( pastedText && /^https?:\/\/\S+$/i.test( pastedText.trim() ) ) {
					event.preventDefault();
					document.execCommand( 'createLink', false, pastedText.trim() );
					return;
				}
			}

			// Strip source typography (font-size, font-family, color, etc.)
			// from rich-text pastes so they inherit the editor's styling.
			// Plain-text pastes have no text/html payload — fall through to
			// the browser default, which inserts a clean text node.
			const html = event.clipboardData.getData( 'text/html' );
			if ( ! html ) return;

			const tmp = document.createElement( 'div' );
			// Element.setHTML is the native HTML Sanitizer API and the only
			// HTML parsing path for pasted markup. The browser's safety
			// baseline drops <script>, dangerous attributes (onerror,
			// onclick, etc.), and javascript: URLs before any of it reaches
			// the live DOM. We allow style/id/href through so the custom
			// pass below can read inline styles (to promote bold/italic to
			// semantic tags), unwrap Google Docs' docs-internal-guid
			// wrapper, and validate href schemes against a tighter
			// allowlist than the Sanitizer baseline.
			//
			// Browsers without setHTML (older Chromium/Brave, pre-137 Firefox,
			// pre-18.4 Safari) fall back to inserting the clipboard's
			// text/plain representation. That loses formatting but guarantees
			// no source typography or markup leaks in — and execCommand
			// 'insertText' isn't an HTML sink, so we don't reintroduce the
			// CodeQL js/xss flow we eliminated above.
			if ( typeof tmp.setHTML !== 'function' ) {
				const text = event.clipboardData.getData( 'text/plain' );
				if ( ! text ) return;
				event.preventDefault();
				document.execCommand( 'insertText', false, text );
				return;
			}

			event.preventDefault();
			tmp.setHTML( html, { sanitizer: { attributes: [ 'style', 'id', 'href' ] } } );
			promotePasteFormatting( tmp );
			sanitizePasteFragment( tmp );

			// execCommand('insertHTML') handles caret-aware block-level
			// splitting (e.g. pasting a <p> inside an existing <p> correctly
			// splits the paragraph) — manual Range.insertNode produces
			// invalid nested-block markup.
			document.execCommand( 'insertHTML', false, tmp.innerHTML );
		} );
	}, 200 );
}

/**
 * Reset the image modal's URL and alt text inputs to empty.
 *
 * Reactive state alone may not update the displayed value of inputs the user
 * has interacted with, so we reset the .value property explicitly.
 */
function resetImageModalInputs() {
	const modal = document.querySelector( '.bw-image-overlay .bw-image-modal' );
	if ( ! modal ) return;
	const urlInput = modal.querySelector( 'input[type="url"]' );
	if ( urlInput ) urlInput.value = '';
	const altInput = modal.querySelector( 'input[type="text"]' );
	if ( altInput ) altInput.value = '';
}

/**
 * Reset the image upload zone to its default state.
 */
function resetUploadZone() {
	const zone = document.getElementById( 'bw-upload-zone' );
	if ( ! zone ) return;
	// Remove any existing preview.
	const old = zone.querySelector( '.bw-upload-preview' );
	if ( old ) old.remove();
	// Reset classes.
	zone.classList.remove( 'bw-upload-has-preview', 'bw-uploading' );
	// Show label, hide saving.
	const label = zone.querySelector( '.bw-upload-label' );
	if ( label ) label.style.display = '';
	const saving = zone.querySelector( '.bw-upload-saving' );
	if ( saving ) saving.style.display = 'none';
	// Clear file input.
	const input = zone.querySelector( 'input[type="file"]' );
	if ( input ) input.value = '';
}

/**
 * POST a file to the media REST endpoint. Returns the media response.
 * No side effects on state or DOM — callers handle the result.
 *
 * @param {File} file - The file to upload.
 * @return {Promise<Object>} The media library response.
 */
async function uploadMedia( file ) {
	const formData = new FormData();
	formData.append( 'file', file );
	return await window.wp.apiFetch( {
		path: state.mediaPath,
		method: 'POST',
		body: formData,
	} );
}

/**
 * Upload a file to the media library and update state with the result.
 *
 * @param {File} file - The file to upload.
 */
async function uploadFileToMedia( file ) {
	const zone = document.getElementById( 'bw-upload-zone' );

	state.isUploading = true;
	if ( zone ) {
		zone.classList.add( 'bw-uploading' );
		const label = zone.querySelector( '.bw-upload-label' );
		if ( label ) label.style.display = 'none';
		const saving = zone.querySelector( '.bw-upload-saving' );
		if ( saving ) saving.style.display = '';
	}

	try {
		const media = await uploadMedia( file );
		state.isUploading = false;
		if ( zone ) zone.classList.remove( 'bw-uploading' );

		// Store the uploaded URL and media ID — wait for "Insert image" click.
		state.imageUrl = media.source_url;
		if ( ! state.imageAlt && media.alt_text ) {
			state.imageAlt = media.alt_text;
		}
		if ( state.setAsFeatured ) {
			state.featuredMediaId = media.id;
		}
		state.uploadedMediaId = media.id;
		// Prime the cache so insertImageFromUrl can use it without a
		// second REST roundtrip.
		mediaSizesCache.set( media.id, media.media_details?.sizes || null );

		// Show preview and re-focus the modal so Escape still works.
		showUploadPreview( media.source_url );
		focusModalInput();
	} catch ( err ) {
		state.isUploading = false;
		if ( zone ) zone.classList.remove( 'bw-uploading' );
		state.message = ( i18n.uploadFailed || 'Upload failed: %s' ).replace( '%s', err.message );
		setTimeout( () => {
			state.message = '';
		}, 3000 );
	}
}

// Media library browser state. Kept in module scope so list rendering can
// look up the chosen media item by id when a thumbnail is clicked, without
// re-fetching. Refreshed on every modal open so newly-uploaded images appear.
// The strip is a single horizontally-scrolling row; we fetch one page and
// rely on search for older items rather than offering Load more.
let libraryItems = [];
let librarySearchTimer = 0;
let libraryFetchToken = 0;
const LIBRARY_PER_PAGE = 24;

/**
 * Pick the smallest reasonable thumbnail URL for the grid. Falls back to the
 * full-size source_url for images without registered sizes (e.g. uploads that
 * pre-date a media setting change).
 *
 * @param {object} media - Media item from /wp/v2/media.
 * @return {string} The thumbnail URL to render.
 */
function libraryThumbUrl( media ) {
	const sizes = media.media_details?.sizes;
	return sizes?.thumbnail?.source_url || sizes?.medium?.source_url || media.source_url || '';
}

/**
 * Render the library strip into #bw-library-grid. Always replaces — the strip
 * holds the most recent items (or current search results) only.  Thumbnails
 * are <button>s; the container has aria-label, so individual items use plain
 * `aria-label` with the media's alt or filename.
 */
function renderLibraryGrid() {
	const grid = document.getElementById( 'bw-library-grid' );
	if ( ! grid ) return;
	grid.textContent = '';

	for ( const item of libraryItems ) {
		const btn = document.createElement( 'button' );
		btn.type = 'button';
		btn.className = 'bw-library-thumb';
		btn.dataset.mediaId = String( item.id );
		const label = item.alt_text || item.title?.rendered || '';
		if ( label ) btn.setAttribute( 'aria-label', label );
		const img = document.createElement( 'img' );
		img.src = libraryThumbUrl( item );
		img.alt = '';
		img.loading = 'lazy';
		btn.appendChild( img );
		grid.appendChild( btn );
	}
}

/**
 * Fetch the most recent (or search-filtered) page of the user's media library
 * and render it as a single-row strip.
 *
 * Concurrent requests are coalesced via a monotonically increasing token —
 * only the most recent fetch's result is applied to state.
 */
async function fetchLibrary() {
	const strings = window.wpcomWriteStrings || {};
	const myToken = ++libraryFetchToken;
	const search = state.librarySearch.trim();

	state.libraryStatus = strings.libraryLoading || 'Loading…';

	try {
		const path =
			`${ state.mediaPath }?media_type=image&per_page=${ LIBRARY_PER_PAGE }` +
			`&orderby=date&order=desc` +
			( search ? `&search=${ encodeURIComponent( search ) }` : '' );
		const items = await window.wp.apiFetch( { path } );
		// A newer fetch superseded this one — drop the result silently.
		if ( myToken !== libraryFetchToken ) return;

		libraryItems = items;

		if ( libraryItems.length === 0 ) {
			state.libraryStatus = search
				? strings.libraryNoResults || 'No matching images.'
				: strings.libraryEmpty || 'No images in your library yet.';
		} else {
			state.libraryStatus = '';
		}

		renderLibraryGrid();
	} catch {
		if ( myToken !== libraryFetchToken ) return;
		state.libraryStatus = strings.libraryLoadFailed || "Couldn't load your library.";
	}
}

/**
 * Show a preview image in the upload zone.
 *
 * @param {string} src - The image source URL to preview.
 */
function showUploadPreview( src ) {
	const zone = document.getElementById( 'bw-upload-zone' );
	if ( ! zone ) return;
	// Remove old preview if any.
	const old = zone.querySelector( '.bw-upload-preview' );
	if ( old ) old.remove();
	// Hide label.
	const label = zone.querySelector( '.bw-upload-label' );
	if ( label ) label.style.display = 'none';
	const saving = zone.querySelector( '.bw-upload-saving' );
	if ( saving ) saving.style.display = 'none';
	// Create fresh img.
	const img = document.createElement( 'img' );
	img.className = 'bw-upload-preview';
	img.src = src;
	img.alt = i18n.preview || 'Preview';
	img.style.display = 'block';
	zone.classList.add( 'bw-upload-has-preview' );
	zone.classList.remove( 'bw-uploading' );
	zone.insertBefore( img, zone.firstChild );
}

/**
 * Insert a new empty block (h2, blockquote, etc.) replacing the slash command line.
 *
 * @param {string} tag - The HTML tag name for the new block (e.g. 'h2', 'blockquote').
 */
function insertNewBlock( tag ) {
	const content = getContent();
	if ( ! content ) return;

	const newEl = document.createElement( tag );
	newEl.innerHTML = '<br>';

	// Find the block containing the slash command by scanning direct children.
	// Include headings and blockquotes so slash commands work inside them.
	let slashBlock = null;
	for ( const child of content.children ) {
		if (
			/^(P|DIV|H[1-6]|BLOCKQUOTE)$/i.test( child.tagName ) &&
			/^\/\S*$/.test( child.textContent.trim() )
		) {
			slashBlock = child;
			break;
		}
	}

	if ( slashBlock ) {
		slashBlock.after( newEl );
		slashBlock.remove();
	} else {
		content.appendChild( newEl );
	}

	// Place cursor inside the new element.
	placeCursorAt( newEl );

	clearSlashActive();
	state.showSlashMenu = false;
}

/**
 * Insert a new list (ul or ol) replacing the slash command line,
 * with an initial empty list item for the cursor.
 *
 * @param {string} listTag - 'ul' or 'ol'.
 */
function insertNewList( listTag ) {
	const content = getContent();
	if ( ! content ) return;

	const list = document.createElement( listTag );
	const li = document.createElement( 'li' );
	li.innerHTML = '<br>';
	list.appendChild( li );

	// Find the block containing the slash command.
	// Include headings and blockquotes so slash commands work inside them.
	let slashBlock = null;
	for ( const child of content.children ) {
		if (
			/^(P|DIV|H[1-6]|BLOCKQUOTE)$/i.test( child.tagName ) &&
			/^\/\S*$/.test( child.textContent.trim() )
		) {
			slashBlock = child;
			break;
		}
	}

	if ( slashBlock ) {
		slashBlock.after( list );
		slashBlock.remove();
	} else {
		content.appendChild( list );
	}

	placeCursorAt( li );

	clearSlashActive();
	state.showSlashMenu = false;
	state.formatUList = listTag === 'ul';
	state.formatOList = listTag === 'ol';
	state.insideList = true;
}

/**
 * Detect a markdown list shortcut in a paragraph's text.
 *
 * Returns 'ul' for `-`, `*`, or `+`, 'ol' for `1.`, otherwise null. Captured
 * before the trigger space is inserted, so the marker should be the only
 * content — trailing whitespace is allowed to tolerate a stray <br>-only text
 * node that contentEditable can leave in an otherwise-empty block.
 *
 * @param {string} text - The paragraph's text content.
 * @return {'ul'|'ol'|null} The list tag to create, or null.
 */
function parseMarkdownListShortcut( text ) {
	if ( /^[-*+]\s*$/.test( text ) ) return 'ul';
	if ( /^1\.\s*$/.test( text ) ) return 'ol';
	return null;
}

/**
 * Replace a paragraph with a fresh list containing one empty item, and move the cursor into it.
 *
 * @param {HTMLElement} paragraph - The paragraph to convert.
 * @param {'ul'|'ol'}   listTag   - The list tag to create.
 */
function applyMarkdownListShortcut( paragraph, listTag ) {
	const list = document.createElement( listTag );
	const li = document.createElement( 'li' );
	li.innerHTML = '<br>';
	list.appendChild( li );
	paragraph.after( list );
	paragraph.remove();
	placeCursorAt( li );
	state.formatUList = listTag === 'ul';
	state.formatOList = listTag === 'ol';
	state.insideList = true;
}

/**
 * Detect a markdown blockquote shortcut in a paragraph's text.
 *
 * Returns true for a lone `>` marker. Captured before the trigger space is
 * inserted, so the marker should be the only content — trailing whitespace is
 * allowed to tolerate a stray <br>-only text node that contentEditable can
 * leave in an otherwise-empty block, matching parseMarkdownListShortcut.
 *
 * @param {string} text - The paragraph's text content.
 * @return {boolean} Whether the text is a blockquote shortcut.
 */
function parseMarkdownQuoteShortcut( text ) {
	return /^>\s*$/.test( text );
}

/**
 * Replace a paragraph with an empty blockquote, and move the cursor into it.
 *
 * Mirrors the slash-menu quote insert (insertNewBlock( 'blockquote' )): the
 * <cite> attribution placeholder is added by the citation lifecycle once the
 * cursor lands inside the blockquote.
 *
 * @param {HTMLElement} paragraph - The paragraph to convert.
 */
function applyMarkdownQuoteShortcut( paragraph ) {
	const blockquote = document.createElement( 'blockquote' );
	blockquote.innerHTML = '<br>';
	paragraph.after( blockquote );
	paragraph.remove();
	placeCursorAt( blockquote );
	state.formatQuote = true;
}

/**
 * Find the blockquote element containing the current cursor, if any.
 *
 * @return {HTMLElement|null} The blockquote element or null.
 */
function getActiveBlockquote() {
	const sel = window.getSelection();
	if ( ! sel.rangeCount ) return null;
	let node = sel.anchorNode;
	while ( node && ! node.classList?.contains( 'bw-content' ) ) {
		if ( node.nodeType === Node.ELEMENT_NODE && node.tagName === 'BLOCKQUOTE' ) {
			return node;
		}
		node = node.parentNode;
	}
	return null;
}

/**
 * Check if the current cursor is inside a <cite> element within a blockquote.
 *
 * @return {HTMLElement|null} The <cite> element, or null.
 */
function getActiveCite() {
	const sel = window.getSelection();
	if ( ! sel.rangeCount ) return null;
	let node = sel.anchorNode;
	while ( node && ! node.classList?.contains( 'bw-content' ) ) {
		if ( node.nodeType === Node.ELEMENT_NODE && node.tagName === 'CITE' ) {
			return node;
		}
		node = node.parentNode;
	}
	return null;
}

/**
 * Ensure a blockquote has a <cite> placeholder for attribution.
 *
 * @param {HTMLElement} blockquote - The blockquote to add the placeholder to.
 */
function ensureCitePlaceholder( blockquote ) {
	if ( blockquote.querySelector( 'cite' ) ) return;
	const cite = document.createElement( 'cite' );
	cite.setAttribute( 'data-placeholder', i18n.addCitation || 'Add citation\u2026' );
	cite.setAttribute( 'aria-label', i18n.citation || 'Citation' );
	blockquote.appendChild( cite );
}

/**
 * Remove an empty <cite> placeholder from a blockquote.
 *
 * @param {HTMLElement} blockquote - The blockquote to clean up.
 */
function removeEmptyCite( blockquote ) {
	const cite = blockquote.querySelector( 'cite' );
	if ( cite && ! cite.textContent.trim() ) {
		cite.remove();
	}
}

/**
 * Detect the current formatting state at the cursor position.
 * Updates all toolbar button states.
 */
function updateFormattingState() {
	state.formatBold = document.queryCommandState( 'bold' );
	state.formatItalic = document.queryCommandState( 'italic' );
	state.formatUnderline = document.queryCommandState( 'underline' );
	state.formatStrikethrough = document.queryCommandState( 'strikeThrough' );
	state.formatOList = document.queryCommandState( 'insertOrderedList' );
	state.formatUList = document.queryCommandState( 'insertUnorderedList' );
	state.insideList = state.formatOList || state.formatUList;

	// Check block-level formatting by walking up from cursor.
	const sel = window.getSelection();
	state.formatHeading = false;
	state.formatQuote = false;
	state.headingLabel = i18n.normal || 'Normal';
	state.formatAlignLeft = false;
	state.formatAlignCenter = false;
	state.formatAlignRight = false;
	state.formatAlignJustify = false;

	if ( sel.rangeCount ) {
		let node = sel.anchorNode;
		while ( node && node !== document.body ) {
			if ( node.nodeType === Node.ELEMENT_NODE ) {
				if ( node.tagName === 'H2' ) {
					state.formatHeading = true;
					state.headingLabel = i18n.heading2 || 'Heading 2';
				} else if ( node.tagName === 'H3' ) {
					state.formatHeading = true;
					state.headingLabel = i18n.heading3 || 'Heading 3';
				} else if ( /^H[1-6]$/.test( node.tagName ) ) {
					state.formatHeading = true;
				}
				if ( node.tagName === 'BLOCKQUOTE' ) {
					state.formatQuote = true;
				}
				// Detect alignment from the nearest block element. Only highlight
				// a button when alignment is explicitly set — empty textAlign
				// means "default", which is left in browsers but shouldn't show
				// any align button as active (matches block-editor behavior and
				// avoids misleading users when nearby figures render centered).
				if ( /^(P|H[1-6]|DIV|BLOCKQUOTE)$/.test( node.tagName ) && node.style.textAlign ) {
					const align = node.style.textAlign;
					state.formatAlignLeft = align === 'left' || align === 'start';
					state.formatAlignCenter = align === 'center';
					state.formatAlignRight = align === 'right';
					state.formatAlignJustify = align === 'justify';
				}
			}
			node = node.parentNode;
		}
	}

	// Justify is paragraph-only; disable the toolbar button inside lists,
	// headings, and quotes where browser justification would look poor.
	state.cannotJustify = state.insideList || state.formatHeading || state.formatQuote;

	// Citation placeholder lifecycle.
	const currentBlockquote = getActiveBlockquote();
	if ( currentBlockquote !== activeBlockquote ) {
		// Capture dirty state before modifying the DOM, so we can re-sync
		// the snapshot only when the placeholder is the sole difference.
		const wasDirty = isDirty();

		// Leaving a blockquote — clean up empty placeholder.
		if ( activeBlockquote ) {
			removeEmptyCite( activeBlockquote );
		}
		// Entering a blockquote — ensure placeholder exists.
		if ( currentBlockquote ) {
			ensureCitePlaceholder( currentBlockquote );
		}
		activeBlockquote = currentBlockquote;

		// Re-sync the snapshot only when the editor was clean before the
		// placeholder DOM change, so real edits stay dirty.
		if ( ! wasDirty ) {
			updateSavedSnapshot();
		}
	}
}

/**
 * Position a dropdown menu precisely on mobile by calculating from the toolbar.
 *
 * On mobile, dropdown menus use position:fixed to escape the overflow:auto
 * scroll container. This calculates the correct top position from the toolbar.
 *
 * @param {string} selector - CSS selector for the dropdown menu.
 */
function positionDropdownOnMobile( selector ) {
	if ( window.innerWidth > 768 ) return;

	requestAnimationFrame( () => {
		const menu = document.querySelector( selector );
		const toolbar = document.querySelector( '.bw-toolbar' );
		if ( ! menu || ! toolbar ) return;

		const toolbarRect = toolbar.getBoundingClientRect();
		menu.style.top = toolbarRect.bottom + 4 + 'px';
	} );
}

/**
 * Clean up stray <div> elements created by justify commands.
 *
 * Some browsers wrap content in a <div> when using justifyLeft/Center/Right
 * instead of applying text-align to the existing block. This replaces those
 * divs with <p> elements carrying the same text-align style.
 */
function cleanupAlignmentDivs() {
	const content = getContent();
	if ( ! content ) return;

	content.querySelectorAll( ':scope > div' ).forEach( div => {
		// Skip intentional divs (image controls, etc.).
		if ( div.classList.length > 0 ) return;

		const p = document.createElement( 'p' );
		if ( div.style.textAlign ) {
			p.style.textAlign = div.style.textAlign;
		}
		p.innerHTML = div.innerHTML;
		div.replaceWith( p );
	} );
}

// Block-level tags recognised by ensureBlockStructure (hoisted to avoid
// re-creating the RegExp on every input event).
const BLOCK_TAGS = /^(P|H[1-6]|BLOCKQUOTE|UL|OL|FIGURE|HR)$/;

// Editable block tags — blocks that can receive the cursor (excludes
// non-editable blocks like FIGURE and HR).
const EDITABLE_BLOCK_TAGS = /^(P|H[1-6]|BLOCKQUOTE|UL|OL)$/;

/**
 * Return true if the node is a non-editable block (figure, hr) that needs
 * gap paragraphs around it for cursor access.
 *
 * @param {Node} node - The DOM node to test.
 * @return {boolean} True if the node is a FIGURE or HR element.
 */
function isNonEditableBlock( node ) {
	return (
		node &&
		node.nodeType === Node.ELEMENT_NODE &&
		( node.tagName === 'FIGURE' || node.tagName === 'HR' )
	);
}

/**
 * Re-demote empty paragraphs back to gap styling when they sit
 * between non-editable blocks and the cursor has moved elsewhere.
 * Called on mouseup/keyup so the gap re-collapses after the user
 * clicks away without typing.
 */
function demoteEmptyGaps() {
	const c = getContent();
	if ( ! c ) return;
	const sel = window.getSelection();
	const cursorBlock = sel.rangeCount ? sel.anchorNode : null;

	[ ...c.querySelectorAll( ':scope > p' ) ].forEach( p => {
		// Skip if the paragraph has content or is already a gap.
		if ( p.classList.contains( 'bw-block-gap' ) ) return;
		if ( p.textContent && p.textContent.trim() ) return;
		// Skip if the cursor is currently inside this paragraph.
		if ( cursorBlock && p.contains( cursorBlock ) ) return;

		const prev = p.previousElementSibling;
		const next = p.nextElementSibling;
		// Only re-demote if the paragraph is in a true gap position:
		// between two non-editable blocks, or at the edge with no
		// editable block on the other side. Don't demote empty
		// paragraphs the user intentionally created next to a figure.
		const shouldBeGap =
			( isNonEditableBlock( prev ) && isNonEditableBlock( next ) ) ||
			( ! prev && isNonEditableBlock( next ) ) ||
			( ! next && isNonEditableBlock( prev ) );
		if ( shouldBeGap ) {
			p.classList.add( 'bw-block-gap' );
			p.innerHTML = '<br>';
		}
	} );
}

/**
 * If the cursor is inside a gap paragraph, promote it to a normal <p>
 * so the user can type. Called on click and input inside .bw-content.
 *
 * Note: focusin/focusout on document cannot detect focus changes to
 * individual elements inside a contenteditable area (e.target is
 * always the contenteditable host, not the inner <p>).
 */
function promoteGapAtCursor() {
	const sel = window.getSelection();
	if ( ! sel.rangeCount ) return;
	let node = sel.anchorNode;
	while ( node ) {
		if ( node.nodeType === Node.ELEMENT_NODE && node.classList.contains( 'bw-block-gap' ) ) {
			node.classList.remove( 'bw-block-gap' );
			return;
		}
		if ( node.classList && node.classList.contains( 'bw-content' ) ) break;
		node = node.parentNode;
	}
}

/**
 * Focus the end of the content area. Reuses an existing empty trailing
 * element when possible; otherwise appends a new empty paragraph.
 *
 * @param {HTMLElement} content   - The .bw-content element.
 * @param {Element}     lastChild - The last child element in the content.
 */
function focusEndOfContent( content, lastChild ) {
	const isEmpty = ! lastChild.textContent || ! lastChild.textContent.trim();
	let target;

	if ( isEmpty ) {
		const tag = lastChild.tagName;

		// Reuse an empty trailing paragraph (non-gap).
		// Reuse an empty trailing heading — the user likely wants to
		// type into it rather than create a new paragraph below.
		if (
			( tag === 'P' && ! lastChild.classList.contains( 'bw-block-gap' ) ) ||
			tag === 'H2' ||
			tag === 'H3'
		) {
			target = lastChild;
		}

		// Promote a trailing gap paragraph instead of stacking a
		// second empty paragraph beneath it.
		if ( tag === 'P' && lastChild.classList.contains( 'bw-block-gap' ) ) {
			lastChild.classList.remove( 'bw-block-gap' );
			target = lastChild;
		}
	}

	if ( ! target ) {
		target = document.createElement( 'p' );
		target.innerHTML = '<br>';
		content.appendChild( target );
	}

	const sel = window.getSelection();
	const range = document.createRange();
	range.setStart( target, 0 );
	range.collapse( true );
	sel.removeAllRanges();
	sel.addRange( range );

	// Focus after setting the selection so the browser doesn't
	// scroll to the top of the contenteditable area.
	content.focus( { preventScroll: true } );
}

/**
 * Ensure the content area always has proper block structure.
 *
 * Native contentEditable can leave bare text nodes or <br> elements as
 * direct children of .bw-content (e.g. when Backspace deletes a figure
 * and unwraps a neighbouring <p>). This wraps any such orphans in <p>
 * tags and re-seeds an empty editor with a blank paragraph.
 */
function ensureBlockStructure() {
	const content = getContent();
	if ( ! content ) return;

	// Fast path: if every direct child is already a block element, bail out.
	// This avoids allocating an array and running the full scan on every
	// keystroke when the structure is already correct (the common case).
	let needsRepair = ! content.firstChild;
	if ( ! needsRepair ) {
		for ( const node of content.childNodes ) {
			if (
				node.nodeType === Node.TEXT_NODE
					? node.textContent.trim()
					: node.nodeType !== Node.ELEMENT_NODE || ! BLOCK_TAGS.test( node.tagName )
			) {
				needsRepair = true;
				break;
			}
			// Flag non-editable blocks that are the first child or follow
			// another non-editable block without a gap.
			if ( isNonEditableBlock( node ) ) {
				const prevEl = node.previousElementSibling;
				if (
					! prevEl ||
					( isNonEditableBlock( prevEl ) && ! prevEl.classList.contains( 'bw-block-gap' ) )
				) {
					needsRepair = true;
					break;
				}
			}
			// Flag orphaned gap paragraphs no longer adjacent to any
			// non-editable block (e.g. after a figure was deleted).
			if ( node.nodeType === Node.ELEMENT_NODE && node.classList.contains( 'bw-block-gap' ) ) {
				const gapPrev = node.previousElementSibling;
				const gapNext = node.nextElementSibling;
				if ( ! isNonEditableBlock( gapPrev ) && ! isNonEditableBlock( gapNext ) ) {
					needsRepair = true;
					break;
				}
			}
		}
	}
	// Check if the last child is a non-editable block without a trailing gap.
	if ( ! needsRepair ) {
		const lastChild = content.lastElementChild;
		if ( isNonEditableBlock( lastChild ) ) {
			needsRepair = true;
		}
	}
	// Check if every block is a gap paragraph (e.g. after all figures
	// were deleted) and no non-editable blocks remain.  When figures
	// or HRs still exist the gap paragraphs are sufficient cursor
	// targets and no additional editable block is needed.
	if ( ! needsRepair ) {
		let hasRealEditable = false;
		let hasNonEditableBlock = false;
		for ( const el of content.children ) {
			if ( EDITABLE_BLOCK_TAGS.test( el.tagName ) && ! el.classList.contains( 'bw-block-gap' ) ) {
				hasRealEditable = true;
				break;
			}
			if ( isNonEditableBlock( el ) ) {
				hasNonEditableBlock = true;
			}
		}
		if ( ! hasRealEditable && ! hasNonEditableBlock ) {
			needsRepair = true;
		}
	}
	if ( ! needsRepair ) return;

	// Convert alignment divs to <p> before the orphan scan, so they
	// aren't mis-detected as orphan inline elements.
	cleanupAlignmentDivs();

	// Re-seed a completely empty editor.
	if ( ! content.firstChild ) {
		content.innerHTML = '<p><br></p>';
		return;
	}

	// Save the current selection so we can restore it after reparenting
	// nodes. Without this, the cursor can jump when the input-event
	// handler triggers a repair while the user is typing.
	const sel = window.getSelection();
	const rangeBackup = sel.rangeCount ? sel.getRangeAt( 0 ).cloneRange() : null;

	// Wrap runs of consecutive non-block nodes in <p> elements.
	let run = [];
	const flush = before => {
		if ( ! run.length ) return;
		// Skip runs that are only whitespace text nodes.
		const hasContent = run.some(
			n => n.nodeType === Node.ELEMENT_NODE || ( n.textContent && n.textContent.trim() )
		);
		if ( hasContent ) {
			const p = document.createElement( 'p' );
			content.insertBefore( p, before );
			run.forEach( n => p.appendChild( n ) );
		} else {
			// Remove whitespace-only orphans so they don't persist in
			// saved markup or trigger needsRepair on the next scan.
			run.forEach( n => n.remove() );
		}
		run = [];
	};

	// Snapshot childNodes because we'll mutate the DOM as we go.
	[ ...content.childNodes ].forEach( node => {
		if ( node.nodeType === Node.ELEMENT_NODE && BLOCK_TAGS.test( node.tagName ) ) {
			flush( node );
		} else {
			run.push( node );
		}
	} );
	flush( null );

	// Re-seed if cleanup left the editor empty.
	if ( ! content.firstChild ) {
		content.innerHTML = '<p><br></p>';
		return;
	}

	// Remove orphaned gap paragraphs that are no longer adjacent to
	// non-editable blocks (e.g. after all figures were deleted).
	[ ...content.querySelectorAll( ':scope > .bw-block-gap' ) ].forEach( gap => {
		const gapPrev = gap.previousElementSibling;
		const gapNext = gap.nextElementSibling;
		const isOrphaned = ! isNonEditableBlock( gapPrev ) && ! isNonEditableBlock( gapNext );
		if ( isOrphaned ) {
			gap.remove();
		}
	} );

	// Re-seed if orphaned-gap cleanup left the editor empty.
	if ( ! content.firstChild ) {
		content.innerHTML = '<p><br></p>';
		return;
	}

	// Insert gap paragraphs between consecutive non-editable blocks and
	// at the edges when the first/last child is non-editable.
	const children = [ ...content.children ];
	for ( let i = 0; i < children.length; i++ ) {
		const child = children[ i ];
		if ( ! isNonEditableBlock( child ) ) continue;

		// Gap before if first child or previous sibling is also non-editable.
		const prev = child.previousElementSibling;
		if ( ! prev || isNonEditableBlock( prev ) ) {
			// Don't insert a duplicate gap.
			if ( prev && prev.classList.contains( 'bw-block-gap' ) ) continue;
			if ( ! prev && child === content.firstElementChild ) {
				const gap = document.createElement( 'p' );
				gap.className = 'bw-block-gap';
				gap.innerHTML = '<br>';
				content.insertBefore( gap, child );
			} else if ( prev && isNonEditableBlock( prev ) ) {
				const gap = document.createElement( 'p' );
				gap.className = 'bw-block-gap';
				gap.innerHTML = '<br>';
				prev.after( gap );
			}
		}
	}
	// Gap after last child if it's non-editable.
	const last = content.lastElementChild;
	if ( isNonEditableBlock( last ) ) {
		const gap = document.createElement( 'p' );
		gap.className = 'bw-block-gap';
		gap.innerHTML = '<br>';
		content.appendChild( gap );
	}

	// Guarantee at least one text-editable block exists.  When
	// non-editable blocks (figures, HRs) are present, the surrounding
	// gap paragraphs already provide editable cursor targets that can
	// be promoted on click — adding another paragraph here would create
	// a visible duplicate once the trailing gap is promoted.
	let hasEditable = false;
	let hasNonEditable = false;
	for ( const el of content.children ) {
		if ( EDITABLE_BLOCK_TAGS.test( el.tagName ) && ! el.classList.contains( 'bw-block-gap' ) ) {
			hasEditable = true;
			break;
		}
		if ( isNonEditableBlock( el ) ) {
			hasNonEditable = true;
		}
	}
	if ( ! hasEditable && ! hasNonEditable && content.firstChild ) {
		const p = document.createElement( 'p' );
		p.innerHTML = '<br>';
		content.appendChild( p );
	}

	// Restore the selection. The range may become invalid if the anchor
	// node was removed (rather than reparented), so catch and discard.
	if ( rangeBackup ) {
		try {
			sel.removeAllRanges();
			sel.addRange( rangeBackup );
		} catch {
			// Range invalidated by node removal — cursor resets naturally.
		}
	}
}

/**
 * Insert a media element (figure) into the editor at the current
 * cursor position, followed by an empty paragraph.
 *
 * @param {Element} mediaEl - The figure element to insert.
 * @return {Element|null} The trailing paragraph (cursor target).
 */
function insertMediaBlock( mediaEl ) {
	const content = getContent();
	if ( ! content ) return null;

	const sel = window.getSelection();
	let insertAfter = null;
	if ( sel.rangeCount ) {
		let node = sel.anchorNode;
		while ( node && node !== content && node.parentNode !== content ) {
			node = node.parentNode;
		}
		if ( node && node.parentNode === content ) {
			insertAfter = node;
		}
	}

	const p = document.createElement( 'p' );
	p.innerHTML = '<br>';

	if ( insertAfter ) {
		insertAfter.after( mediaEl );
		mediaEl.after( p );
		if (
			/^(P|H[1-6]|BLOCKQUOTE)$/i.test( insertAfter.tagName ) &&
			( ! insertAfter.textContent || ! insertAfter.textContent.trim() )
		) {
			insertAfter.remove();
		}
	} else {
		content.appendChild( mediaEl );
		content.appendChild( p );
	}

	ensureBlockStructure();
	return p;
}

/**
 * Place the caret at the (x, y) viewport coordinates inside the editor.
 * Uses the standard `caretPositionFromPoint`, falling back to the
 * WebKit/Chromium-prefixed `caretRangeFromPoint`. Returns true if the
 * caret was placed inside the editor; false otherwise.
 *
 * @param {number} x - Viewport X coordinate.
 * @param {number} y - Viewport Y coordinate.
 * @return {boolean} Whether the caret was placed inside the editor.
 */
function placeCaretAtPoint( x, y ) {
	const content = getContent();
	if ( ! content ) return false;

	let range = null;
	if ( document.caretPositionFromPoint ) {
		const pos = document.caretPositionFromPoint( x, y );
		if ( pos && pos.offsetNode ) {
			range = document.createRange();
			range.setStart( pos.offsetNode, pos.offset );
			range.collapse( true );
		}
	} else if ( document.caretRangeFromPoint ) {
		range = document.caretRangeFromPoint( x, y );
		range?.collapse( true );
	}

	if ( ! range || ! content.contains( range.startContainer ) ) {
		return false;
	}

	const sel = window.getSelection();
	sel.removeAllRanges();
	sel.addRange( range );
	return true;
}

// Currently highlighted drop-target block, so dragover can move the
// indicator between blocks without re-querying every frame.
let currentDropTarget = null;

// Position the indicator was rendered at on currentDropTarget. Lets the
// drop handler pick before/after without re-running getBoundingClientRect
// (the dragover that placed the indicator already settled it).
let currentDropPosition = 'after';

// The figure currently being dragged within the editor (set in
// dragstart, cleared in dragend). Used to switch the dragover/drop
// handlers from their default "insert a file from disk" branch into a
// "move this existing figure" branch — the bug RSM-3981 was the absence
// of this branch, which left the browser to fall back to its native
// contentEditable=false copy-on-drop.
let draggingFigure = null;

/**
 * Show a visual indicator on the block where a dragged image will land.
 * The indicator is a class on the block element itself (a top-level
 * child of .bw-content-inner) so the CSS can position a horizontal line
 * at the insertion point — under the target block, or above the first
 * block if the drag is near the top edge.
 *
 * @param {number} x - Viewport X coordinate.
 * @param {number} y - Viewport Y coordinate.
 */
function updateDropIndicator( x, y ) {
	const content = getContent();
	if ( ! content ) return;

	let target = null;
	let position = 'after';

	if ( document.caretPositionFromPoint || document.caretRangeFromPoint ) {
		let node;
		if ( document.caretPositionFromPoint ) {
			const pos = document.caretPositionFromPoint( x, y );
			node = pos?.offsetNode || null;
		} else {
			const range = document.caretRangeFromPoint( x, y );
			node = range?.startContainer || null;
		}
		// Walk up to the direct child of .bw-content-inner.
		while ( node && node !== content && node.parentNode !== content ) {
			node = node.parentNode;
		}
		if ( node && node.parentNode === content ) {
			target = node;
		}
	}

	// Fallback: pick the block closest to the y-coordinate, or the
	// last block if the drag is below all content. Lets the indicator
	// stay visible when hovering over the empty area below the post.
	if ( ! target ) {
		const blocks = Array.from( content.children );
		for ( const block of blocks ) {
			const rect = block.getBoundingClientRect();
			if ( y < rect.top ) {
				target = block;
				position = 'before';
				break;
			}
			target = block;
		}
	}

	if ( ! target ) return;
	if ( currentDropTarget === target ) {
		// Position may have flipped on the same block — keep both states
		// consistent by clearing the other one.
		target.classList.toggle( 'bw-drop-target--before', position === 'before' );
		target.classList.toggle( 'bw-drop-target--after', position === 'after' );
		currentDropPosition = position;
		return;
	}

	clearDropIndicator();
	target.classList.add(
		position === 'before' ? 'bw-drop-target--before' : 'bw-drop-target--after'
	);
	currentDropTarget = target;
	currentDropPosition = position;
}

/**
 * Remove the drop-target indicator from whichever block currently has it.
 */
function clearDropIndicator() {
	if ( currentDropTarget ) {
		currentDropTarget.classList.remove( 'bw-drop-target--before', 'bw-drop-target--after' );
		currentDropTarget = null;
	}
	currentDropPosition = 'after';
}

/**
 * Move a figure to a new position relative to a target block. No-ops
 * when the move would not change the DOM (figure dropped onto itself,
 * or onto its current neighbour on the same side).
 *
 * @param {Element}          figure   - The figure being dragged.
 * @param {Element}          target   - The block to land next to.
 * @param {'before'|'after'} position - Where to drop relative to target.
 * @return {boolean} Whether the DOM actually changed.
 */
function moveFigureToBlock( figure, target, position ) {
	if ( ! figure || ! target || figure === target ) return false;
	if ( position === 'before' ) {
		if ( target.previousSibling === figure ) return false;
		target.before( figure );
	} else {
		if ( target.nextSibling === figure ) return false;
		target.after( figure );
	}
	return true;
}

/**
 * Upload an image file and insert it at the current caret position.
 * Inserts a placeholder figure immediately (using a local object URL)
 * so the user gets feedback while the upload is in flight, then
 * replaces the placeholder with the media-library URL and ID once
 * uploaded.
 *
 * The whole upload+swap is registered via trackMediaSizeSwap so
 * savePost waits for it before serializing the editor.
 *
 * @param {File} file - The image file to upload.
 */
function uploadAndInsertImage( file ) {
	const content = getContent();
	if ( ! content ) return;

	const figure = document.createElement( 'figure' );
	// Apply size-large up-front so the placeholder renders at the same
	// 75% width the figure will land at after upload. Without it the
	// locally-previewed image renders at its natural pixel size and
	// snaps narrower the moment the swap runs.
	figure.className = 'bw-image-figure bw-image-uploading size-large';
	const img = document.createElement( 'img' );
	const localUrl = URL.createObjectURL( file );
	img.src = localUrl;
	img.alt = '';
	figure.appendChild( img );

	const p = insertMediaBlock( figure );
	if ( p ) {
		placeCursorAt( p );
	}
	// Deliberately do NOT push undo history here: the placeholder figure's
	// img.src is a blob: URL that gets revoked when the upload completes.
	// Capturing the placeholder in an undo snapshot would let Cmd+Z restore
	// a dead blob URL, which would then serialize into the saved post. The
	// undo snapshot is pushed inside the swap below, after the real URL
	// and wp-image-{id} class are in place.

	const swap = ( async () => {
		try {
			const media = await uploadMedia( file );
			// If the figure was removed during the upload (e.g. by undo or
			// manual delete), skip the DOM swap. The upload still lives in
			// the media library, which is harmless.
			if ( ! content.contains( figure ) ) {
				return;
			}
			// Tag the figure with the media-library id+size so the
			// save-time serializer produces a real <!-- wp:image --> block.
			img.src = media.source_url;
			img.alt = media.alt_text || '';
			img.className = 'wp-image-' + media.id;
			figure.className = 'bw-image-figure size-large';
			mediaSizesCache.set( media.id, media.media_details?.sizes || null );
			// The figure was decorated by addDeleteButtons() before upload,
			// so it's missing the Size button (that branch is gated on
			// getMediaIdFromImg). Strip and re-decorate now that the
			// wp-image-{id} class is in place.
			stripRuntimeFigureControls( figure );
			addDeleteButtons();
			await applyMediaSizeToFigure( figure, 'large' );
			pushToUndoHistory();
		} catch ( err ) {
			if ( content.contains( figure ) ) {
				figure.remove();
			}
			state.message = ( i18n.uploadFailed || 'Upload failed: %s' ).replace( '%s', err.message );
			setTimeout( () => {
				state.message = '';
			}, 3000 );
		} finally {
			URL.revokeObjectURL( localUrl );
		}
	} )();
	trackMediaSizeSwap( swap );
}

// --- Inline category meta helpers ---

/**
 * Recompute state.catLabel from the currently selected categories.
 * Uses the translatable "Writing in %s" format string from i18n.
 */
function updateCatLabel() {
	const selected = state.categories.filter( c => c.selected );
	const names = selected.map( c => c.name ).join( ', ' );
	const fmt = i18n.writingIn || 'Writing in %s';
	state.catLabel = names ? fmt.replace( '%s', names ) : '';
}

/**
 * Sync the visual selected state of each dropdown item with state.categories.
 */
function syncCatDropdownItems() {
	document.querySelectorAll( '#bw-cat-dropdown .bw-meta-dropdown-item' ).forEach( item => {
		const idx = parseInt( item.dataset.catIndex, 10 );
		const selected = !! state.categories[ idx ]?.selected;
		item.classList.toggle( 'bw-meta-dropdown-item--selected', selected );
		item.setAttribute( 'aria-selected', selected ? 'true' : 'false' );
	} );
}

const { state } = store( 'wpcom-write', {
	callbacks: {
		/**
		 * Mirror reactive slash-menu state onto the .bw-content-inner element.
		 *
		 * .bw-content-inner has `data-wp-ignore` (so Preact treats its children
		 * as opaque and won't re-attach detached nodes during undo/redo) — but
		 * that directive strips any sibling `data-wp-bind--*` directives. To
		 * keep the combobox aria attributes reactive, we sync them imperatively
		 * via `data-wp-watch` on the outer wrapper: reading state.showSlashMenu
		 * and state.slashActiveId here subscribes the watcher to their signals.
		 */
		syncComboboxAria() {
			const inner = document.querySelector( '.bw-content-inner' );
			if ( ! inner ) return;
			inner.setAttribute( 'aria-expanded', state.showSlashMenu ? 'true' : 'false' );
			inner.setAttribute( 'aria-activedescendant', state.slashActiveId || '' );
		},

		/**
		 * Mirror edit-modal radio state onto aria-checked + tabindex so the
		 * active option is visually marked AND owns the roving tab stop per
		 * the WAI-ARIA radio pattern (only one radio per group in tab order;
		 * arrow keys move within the group). Reading state.editingImageAlign
		 * / state.editingImageSize here subscribes the watcher to those
		 * signals; the panel's data-wp-watch wires this up.
		 */
		syncEditImageModalRadios() {
			const align = state.editingImageAlign;
			const size = state.editingImageSize;
			if ( ! state.showImageModal || ! state.isEditMode ) return;
			const sync = ( selector, activeValue ) => {
				const options = document.querySelectorAll( selector );
				let activeFound = false;
				options.forEach( btn => {
					const isActive = btn.value === activeValue;
					btn.setAttribute( 'aria-checked', isActive ? 'true' : 'false' );
					btn.tabIndex = isActive ? 0 : -1;
					if ( isActive ) activeFound = true;
				} );
				// Keep one option tabbable even when nothing matches the
				// current state (e.g. size: '' for non-media-library images
				// where the section is hidden anyway, but the rule still
				// holds — no group should be entirely untabbable).
				if ( ! activeFound && options.length ) {
					options[ 0 ].tabIndex = 0;
				}
			};
			sync( '.bw-edit-align-option', align );
			sync( '.bw-edit-size-option', size );
		},
	},
	state: {
		formatBold: false,
		formatItalic: false,
		formatHeading: false,
		formatQuote: false,
		imageUrl: '',
		headingLabel: i18n.normal || 'Normal',
		canUndo: false,
		canRedo: false,
		get headerLabel() {
			return state.title.trim() || i18n.untitled || 'Untitled';
		},
		get displayStatus() {
			return state.message || state.headerLabel;
		},
		get isClassicWarning() {
			return state.unsupportedWarning === 'classic-editor';
		},
		get isBlockEditorWarning() {
			return state.unsupportedWarning === 'block-editor';
		},
		// True when a "true modal" overlay is open (insert image, video,
		// post picker). Used to gate keystroke handlers — the edit panel is
		// non-modal and intentionally not included here.
		get hasBlockingModal() {
			return state.showImageInsertOverlay || state.showVideoModal || state.showPostPicker;
		},
		// True when the centered insert overlay should be visible. The
		// underlying state.showImageModal flag is shared between insert and
		// edit; this getter separates them in markup bindings.
		get showImageInsertOverlay() {
			return state.showImageModal && ! state.isEditMode;
		},
		get unsupportedDescId() {
			if ( state.unsupportedWarning === 'classic-editor' ) {
				return 'bw-unsupported-desc-classic';
			}
			if ( state.unsupportedWarning === 'block-editor' ) {
				return 'bw-unsupported-desc-block';
			}
			return '';
		},
	},

	actions: {
		updateTitle() {
			const el = getElement();
			state.title = el.ref.value;
			// Auto-resize textarea height for browsers without field-sizing support.
			el.ref.style.height = 'auto';
			el.ref.style.height = el.ref.scrollHeight + 'px';

			// Typing a title counts as the first anon write too — the title field
			// binds to this action rather than repairStructure, so hook it here so
			// a title-only author still registers a write-start before publish.
			if ( isAnon() && ! anonWriteStartTracked ) {
				maybeTrackAnonWriteStart( state.title );
			}

			// Dismiss the recovery banner once the user starts editing.
			if ( state.showRecoveryBanner ) {
				localStorage.removeItem( AUTOSAVE_STORAGE_KEY );
				state.showRecoveryBanner = false;
			}
		},

		handleTitleKeyDown( event ) {
			// Block keystrokes while a blocking overlay is open. The image
			// edit panel is non-modal and doesn't block title editing.
			if ( state.hasBlockingModal ) {
				if ( event.key === 'Escape' ) {
					const { actions: a } = store( 'wpcom-write' );
					if ( state.showImageInsertOverlay ) {
						a.closeImageModal();
					} else {
						a.closeVideoModal();
					}
					return;
				}
				if ( event.key === 'Tab' ) {
					return;
				}
				event.preventDefault();
				return;
			}

			if ( event.key === 'Enter' ) {
				event.preventDefault();
				const content = getContent();
				if ( content ) {
					content.focus();
					// Ensure the cursor starts inside a paragraph.
					if ( ! content.querySelector( 'p' ) ) {
						document.execCommand( 'formatBlock', false, 'p' );
					}
				}
			}
		},

		handleBack( event ) {
			// Don't warn if the post has been published.
			if ( state.isPublished ) {
				return;
			}

			// Use dirty-state tracking: warn if content changed since last save.
			if ( isDirty() ) {
				event.preventDefault();
				state.showLeaveConfirm = true;

				// Move focus into the modal for a11y.
				requestAnimationFrame( () => {
					const modal = document.querySelector( '.bw-leave-modal' );
					if ( modal ) {
						const firstBtn = modal.querySelector( 'button' );
						if ( firstBtn ) firstBtn.focus();
					}
				} );
			}
		},

		cancelLeave() {
			state.pendingOpenPost = false;
			state.showLeaveConfirm = false;
			// Return focus to the back button.
			const backBtn = document.querySelector( '.bw-back' );
			if ( backBtn ) backBtn.focus();
		},

		handleLeaveModalKeyDown( event ) {
			if ( event.key === 'Escape' ) {
				event.preventDefault();
				const { actions: a } = store( 'wpcom-write' );
				a.cancelLeave();
				return;
			}

			// Trap Tab within the modal.
			if ( event.key === 'Tab' ) {
				const modal = document.querySelector( '.bw-leave-modal' );
				if ( ! modal ) return;
				const focusable = modal.querySelectorAll( 'button' );
				if ( ! focusable.length ) return;
				const first = focusable[ 0 ];
				const last = focusable[ focusable.length - 1 ];
				const active = modal.ownerDocument.activeElement;
				if ( event.shiftKey && active === first ) {
					event.preventDefault();
					last.focus();
				} else if ( ! event.shiftKey && active === last ) {
					event.preventDefault();
					first.focus();
				}
			}
		},

		confirmLeave() {
			if ( state.pendingOpenPost ) {
				state.pendingOpenPost = false;
				state.showLeaveConfirm = false;
				showPostPickerModal();
				return;
			}
			allowLeave = true;
			window.location.href = state.backUrl;
		},

		async saveAndLeave() {
			state.showLeaveConfirm = false;
			const status = state.postStatus === 'publish' ? 'publish' : 'draft';
			await savePost( status, true );

			// If the save failed, stay on the editor — don't navigate away
			// or open the post picker, as that would discard unsaved edits.
			// A successful save updates lastSavedSnapshot, so isDirty() returns false.
			if ( isDirty() ) {
				state.pendingOpenPost = false;
				state.message = ( i18n.error || 'Error: %s' ).replace( '%s', 'Could not save' );
				setTimeout( () => {
					state.message = '';
				}, 4000 );
				return;
			}

			if ( state.pendingOpenPost ) {
				state.pendingOpenPost = false;
				showPostPickerModal();
				return;
			}
			allowLeave = true;
			window.location.href = state.backUrl;
		},

		checkFormatting() {
			// Keep savedRange current so toolbar keyboard activation always has a
			// fresh selection, regardless of focusout timing.
			saveSelection();

			// Dismiss the recovery banner once the user starts editing.
			if ( state.showRecoveryBanner ) {
				localStorage.removeItem( AUTOSAVE_STORAGE_KEY );
				state.showRecoveryBanner = false;
			}

			// Re-demote empty paragraphs that were promoted from gaps
			// but never received content (user clicked in then away).
			demoteEmptyGaps();

			// Expand the gap paragraph the user clicked into.
			promoteGapAtCursor();

			// Check for slash commands first.
			const { actions } = store( 'wpcom-write' );
			actions.checkSlashCommand();

			// Update all formatting button states based on cursor position.
			updateFormattingState();
		},

		handleContentClick( event ) {
			const content = getContent();
			if ( ! content ) return;

			// Don't interfere with drag selections.
			const sel = window.getSelection();
			if ( sel && ! sel.isCollapsed ) return;

			const lastChild = content.lastElementChild;
			if ( ! lastChild ) return;

			// Check if the click landed below the last child element.
			const lastRect = lastChild.getBoundingClientRect();
			if ( event.clientY <= lastRect.bottom ) return;

			focusEndOfContent( content, lastChild );
		},

		handleMainClick( event ) {
			const content = getContent();
			if ( ! content ) return;

			// Don't interfere with drag selections.
			const sel = window.getSelection();
			if ( sel && ! sel.isCollapsed ) return;

			// Only handle clicks directly on .bw-main or .bw-editor
			// (the padding area below the content), not on child elements
			// like the content area itself or the title.
			const tag = event.target.tagName;
			const cls = event.target.classList;
			if (
				! ( tag === 'MAIN' && cls.contains( 'bw-main' ) ) &&
				! ( tag === 'DIV' && cls.contains( 'bw-editor' ) )
			) {
				return;
			}

			const contentRect = content.getBoundingClientRect();
			if ( event.clientY <= contentRect.bottom ) return;

			const lastChild = content.lastElementChild;
			if ( ! lastChild ) return;

			focusEndOfContent( content, lastChild );
		},

		repairStructure() {
			// Fires on the `input` event — after the browser mutates the DOM
			// but before the next paint. Wraps any bare text/inline nodes that
			// native contentEditable orphaned (e.g. deleting a figure via
			// Backspace can unwrap a neighbouring <p>).
			promoteGapAtCursor();
			ensureBlockStructure();
			pushToUndoHistoryDebounced();

			// First real keystroke in the anon funnel — fires once per session.
			if ( isAnon() && ! anonWriteStartTracked ) {
				const contentEl = getContent();
				maybeTrackAnonWriteStart( contentEl ? contentEl.textContent : '' );
			}
		},

		undo() {
			performUndo();
		},

		redo() {
			performRedo();
		},

		handleKeyDown( event ) {
			// Keep savedRange current before any key changes the selection.
			if ( ! state.hasBlockingModal ) {
				saveSelection();
			}

			// Block all keystrokes while a blocking overlay is open. The
			// image edit panel is non-modal and doesn't block editor input.
			if ( state.hasBlockingModal ) {
				if ( event.key === 'Escape' ) {
					const { actions: a } = store( 'wpcom-write' );
					if ( state.showImageInsertOverlay ) {
						a.closeImageModal();
					} else {
						a.closeVideoModal();
					}
					return;
				}
				if ( event.key === 'Tab' ) {
					return;
				}
				event.preventDefault();
				return;
			}

			// Shift+Tab / Alt+F10: jump focus directly to the toolbar.
			// Shift+Tab bypasses the title textarea (which clears window.getSelection()
			// en route, losing the saved range before the toolbar is reached).
			// Exception: if focus is inside a figure, let the browser navigate
			// naturally between the figure's action buttons.
			if ( ( event.key === 'Tab' && event.shiftKey ) || ( event.altKey && event.key === 'F10' ) ) {
				if (
					event.key === 'Tab' &&
					event.target.closest( 'figure, .bw-image-figure, .bw-video-figure' )
				) {
					return;
				}
				event.preventDefault();
				saveSelection();
				const target =
					lastFocusedToolbarButton ||
					document.querySelector( '.bw-toolbar .bw-tool-heading-toggle' );
				if ( target ) target.focus();
				return;
			}

			// Normalize via toLowerCase so Shift+Z and CapsLock don't bypass these
			// shortcuts — some browser/platform combinations report uppercase keys.
			const lowerKey = event.key.toLowerCase();
			// Undo (Cmd+Z / Ctrl+Z).
			if ( ( event.ctrlKey || event.metaKey ) && lowerKey === 'z' && ! event.shiftKey ) {
				event.preventDefault();
				performUndo();
				return;
			}
			// Redo (Cmd+Shift+Z / Ctrl+Shift+Z / Ctrl+Y).
			if (
				( ( event.ctrlKey || event.metaKey ) && lowerKey === 'z' && event.shiftKey ) ||
				( event.ctrlKey && lowerKey === 'y' )
			) {
				event.preventDefault();
				performRedo();
				return;
			}

			// Ctrl+K / Cmd+K to toggle link input.
			if ( ( event.ctrlKey || event.metaKey ) && lowerKey === 'k' ) {
				event.preventDefault();
				const { actions: a } = store( 'wpcom-write' );
				a.toggleLinkInput();
				return;
			}

			// Escape deselects a keyboard-selected figure.
			if ( event.key === 'Escape' && selectedFigure ) {
				event.preventDefault();
				clearFigureSelection();
				return;
			}

			// Any key other than Backspace/Delete/Escape deselects the figure.
			if ( selectedFigure && event.key !== 'Backspace' && event.key !== 'Delete' ) {
				clearFigureSelection();
			}

			// Slash menu keyboard navigation.
			if ( state.showSlashMenu ) {
				if ( event.key === 'Escape' ) {
					event.preventDefault();
					slashMenuEscaped = true;
					prevSlashFilter = null;
					keyboardNavListenerActive = false;
					const menu = document.querySelector( '.bw-slash-menu' );
					if ( menu ) menu.classList.remove( 'bw-slash-menu--keyboard' );
					clearSlashActive();
					state.showSlashMenu = false;
					return;
				}

				const visible = [ ...document.querySelectorAll( '.bw-slash-item' ) ].filter(
					el => el.style.display !== 'none'
				);

				if ( ! visible.length ) return;

				const active = document.querySelector( '.bw-slash-item-active' );
				let idx = active ? visible.indexOf( active ) : -1;

				if ( event.key === 'ArrowDown' || ( event.key === 'Tab' && ! event.shiftKey ) ) {
					event.preventDefault();
					idx = ( idx + 1 ) % visible.length;
					setSlashActiveItem( visible[ idx ] );
					enterKeyboardNav();
					return;
				}

				if ( event.key === 'ArrowUp' || ( event.key === 'Tab' && event.shiftKey ) ) {
					event.preventDefault();
					idx = idx <= 0 ? visible.length - 1 : idx - 1;
					setSlashActiveItem( visible[ idx ] );
					enterKeyboardNav();
					return;
				}

				if ( event.key === 'Enter' ) {
					event.preventDefault();
					prevSlashFilter = null;
					keyboardNavListenerActive = false;
					const menu = document.querySelector( '.bw-slash-menu' );
					if ( menu ) menu.classList.remove( 'bw-slash-menu--keyboard' );
					const target = active || document.querySelector( '.bw-slash-item:hover' ) || visible[ 0 ];
					if ( target ) {
						// Map menu items to actions by their data-action attribute
						// (not label text, which is translated and would break on non-English sites).
						const action = target.dataset.action;
						const { actions: a } = store( 'wpcom-write' );
						const actionMap = {
							heading: a.insertHeading,
							image: a.insertImage,
							'bulleted-list': a.insertBulletedList,
							'numbered-list': a.insertNumberedList,
							video: a.insertVideo,
							quote: a.insertQuote,
							divider: a.insertDivider,
						};
						if ( actionMap[ action ] ) {
							actionMap[ action ]();
						}
					}
					return;
				}
			}

			// Two-step figure deletion: first Backspace/Delete selects the
			// adjacent figure, second press deletes it.
			if ( event.key === 'Backspace' || event.key === 'Delete' ) {
				// Second press — delete the already-selected figure.
				// Check this first because the selection was cleared when
				// the figure was highlighted (no blinking cursor).
				if ( selectedFigure ) {
					event.preventDefault();
					const fig = selectedFigure;
					clearFigureSelection();
					animateAndDeleteFigure( fig );
					return;
				}

				// First press — select the adjacent figure.
				const targetFigure = getFigureAdjacentToCursor( event.key );
				if ( targetFigure ) {
					event.preventDefault();
					selectedFigure = targetFigure;
					targetFigure.classList.add( 'bw-figure-selected' );
					// Save the cursor position so it can be restored if the
					// user cancels the selection (Escape, click, or letter).
					const sel = window.getSelection();
					if ( sel.rangeCount ) {
						preFigureSelectionRange = sel.getRangeAt( 0 ).cloneRange();
					}
					// Hide the blinking cursor so focus appears to move
					// to the highlighted figure.
					sel.removeAllRanges();
					return;
				}
				// No adjacent figure — fall through to native Backspace/Delete.
			}

			// Backspace in an empty list item: exit the list.
			// Must run before the first-block Backspace guard below, otherwise the
			// guard swallows Backspace when the list is the editor's first block
			// (e.g. just after triggering the markdown shortcut on a fresh post).
			if ( event.key === 'Backspace' ) {
				const sel = window.getSelection();
				let li = null;
				if ( sel.rangeCount ) {
					let n = sel.anchorNode;
					while ( n && ! n.classList?.contains( 'bw-content' ) ) {
						if ( n.nodeType === Node.ELEMENT_NODE && n.tagName === 'LI' ) {
							li = n;
							break;
						}
						n = n.parentNode;
					}
				}
				if ( li && li.textContent.trim() === '' ) {
					event.preventDefault();
					exitListAndApplyBlock( 'p' );
					state.formatUList = false;
					state.formatOList = false;
					return;
				}
			}

			// Backspace in an empty blockquote: convert it back to a paragraph.
			// Must run before the first-block Backspace guard below, otherwise the
			// guard swallows Backspace when the quote is the editor's first block
			// (e.g. just after the `>` markdown shortcut on a fresh post), leaving
			// the user with no way to remove the quote.
			if ( event.key === 'Backspace' ) {
				const sel = window.getSelection();
				if ( sel.rangeCount && sel.isCollapsed && ! getActiveCite() ) {
					const bq = getActiveBlockquote();
					if ( bq ) {
						// Ignore the <cite> placeholder when checking for empty body.
						const probe = bq.cloneNode( true );
						const probeCite = probe.querySelector( 'cite' );
						if ( probeCite ) {
							probeCite.remove();
						}
						if ( probe.textContent.trim() === '' ) {
							event.preventDefault();
							flushUndoDebounce();
							const p = document.createElement( 'p' );
							p.innerHTML = '<br>';
							bq.after( p );
							bq.remove();
							placeCursorAt( p );
							state.formatQuote = false;
							pushToUndoHistory();
							return;
						}
					}
				}
			}

			// Block Backspace at the very start of the first block. With nothing
			// to merge into, some browsers respond by unwrapping the structure
			// — including the .bw-content-inner wrapper that protects user
			// content from the Interactivity API reconciler. Losing the wrapper
			// breaks undo/redo, so we no-op this keystroke instead.
			if ( event.key === 'Backspace' ) {
				const sel = window.getSelection();
				if ( sel.rangeCount && sel.isCollapsed ) {
					const range = sel.getRangeAt( 0 );
					const content = getContent();
					if ( content && content.firstElementChild ) {
						// Walk up from the cursor to the direct child of .bw-content-inner.
						let block = range.startContainer;
						while ( block && block.parentNode !== content ) {
							block = block.parentNode;
						}
						if ( block && block === content.firstElementChild ) {
							const beforeRange = document.createRange();
							beforeRange.setStart( block, 0 );
							beforeRange.setEnd( range.startContainer, range.startOffset );
							if ( beforeRange.toString() === '' ) {
								event.preventDefault();
								return;
							}
						}
					}
				}
			}

			// Tab / Shift-Tab inside a list: indent / outdent.
			if ( event.key === 'Tab' ) {
				const sel = window.getSelection();
				let li = null;
				if ( sel.rangeCount ) {
					let n = sel.anchorNode;
					while ( n && ! n.classList?.contains( 'bw-content' ) ) {
						if ( n.nodeType === Node.ELEMENT_NODE && n.tagName === 'LI' ) {
							li = n;
							break;
						}
						n = n.parentNode;
					}
				}
				if ( li ) {
					event.preventDefault();
					if ( event.shiftKey ) {
						indentListItem( li, 'outdent' );
					} else {
						indentListItem( li, 'indent' );
					}
					return;
				}
			}

			// Backspace in an empty <cite>: remove it and move cursor to quote body.
			if ( event.key === 'Backspace' ) {
				const cite = getActiveCite();
				if ( cite && ! cite.textContent.trim() ) {
					event.preventDefault();
					const bq = cite.closest( 'blockquote' );
					cite.remove();
					if ( bq ) {
						const lastP = bq.querySelector( 'p:last-of-type' );
						if ( lastP ) {
							placeCursorAtEnd( lastP );
						}
					}
					return;
				}
			}

			// Markdown shortcuts: typing space after `-`, `*`, `+`, or `1.` at the
			// start of an otherwise-empty paragraph converts it to a list, and `>`
			// converts it to a blockquote. The space itself is swallowed so the user
			// lands at column 0 of the new block.
			if ( event.key === ' ' && ! state.showSlashMenu ) {
				const sel = window.getSelection();
				if ( sel.rangeCount && sel.isCollapsed ) {
					const content = getContent();
					let block = sel.anchorNode;
					while ( block && block !== content && block.parentNode !== content ) {
						block = block.parentNode;
					}
					// Only fire on top-level paragraphs — keep this out of headings,
					// blockquotes, lists, figures, and other structured blocks.
					if ( block && block.parentNode === content && block.tagName === 'P' ) {
						const listTag = parseMarkdownListShortcut( block.textContent );
						if ( listTag ) {
							event.preventDefault();
							flushUndoDebounce();
							applyMarkdownListShortcut( block, listTag );
							pushToUndoHistory();
							return;
						}
						if ( parseMarkdownQuoteShortcut( block.textContent ) ) {
							event.preventDefault();
							flushUndoDebounce();
							applyMarkdownQuoteShortcut( block );
							pushToUndoHistory();
							return;
						}
					}
				}
			}

			// Enter key: handle cite break-out and blockquote/heading break-out.
			if ( event.key === 'Enter' && ! event.shiftKey ) {
				// Inside a blockquote <cite>: break out to a new paragraph.
				const cite = getActiveCite();
				if ( cite ) {
					const bq = cite.closest( 'blockquote' );
					if ( bq ) {
						event.preventDefault();
						const p = document.createElement( 'p' );
						p.innerHTML = '<br>';
						bq.after( p );
						placeCursorAt( p );
						return;
					}
				}

				// Break out of blockquotes/headings and ensure paragraphs.
				const sel = window.getSelection();
				if ( sel.rangeCount ) {
					let node = sel.anchorNode;
					// Walk up to find if we're inside a blockquote or heading.
					let block = null;
					while ( node && ! node.classList?.contains( 'bw-content' ) ) {
						if (
							node.nodeType === Node.ELEMENT_NODE &&
							( node.tagName === 'BLOCKQUOTE' || /^H[1-6]$/.test( node.tagName ) )
						) {
							block = node;
							break;
						}
						node = node.parentNode;
					}

					// If at the end of a blockquote or heading, break out to a paragraph.
					if ( block ) {
						const range = sel.getRangeAt( 0 );
						const textAfterCursor = range.cloneRange();
						textAfterCursor.selectNodeContents( block );
						textAfterCursor.setStart( range.endContainer, range.endOffset );

						// Exclude <cite> text from the "remaining" check so Enter at the
						// end of quote body text breaks out even when a citation follows.
						const tmpFrag = textAfterCursor.cloneContents();
						const citeFrag = tmpFrag.querySelector( 'cite' );
						if ( citeFrag ) {
							citeFrag.remove();
						}
						const remaining = tmpFrag.textContent.trim();

						if ( ! remaining ) {
							event.preventDefault();
							const p = document.createElement( 'p' );
							p.innerHTML = '<br>';
							block.after( p );
							placeCursorAt( p );
						}
					}
				}
			}
		},

		handleBeforeInput( event ) {
			// Route Edit menu undo/redo through our history stack.
			if ( event.inputType === 'historyUndo' ) {
				event.preventDefault();
				performUndo();
			} else if ( event.inputType === 'historyRedo' ) {
				event.preventDefault();
				performRedo();
			}
		},

		checkSlashCommand() {
			const sel = window.getSelection();
			if ( ! sel.rangeCount ) {
				if ( state.showSlashMenu ) clearSlashActive();
				state.showSlashMenu = false;
				return;
			}

			const node = sel.anchorNode;
			if ( ! node || node.nodeType !== Node.TEXT_NODE ) {
				if ( state.showSlashMenu ) clearSlashActive();
				state.showSlashMenu = false;
				return;
			}

			const text = node.textContent;
			// Show menu when the line starts with "/" and optionally a filter after it.
			// Suppress inside lists — block-level insertions are not supported there.
			if ( /^\/\S*$/.test( text.trimStart() ) && ! state.insideList ) {
				// User just dismissed the menu with Escape — skip this keyup cycle.
				if ( slashMenuEscaped ) {
					slashMenuEscaped = false;
					return;
				}

				const newFilter = text.trim().slice( 1 ).toLowerCase();
				// Only reset the active item when the filter text actually changes
				// (i.e. the user typed a character). Preserve selection when navigating.
				const filterChanged = newFilter !== prevSlashFilter;
				const menuJustOpened = ! state.showSlashMenu;
				state.slashFilter = newFilter;
				prevSlashFilter = newFilter;
				state.showSlashMenu = true;
				requestAnimationFrame( positionSlashMenu );

				// Suppress hover highlight when the menu first opens so an item
				// under the cursor doesn't appear selected before the user moves.
				if ( menuJustOpened ) enterKeyboardNav();

				// Filter menu items; reset active highlight only on filter change.
				const items = document.querySelectorAll( '.bw-slash-item' );
				let firstVisible = null;
				items.forEach( item => {
					const label = item.querySelector( 'strong' ).textContent.toLowerCase();
					const show = label.includes( state.slashFilter );
					item.style.display = show ? '' : 'none';
					if ( show && ! firstVisible ) firstVisible = item;
				} );
				// Close the menu when no items match the filter.
				if ( ! firstVisible ) {
					clearSlashActive();
					state.showSlashMenu = false;
					return;
				}
				// Auto-highlight the first visible item only when filter changes.
				if ( filterChanged ) setSlashActiveItem( firstVisible );
			} else {
				slashMenuEscaped = false;
				prevSlashFilter = null;
				clearSlashActive();
				state.showSlashMenu = false;
			}
		},

		preventToolbarBlur( event ) {
			// Prevent the toolbar from stealing focus from the content area,
			// but allow normal interaction with form inputs (text selection, cursor).
			if ( event.target.closest( 'input, textarea' ) ) return;
			event.preventDefault();
		},

		// --- Toolbar keyboard navigation (WAI-ARIA toolbar pattern) ---

		handleToolbarKeyDown( event ) {
			const toolbar = event.currentTarget;
			const focused = toolbar.ownerDocument.activeElement;

			// When focus is inside a submenu, arrow navigation is handled by
			// handleSubmenuKeyDown — don't also move the toolbar focus.
			const insideSubmenu = focused?.closest( '.bw-heading-menu, .bw-color-menu' );

			if ( event.key === 'ArrowRight' || event.key === 'ArrowLeft' ) {
				if ( insideSubmenu ) return;
				event.preventDefault();
				const buttons = [
					...toolbar.querySelectorAll( ':scope .bw-tool, :scope .bw-tool-heading-toggle' ),
				].filter( btn => ! btn.closest( '.bw-heading-menu, .bw-color-menu' ) && ! btn.disabled );
				const idx = buttons.indexOf( focused );
				const delta = event.key === 'ArrowRight' ? 1 : -1;
				setToolbarFocus( buttons[ ( idx + delta + buttons.length ) % buttons.length ] );
				return;
			}

			if ( event.key === 'Escape' ) {
				event.preventDefault();
				state.showHeadingMenu = false;
				state.showTextColorMenu = false;
				getContent()?.focus();
				restoreSelection();
				return;
			}

			if ( event.key === 'Enter' || event.key === ' ' ) {
				if ( ! focused || ! toolbar.contains( focused ) ) return;
				// Submenu toggles: open the menu and focus its first item.
				const isHeadingToggle = focused.classList.contains( 'bw-tool-heading-toggle' );
				const isColorToggle =
					focused.getAttribute( 'data-wp-on--click' ) === 'actions.toggleTextColorMenu';
				if ( isHeadingToggle || isColorToggle ) {
					// Let the existing click handler open the menu.
					event.preventDefault();
					focused.click();
					requestAnimationFrame( () => {
						const menuSelector = isHeadingToggle ? '.bw-heading-menu' : '.bw-color-menu';
						const menu = toolbar.querySelector( menuSelector );
						const firstItem = menu?.querySelector( '[role="menuitem"]' );
						if ( firstItem ) firstItem.focus();
					} );
					return;
				}
				// Link button: restore selection, fire click — toggleLinkInput handles focus.
				const isLink = focused.getAttribute( 'data-wp-on--click' ) === 'actions.toggleLinkInput';
				if ( isLink ) {
					event.preventDefault();
					getContent()?.focus();
					restoreSelection();
					focused.click();
					return;
				}
				// All other buttons: focus editor first so execCommand has an active
				// editable context, then restore selection, then fire the action.
				event.preventDefault();
				getContent()?.focus();
				restoreSelection();
				focused.click();
			}
		},

		handleSubmenuKeyDown( event ) {
			const menu = event.currentTarget;
			const focused = menu.ownerDocument.activeElement;

			if (
				event.key === 'ArrowDown' ||
				event.key === 'ArrowUp' ||
				event.key === 'ArrowRight' ||
				event.key === 'ArrowLeft'
			) {
				event.preventDefault();
				const items = [ ...menu.querySelectorAll( '[role="menuitem"]' ) ].filter(
					item => ! item.disabled
				);
				const idx = items.indexOf( focused );
				const delta = event.key === 'ArrowDown' || event.key === 'ArrowRight' ? 1 : -1;
				items[ ( idx + delta + items.length ) % items.length ]?.focus();
				return;
			}

			if ( event.key === 'Enter' || event.key === ' ' ) {
				event.preventDefault();
				getContent()?.focus();
				restoreSelection();
				focused.click();
				return;
			}

			if ( event.key === 'Escape' ) {
				event.preventDefault();
				state.showHeadingMenu = false;
				state.showTextColorMenu = false;
				// Return focus to the toggle button that opened this menu.
				const toggle = menu.previousElementSibling;
				if ( toggle ) toggle.focus();
			}
		},

		// --- Inline formatting ---

		formatBold() {
			document.execCommand( 'bold' );
			state.formatBold = document.queryCommandState( 'bold' );
		},

		formatItalic() {
			document.execCommand( 'italic' );
			state.formatItalic = document.queryCommandState( 'italic' );
		},

		formatUnderline() {
			document.execCommand( 'underline' );
			state.formatUnderline = document.queryCommandState( 'underline' );
		},

		formatStrikethrough() {
			document.execCommand( 'strikeThrough' );
			state.formatStrikethrough = document.queryCommandState( 'strikeThrough' );
		},

		// --- Text color ---

		toggleTextColorMenu() {
			state.showTextColorMenu = ! state.showTextColorMenu;
			state.showHeadingMenu = false;
			// Always clean up any existing listener first.
			if ( textColorMenuCloseHandler ) {
				document.removeEventListener( 'click', textColorMenuCloseHandler );
				textColorMenuCloseHandler = null;
			}
			if ( state.showTextColorMenu ) {
				positionDropdownOnMobile( '.bw-color-menu' );
				textColorMenuCloseHandler = e => {
					if (
						e.target.closest( '.bw-color-menu' ) ||
						e.target.closest( '[data-wp-on--click="actions.toggleTextColorMenu"]' )
					)
						return;
					state.showTextColorMenu = false;
					document.removeEventListener( 'click', textColorMenuCloseHandler );
					textColorMenuCloseHandler = null;
				};
				setTimeout( () => document.addEventListener( 'click', textColorMenuCloseHandler ), 0 );
			}
		},

		setTextColorDefault() {
			// Use foreColor with the default text color instead of removeFormat,
			// which would strip all inline formatting (bold, italic, etc.).
			document.execCommand( 'foreColor', false, '#1a1a1a' );
			state.showTextColorMenu = false;
		},

		setTextColorRed() {
			document.execCommand( 'foreColor', false, '#d63638' );
			state.showTextColorMenu = false;
		},

		setTextColorBlue() {
			document.execCommand( 'foreColor', false, '#2171b1' );
			state.showTextColorMenu = false;
		},

		setTextColorGreen() {
			document.execCommand( 'foreColor', false, '#00a32a' );
			state.showTextColorMenu = false;
		},

		setTextColorYellow() {
			document.execCommand( 'foreColor', false, '#dba617' );
			state.showTextColorMenu = false;
		},

		setTextColorPurple() {
			document.execCommand( 'foreColor', false, '#8c5db0' );
			state.showTextColorMenu = false;
		},

		// --- Heading dropdown ---

		toggleHeadingMenu() {
			state.showHeadingMenu = ! state.showHeadingMenu;
			state.showTextColorMenu = false;
			// Always clean up any existing listener first.
			if ( headingMenuCloseHandler ) {
				document.removeEventListener( 'click', headingMenuCloseHandler );
				headingMenuCloseHandler = null;
			}
			if ( state.showHeadingMenu ) {
				positionDropdownOnMobile( '.bw-heading-menu' );
				headingMenuCloseHandler = e => {
					if (
						e.target.closest( '.bw-heading-menu' ) ||
						e.target.closest( '.bw-tool-heading-toggle' )
					)
						return;
					state.showHeadingMenu = false;
					document.removeEventListener( 'click', headingMenuCloseHandler );
					headingMenuCloseHandler = null;
				};
				setTimeout( () => document.addEventListener( 'click', headingMenuCloseHandler ), 0 );
			}
		},

		setHeadingNormal() {
			if ( ! exitListAndApplyBlock( 'p' ) ) {
				document.execCommand( 'formatBlock', false, 'p' );
			}
			state.formatHeading = false;
			state.formatUList = false;
			state.formatOList = false;
			state.headingLabel = i18n.normal || 'Normal';
			state.showHeadingMenu = false;
		},

		setHeadingH2() {
			if ( ! exitListAndApplyBlock( 'h2' ) ) {
				document.execCommand( 'formatBlock', false, 'h2' );
			}
			state.formatHeading = true;
			state.headingLabel = i18n.heading2 || 'Heading 2';
			state.formatQuote = false;
			state.formatUList = false;
			state.formatOList = false;
			state.showHeadingMenu = false;
		},

		setHeadingH3() {
			if ( ! exitListAndApplyBlock( 'h3' ) ) {
				document.execCommand( 'formatBlock', false, 'h3' );
			}
			state.formatHeading = true;
			state.headingLabel = i18n.heading3 || 'Heading 3';
			state.formatQuote = false;
			state.formatUList = false;
			state.formatOList = false;
			state.showHeadingMenu = false;
		},

		// --- Alignment ---

		alignLeft() {
			const bq = getActiveBlockquote();
			if ( bq ) {
				// Left is the default — remove explicit alignment from
				// the blockquote and any inner paragraphs.
				flushUndoDebounce();
				bq.style.removeProperty( 'text-align' );
				bq.querySelectorAll( ':scope > p, :scope > div' ).forEach( el => {
					el.style.removeProperty( 'text-align' );
				} );
				pushToUndoHistory();
			} else {
				document.execCommand( 'justifyLeft' );
				cleanupAlignmentDivs();
			}
			state.formatAlignLeft = true;
			state.formatAlignCenter = false;
			state.formatAlignRight = false;
			state.formatAlignJustify = false;
		},

		alignCenter() {
			const bq = getActiveBlockquote();
			if ( bq ) {
				// Apply alignment to the blockquote itself so
				// convertToBlocks reads it from node.style.textAlign.
				flushUndoDebounce();
				bq.style.textAlign = 'center';
				bq.querySelectorAll( ':scope > p, :scope > div' ).forEach( el => {
					el.style.removeProperty( 'text-align' );
				} );
				pushToUndoHistory();
			} else {
				document.execCommand( 'justifyCenter' );
				cleanupAlignmentDivs();
			}
			state.formatAlignLeft = false;
			state.formatAlignCenter = true;
			state.formatAlignRight = false;
			state.formatAlignJustify = false;
		},

		alignRight() {
			const bq = getActiveBlockquote();
			if ( bq ) {
				flushUndoDebounce();
				bq.style.textAlign = 'right';
				bq.querySelectorAll( ':scope > p, :scope > div' ).forEach( el => {
					el.style.removeProperty( 'text-align' );
				} );
				pushToUndoHistory();
			} else {
				document.execCommand( 'justifyRight' );
				cleanupAlignmentDivs();
			}
			state.formatAlignLeft = false;
			state.formatAlignCenter = false;
			state.formatAlignRight = true;
			state.formatAlignJustify = false;
		},

		alignJustify() {
			if ( state.cannotJustify ) return;
			document.execCommand( 'justifyFull' );
			cleanupAlignmentDivs();
			state.formatAlignLeft = false;
			state.formatAlignCenter = false;
			state.formatAlignRight = false;
			state.formatAlignJustify = true;
		},

		// --- Lists ---

		formatUList() {
			if ( changeListTagAtCursor( 'ul' ) ) {
				state.formatUList = true;
				state.formatOList = false;
			} else if ( exitBlockAndApplyList( 'ul' ) ) {
				state.formatUList = true;
				state.formatOList = false;
			} else {
				document.execCommand( 'insertUnorderedList' );
				state.formatUList = document.queryCommandState( 'insertUnorderedList' );
				state.formatOList = document.queryCommandState( 'insertOrderedList' );
			}
		},

		formatOList() {
			if ( changeListTagAtCursor( 'ol' ) ) {
				state.formatOList = true;
				state.formatUList = false;
			} else if ( exitBlockAndApplyList( 'ol' ) ) {
				state.formatOList = true;
				state.formatUList = false;
			} else {
				document.execCommand( 'insertOrderedList' );
				state.formatOList = document.queryCommandState( 'insertOrderedList' );
				state.formatUList = document.queryCommandState( 'insertUnorderedList' );
			}
		},

		// --- Block formatting ---

		formatQuote() {
			if ( state.formatQuote ) {
				if ( ! exitListAndApplyBlock( 'p' ) ) {
					document.execCommand( 'formatBlock', false, 'p' );
				}
				state.formatQuote = false;
			} else {
				if ( ! exitListAndApplyBlock( 'blockquote' ) ) {
					document.execCommand( 'formatBlock', false, 'blockquote' );
				}
				state.formatQuote = true;
				state.formatHeading = false;
			}
			state.formatUList = false;
			state.formatOList = false;
		},

		// --- Link ---

		toggleLinkInput() {
			// Always clean up any existing listener first.
			if ( linkPopoverCloseHandler ) {
				document.removeEventListener( 'click', linkPopoverCloseHandler );
				linkPopoverCloseHandler = null;
			}
			if ( state.showLinkInput ) {
				clearHighlight();
				restoreSelection();
				state.showLinkInput = false;
				return;
			}

			// Pre-fill if cursor is inside a link.  When the cursor is
			// collapsed inside an <a>, expand the selection to cover the
			// full link text so the highlight shows what will be affected.
			const sel = window.getSelection();
			let node = sel.anchorNode;
			state.linkUrl = '';
			while ( node && node !== document.body ) {
				if ( node.nodeType === Node.ELEMENT_NODE && node.tagName === 'A' ) {
					state.linkUrl = node.getAttribute( 'href' ) || '';
					if ( sel.isCollapsed ) {
						const range = document.createRange();
						range.selectNodeContents( node );
						sel.removeAllRanges();
						sel.addRange( range );
					}
					break;
				}
				node = node.parentNode;
			}

			// Save and highlight after any selection expansion above.
			saveSelection();
			highlightSelection();

			state.showLinkInput = true;

			// Focus the link input.
			requestAnimationFrame( () => {
				const popover = document.querySelector( '.bw-link-popover' );
				if ( ! popover ) return;
				const input = popover.querySelector( '.bw-link-input' );
				if ( input ) input.focus();
			} );

			// Close when clicking outside the popover.
			linkPopoverCloseHandler = e => {
				if (
					e.target.closest( '.bw-link-popover' ) ||
					e.target.closest( '[data-wp-on--click="actions.toggleLinkInput"]' )
				)
					return;
				clearHighlight();
				state.showLinkInput = false;
				document.removeEventListener( 'click', linkPopoverCloseHandler );
				linkPopoverCloseHandler = null;
			};
			setTimeout( () => document.addEventListener( 'click', linkPopoverCloseHandler ), 0 );
		},

		updateLinkUrl() {
			const el = getElement();
			state.linkUrl = el.ref.value;
		},

		handleLinkKeyDown( event ) {
			if ( event.key === 'Enter' ) {
				event.preventDefault();
				clearHighlight();
				restoreSelection();
				if ( state.linkUrl ) {
					createLinkFromUrl( state.linkUrl );
				}
				state.showLinkInput = false;
				if ( linkPopoverCloseHandler ) {
					document.removeEventListener( 'click', linkPopoverCloseHandler );
					linkPopoverCloseHandler = null;
				}
				const contentEl1 = getContent();
				if ( contentEl1 ) contentEl1.focus();
			}
			if ( event.key === 'Escape' ) {
				event.preventDefault();
				clearHighlight();
				restoreSelection();
				state.showLinkInput = false;
				if ( linkPopoverCloseHandler ) {
					document.removeEventListener( 'click', linkPopoverCloseHandler );
					linkPopoverCloseHandler = null;
				}
				const contentEl2 = getContent();
				if ( contentEl2 ) contentEl2.focus();
			}
		},

		applyLink() {
			clearHighlight();
			restoreSelection();
			if ( state.linkUrl ) {
				createLinkFromUrl( state.linkUrl );
			}
			state.showLinkInput = false;
			if ( linkPopoverCloseHandler ) {
				document.removeEventListener( 'click', linkPopoverCloseHandler );
				linkPopoverCloseHandler = null;
			}
			const content = getContent();
			if ( content ) content.focus();
		},

		removeLink() {
			clearHighlight();
			restoreSelection();
			document.execCommand( 'unlink' );
			state.showLinkInput = false;
			if ( linkPopoverCloseHandler ) {
				document.removeEventListener( 'click', linkPopoverCloseHandler );
				linkPopoverCloseHandler = null;
			}
			const content = getContent();
			if ( content ) content.focus();
		},

		// --- Image ---

		toggleFeaturedImage() {
			state.setAsFeatured = ! state.setAsFeatured;
			// In edit mode the toggle applies to the post immediately.  The
			// post-level featuredMediaId is the source of truth on save; we
			// set / clear it here so the change survives modal close.
			if ( state.isEditMode && editingFigure ) {
				const mediaId = getMediaIdFromImg( editingFigure.querySelector( 'img' ) );
				if ( ! mediaId ) return;
				state.featuredMediaId = state.setAsFeatured ? mediaId : 0;
			}
		},

		updateImageAlt() {
			const el = getElement();
			state.imageAlt = el.ref.value;
			// In edit mode, apply to the figure live.  Undo coalesces all
			// modal edits into a single history entry pushed on close.
			if ( state.isEditMode && editingFigure ) {
				const img = editingFigure.querySelector( 'img' );
				if ( img ) img.alt = state.imageAlt;
			}
		},

		setEditImageSize() {
			const el = getElement();
			const slug = el.ref.value;
			if ( ! editingFigure || ! IMAGE_SIZE_SLUGS.includes( slug ) ) return;
			state.editingImageSize = slug;
			setFigureSize( editingFigure, slug );
			trackMediaSizeSwap( applyMediaSizeToFigure( editingFigure, slug ) );
		},

		setEditImageAlign() {
			const el = getElement();
			const align = el.ref.value;
			if ( ! editingFigure || ! IMAGE_ALIGNS.includes( align ) ) return;
			state.editingImageAlign = align;
			setFigureAlignment( editingFigure, align );
		},

		/**
		 * Arrow / Home / End navigation within the Size and Alignment
		 * radiogroups in the edit panel. Implements the WAI-ARIA radio
		 * pattern: arrow keys move focus to the next/previous option AND
		 * activate it; Home / End jump to first / last; only the active
		 * option carries tabindex=0 so Tab moves out of the group.
		 *
		 * @param {KeyboardEvent} event - The keydown event.
		 */
		handleEditRadiogroupKeyDown( event ) {
			const nav = [ 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End' ];
			if ( ! nav.includes( event.key ) ) return;
			const group = event.currentTarget;
			const options = [ ...group.querySelectorAll( '[role="radio"]' ) ];
			if ( ! options.length ) return;
			event.preventDefault();
			const current = group.ownerDocument.activeElement;
			const idx = Math.max( 0, options.indexOf( current ) );
			let next;
			switch ( event.key ) {
				case 'ArrowLeft':
				case 'ArrowUp':
					next = options[ ( idx - 1 + options.length ) % options.length ];
					break;
				case 'ArrowRight':
				case 'ArrowDown':
					next = options[ ( idx + 1 ) % options.length ];
					break;
				case 'Home':
					next = options[ 0 ];
					break;
				case 'End':
					next = options[ options.length - 1 ];
					break;
			}
			if ( next ) {
				next.focus();
				// Activate the new option — the radio pattern selects on
				// move (vs. menu, which moves focus without selecting).
				next.click();
			}
		},

		openImageModal() {
			// Image insertion needs an upload endpoint and a media library; neither
			// is available without auth, and CSS hides the entry point. The guard
			// here covers programmatic callers (slash menu, etc.).
			if ( isAnon() ) {
				return;
			}
			// If the edit panel is open for an existing image, end that
			// session first so the user's changes land as a discrete undo
			// entry before the insert overlay replaces the panel.
			endEditSession();
			saveSelection();
			state.imageUrl = '';
			state.imageAlt = '';
			resetImageModalInputs();
			state.setAsFeatured = false;
			state.uploadedMediaId = 0;
			resetUploadZone();
			state.showImageModal = true;
			// Every open starts from the upload-default state; library/URL
			// expanders collapse and search resets so the next open looks
			// identical to the first.
			state.showLibraryPicker = false;
			state.showUrlInput = false;
			state.librarySearch = '';
			// Lock the page behind the modal so the editor can't scroll under
			// the dimmed backdrop. The non-modal edit panel (editImage) does
			// not lock — it docks bottom-right and the editor stays usable.
			document.body.classList.add( 'bw-modal-open' );
			focusModalInput();
		},

		toggleLibraryPicker() {
			if ( isAnon() ) {
				return;
			}
			state.showLibraryPicker = ! state.showLibraryPicker;
			// Lazy-fetch the library on first expand, and refresh on every
			// reopen so a just-uploaded image appears at the top.
			if ( state.showLibraryPicker ) {
				state.librarySearch = '';
				fetchLibrary();
			}
		},

		toggleUrlInput() {
			state.showUrlInput = ! state.showUrlInput;
			// When opening, focus the URL field for immediate typing.
			if ( state.showUrlInput ) {
				requestAnimationFrame( () => {
					document.querySelector( '.bw-url-section input[type="url"]' )?.focus();
				} );
			}
		},

		searchLibrary() {
			const el = getElement();
			state.librarySearch = el.ref.value;
			clearTimeout( librarySearchTimer );
			// 250ms debounce keeps us under the WP REST rate even while typing
			// quickly without feeling laggy on a fast network.
			librarySearchTimer = setTimeout( fetchLibrary, 250 );
		},

		selectLibraryImage( event ) {
			// Delegated handler on the grid container — find the actual
			// thumbnail button regardless of whether the click landed on the
			// button, its inner <img>, or some descendant.
			const btn = event.target.closest( '.bw-library-thumb' );
			if ( ! btn ) return;
			const id = parseInt( btn.dataset.mediaId, 10 );
			if ( ! id ) return;
			const item = libraryItems.find( m => m.id === id );
			if ( ! item ) return;

			// Match the upload-success path: populate the URL/alt fields and
			// stamp the media id so insertImageFromUrl tags the figure with
			// wp-image-<id> and applies the Large size preset.  Alt only
			// overwrites a blank field so a user who already typed alt for a
			// different image they were considering doesn't lose their work.
			state.imageUrl = item.source_url;
			if ( ! state.imageAlt && item.alt_text ) {
				state.imageAlt = item.alt_text;
			}
			state.uploadedMediaId = item.id;
			mediaSizesCache.set( item.id, item.media_details?.sizes || null );
			showUploadPreview( item.source_url );

			// Announce the selection through the modal's aria-live region so
			// screen-reader users get audible confirmation that the click
			// registered (the preview itself is purely visual).
			const label = item.alt_text || item.title?.rendered || '';
			const template = window.wpcomWriteStrings?.librarySelected || 'Selected %s';
			state.libraryStatus = template.replace( '%s', label );
		},

		editImage( figure, triggerEl ) {
			// `figure` and `triggerEl` are passed by the per-image Edit pencil
			// handler — not by Interactivity bindings — so we accept them as
			// arguments rather than reading from getElement().
			if ( ! figure ) return;
			const img = figure.querySelector( 'img' );
			if ( ! img ) return;

			// Switching mid-edit from one image's panel to another: commit
			// the previous session as a discrete undo entry and clear the
			// outline on the old figure before retargeting.
			if ( state.isEditMode && editingFigure && editingFigure !== figure ) {
				editingFigure.classList.remove( 'bw-figure-editing' );
				pushToUndoHistory();
			}

			editingFigure = figure;
			editTriggerEl = triggerEl || null;
			figure.classList.add( 'bw-figure-editing' );
			state.isEditMode = true;
			state.imageAlt = img.alt || '';
			state.editingImageAlign = getFigureAlignment( figure );
			state.editingImageSize =
				IMAGE_SIZE_SLUGS.find( s => figure.classList.contains( 'size-' + s ) ) || '';

			const mediaId = getMediaIdFromImg( img );
			state.editingImageHasMediaId = !! mediaId;
			state.setAsFeatured = !! ( mediaId && state.featuredMediaId === mediaId );

			// Block-editor inserts often omit `sizeSlug` even though the img
			// src matches a registered size — so the figure has no `size-X`
			// class and the panel would show no size as selected.  When that
			// happens, fall back to matching the img URL against the media
			// library's registered sizes so the panel reflects what the user
			// actually sees.  Stamp the matched class onto the figure so the
			// figure is self-describing and round-trips through save.
			if ( ! state.editingImageSize && mediaId ) {
				inferSizeFromImgSrc( figure ).then( slug => {
					if ( slug && figure === editingFigure ) {
						state.editingImageSize = slug;
						setFigureSize( figure, slug );
					}
				} );
			}

			state.showImageModal = true;
			focusModalInput();

			// On mobile the panel slides up as a bottom sheet that covers
			// roughly the lower half of the viewport. Scroll the figure
			// near the top so it stays visible while the user edits.
			if ( window.matchMedia( '(max-width: 640px)' ).matches ) {
				requestAnimationFrame( () => {
					figure.scrollIntoView( { block: 'start', behavior: 'smooth' } );
				} );
			}
		},

		closeImageModal() {
			// endEditSession returns the Edit pencil that opened the panel
			// (when we were in edit mode) so we can return focus there.
			const triggerToRefocus = endEditSession();
			state.showImageModal = false;
			state.imageUrl = '';
			state.imageAlt = '';
			state.setAsFeatured = false;
			state.uploadedMediaId = 0;
			document.body.classList.remove( 'bw-modal-open' );
			resetUploadZone();
			restoreSelection();
			if ( triggerToRefocus && document.contains( triggerToRefocus ) ) {
				triggerToRefocus.focus();
			} else {
				getContent()?.focus();
			}
		},

		handleImageModalKeyDown( event ) {
			if ( event.key === 'Escape' ) {
				const { actions: a } = store( 'wpcom-write' );
				a.closeImageModal();
				return;
			}
			if ( event.key === 'Tab' ) {
				const modal = event.currentTarget.querySelector( '.bw-image-modal' );
				if ( ! modal ) return;
				// Filter to currently-rendered elements only. The collapsible
				// library/URL sections live inside the modal but use the
				// `hidden` attribute on their wrapper — `:not([hidden])` on
				// the input itself doesn't catch that, so without the
				// offsetParent check those inputs would land in the trap's
				// boundaries even though Tab can't actually reach them, and
				// focus would fall out of the modal.
				const focusable = Array.from(
					modal.querySelectorAll( 'input:not([hidden]), button, [tabindex]:not([tabindex="-1"])' )
				).filter( el => el.offsetParent !== null && ! el.disabled );
				if ( ! focusable.length ) return;
				const first = focusable[ 0 ];
				const last = focusable[ focusable.length - 1 ];
				const active = modal.ownerDocument.activeElement;
				if ( event.shiftKey && ( active === first || ! modal.contains( active ) ) ) {
					event.preventDefault();
					last.focus();
				} else if ( ! event.shiftKey && ( active === last || ! modal.contains( active ) ) ) {
					event.preventDefault();
					first.focus();
				}
			}
		},

		// Close whichever media modal is open, but only when the pointerdown
		// lands directly on the overlay backdrop — not when it starts inside
		// the modal (e.g. while selecting text in an input) and drags out.
		handleOverlayPointerDown( event ) {
			if ( event.button !== 0 || event.target !== event.currentTarget ) return;
			const { actions: a } = store( 'wpcom-write' );
			if ( state.showImageModal ) {
				a.closeImageModal();
			} else if ( state.showVideoModal ) {
				a.closeVideoModal();
			}
		},

		stopPropagation( event ) {
			event.stopPropagation();
		},

		updateImageUrl() {
			const el = getElement();
			// Typing in the URL field overrides any pending upload — clear
			// the media ID so insertImageFromUrl doesn't apply uploaded-size
			// behavior to a manually pasted external URL.
			if ( state.uploadedMediaId && el.ref.value !== state.imageUrl ) {
				state.uploadedMediaId = 0;
			}
			state.imageUrl = el.ref.value;
		},

		insertImageFromUrl() {
			if ( ! state.imageUrl ) return;

			// Handle featured image from uploaded media.
			if ( state.setAsFeatured && state.uploadedMediaId ) {
				state.featuredMediaId = state.uploadedMediaId;
			}

			restoreSelection();
			const figure = document.createElement( 'figure' );
			const img = document.createElement( 'img' );
			img.src = state.imageUrl;
			img.alt = state.imageAlt || '';

			if ( state.uploadedMediaId ) {
				// Media-library image: tag it for round-trip with the block
				// editor and swap src to the Large-sized URL so the natural
				// img dimensions match the default preset.
				img.className = 'wp-image-' + state.uploadedMediaId;
				figure.className = 'bw-image-figure size-large aligncenter';
				figure.appendChild( img );
				trackMediaSizeSwap( applyMediaSizeToFigure( figure, 'large' ) );
			} else {
				// External URL (no media library entry, no resized files):
				// no size preset — the per-image Size button is hidden, matching
				// block editor behavior.
				figure.className = 'bw-image-figure aligncenter';
				figure.appendChild( img );
			}

			const p = insertMediaBlock( figure );
			if ( p ) {
				placeCursorAt( p );
			}

			state.showImageModal = false;
			document.body.classList.remove( 'bw-modal-open' );
			resetUploadZone();
			pushToUndoHistory();
		},

		async uploadImage() {
			const el = getElement();
			const file = el.ref.files[ 0 ];
			if ( ! file ) return;
			await uploadFileToMedia( file );
		},

		handleDragOver( event ) {
			event.preventDefault();
			event.stopPropagation();
			const zone = document.getElementById( 'bw-upload-zone' );
			if ( zone ) zone.classList.add( 'bw-drag-over' );
		},

		handleDragLeave( event ) {
			event.preventDefault();
			event.stopPropagation();
			const zone = document.getElementById( 'bw-upload-zone' );
			if ( zone ) zone.classList.remove( 'bw-drag-over' );
		},

		async handleDrop( event ) {
			event.preventDefault();
			event.stopPropagation();
			const zone = document.getElementById( 'bw-upload-zone' );
			if ( zone ) zone.classList.remove( 'bw-drag-over' );

			const file = event.dataTransfer?.files?.[ 0 ];
			if ( ! file || ! file.type.startsWith( 'image/' ) ) {
				return;
			}
			await uploadFileToMedia( file );
		},

		handleOverlayDragOver( event ) {
			event.preventDefault();
		},

		async handleOverlayDrop( event ) {
			event.preventDefault();
			const file = event.dataTransfer?.files?.[ 0 ];
			if ( ! file || ! file.type.startsWith( 'image/' ) ) {
				return;
			}
			await uploadFileToMedia( file );
		},

		handleEditorDragStart( event ) {
			// Image figures are contentEditable=false atoms inside an
			// editable parent. Without an explicit handler the browser
			// drags them as opaque HTML and the editor's drop branch
			// (which only handles File drags) lets the native
			// copy-on-drop behaviour insert a duplicate. Tag the drag as
			// a move and remember the source so the dragover/drop
			// branches below relocate it instead of falling through.
			const figure = event.target?.closest?.( 'figure, .bw-image-figure, .bw-video-figure' );
			const content = getContent();
			if ( ! figure || ! content?.contains( figure ) ) return;

			draggingFigure = figure;
			if ( event.dataTransfer ) {
				event.dataTransfer.effectAllowed = 'move';
				// Overwrite the default HTML/text payload the browser
				// stages when dragging an <img>. If we ever fail to
				// preventDefault on drop, an empty payload means no
				// stray content is inserted.
				try {
					event.dataTransfer.setData( 'text/plain', '' );
				} catch {
					// Some browsers throw if setData is called outside a
					// real dragstart. Safe to ignore — preventDefault on
					// drop is the primary guard.
				}
			}
		},

		handleEditorDragOver( event ) {
			// File drags from disk: keep the original "insert at drop
			// point" behaviour.
			if ( event.dataTransfer?.types?.includes( 'Files' ) ) {
				event.preventDefault();
				event.dataTransfer.dropEffect = 'copy';
				updateDropIndicator( event.clientX, event.clientY );
				return;
			}
			// Internal figure drag: opt in to drop and show the move
			// cursor. Without preventDefault here the drop event never
			// fires inside the editor.
			if ( draggingFigure ) {
				event.preventDefault();
				if ( event.dataTransfer ) event.dataTransfer.dropEffect = 'move';
				updateDropIndicator( event.clientX, event.clientY );
			}
			// Text/selection drags inside the editor: leave to the
			// browser's contentEditable default.
		},

		handleEditorDragLeave( event ) {
			// dragleave fires when the pointer crosses any child element
			// boundary; only clear the visual state when the drag truly
			// leaves the editor wrapper.
			if ( event.relatedTarget && event.currentTarget.contains( event.relatedTarget ) ) {
				return;
			}
			clearDropIndicator();
		},

		handleEditorDrop( event ) {
			// Internal figure move.
			if ( draggingFigure ) {
				event.preventDefault();
				const figure = draggingFigure;
				const target = currentDropTarget;
				const position = currentDropPosition;
				clearDropIndicator();
				draggingFigure = null;

				if ( target && moveFigureToBlock( figure, target, position ) ) {
					ensureBlockStructure();
					pushToUndoHistory();
				}
				return;
			}

			if ( ! event.dataTransfer?.types?.includes( 'Files' ) ) return;
			event.preventDefault();
			clearDropIndicator();

			if ( isAnon() ) {
				return;
			}

			const images = Array.from( event.dataTransfer.files || [] ).filter( f =>
				f.type.startsWith( 'image/' )
			);
			if ( ! images.length ) return;

			// Place the caret at the drop point once before inserting.
			// Each insertMediaBlock leaves the caret in the trailing
			// paragraph, so subsequent figures naturally stack below.
			// If the drop lands outside the editable area, fall back to
			// the end of the content.
			const content = getContent();
			if ( content && ! placeCaretAtPoint( event.clientX, event.clientY ) ) {
				placeCursorAtEnd( content );
			}

			for ( const file of images ) {
				uploadAndInsertImage( file );
			}
		},

		handleEditorDragEnd() {
			// Safety net: dragend always fires (even on cancelled or
			// out-of-editor drops), so this is the canonical place to
			// drop the drag state and any stale drop indicator.
			draggingFigure = null;
			clearDropIndicator();
		},

		// --- Slash commands ---

		insertHeading() {
			flushUndoDebounce();
			insertNewBlock( 'h2' );
			pushToUndoHistory();
		},

		insertImage() {
			// Slash-menu image insert: clean up the slash UI, then delegate
			// to openImageModal so the modal opens in the same reset state as
			// the toolbar entry (collapsed expanders + scroll lock).
			flushUndoDebounce();
			clearSlashText();
			clearSlashActive();
			state.showSlashMenu = false;
			store( 'wpcom-write' ).actions.openImageModal();
		},

		insertBulletedList() {
			flushUndoDebounce();
			insertNewList( 'ul' );
			pushToUndoHistory();
		},

		insertNumberedList() {
			flushUndoDebounce();
			insertNewList( 'ol' );
			pushToUndoHistory();
		},

		insertQuote() {
			flushUndoDebounce();
			insertNewBlock( 'blockquote' );
			pushToUndoHistory();
		},

		insertVideo() {
			clearSlashText();
			clearSlashActive();
			state.showSlashMenu = false;
			saveSelection();
			state.showVideoModal = true;
			state.videoUrl = '';
			focusModalInput();
		},

		closeVideoModal() {
			state.showVideoModal = false;
			state.videoUrl = '';
			restoreSelection();
			getContent()?.focus();
		},

		handleVideoModalKeyDown( event ) {
			if ( event.key === 'Escape' ) {
				const { actions: a } = store( 'wpcom-write' );
				a.closeVideoModal();
				return;
			}
			if ( event.key === 'Tab' ) {
				const modal = event.currentTarget.querySelector( '.bw-image-modal' );
				if ( ! modal ) return;
				const focusable = modal.querySelectorAll(
					'input:not([hidden]), button, [tabindex]:not([tabindex="-1"])'
				);
				if ( ! focusable.length ) return;
				const first = focusable[ 0 ];
				const last = focusable[ focusable.length - 1 ];
				const active = modal.ownerDocument.activeElement;
				if ( event.shiftKey && ( active === first || ! modal.contains( active ) ) ) {
					event.preventDefault();
					last.focus();
				} else if ( ! event.shiftKey && ( active === last || ! modal.contains( active ) ) ) {
					event.preventDefault();
					first.focus();
				}
			}
		},

		updateVideoUrl() {
			const el = getElement();
			state.videoUrl = el.ref.value;
		},

		handleVideoKeyDown( event ) {
			if ( event.key === 'Enter' ) {
				event.preventDefault();
				const { actions } = store( 'wpcom-write' );
				actions.insertVideoEmbed();
			}
		},

		insertVideoEmbed() {
			if ( ! state.videoUrl ) return;

			const embedUrl = getEmbedUrl( state.videoUrl );
			if ( ! embedUrl ) {
				state.message = i18n.invalidVideoUrl || 'Please paste a valid YouTube or Vimeo URL';
				setTimeout( () => {
					state.message = '';
				}, 3000 );
				return;
			}

			restoreSelection();

			const wrapper = document.createElement( 'figure' );
			wrapper.className = 'bw-video-figure';
			const videoWrap = document.createElement( 'div' );
			videoWrap.className = 'bw-video-wrap';
			const iframe = document.createElement( 'iframe' );
			iframe.setAttribute( 'src', embedUrl );
			iframe.setAttribute( 'frameborder', '0' );
			iframe.setAttribute( 'allowfullscreen', '' );
			videoWrap.appendChild( iframe );
			wrapper.appendChild( videoWrap );

			const p = insertMediaBlock( wrapper );
			if ( p ) {
				placeCursorAt( p );
			}

			state.showVideoModal = false;
			pushToUndoHistory();
		},

		insertDivider() {
			flushUndoDebounce();
			clearSlashText();
			const hr = document.createElement( 'hr' );
			const p = document.createElement( 'p' );
			p.innerHTML = '<br>';

			const sel = window.getSelection();
			if ( sel.rangeCount ) {
				const range = sel.getRangeAt( 0 );
				// Find the parent block to insert after.
				let block = range.startContainer;
				while (
					block &&
					block.parentNode &&
					! block.parentNode.classList.contains( 'bw-content-inner' )
				) {
					block = block.parentNode;
				}
				if ( block && block.parentNode ) {
					block.after( hr );
					hr.after( p );
					// Remove empty block left behind.
					if ( block.textContent.trim() === '' ) {
						block.remove();
					}
					ensureBlockStructure();
					// Move cursor to new paragraph.
					placeCursorAt( p );
				}
			}
			clearSlashActive();
			state.showSlashMenu = false;
			pushToUndoHistory();
		},

		// --- UI toggles ---

		toggleHelp() {
			state.showHelp = ! state.showHelp;
			if ( state.showHelp ) {
				const close = e => {
					if ( e.target.closest( '.bw-help-wrap' ) ) return;
					state.showHelp = false;
					document.removeEventListener( 'click', close );
				};
				setTimeout( () => document.addEventListener( 'click', close ), 0 );
			}
		},

		handleHelpKeyDown( event ) {
			if ( event.key === 'Escape' ) {
				event.preventDefault();
				state.showHelp = false;
				event.currentTarget.querySelector( '.bw-help-toggle' )?.focus();
			}
		},

		handleHelpFocusOut( event ) {
			const wrap = event.currentTarget;
			if ( ! wrap.contains( event.relatedTarget ) ) {
				state.showHelp = false;
			}
		},

		// --- Topbar "more" menu (Open in block editor / Preview) ---

		toggleMoreMenu() {
			state.showMoreMenu = ! state.showMoreMenu;
			if ( state.showMoreMenu ) {
				const close = e => {
					if ( e.target.closest( '.bw-more-wrap' ) ) return;
					state.showMoreMenu = false;
					document.removeEventListener( 'click', close );
				};
				setTimeout( () => document.addEventListener( 'click', close ), 0 );
			}
		},

		handleMoreMenuKeyDown( event ) {
			const wrap = event.currentTarget;
			const menu = wrap.querySelector( '.bw-more-menu' );
			const items = menu ? [ ...menu.querySelectorAll( '.bw-more-menu-item' ) ] : [];
			const onToggle = !! event.target.closest( '.bw-more-toggle' );

			if ( event.key === 'Escape' ) {
				event.preventDefault();
				state.showMoreMenu = false;
				// Defer so the focus-restoration happens after the Interactivity
				// state update; otherwise focus can land on <body>.
				const toggle = wrap.querySelector( '.bw-more-toggle' );
				requestAnimationFrame( () => toggle?.focus() );
				return;
			}

			// Open the menu from the toggle with ArrowDown/ArrowUp and move focus
			// to the first/last item respectively.
			if ( onToggle && ( event.key === 'ArrowDown' || event.key === 'ArrowUp' ) ) {
				event.preventDefault();
				state.showMoreMenu = true;
				const target = event.key === 'ArrowUp' ? items[ items.length - 1 ] : items[ 0 ];
				requestAnimationFrame( () => target?.focus() );
				return;
			}

			if ( ! state.showMoreMenu || ! items.length ) {
				return;
			}

			const focused = wrap.ownerDocument.activeElement;
			const idx = items.indexOf( focused );

			if ( event.key === 'ArrowDown' || event.key === 'ArrowUp' ) {
				event.preventDefault();
				const delta = event.key === 'ArrowDown' ? 1 : -1;
				let next;
				if ( idx < 0 ) {
					next = delta > 0 ? 0 : items.length - 1;
				} else {
					next = ( idx + delta + items.length ) % items.length;
				}
				items[ next ]?.focus();
			} else if ( event.key === 'Home' ) {
				event.preventDefault();
				items[ 0 ]?.focus();
			} else if ( event.key === 'End' ) {
				event.preventDefault();
				items[ items.length - 1 ]?.focus();
			}
		},

		handleMoreMenuFocusOut( event ) {
			const wrap = event.currentTarget;
			if ( ! wrap.contains( event.relatedTarget ) ) {
				state.showMoreMenu = false;
			}
		},

		async openInBlockEditor() {
			state.showMoreMenu = false;
			if ( isAnon() ) {
				return;
			}

			// New posts need a save to create the underlying post before we
			// have a URL to navigate to. Surface the same "Please write
			// something" hint the publish flow shows so the menu doesn't
			// appear unresponsive on an empty page.
			if ( ! state.editPostId && ! hasWritableContent() ) {
				state.message = i18n.pleaseWriteSomething || 'Please write something';
				setTimeout( () => {
					state.message = '';
				}, 2500 );
				return;
			}

			// For unpublished posts, silently save the draft first so the
			// block editor opens with current edits (and to create the post
			// if it's new). For published posts, hand off to the block
			// editor without auto-saving — we don't want to silently push
			// unsaved Write edits live.
			if ( state.postStatus !== 'publish' && ( isDirty() || ! state.editPostId ) ) {
				await savePost( 'draft', true );
			}
			if ( ! state.editPostId ) {
				// Save failed for some other reason — abort.
				return;
			}

			// Prefer the SSR-seeded URL; fall back to building it for posts
			// created in this session (no SSR-seeded URL yet).
			const url =
				state.blockEditorUrl ||
				state.adminUrl +
					'post.php?post=' +
					state.editPostId +
					'&action=edit&classic-editor__forget';
			allowLeave = true;
			window.location.href = url;
		},

		async previewPost() {
			state.showMoreMenu = false;
			if ( isAnon() ) {
				return;
			}

			if ( ! state.editPostId && ! hasWritableContent() ) {
				state.message = i18n.pleaseWriteSomething || 'Please write something';
				setTimeout( () => {
					state.message = '';
				}, 2500 );
				return;
			}

			// For unpublished posts, silently save the draft first so preview
			// reflects current edits (and creates the post if it's new).
			// For published posts, open the live URL without auto-saving to
			// avoid silently pushing unsaved edits live.
			if ( state.postStatus !== 'publish' && ( isDirty() || ! state.editPostId ) ) {
				await savePost( 'draft', true );
			}
			if ( ! state.editPostId ) {
				return;
			}

			// Use the SSR-seeded preview URL when available — it includes any
			// nonce returned by get_preview_post_link(). For posts created in
			// this session, build the draft preview URL from state.homeUrl.
			const url = state.previewUrl || state.homeUrl + '?p=' + state.editPostId + '&preview=true';
			window.open( url, '_blank', 'noopener,noreferrer' );
		},

		// --- Post picker ---

		openPostPicker() {
			state.showMoreMenu = false;
			if ( isAnon() ) {
				return;
			}

			if ( isDirty() ) {
				state.pendingOpenPost = true;
				state.showLeaveConfirm = true;
				requestAnimationFrame( () => {
					const modal = document.querySelector( '.bw-leave-modal' );
					if ( modal ) {
						const first = modal.querySelector( 'button' );
						if ( first ) first.focus();
					}
				} );
				return;
			}

			showPostPickerModal();
		},

		closePostPicker() {
			state.showPostPicker = false;
			state.postPickerUrl = '';
			state.openPostError = '';
			document.documentElement.style.overflow = '';
			const toggle = document.querySelector( '.bw-more-toggle' );
			if ( toggle ) toggle.focus();
		},

		openPickedPost( event ) {
			const postId = event.target.closest( '[data-post-id]' )?.dataset?.postId;
			if ( postId ) {
				if ( window.wpcomTracksRecordEvent ) {
					window.wpcomTracksRecordEvent( 'wpcom_write_post_picker_select', {
						post_id: parseInt( postId, 10 ),
						source: 'draft_list',
					} );
				}
				allowLeave = true;
				window.location.href = state.writeUrl + '&post=' + postId;
			}
		},

		updatePostPickerUrl( event ) {
			state.postPickerUrl = event.target.value;
		},

		async submitPostPickerUrl() {
			const input = state.postPickerUrl.trim();
			if ( ! input ) return;

			const numericId = parsePostId( input );
			if ( window.wpcomTracksRecordEvent ) {
				window.wpcomTracksRecordEvent( 'wpcom_write_post_picker_go', {
					input_type: numericId ? 'numeric_id' : 'url',
					source: 'url_input',
				} );
			}

			if ( numericId ) {
				// Validate the post exists and is editable before navigating.
				try {
					await window.wp.apiFetch( {
						path: state.postsPath + '/' + numericId + '?context=edit&_fields=id',
						method: 'GET',
					} );
				} catch ( err ) {
					const status = err?.data?.status;
					if ( status === 403 ) {
						state.openPostError =
							i18n.postNoPermission || "You don't have permission to edit this post.";
					} else {
						state.openPostError =
							i18n.postNotFound || 'Post not found. Check the URL or ID and try again.';
					}
					return;
				}
				allowLeave = true;
				window.location.href = state.writeUrl + '&post=' + numericId;
			} else {
				// Reject input that isn't URL-shaped before hitting the server.
				const normalized = /^https?:\/\//i.test( input ) ? input : 'https://' + input;
				let parsed;
				try {
					parsed = new URL( normalized );
				} catch {
					state.openPostError =
						i18n.postNotFound || 'Post not found. Check the URL or ID and try again.';
					return;
				}
				if ( ! parsed.hostname.includes( '.' ) ) {
					state.openPostError =
						i18n.postNotFound || 'Post not found. Check the URL or ID and try again.';
					return;
				}

				// If the pasted URL is same-site and contains a numeric ?p= or
				// ?post= param, navigate directly with &post=<id> instead of
				// passing the full URL through &url=. This avoids carrying
				// unrelated params (preview nonces, tracking params, etc.) into
				// the address bar and server logs.
				const homeHost = new URL( state.homeUrl ).hostname;
				if ( parsed.hostname === homeHost ) {
					const qp = parsed.searchParams.get( 'p' ) || parsed.searchParams.get( 'post' );
					const extractedId = qp ? parseInt( qp, 10 ) : 0;
					if ( extractedId > 0 ) {
						allowLeave = true;
						window.location.href = state.writeUrl + '&post=' + extractedId;
						return;
					}
				}

				// Pretty permalinks and other URL shapes: delegate resolution
				// to PHP's url_to_postid(). Server-side checks the host against
				// home_url() and enforces edit_post capability.
				allowLeave = true;
				window.location.href = state.writeUrl + '&url=' + encodeURIComponent( normalized );
			}
		},

		handlePostPickerInputKeyDown( event ) {
			if ( event.key === 'Enter' ) {
				event.preventDefault();
				const { actions: a } = store( 'wpcom-write' );
				a.submitPostPickerUrl();
			}
		},

		handlePostPickerOverlayClick( event ) {
			if ( event.button !== 0 || event.target !== event.currentTarget ) return;
			const { actions: a } = store( 'wpcom-write' );
			a.closePostPicker();
		},

		handlePostPickerKeyDown( event ) {
			if ( event.key === 'Escape' ) {
				event.preventDefault();
				const { actions: a } = store( 'wpcom-write' );
				a.closePostPicker();
				return;
			}

			const active = event.target.ownerDocument.activeElement;
			const items = [ ...document.querySelectorAll( '.bw-postpicker-item' ) ];
			if ( items.length ) {
				const idx = items.indexOf( active );
				let next = -1;
				if ( event.key === 'ArrowDown' ) {
					next = idx < items.length - 1 ? idx + 1 : 0;
				} else if ( event.key === 'ArrowUp' ) {
					next = idx > 0 ? idx - 1 : items.length - 1;
				}
				if ( next >= 0 ) {
					event.preventDefault();
					items.forEach( el => el.setAttribute( 'tabindex', '-1' ) );
					items[ next ].setAttribute( 'tabindex', '0' );
					items[ next ].focus();
				}
			}

			if ( event.key === 'Tab' ) {
				const modal = document.querySelector( '.bw-postpicker-modal' );
				if ( ! modal ) return;
				const focusable = [
					...modal.querySelectorAll( 'button, input, [tabindex]:not([tabindex="-1"])' ),
				];
				if ( ! focusable.length ) return;
				const first = focusable[ 0 ];
				const last = focusable[ focusable.length - 1 ];
				if ( event.shiftKey && active === first ) {
					event.preventDefault();
					last.focus();
				} else if ( ! event.shiftKey && active === last ) {
					event.preventDefault();
					first.focus();
				}
			}
		},

		// --- Inline category meta ---

		toggleCatDropdown( event ) {
			event.stopPropagation();
			state.showCatDropdown = ! state.showCatDropdown;
			if ( state.showCatDropdown ) {
				syncCatDropdownItems();
			}
		},

		handleCatBtnKeyDown( event ) {
			if ( event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ' ) {
				event.preventDefault();
				if ( ! state.showCatDropdown ) {
					state.showCatDropdown = true;
					syncCatDropdownItems();
				}
				// Focus first item once the dropdown is visible.
				requestAnimationFrame( () => {
					const first = document.querySelector( '#bw-cat-dropdown .bw-meta-dropdown-item' );
					if ( first ) first.focus();
				} );
			} else if ( event.key === 'Escape' ) {
				state.showCatDropdown = false;
			}
		},

		handleCatDropdownKeyDown( event ) {
			const dropdown = event.currentTarget;
			const focused = dropdown.ownerDocument.activeElement;
			const items = [ ...dropdown.querySelectorAll( '.bw-meta-dropdown-item' ) ];

			if ( event.key === 'ArrowDown' || event.key === 'ArrowUp' ) {
				event.preventDefault();
				const idx = items.indexOf( focused );
				const delta = event.key === 'ArrowDown' ? 1 : -1;
				items[ ( idx + delta + items.length ) % items.length ]?.focus();
			} else if ( event.key === 'Enter' || event.key === ' ' ) {
				event.preventDefault();
				focused.click();
			} else if ( event.key === 'Escape' ) {
				event.preventDefault();
				state.showCatDropdown = false;
				document.querySelector( '.bw-meta-cat-btn' )?.focus();
			}
		},

		handleCatFocusOut( event ) {
			if ( ! event.currentTarget.contains( event.relatedTarget ) ) {
				state.showCatDropdown = false;
			}
		},

		handleCatDropdownClick( event ) {
			const item = event.target.closest( '.bw-meta-dropdown-item' );
			if ( ! item ) {
				return;
			}
			const idx = parseInt( item.dataset.catIndex, 10 );
			if ( ! isNaN( idx ) && state.categories[ idx ] ) {
				state.categories[ idx ].selected = ! state.categories[ idx ].selected;
				syncCatDropdownItems();
				updateCatLabel();
			}
		},

		async publish() {
			if ( isAnon() ) {
				// The publish-intent event — the moment an anon visitor hits the
				// signup wall. Captured before navigating away so it isn't lost to
				// the handoff. word_count / draft_size_bytes size the draft; the
				// server open event and this share the tk_ai identity for stitching.
				const contentEl = getContent();
				const rawHtml = contentEl ? contentEl.innerHTML : '';
				const plainText = contentEl ? contentEl.textContent || '' : '';
				const words = plainText.trim() ? plainText.trim().split( /\s+/ ).length : 0;
				const draftContent = rawHtml ? convertToBlocks( rawHtml ) : '';

				// Flush the latest draft snapshot before navigating — autosave is
				// on a 30s tick, and a fast typer-then-clicker would otherwise
				// hand off stale (or no) content to the signup flow.
				captureAnonSnapshot();

				// Suppress the dirty-state leave prompt the way every other
				// internal navigation in this file does (cf. openInBlockEditor).
				allowLeave = true;

				// Record publish-intent and let the pixel dispatch before the
				// redirect. wpcom Tracks beacons via `new Image()`, whose in-flight
				// GET the browser cancels on unload — so a synchronous navigate
				// would drop this event. The wait is bounded (and skipped entirely
				// when Tracks isn't loaded) so the handoff is never stalled.
				await recordTracksEventBeforeUnload( 'wpcom_write_editor_anon_publish_click', {
					word_count: words,
					time_to_publish_ms: Date.now() - ANON_EDITOR_OPENED_AT,
					draft_size_bytes:
						typeof Blob !== 'undefined' ? new Blob( [ draftContent ] ).size : draftContent.length,
				} );

				// Anon visitors hand off to the signup flow, which reads the draft
				// from localStorage and publishes after signup completes.
				window.location.assign( 'https://wordpress.com/setup/write-on' );
				return;
			}
			await savePost( 'publish' );
		},

		async saveDraft() {
			if ( isAnon() ) {
				// Anon persists to localStorage on every autosave tick; an
				// explicit "save draft" maps to the same operation.
				captureAnonSnapshot();
				lastSavedSnapshot = getContentSnapshot();
				return;
			}
			await savePost( 'draft' );
		},

		async saveDraftFromMenu() {
			state.showMoreMenu = false;
			if ( isAnon() ) {
				captureAnonSnapshot();
				lastSavedSnapshot = getContentSnapshot();
				return;
			}
			await savePost( 'draft' );
		},

		/**
		 * Perform a periodic autosave if the editor is dirty.
		 */
		async autosave() {
			// Skip autosave for published posts — partial edits should not go live silently.
			// Users can still save manually via the unsaved-changes modal.
			if (
				state.unsupportedWarning ||
				! isDirty() ||
				state.isSaving ||
				state.isPublished ||
				state.postStatus === 'publish'
			) {
				return;
			}

			// Require at least a title or content before autosaving.
			const contentEl = getContent();
			const hasContent = state.title.trim() || ( contentEl && contentEl.textContent.trim() );
			if ( ! hasContent ) {
				return;
			}

			if ( isAnon() ) {
				// Anon visitors have no server post; snapshot the editable HTML
				// to localStorage so a refresh can rehydrate via the recovery banner.
				captureAnonSnapshot();
				lastSavedSnapshot = getContentSnapshot();
				return;
			}

			await savePost( 'draft', true );
		},

		/**
		 * Resume editing an autosaved draft.
		 */
		resumeDraft() {
			if ( isAnon() ) {
				// Anon snapshot is a JSON blob, not a server post id — hydrate the
				// editor in place rather than navigating.
				const snapshot = readAnonDraft();
				if ( snapshot ) {
					state.title = snapshot.title;
					// The title <textarea> binds input → state.title one-way; mutating
					// state alone does not update the field, so set the DOM value too
					// (matching applyUndoSnapshot's pattern).
					const titleEl = document.querySelector( '.bw-title' );
					if ( titleEl ) {
						titleEl.value = snapshot.title;
						titleEl.style.height = 'auto';
						titleEl.style.height = titleEl.scrollHeight + 'px';
					}
					const contentEl = getContent();
					if ( contentEl ) {
						contentEl.innerHTML = snapshot.content;
					}
					// The CSS placeholder is driven by `bw-is-empty` on the outer
					// `.bw-content`, normally removed by the first input event.
					// Programmatic hydration fires no input, so clear it directly.
					if ( snapshot.content ) {
						document.querySelector( '.bw-content' )?.classList.remove( 'bw-is-empty' );
					}
					lastSavedSnapshot = getContentSnapshot();
				}
				state.showRecoveryBanner = false;
				return;
			}
			const draftId = localStorage.getItem( AUTOSAVE_STORAGE_KEY );
			if ( draftId && /^\d+$/.test( draftId ) ) {
				localStorage.removeItem( AUTOSAVE_STORAGE_KEY );
				window.location.href = state.writeUrl + '&post=' + draftId;
			}
		},

		/**
		 * Dismiss the recovery banner and discard the autosaved draft reference.
		 */
		dismissRecovery() {
			if ( isAnon() ) {
				clearAnonDraft();
			} else {
				localStorage.removeItem( AUTOSAVE_STORAGE_KEY );
			}
			state.showRecoveryBanner = false;
		},

		dismissDisclaimer() {
			localStorage.setItem( DISCLAIMER_STORAGE_KEY, '1' );
			state.showDisclaimer = false;
		},

		// --- Unsupported content warning ---
		goBack() {
			const sameOrigin =
				document.referrer && new URL( document.referrer ).origin === window.location.origin;
			if ( sameOrigin && window.history.length > 1 ) {
				window.history.back();
			} else {
				window.location.href = state.adminUrl + 'edit.php';
			}
		},

		openEditor() {
			if ( state.editorUrl ) {
				window.location.href = state.editorUrl;
			}
		},

		handleUnsupportedKeyDown( event ) {
			if ( event.key === 'Escape' ) {
				event.preventDefault();
				const { actions } = store( 'wpcom-write' );
				actions.goBack();
				return;
			}

			// Trap Tab within the modal.
			if ( event.key === 'Tab' ) {
				const modal = document.querySelector( '.bw-unsupported-modal' );
				if ( ! modal ) return;
				const focusable = modal.querySelectorAll( 'button:not([hidden])' );
				if ( ! focusable.length ) return;
				const first = focusable[ 0 ];
				const last = focusable[ focusable.length - 1 ];
				const active = modal.ownerDocument.activeElement;
				if ( event.shiftKey && active === first ) {
					event.preventDefault();
					last.focus();
				} else if ( ! event.shiftKey && active === last ) {
					event.preventDefault();
					first.focus();
				}
			}
		},
	},
} );

/**
 * Open the post picker modal, fire a Tracks event, and focus the first item.
 */
function showPostPickerModal() {
	document.documentElement.style.overflow = 'hidden';
	state.showPostPicker = true;
	state.openPostError = '';
	if ( window.wpcomTracksRecordEvent ) {
		window.wpcomTracksRecordEvent( 'wpcom_write_post_picker_open', {
			has_drafts: state.recentDrafts.length > 0,
			draft_count: state.recentDrafts.length,
		} );
	}
	requestAnimationFrame( () => {
		const firstItem = document.querySelector( '.bw-postpicker-item' );
		const urlInput = document.getElementById( 'bw-postpicker-url-input' );
		( firstItem || urlInput )?.focus();
	} );
}

// --- Save failure telemetry (RSM-4323) ---
//
// Diagnostic Tracks events for save/publish failures. Today a throw during
// content preparation, or a request stalled by a proxy/VPN/ad blocker, leaves
// the Publish and Save buttons disabled with no error surfaced and nothing in
// Tracks — so we can't see it happening. These events add observability only;
// they intentionally do not change the save behavior. view.js is served
// unminified, so error_code + error_message read against real line numbers,
// and `phase` localizes which stage failed without needing a full stack trace.

// Report a save that has neither resolved nor rejected within this window.
const SAVE_STALL_THRESHOLD_MS = 30000;
// Cap free-text error strings so a pathological message can't bloat the payload.
const MAX_ERROR_MESSAGE_LENGTH = 200;

/**
 * Normalize an unknown thrown value into a small, Tracks-friendly descriptor.
 *
 * Handles the shapes `wp.apiFetch` actually rejects with: WP REST errors
 * ( `{ code, message, data: { status } }` ), native/AbortError ( `{ name,
 * message }` ), and non-object throws as a last resort.
 *
 * @param {*} err - The thrown value.
 * @return {{ code: string, status: (number|null), message: string }} Descriptor.
 */
function describeSaveError( err ) {
	if ( ! err || typeof err !== 'object' ) {
		const raw = err === undefined ? '' : String( err );
		return { code: 'unknown', status: null, message: raw.slice( 0, MAX_ERROR_MESSAGE_LENGTH ) };
	}
	// Prefer the specific REST `code`; fall back to `name` ('AbortError', 'TypeError', …).
	const code = err.code || err.name || 'unknown';
	const status = err.data && typeof err.data.status === 'number' ? err.data.status : null;
	const message = String( err.message || '' ).slice( 0, MAX_ERROR_MESSAGE_LENGTH );
	return { code: String( code ), status, message };
}

/**
 * Fire the `wpcom_write_editor_save_failed` Tracks event.
 *
 * @param {*}       err                - The thrown value.
 * @param {object}  context            - Save context.
 * @param {string}  context.postStatus - The attempted status ('publish' or 'draft').
 * @param {boolean} context.isAutosave - Whether the failed save was a periodic autosave.
 * @param {boolean} context.isUpdate   - Whether this was an update to a published post.
 * @param {boolean} context.isEditing  - Whether an existing post was being edited.
 * @param {string}  context.phase      - Stage that failed ('prepare' | 'save_request').
 */
function recordSaveFailed( err, { postStatus, isAutosave, isUpdate, isEditing, phase } ) {
	const { code, status, message } = describeSaveError( err );
	window._tkq = window._tkq || [];
	window._tkq.push( [
		'recordEvent',
		'wpcom_write_editor_save_failed',
		{
			post_status: postStatus,
			is_autosave: !! isAutosave,
			is_update: !! isUpdate,
			is_new_post: ! isEditing,
			phase,
			error_code: code,
			error_status: status,
			error_message: message,
		},
	] );
}

/**
 * Fire the `wpcom_write_editor_save_stalled` Tracks event for a save request
 * that never settled within the watchdog window.
 *
 * @param {object}  context            - Save context.
 * @param {string}  context.postStatus - The attempted status ('publish' or 'draft').
 * @param {boolean} context.isAutosave - Whether the stalled save was a periodic autosave.
 * @param {boolean} context.isUpdate   - Whether this was an update to a published post.
 * @param {boolean} context.isEditing  - Whether an existing post was being edited.
 * @param {string}  context.phase      - Stage that stalled ('prepare' | 'save_request').
 * @param {number}  context.elapsedMs  - The watchdog threshold that elapsed, in ms.
 */
function recordSaveStalled( { postStatus, isAutosave, isUpdate, isEditing, phase, elapsedMs } ) {
	window._tkq = window._tkq || [];
	window._tkq.push( [
		'recordEvent',
		'wpcom_write_editor_save_stalled',
		{
			post_status: postStatus,
			is_autosave: !! isAutosave,
			is_update: !! isUpdate,
			is_new_post: ! isEditing,
			phase,
			elapsed_ms: elapsedMs,
		},
	] );
}

/**
 * Save or publish the current post via the REST API.
 *
 * Thin wrapper around performSave() that reports any throw during content
 * preparation or tag resolution — code that runs before the save request's own
 * try/catch and today surfaces as a silent unhandled rejection. It re-throws to
 * preserve current behavior; this is an observability-only change (RSM-4323).
 *
 * @param {string}  postStatus - The desired post status ('publish' or 'draft').
 * @param {boolean} isAutosave - Whether this is a periodic autosave (quieter UX).
 */
async function savePost( postStatus, isAutosave = false ) {
	// Shared with performSave so a prep-stage throw here can clear the stall
	// watchdog performSave armed — otherwise it would fire a spurious
	// save_stalled ~30s after a save that already failed.
	const saveCtx = {};
	try {
		await performSave( postStatus, isAutosave, saveCtx );
	} catch ( err ) {
		// Save-request failures are handled inside performSave; anything caught
		// here threw during content prep / tag resolution. Report, then re-throw
		// so behavior is unchanged.
		clearTimeout( saveCtx.stallWatchdog );
		recordSaveFailed( err, {
			postStatus,
			isAutosave,
			isUpdate: state.editPostId > 0 && state.postStatus === 'publish',
			isEditing: state.editPostId > 0,
			phase: 'prepare',
		} );
		throw err;
	}
}

/**
 * Perform the save/publish request. See savePost() for the failure-telemetry wrapper.
 *
 * @param {string}  postStatus - The desired post status ('publish' or 'draft').
 * @param {boolean} isAutosave - Whether this is a periodic autosave (quieter UX).
 * @param {object}  saveCtx    - Cross-call scratch; receives the stall watchdog handle.
 */
async function performSave( postStatus, isAutosave = false, saveCtx = {} ) {
	if ( ! isAutosave ) {
		// Use textContent rather than innerHTML so structural-only markup
		// (e.g. <p><br></p> left over from clearing the editor) doesn't
		// pass the client-side guard and reach the server, which would
		// return a confusing "title, content, or excerpt is empty" error.
		if ( ! hasWritableContent() ) {
			state.message = i18n.pleaseWriteSomething || 'Please write something';
			setTimeout( () => {
				state.message = '';
			}, 2500 );
			return;
		}
	}

	const isEditing = state.editPostId > 0;
	const isUpdate = isEditing && state.postStatus === 'publish';

	state.isSaving = true;
	if ( ! isAutosave ) {
		let savingMessage = i18n.savingDraft || 'Saving draft...';
		if ( isUpdate ) {
			savingMessage = i18n.updating || 'Updating...';
		} else if ( postStatus === 'publish' ) {
			savingMessage = i18n.publishing || 'Publishing...';
		}
		state.message = savingMessage;
	}

	// Watchdog: report (without aborting) a save that neither resolves nor rejects
	// within the threshold — e.g. one held open by a proxy, VPN, or ad blocker.
	// Armed here, before the pre-save awaits below (media-size swaps, tag
	// resolution), so a hang in either of those is caught too — not just a hang
	// in the main save request. `stallPhase` narrows the report to prep vs. the
	// request. Cleared as soon as the flow settles or early-returns.
	let stallPhase = 'prepare';
	const stallWatchdog = ( saveCtx.stallWatchdog = setTimeout( () => {
		recordSaveStalled( {
			postStatus,
			isAutosave,
			isUpdate,
			isEditing,
			phase: stallPhase,
			elapsedMs: SAVE_STALL_THRESHOLD_MS,
		} );
	}, SAVE_STALL_THRESHOLD_MS ) );

	// Wait for any in-flight image size swaps to finish so the saved
	// content's img.src matches its size-* class. Without this, a save
	// fired between a size click and the REST response would serialize
	// the new size class with the old src.
	if ( pendingMediaSizeSwaps.size ) {
		await Promise.allSettled( [ ...pendingMediaSizeSwaps ] );
	}

	// Ensure the live DOM has proper structure before cloning — this
	// converts any gap-only state into a real editable paragraph so
	// the save doesn't produce blank content.
	ensureBlockStructure();

	// Clone the content so we can strip editor-only elements without
	// disrupting the live DOM (gaps and selection highlights stay visible
	// while the save request is in flight).
	const contentEl = getContent();
	const clone = contentEl.cloneNode( true );
	clone.querySelectorAll( '.bw-block-gap' ).forEach( el => el.remove() );
	// Strip empty paragraphs in gap positions (between two non-editable
	// blocks, or at the edge with no sibling). These are promoted gaps
	// the user never typed into. Don't strip intentional empty paragraphs
	// that happen to be next to a single figure.
	clone.querySelectorAll( ':scope > p' ).forEach( p => {
		if ( p.textContent && p.textContent.trim() ) return;
		const prev = p.previousElementSibling;
		const next = p.nextElementSibling;
		const isGapPosition =
			( isNonEditableBlock( prev ) && isNonEditableBlock( next ) ) ||
			( ! prev && isNonEditableBlock( next ) ) ||
			( ! next && isNonEditableBlock( prev ) );
		if ( isGapPosition ) {
			p.remove();
		}
	} );
	clone.querySelectorAll( '.bw-figure-selected, .bw-figure-editing' ).forEach( el => {
		el.classList.remove( 'bw-figure-selected', 'bw-figure-editing' );
	} );
	// Also strip the contenteditable attribute from figures — it's a
	// runtime attribute that shouldn't be persisted.
	clone.querySelectorAll( 'figure[contenteditable]' ).forEach( el => {
		el.removeAttribute( 'contenteditable' );
	} );
	clone.querySelectorAll( 'blockquote cite' ).forEach( el => {
		el.removeAttribute( 'data-placeholder' );
		el.removeAttribute( 'aria-label' );
	} );
	stripRuntimeFigureControls( clone );

	// Safety net: if stripping editor-only elements left the clone
	// empty, treat it the same as no content.
	if ( ! clone.innerHTML.trim() ) {
		clearTimeout( stallWatchdog );
		state.message = i18n.pleaseWriteSomething || 'Please write something';
		state.isSaving = false;
		setTimeout( () => {
			state.message = '';
		}, 2500 );
		return;
	}

	// Snapshot what we're about to send so dirty tracking compares against
	// the submitted content, not whatever the DOM contains when the request resolves.
	const submittedSnapshot = getContentSnapshot();

	// Extract #tags from lines that contain only hashtag tokens (e.g. "#travel #food").
	// Those paragraphs are metadata, not body text — strip them from the saved content.
	// Each # starts a new tag, and a tag may contain spaces ("#New York"). To keep prose
	// that merely starts with a # ("#1 reason you should read this") out of the tag list,
	// each tag is capped at three whitespace-separated words. The char right after # must
	// be a non-# non-space, so "# Heading" and "## Heading" stay body text.
	const tagNames = [];
	clone.querySelectorAll( ':scope > p' ).forEach( p => {
		const text = p.textContent.trim();
		if ( /^(#[^#\s]+(?:\s+[^#\s]+){0,2}\s*)+$/.test( text ) ) {
			text
				.split( '#' )
				.slice( 1 )
				.forEach( name => {
					const trimmed = name.trim();
					if ( trimmed ) {
						tagNames.push( trimmed );
					}
				} );
			p.remove();
		}
	} );

	const blockMarkup = convertToBlocks( clone.innerHTML );

	// Collect selected category IDs.
	const selectedCats = state.categories.filter( c => c.selected ).map( c => c.id );

	// Resolve extracted tag names to WP term IDs only when #tag paragraphs are present.
	// When present, merge with existing tag IDs so tags set outside the Write editor survive.
	// Omitting `tags` entirely when no #tag lines exist preserves existing tags without fetching.
	// WordPress returns a term_exists error (with the existing ID) for duplicates.
	const tagData = {};
	if ( tagNames.length ) {
		const newTagIds = await Promise.all(
			tagNames.map( name =>
				window.wp
					.apiFetch( { path: '/wp/v2/tags', method: 'POST', data: { name } } )
					.then( tag => tag.id )
					.catch( err => err?.data?.term_id ?? null )
			)
		).then( ids => ids.filter( Boolean ) );
		tagData.tags = [ ...new Set( [ ...( state.existingTagIds || [] ), ...newTagIds ] ) ];
	}

	// If editing, PUT to the existing post. If new, POST to create.
	const path = isEditing ? state.postsPath + '/' + state.editPostId : state.postsPath;

	// Prep is done; a stall from here on is the main save request itself.
	stallPhase = 'save_request';

	try {
		const post = await window.wp.apiFetch( {
			path,
			method: 'POST',
			data: {
				title: state.title,
				content: blockMarkup,
				status: postStatus,
				categories: selectedCats,
				...tagData,
				featured_media: state.featuredMediaId || 0,
				wpcom_write_editor_used: true,
			},
		} );
		clearTimeout( stallWatchdog );

		// Store the post ID so subsequent saves update the same post.
		if ( ! isEditing ) {
			state.editPostId = post.id;
		}

		// Keep existingTagIds in sync so the next save in this session merges correctly.
		if ( tagData.tags ) {
			state.existingTagIds = tagData.tags;
		}

		// Mark only the submitted content as saved — if the user typed
		// during the request the editor stays dirty.
		lastSavedSnapshot = submittedSnapshot;

		if ( isAutosave ) {
			// Quiet autosave — no redirect, no localStorage clear.
			state.hasSaved = true;
			state.isSaving = false;
			state.message = i18n.draftAutosaved || 'Draft saved';
			localStorage.setItem( AUTOSAVE_STORAGE_KEY, String( post.id ) );
			setTimeout( () => {
				state.message = '';
			}, AUTOSAVE_MESSAGE_DURATION_MS );
		} else if ( postStatus === 'publish' ) {
			state.isPublished = true;
			state.message = isUpdate ? i18n.updated || 'Updated!' : i18n.published || 'Published!';
			// Clear any autosave draft reference on publish.
			localStorage.removeItem( AUTOSAVE_STORAGE_KEY );

			// Track publish event client-side for reliable Write editor attribution.
			window._tkq = window._tkq || [];
			window._tkq.push( [
				'recordEvent',
				'wpcom_write_editor_post_published',
				{ post_id: post.id, is_update: isUpdate },
			] );
			setTimeout( () => {
				// Hide the page before navigating so the bfcache snapshot
				// stores it hidden — prevents a flash of stale content if
				// the user later presses Back.
				document.documentElement.style.visibility = 'hidden';

				// On a Coming Soon site the published post is still private. Tag
				// the redirect so the post-publish next-steps checklist (launch +
				// share) surfaces on the post the author lands on. Public sites
				// redirect to the bare permalink, unchanged.
				let destination = post.link;
				if ( state.isComingSoon ) {
					try {
						const url = new URL( post.link );
						url.searchParams.set( state.publishedMarker || 'wpcom_write_published', '1' );
						destination = url.href;
					} catch {
						// Fall back to the bare permalink if it can't be parsed.
					}
				}
				window.location.href = destination;
			}, 800 );
		} else {
			state.editPostId = post.id;
			state.hasSaved = true;
			state.message = i18n.draftSaved || 'Draft saved';
			state.isSaving = false;
			// Clear autosave reference — user explicitly saved.
			localStorage.removeItem( AUTOSAVE_STORAGE_KEY );

			window._tkq = window._tkq || [];
			window._tkq.push( [
				'recordEvent',
				'wpcom_write_editor_draft_saved',
				{ is_new_post: ! isEditing, post_id: post.id },
			] );
			setTimeout( () => {
				state.message = '';
			}, 2500 );
		}
	} catch ( err ) {
		clearTimeout( stallWatchdog );
		recordSaveFailed( err, { postStatus, isAutosave, isUpdate, isEditing, phase: 'save_request' } );
		state.isSaving = false;
		if ( ! isAutosave ) {
			state.message = ( i18n.error || 'Error: %s' ).replace( '%s', err.message );
			setTimeout( () => {
				state.message = '';
			}, 4000 );
		}
	}
}

// --- Autosave timer and recovery ---

// Disable browser scroll restoration so the editor always starts at the top.
// Without this, refreshing while scrolled down restores the old scroll offset.
if ( 'scrollRestoration' in history ) {
	history.scrollRestoration = 'manual';
}
window.scrollTo( 0, 0 );

// Start the autosave interval once the content area is ready.
const autosaveReady = setInterval( () => {
	const contentEl = document.querySelector( '.bw-content' );
	if ( ! contentEl ) return;
	clearInterval( autosaveReady );

	// Capture the initial snapshot so edits are detected relative to load state.
	updateSavedSnapshot();
	// Seed the undo history with the initial content so Cmd+Z can return to it.
	pushToUndoHistory();

	// Focus the unsupported-content warning modal when present on load
	// and prevent background scrolling while the overlay is visible.
	if ( state.unsupportedWarning ) {
		document.body.style.overflow = 'hidden';
		requestAnimationFrame( () => {
			const btn = document.querySelector( '.bw-unsupported-open-editor:not([hidden])' );
			if ( btn ) btn.focus();
		} );
	}

	// Start the periodic autosave timer.
	const { actions } = store( 'wpcom-write' );
	autosaveTimer = setInterval( () => {
		actions.autosave();
	}, AUTOSAVE_INTERVAL_MS );

	// Show the beta disclaimer unless previously dismissed. Anon visitors
	// skip this entirely — not just because the banner is irrelevant, but
	// because the layout's sibling selectors (`.bw-disclaimer-banner:not(
	// [hidden]) ~ .bw-toolbar`) push the toolbar down based on the `hidden`
	// attribute, which the Interactivity API only sets when the state is
	// false. Leaving state true would shift the toolbar down by 44px even
	// though our anon CSS hides the banner itself.
	if ( ! isAnon() && ! localStorage.getItem( DISCLAIMER_STORAGE_KEY ) ) {
		state.showDisclaimer = true;
	}

	// Check for a recoverable autosaved draft (only for new posts).
	if ( isAnon() ) {
		// Anon recovery reads a JSON snapshot rather than a post id. Show the
		// banner only when the snapshot has any actual content to restore — an
		// empty record is no better than starting fresh.
		const snapshot = readAnonDraft();
		if ( snapshot && ( snapshot.title || snapshot.content ) ) {
			state.showRecoveryBanner = true;
		}
	} else if ( ! state.editPostId ) {
		const draftId = localStorage.getItem( AUTOSAVE_STORAGE_KEY );
		if ( draftId ) {
			state.showRecoveryBanner = true;
		}
	} else {
		// Editing an existing post — clear any stale autosave reference.
		const savedDraftId = localStorage.getItem( AUTOSAVE_STORAGE_KEY );
		if ( savedDraftId && String( state.editPostId ) === savedDraftId ) {
			localStorage.removeItem( AUTOSAVE_STORAGE_KEY );
		}
	}

	// Populate relative dates in the post picker draft list.
	document.querySelectorAll( '.bw-postpicker-item-date[data-modified]' ).forEach( el => {
		el.textContent = formatRelativeDate( el.dataset.modified );
	} );

	// If the page was loaded via ?url= and resolved to a post, replace the
	// address-bar URL with the canonical ?post=<id> form so the raw URL
	// the user pasted doesn't linger.
	if ( state.editPostId ) {
		const params = new URLSearchParams( window.location.search );
		if ( params.has( 'url' ) ) {
			params.delete( 'url' );
			params.set( 'post', state.editPostId );
			history.replaceState( null, '', window.location.pathname + '?' + params.toString() );
		}
	}

	// Auto-open the post picker if there's an error from the server.
	if ( state.openPostError ) {
		document.documentElement.style.overflow = 'hidden';
		state.showPostPicker = true;
		requestAnimationFrame( () => {
			const urlInput = document.getElementById( 'bw-postpicker-url-input' );
			if ( urlInput ) urlInput.focus();
		} );
	}
}, 200 );

// Warn before leaving if there are unsaved changes.
window.addEventListener( 'beforeunload', event => {
	if ( isDirty() && ! state.isPublished && ! allowLeave ) {
		event.preventDefault();
	}
} );

// If the page is restored from bfcache after a publish, redirect to a
// fresh editor.  On publish the isSaving flag is intentionally left true
// (buttons stay disabled while the redirect fires), so a bfcache restore
// would strand the user on a "done" page with grayed-out buttons.
window.addEventListener( 'pageshow', event => {
	if ( event.persisted && state.isPublished ) {
		window.location.replace( state.writeUrl );
	}
} );

// Clean up autosave timer on page unload.
window.addEventListener( 'pagehide', () => {
	if ( autosaveTimer ) {
		clearInterval( autosaveTimer );
	}
} );

// Cmd+S (Mac) / Ctrl+S (Windows/Linux) — trigger the primary save action,
// matching whichever button is visible (Save draft on a draft, Update on a
// published post). Attached at the document level so the shortcut works
// regardless of which field has focus.
document.addEventListener( 'keydown', event => {
	if ( event.key?.toLowerCase() !== 's' ) return;
	if ( ! ( event.ctrlKey || event.metaKey ) ) return;
	if ( event.shiftKey || event.altKey ) return;
	if ( state.isSaving || state.unsupportedWarning || state.hasBlockingModal ) {
		return;
	}

	event.preventDefault();
	const { actions } = store( 'wpcom-write' );
	if ( state.isPublishedPost ) {
		actions.publish();
	} else {
		actions.saveDraft();
	}
} );

// Escape closes the image edit panel from anywhere on the page. The panel
// is non-modal — focus may live in the editor, the title, or anywhere
// outside the panel itself — so it needs a global Escape handler instead
// of relying on the panel's own keydown.  Skipped when a blocking overlay
// is open (those handle Escape themselves) and when an active text-editing
// surface might want Escape for its own purposes (the alt-text input
// inside the panel uses default behavior — losing focus on Escape is OK).
document.addEventListener( 'keydown', event => {
	if ( event.key !== 'Escape' ) return;
	if ( ! state.isEditMode ) return;
	if ( state.hasBlockingModal ) return;
	event.preventDefault();
	const { actions } = store( 'wpcom-write' );
	actions.closeImageModal();
} );

// File-drop safety net: .bw-content has min-height:60vh but doesn't
// fill the rest of the viewport, and a long post can extend below the
// viewport entirely. A file dropped outside .bw-content would otherwise
// be opened by the browser. Catch file drags at the window level so
// dropping anywhere on the Write page inserts at the end of the post
// instead of navigating away from the editor.
window.addEventListener( 'dragover', event => {
	if ( ! event.dataTransfer?.types?.includes( 'Files' ) ) return;
	event.preventDefault();
	event.dataTransfer.dropEffect = 'copy';
} );

window.addEventListener( 'drop', event => {
	if ( ! event.dataTransfer?.types?.includes( 'Files' ) ) return;
	if ( isAnon() ) {
		// No upload endpoint for anon — prevent the default file-open behavior
		// (matching the rest of this handler) but skip the upload path.
		event.preventDefault();
		return;
	}
	// The editor (.bw-content) and the image-modal overlay each have
	// their own data-wp-on--drop handlers; those fire on the inner
	// target first and bubble up to here. Check via composedPath rather
	// than target.closest because the editor handler removes the empty
	// <p> that was the drop target (insertMediaBlock collapses an empty
	// trailing paragraph into the figure), leaving event.target detached
	// and breaking ancestor lookups. composedPath is snapshotted at
	// dispatch time and stays valid through the mutation.
	const path = event.composedPath();
	if (
		path.some(
			el => el instanceof Element && el.matches?.( '.bw-content, .bw-image-overlay:not([hidden])' )
		)
	) {
		return;
	}
	event.preventDefault();

	const images = Array.from( event.dataTransfer.files || [] ).filter( f =>
		f.type.startsWith( 'image/' )
	);
	if ( ! images.length ) return;

	const content = getContent();
	if ( ! content ) return;
	placeCursorAtEnd( content );
	for ( const file of images ) {
		uploadAndInsertImage( file );
	}
} );
