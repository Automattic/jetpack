/**
 * Write — WordPress.com — Interactivity API Store
 *
 * A distraction-free front-end writing experience.
 * Creates WordPress posts with proper block markup via the REST API.
 */

/* eslint-disable @wordpress/no-global-get-selection -- Write serves a full page, not an iframe or shadow DOM. */

// eslint-disable-next-line import/no-unresolved -- Provided by WordPress at runtime via wp_register_script_module.
import { store, getElement, getContext } from '@wordpress/interactivity';

// Translated strings passed from PHP via wp_print_inline_script_tag.
const i18n = window.wpcomWriteStrings || {};

// Autosave configuration.
const AUTOSAVE_INTERVAL_MS = 30000; // 30 seconds.
const AUTOSAVE_MESSAGE_DURATION_MS = 2000;
const AUTOSAVE_STORAGE_KEY = 'wpcom-write-autosave-draft';

// Autosave state — tracked outside the store to avoid triggering reactivity.
let lastSavedSnapshot = { title: '', content: '' };
let autosaveTimer = null;
let allowLeave = false;

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

// Track the figure currently "selected" by the first Backspace/Delete press.
// A second press on the same figure deletes it.
let selectedFigure = null;

// The cursor range saved before a figure is selected so it can be restored
// if the user cancels the selection (Escape, click, or typing a letter).
let preFigureSelectionRange = null;

let cachedContent = null;

/**
 * Get the content editable element, caching the reference.
 *
 * @return {Element|null} The .bw-content element.
 */
