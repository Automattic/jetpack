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
	const contentEl = document.querySelector( '.bw-content' );
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
			blocks.push(
				`<!-- wp:image -->\n<figure class="wp-block-image"><img src="${ src }" alt="${ alt }"/></figure>\n<!-- /wp:image -->`
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
		node.textContent = '';
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
 * Add delete buttons to image/video figures in the content area.
 */
function addDeleteButtons() {
	const content = document.querySelector( '.bw-content' );
	if ( ! content ) return;

	content.querySelectorAll( 'figure, .bw-image-figure, .bw-video-figure' ).forEach( fig => {
		if ( fig.querySelector( '.bw-img-delete' ) ) return;

		// Wrap img in a positioning container so buttons stay anchored to the image.
		const img = fig.querySelector( 'img' );
		if ( img && ! img.parentElement.classList.contains( 'bw-img-controls' ) ) {
			const wrapper = document.createElement( 'div' );
			wrapper.className = 'bw-img-controls';
			wrapper.contentEditable = 'false';
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
			fig.style.opacity = '0';
			fig.style.transform = 'scale(0.95)';
			fig.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
			setTimeout( () => fig.remove(), 200 );
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
					const range = document.createRange();
					range.setStart( next, 0 );
					range.collapse( true );
					const sel = window.getSelection();
					sel.removeAllRanges();
					sel.addRange( range );
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
	const contentEl = document.querySelector( '.bw-content' );
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
		const content = document.querySelector( '.bw-content' );
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
	const content = document.querySelector( '.bw-content' );
	if ( ! content ) return;

	const sel = window.getSelection();
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
	const range = document.createRange();
	range.setStart( newEl, 0 );
	range.collapse( true );
	sel.removeAllRanges();
	sel.addRange( range );

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
	const content = document.querySelector( '.bw-content' );
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
			if ( event.key === 'Enter' ) {
				event.preventDefault();
				const content = document.querySelector( '.bw-content' );
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

			// Check for slash commands first.
			const { actions } = store( 'wpcom-write' );
			actions.checkSlashCommand();

			// Update all formatting button states based on cursor position.
			updateFormattingState();
		},

		handleKeyDown( event ) {
			// Ctrl+K / Cmd+K to toggle link input.
			if ( ( event.ctrlKey || event.metaKey ) && event.key === 'k' ) {
				event.preventDefault();
				const { actions: a } = store( 'wpcom-write' );
				a.toggleLinkInput();
				return;
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
							const newRange = document.createRange();
							newRange.setStart( p, 0 );
							newRange.collapse( true );
							sel.removeAllRanges();
							sel.addRange( newRange );
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
			if ( /^\/\S*$/.test( text.trim() ) ) {
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
				// Auto-highlight the first visible item only when filter changes.
				if ( filterChanged && firstVisible ) firstVisible.classList.add( 'bw-slash-item-active' );
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
				const content = document.querySelector( '.bw-content' );
				if ( content ) content.focus();
			}
			if ( event.key === 'Escape' ) {
				event.preventDefault();
				clearHighlight();
				state.showLinkInput = false;
				if ( linkPopoverCloseHandler ) {
					document.removeEventListener( 'click', linkPopoverCloseHandler );
					linkPopoverCloseHandler = null;
				}
				const content = document.querySelector( '.bw-content' );
				if ( content ) content.focus();
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
			const content = document.querySelector( '.bw-content' );
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
			const content = document.querySelector( '.bw-content' );
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
		},

		closeImageModal() {
			state.showImageModal = false;
			resetUploadZone();
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

			const content = document.querySelector( '.bw-content' );

			// Find the parent block (direct child of .bw-content) to insert after.
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
				insertAfter.after( figure );
				figure.after( p );
			} else {
				content.appendChild( figure );
				content.appendChild( p );
			}

			// Move cursor to the new paragraph.
			const range = document.createRange();
			range.setStart( p, 0 );
			range.collapse( true );
			sel.removeAllRanges();
			sel.addRange( range );

			state.showImageModal = false;
			resetUploadZone();
		},

		async uploadImage() {
			const el = getElement();
			const file = el.ref.files[ 0 ];
			if ( ! file ) return;

			state.isUploading = true;
			const zone = document.getElementById( 'bw-upload-zone' );
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
				state.imageUrl = media.source_url;
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

				// Show preview.
				showUploadPreview( media.source_url );
			} catch ( err ) {
				state.isUploading = false;
				if ( zone ) zone.classList.remove( 'bw-uploading' );
				state.message = ( i18n.uploadFailed || 'Upload failed: %s' ).replace( '%s', err.message );
				setTimeout( () => {
					state.message = '';
				}, 3000 );
			}
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
		},

		closeVideoModal() {
			state.showVideoModal = false;
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

			const content = document.querySelector( '.bw-content' );
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
				insertAfter.after( wrapper );
				wrapper.after( p );
			} else {
				content.appendChild( wrapper );
				content.appendChild( p );
			}

			const range = document.createRange();
			range.setStart( p, 0 );
			range.collapse( true );
			sel.removeAllRanges();
			sel.addRange( range );

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
					// Move cursor to new paragraph.
					const newRange = document.createRange();
					newRange.setStart( p, 0 );
					newRange.collapse( true );
					sel.removeAllRanges();
					sel.addRange( newRange );
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
		const content = document.querySelector( '.bw-content' );
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

	const contentEl = document.querySelector( '.bw-content' );
	const blockMarkup = convertToBlocks( contentEl.innerHTML );

	// Snapshot what we're about to send so dirty tracking compares against
	// the submitted content, not whatever the DOM contains when the request resolves.
	const submittedSnapshot = getContentSnapshot();

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