function getContent() {
	if ( ! cachedContent || ! cachedContent.isConnected ) {
		cachedContent = document.querySelector( '.bw-content' );
	}
	return cachedContent;
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
 * Focus the first visible input inside a modal after it becomes visible.
 * Uses requestAnimationFrame so the element is no longer hidden.
 */
function focusModalInput() {
	requestAnimationFrame( () => {
		const overlay = document.querySelector( '.bw-image-overlay:not([hidden])' );
		if ( ! overlay ) return;
		const input = overlay.querySelector( 'input:not([hidden])' );
		if ( input ) input.focus();
	} );
}

/**
 * Normalize color markup from contentEditable before block serialization.
 *
 * The foreColor command creates <font color="..."> (legacy) or
 * <span style="color:..."> (modern). Convert both to clean <span> elements
 * with inline styles, and strip the default text color (#1a1a1a).
 *
 * @param {HTMLElement} container - The container to normalize in place.
 */
function normalizeColorMarkup( container ) {
	// Convert <font color="..."> to <span style="color:...">.
	container.querySelectorAll( 'font[color]' ).forEach( font => {
		const color = font.getAttribute( 'color' );
		const span = document.createElement( 'span' );
		// Skip default color — unwrap the element entirely.
		if ( color && color.toLowerCase() !== '#1a1a1a' ) {
			span.style.color = color;
		}
		span.innerHTML = font.innerHTML;
		font.replaceWith( span );
	} );

	// Strip default-colored spans (unwrap them, keeping their content).
	container.querySelectorAll( 'span' ).forEach( span => {
		const color = span.style.color;
		if ( ! color ) return;
		// Detect default color in various formats.
		const isDefault = color === '#1a1a1a' || color === 'rgb(26, 26, 26)';
		if ( isDefault ) {
			span.replaceWith( ...span.childNodes );
		}
	} );
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
		const inner = node.innerHTML.trim();

		if ( ! inner && ! [ 'figure', 'img', 'hr' ].includes( tag ) ) continue;

		// Check for text alignment.
		const align = node.style && node.style.textAlign;
		const alignAttr =
			align && [ 'center', 'right' ].includes( align ) ? ` style="text-align:${ align }"` : '';
		const alignJson =
			align && [ 'center', 'right' ].includes( align ) ? `,"align":"${ align }"` : '';

		if ( tag === 'p' || tag === 'div' ) {
			blocks.push(
				`<!-- wp:paragraph${
					alignJson ? ` {${ alignJson.slice( 1 ) }}` : ''
				} -->\n<p${ alignAttr }>${ inner }</p>\n<!-- /wp:paragraph -->`
			);
		} else if ( /^h[1-6]$/.test( tag ) ) {
			const level = parseInt( tag.charAt( 1 ), 10 );
			blocks.push(
				`<!-- wp:heading {"level":${ level }${ alignJson }} -->\n<${ tag } class="wp-block-heading"${ alignAttr }>${ inner }</${ tag }>\n<!-- /wp:heading -->`
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
			blocks.push(
				`<!-- wp:image -->\n<figure class="wp-block-image"><img src="${ src }" alt="${ alt }"/>${ captionHtml }</figure>\n<!-- /wp:image -->`
			);
		} else if ( tag === 'blockquote' ) {
			// inner may already contain <p> tags from contentEditable.
			const quoteInner = inner.startsWith( '<p' ) ? inner : `<p>${ inner }</p>`;
			const hasQuoteAlign = align && [ 'center', 'right' ].includes( align );
			const quoteAlignAttr = hasQuoteAlign ? ` style="text-align:${ align }"` : '';
			const quoteAlignJson = hasQuoteAlign ? ` {"align":"${ align }"}` : '';
			blocks.push(
				`<!-- wp:quote${ quoteAlignJson } -->\n<blockquote class="wp-block-quote"${ quoteAlignAttr }>${ quoteInner }</blockquote>\n<!-- /wp:quote -->`
			);
		} else if ( tag === 'ul' ) {
			blocks.push(
				`<!-- wp:list -->\n<ul class="wp-block-list">${ inner }</ul>\n<!-- /wp:list -->`
			);
		} else if ( tag === 'ol' ) {
			blocks.push(
				`<!-- wp:list {"ordered":true} -->\n<ol class="wp-block-list">${ inner }</ol>\n<!-- /wp:list -->`
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
				menu
					.querySelectorAll( '.bw-slash-item-active' )
					.forEach( el => el.classList.remove( 'bw-slash-item-active' ) );
			},
			{ once: true }
		);
	}
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

		// Alt text button (only for images, not videos).
		const imgEl = controls.querySelector( 'img' );
		if ( ! imgEl ) return;

		const altBtn = document.createElement( 'button' );
		altBtn.className = 'bw-img-alt';
		altBtn.textContent = i18n.alt || 'ALT';
		altBtn.contentEditable = 'false';
		altBtn.addEventListener( 'click', e => {
			e.preventDefault();
			e.stopPropagation();

			const existing = controls.querySelector( '.bw-img-alt-input' );
			if ( existing ) {
				existing.remove();
				return;
			}

			const input = document.createElement( 'input' );
			input.type = 'text';
			input.className = 'bw-img-alt-input';
			input.placeholder = i18n.describeImage || 'Describe this image...';
			input.value = imgEl.alt || '';
			input.contentEditable = 'false';
			input.addEventListener( 'click', ev => ev.stopPropagation() );
			input.addEventListener( 'keydown', ev => {
				ev.stopPropagation();
				if ( ev.key === 'Enter' ) {
					imgEl.alt = input.value;
					input.remove();
				}
				if ( ev.key === 'Escape' ) {
					input.remove();
				}
			} );
			input.addEventListener( 'blur', () => {
				imgEl.alt = input.value;
				setTimeout( () => input.remove(), 150 );
			} );
			controls.appendChild( input );
			input.focus();
		} );
		controls.appendChild( altBtn );

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

			// Listen on the figure for keydown so we catch it before the content area.
			fig.addEventListener( 'keydown', ev => {
				if (
					ev.key === 'Enter' &&
					fig.querySelector( 'figcaption' ) &&
					fig.querySelector( 'figcaption' ).contains( document.getSelection().anchorNode )
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
			figcaption.focus();
		} );
		controls.appendChild( capBtn );
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
	if ( ! contentEl.textContent.trim() && ! contentEl.querySelector( 'img, video, figure' ) ) {
		contentEl.classList.add( 'bw-is-empty' );
		contentEl.addEventListener( 'input', () => contentEl.classList.remove( 'bw-is-empty' ), {
			once: true,
		} );
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

		// Highlight text + paste URL → create a link.
		content.addEventListener( 'paste', event => {
			const sel = window.getSelection();
			if ( ! sel.rangeCount || sel.isCollapsed ) return;

			const pasted = event.clipboardData.getData( 'text/plain' );
			if ( pasted && /^https?:\/\/\S+$/i.test( pasted.trim() ) ) {
				event.preventDefault();
				document.execCommand( 'createLink', false, pasted.trim() );
			}
		} );
	}, 200 );
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

	const formData = new FormData();
	formData.append( 'file', file );

	try {
		const media = await window.wp.apiFetch( {
			path: state.mediaPath,
			method: 'POST',
			body: formData,
		} );
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

	// Find the paragraph containing the slash command by scanning direct children.
	let slashBlock = null;
	for ( const child of content.children ) {
		if ( /^(P|DIV)$/i.test( child.tagName ) && /^\/\S*$/.test( child.textContent.trim() ) ) {
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

	state.showSlashMenu = false;
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

	// Check block-level formatting by walking up from cursor.
	const sel = window.getSelection();
	state.formatHeading = false;
	state.formatQuote = false;
	state.headingLabel = i18n.normal || 'Normal';
	state.formatAlignLeft = true;
	state.formatAlignCenter = false;
	state.formatAlignRight = false;

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
				// Detect alignment from the nearest block element.
				if ( /^(P|H[1-6]|DIV|BLOCKQUOTE)$/.test( node.tagName ) && node.style.textAlign ) {
					const align = node.style.textAlign;
					state.formatAlignLeft = align === 'left' || align === 'start' || align === '';
					state.formatAlignCenter = align === 'center';
					state.formatAlignRight = align === 'right';
				}
			}
			node = node.parentNode;
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
	// were deleted). Without a real editable block the save cleanup
	// would strip all gaps and serialize empty content.
	if ( ! needsRepair ) {
		let hasRealEditable = false;
		for ( const el of content.children ) {
			if ( EDITABLE_BLOCK_TAGS.test( el.tagName ) && ! el.classList.contains( 'bw-block-gap' ) ) {
				hasRealEditable = true;
				break;
			}
		}
		if ( ! hasRealEditable ) {
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

	// Guarantee at least one text-editable block exists.
	let hasEditable = false;
	for ( const el of content.children ) {
		if ( EDITABLE_BLOCK_TAGS.test( el.tagName ) && ! el.classList.contains( 'bw-block-gap' ) ) {
			hasEditable = true;
			break;
		}
	}
	if ( ! hasEditable && content.firstChild ) {
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
			insertAfter.tagName === 'P' &&
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

const { state } = store( 'wpcom-write', {
	state: {
		formatBold: false,
		formatItalic: false,
		formatHeading: false,
		formatQuote: false,
		imageUrl: '',
		headingLabel: i18n.normal || 'Normal',
	},

	actions: {
		updateTitle() {
			const el = getElement();
			state.title = el.ref.value;
			// Auto-resize textarea height for browsers without field-sizing support.
			el.ref.style.height = 'auto';
			el.ref.style.height = el.ref.scrollHeight + 'px';

			// Dismiss the recovery banner once the user starts editing.
			if ( state.showRecoveryBanner ) {
				localStorage.removeItem( AUTOSAVE_STORAGE_KEY );
				state.showRecoveryBanner = false;
			}
		},

		handleTitleKeyDown( event ) {
			// Block keystrokes while a modal overlay is open.
			if ( state.showImageModal || state.showVideoModal ) {
				if ( event.key === 'Escape' ) {
					const { actions: a } = store( 'wpcom-write' );
					if ( state.showImageModal ) {
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
			state.showLeaveConfirm = false;
			// Return focus to the back button.
			const backBtn = document.querySelector( '.bw-back' );
			if ( backBtn ) backBtn.focus();
		},

		handleLeaveModalKeyDown( event ) {
			if ( event.key === 'Escape' ) {
				event.preventDefault();
				state.showLeaveConfirm = false;
				const backBtn = document.querySelector( '.bw-back' );
				if ( backBtn ) backBtn.focus();
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
			allowLeave = true;
			window.location.href = state.adminUrl;
		},

		async saveAndLeave() {
			state.showLeaveConfirm = false;
			const status = state.postStatus === 'publish' ? 'publish' : 'draft';
			await savePost( status, true );
			allowLeave = true;
			window.location.href = state.adminUrl;
		},

		checkFormatting() {
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

		repairStructure() {
			// Fires on the `input` event — after the browser mutates the DOM
			// but before the next paint. Wraps any bare text/inline nodes that
			// native contentEditable orphaned (e.g. deleting a figure via
			// Backspace can unwrap a neighbouring <p>).
			promoteGapAtCursor();
			ensureBlockStructure();
		},

		handleKeyDown( event ) {
			// Block all keystrokes while a modal overlay is open.
			if ( state.showImageModal || state.showVideoModal ) {
				if ( event.key === 'Escape' ) {
					const { actions: a } = store( 'wpcom-write' );
					if ( state.showImageModal ) {
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

			// Ctrl+K / Cmd+K to toggle link input.
			if ( ( event.ctrlKey || event.metaKey ) && event.key === 'k' ) {
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
					if ( active ) active.classList.remove( 'bw-slash-item-active' );
					idx = ( idx + 1 ) % visible.length;
					visible[ idx ].classList.add( 'bw-slash-item-active' );
					enterKeyboardNav();
					return;
				}

				if ( event.key === 'ArrowUp' || ( event.key === 'Tab' && event.shiftKey ) ) {
					event.preventDefault();
					if ( active ) active.classList.remove( 'bw-slash-item-active' );
					idx = idx <= 0 ? visible.length - 1 : idx - 1;
					visible[ idx ].classList.add( 'bw-slash-item-active' );
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
						// Map menu items to actions by their label text.
						const label = target.querySelector( 'strong' )?.textContent?.toLowerCase();
						const { actions: a } = store( 'wpcom-write' );
						const actionMap = {
							heading: a.insertHeading,
							image: a.insertImage,
							video: a.insertVideo,
							quote: a.insertQuote,
							divider: a.insertDivider,
						};
						if ( actionMap[ label ] ) {
							actionMap[ label ]();
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

			// Enter key: break out of blockquotes/headings and ensure paragraphs.
			if ( event.key === 'Enter' && ! event.shiftKey ) {
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
						const remaining = textAfterCursor.toString().trim();

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

		checkSlashCommand() {
			const sel = window.getSelection();
			if ( ! sel.rangeCount ) {
				state.showSlashMenu = false;
				return;
			}

			const node = sel.anchorNode;
			if ( ! node || node.nodeType !== Node.TEXT_NODE ) {
				state.showSlashMenu = false;
				return;
			}

			const text = node.textContent;
			// Show menu when the line starts with "/" and optionally a filter after it.
			if ( /^\/\S*$/.test( text.trimStart() ) ) {
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
					if ( filterChanged ) item.classList.remove( 'bw-slash-item-active' );
					const label = item.querySelector( 'strong' ).textContent.toLowerCase();
					const show = label.includes( state.slashFilter );
					item.style.display = show ? '' : 'none';
					if ( show && ! firstVisible ) firstVisible = item;
				} );
				// Close the menu when no items match the filter.
				if ( ! firstVisible ) {
					state.showSlashMenu = false;
					return;
				}
				// Auto-highlight the first visible item only when filter changes.
				if ( filterChanged ) firstVisible.classList.add( 'bw-slash-item-active' );
			} else {
				slashMenuEscaped = false;
				prevSlashFilter = null;
				state.showSlashMenu = false;
			}
		},

		preventToolbarBlur( event ) {
			// Prevent the toolbar from stealing focus from the content area,
			// but allow normal interaction with form inputs (text selection, cursor).
			if ( event.target.closest( 'input, textarea' ) ) return;
			event.preventDefault();
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
			document.execCommand( 'formatBlock', false, 'p' );
			state.formatHeading = false;
			state.headingLabel = i18n.normal || 'Normal';
			state.showHeadingMenu = false;
		},

		setHeadingH2() {
			document.execCommand( 'formatBlock', false, 'h2' );
			state.formatHeading = true;
			state.headingLabel = i18n.heading2 || 'Heading 2';
			state.formatQuote = false;
			state.showHeadingMenu = false;
		},

		setHeadingH3() {
			document.execCommand( 'formatBlock', false, 'h3' );
			state.formatHeading = true;
			state.headingLabel = i18n.heading3 || 'Heading 3';
			state.formatQuote = false;
			state.showHeadingMenu = false;
		},

		// --- Alignment ---

		alignLeft() {
			document.execCommand( 'justifyLeft' );
			cleanupAlignmentDivs();
			state.formatAlignLeft = true;
			state.formatAlignCenter = false;
			state.formatAlignRight = false;
		},

		alignCenter() {
			document.execCommand( 'justifyCenter' );
			cleanupAlignmentDivs();
			state.formatAlignLeft = false;
			state.formatAlignCenter = true;
			state.formatAlignRight = false;
		},

		alignRight() {
			document.execCommand( 'justifyRight' );
			cleanupAlignmentDivs();
			state.formatAlignLeft = false;
			state.formatAlignCenter = false;
			state.formatAlignRight = true;
		},

		// --- Lists ---

		formatUList() {
			document.execCommand( 'insertUnorderedList' );
			state.formatUList = document.queryCommandState( 'insertUnorderedList' );
			state.formatOList = document.queryCommandState( 'insertOrderedList' );
		},

		formatOList() {
			document.execCommand( 'insertOrderedList' );
			state.formatOList = document.queryCommandState( 'insertOrderedList' );
			state.formatUList = document.queryCommandState( 'insertUnorderedList' );
		},

		// --- Block formatting ---

		formatQuote() {
			if ( state.formatQuote ) {
				document.execCommand( 'formatBlock', false, 'p' );
				state.formatQuote = false;
			} else {
				document.execCommand( 'formatBlock', false, 'blockquote' );
				state.formatQuote = true;
				state.formatHeading = false;
			}
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
					document.execCommand( 'createLink', false, state.linkUrl );
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
				document.execCommand( 'createLink', false, state.linkUrl );
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
		},

		updateImageAlt() {
			const el = getElement();
			state.imageAlt = el.ref.value;
		},

		openImageModal() {
			saveSelection();
			state.imageUrl = '';
			state.imageAlt = '';
			state.setAsFeatured = false;
			state.uploadedMediaId = 0;
			resetUploadZone();
			state.showImageModal = true;
			focusModalInput();
		},

		closeImageModal() {
			state.showImageModal = false;
			state.imageUrl = '';
			state.imageAlt = '';
			state.setAsFeatured = false;
			state.uploadedMediaId = 0;
			resetUploadZone();
			restoreSelection();
			const content = document.querySelector( '.bw-content' );
			if ( content ) content.focus();
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
				const focusable = modal.querySelectorAll(
					'input:not([hidden]):not([type="file"]), button, [tabindex]:not([tabindex="-1"])'
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

		stopPropagation( event ) {
			event.stopPropagation();
		},

		updateImageUrl() {
			const el = getElement();
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
			figure.className = 'bw-image-figure';
			const img = document.createElement( 'img' );
			img.src = state.imageUrl;
			img.alt = state.imageAlt || '';
			figure.appendChild( img );

			const p = insertMediaBlock( figure );
			if ( p ) {
				placeCursorAt( p );
			}

			state.showImageModal = false;
			resetUploadZone();
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

		// --- Slash commands ---

		insertHeading() {
			insertNewBlock( 'h2' );
		},

		insertImage() {
			clearSlashText();
			state.showSlashMenu = false;
			saveSelection();
			state.showImageModal = true;
			state.imageUrl = '';
			focusModalInput();
		},

		insertQuote() {
			insertNewBlock( 'blockquote' );
		},

		insertVideo() {
			clearSlashText();
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
			const content = document.querySelector( '.bw-content' );
			if ( content ) content.focus();
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
					'input:not([hidden]):not([type="file"]), button, [tabindex]:not([tabindex="-1"])'
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
			wrapper.innerHTML = `<div class="bw-video-wrap"><iframe src="${ embedUrl }" frameborder="0" allowfullscreen></iframe></div>`;

			const p = insertMediaBlock( wrapper );
			if ( p ) {
				placeCursorAt( p );
			}

			state.showVideoModal = false;
		},

		insertDivider() {
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
					! block.parentNode.classList.contains( 'bw-content' )
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
			state.showSlashMenu = false;
		},

		// --- UI toggles ---

		toggleHelp() {
			state.showHelp = ! state.showHelp;
			if ( state.showHelp ) {
				const close = e => {
					if ( e.target.closest( '.bw-help-popover' ) || e.target.closest( '.bw-help-toggle' ) )
						return;
					state.showHelp = false;
					document.removeEventListener( 'click', close );
				};
				setTimeout( () => document.addEventListener( 'click', close ), 0 );
			}
		},

		toggleCatPicker( event ) {
			event.stopPropagation();
			state.showCatPicker = ! state.showCatPicker;

			if ( state.showCatPicker ) {
				const close = e => {
					if ( e.target.closest( '.bw-cat-popover' ) || e.target.closest( '.bw-cat-fab' ) ) return;
					state.showCatPicker = false;
					document.removeEventListener( 'click', close );
				};
				// Delay so the current click doesn't immediately close it.
				setTimeout( () => document.addEventListener( 'click', close ), 0 );
			}
		},

		toggleCategory() {
			const ctx = getContext();
			ctx.catSelected = ! ctx.catSelected;
			state.categories[ ctx.catIndex ].selected = ctx.catSelected;
		},

		async publish() {
			await savePost( 'publish' );
		},

		async saveDraft() {
			await savePost( 'draft' );
		},

		/**
		 * Perform a periodic autosave if the editor is dirty.
		 */
		async autosave() {
			// Skip autosave for published posts — partial edits should not go live silently.
			// Users can still save manually via the unsaved-changes modal.
			if ( ! isDirty() || state.isSaving || state.isPublished || state.postStatus === 'publish' ) {
				return;
			}

			// Require at least a title or content before autosaving.
			const contentEl = document.querySelector( '.bw-content' );
			const hasContent = state.title.trim() || ( contentEl && contentEl.textContent.trim() );
			if ( ! hasContent ) {
				return;
			}

			await savePost( 'draft', true );
		},

		/**
		 * Resume editing an autosaved draft.
		 */
		resumeDraft() {
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
			localStorage.removeItem( AUTOSAVE_STORAGE_KEY );
			state.showRecoveryBanner = false;
		},
	},
} );

/**
 * Save or publish the current post via the REST API.
 *
 * @param {string}  postStatus - The desired post status ('publish' or 'draft').
 * @param {boolean} isAutosave - Whether this is a periodic autosave (quieter UX).
 */
async function savePost( postStatus, isAutosave = false ) {
	if ( ! isAutosave ) {
		const content = getContent();
		if ( ! state.title.trim() && ( ! content || ! content.innerHTML.trim() ) ) {
			state.message = i18n.pleaseWriteSomething || 'Please write something';
			setTimeout( () => {
				state.message = '';
			}, 2500 );
			return;
		}
	}

	const isEditing = state.editPostId > 0;
	const isUpdate = isEditing && postStatus === 'publish';

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
	clone.querySelectorAll( '.bw-figure-selected' ).forEach( el => {
		el.classList.remove( 'bw-figure-selected' );
	} );
	// Also strip the contenteditable attribute from figures — it's a
	// runtime attribute that shouldn't be persisted.
	clone.querySelectorAll( 'figure[contenteditable]' ).forEach( el => {
		el.removeAttribute( 'contenteditable' );
	} );
	// Strip runtime control wrappers and buttons from figures so only
	// the original media elements are saved.
	clone.querySelectorAll( '.bw-img-controls' ).forEach( wrapper => {
		// Move the img back out of the wrapper.
		const img = wrapper.querySelector( 'img' );
		if ( img ) {
			wrapper.before( img );
		}
		wrapper.remove();
	} );
	clone
		.querySelectorAll( '.bw-img-delete, .bw-img-alt, .bw-img-alt-input, .bw-img-caption-btn' )
		.forEach( el => el.remove() );

	// Safety net: if stripping editor-only elements left the clone
	// empty, treat it the same as no content.
	if ( ! clone.innerHTML.trim() ) {
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

	const blockMarkup = convertToBlocks( clone.innerHTML );

	// Collect selected category IDs.
	const selectedCats = state.categories.filter( c => c.selected ).map( c => c.id );

	// If editing, PUT to the existing post. If new, POST to create.
	const path = isEditing ? state.postsPath + '/' + state.editPostId : state.postsPath;

	try {
		const post = await window.wp.apiFetch( {
			path,
			method: 'POST',
			data: {
				title: state.title,
				content: blockMarkup,
				status: postStatus,
				categories: selectedCats,
				featured_media: state.featuredMediaId || 0,
			},
		} );

		// Store the post ID so subsequent saves update the same post.
		if ( ! isEditing ) {
			state.editPostId = post.id;
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
			setTimeout( () => {
				window.location.href = post.link;
			}, 800 );
		} else {
			state.editPostId = post.id;
			state.hasSaved = true;
			state.message = i18n.draftSaved || 'Draft saved';
			state.isSaving = false;
			// Clear autosave reference — user explicitly saved.
			localStorage.removeItem( AUTOSAVE_STORAGE_KEY );
			setTimeout( () => {
				state.message = '';
			}, 2500 );
		}
	} catch ( err ) {
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

// Start the autosave interval once the content area is ready.
const autosaveReady = setInterval( () => {
	const contentEl = document.querySelector( '.bw-content' );
	if ( ! contentEl ) return;
	clearInterval( autosaveReady );

	// Capture the initial snapshot so edits are detected relative to load state.
	updateSavedSnapshot();

	// Start the periodic autosave timer.
	const { actions } = store( 'wpcom-write' );
	autosaveTimer = setInterval( () => {
		actions.autosave();
	}, AUTOSAVE_INTERVAL_MS );

	// Check for a recoverable autosaved draft (only for new posts).
	if ( ! state.editPostId ) {
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
}, 200 );

// Warn before leaving if there are unsaved changes.
window.addEventListener( 'beforeunload', event => {
	if ( isDirty() && ! state.isPublished && ! allowLeave ) {
		event.preventDefault();
	}
} );

// Clean up autosave timer on page unload.
window.addEventListener( 'pagehide', () => {
	if ( autosaveTimer ) {
		clearInterval( autosaveTimer );
	}
} );
