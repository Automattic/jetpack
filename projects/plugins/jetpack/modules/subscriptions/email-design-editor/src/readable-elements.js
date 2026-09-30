/**
 * Keep the link and heading colors a blog inherits readable on the background the creator picked.
 *
 * WordPress.com applies the same rules at render, but only against a background already saved, so
 * its answer goes stale the moment the creator picks another one. A failing color keeps its own
 * hue and changes only its lightness, so a link stays the site's accent and stays distinct from
 * the text. See NL-959.
 */

import {
	colorToStore,
	contrastRatio,
	isNeutral,
	isSameColor,
	MINIMUM_CONTRAST,
	readableOn,
} from './text-color';

// Content links, and headings including the post title (`h1`) and the header's site title (`h2`).
export const MANAGED = [ 'link', 'heading', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6' ];

/**
 * The design's `elements` with the colors the new background calls for.
 *
 * @param {object} styles     - The design's `styles`.
 * @param {*}      before     - The background before the change.
 * @param {*}      background - The background after it.
 * @param {object} inherited  - The colors the site gives each element, keyed by element.
 * @return {object|null} The new `elements`, or null when nothing changes.
 */
export function nextElements( styles, before, background, inherited ) {
	const elements = JSON.parse( JSON.stringify( styles?.elements ?? {} ) );
	let changed = false;

	MANAGED.forEach( element => {
		const original = inherited?.[ element ];
		const stored = elements[ element ]?.color?.text;

		// A color the creator chose survives a background change; one derived for the previous
		// background does not, which is what keeps these controls both real and overridable.
		const ours =
			undefined === stored ||
			null === stored ||
			isSameColor( stored, colorToStore( readableFor, original, before ) );

		if ( ours ) {
			changed =
				setPath(
					elements,
					[ element, 'color', 'text' ],
					colorToStore( readableFor, original, background )
				) || changed;
		}

		changed = nextUnderline( elements, element, original, before, background, ours ) || changed;
	} );

	return changed ? prune( elements ) : null;
}

/**
 * Underline a link with no hue to keep, and take that underline back off with the color.
 *
 * Owned by the same test the color uses, applied to the decoration itself — so one the creator
 * set on a link this never underlined survives, and one this wrote does not outlive the creator
 * taking the color over.
 *
 * @param {object}  elements   - The design's `elements`, modified in place.
 * @param {string}  element    - The element being written.
 * @param {*}       original   - The color the site gives the element.
 * @param {*}       before     - The background before the change.
 * @param {*}       background - The background after it.
 * @param {boolean} ours       - Whether the link's color is this module's to set.
 * @return {boolean} True when the tree changed.
 */
function nextUnderline( elements, element, original, before, background, ours ) {
	const stored = elements[ element ]?.typography?.textDecoration;

	if (
		undefined !== stored &&
		null !== stored &&
		stored !== underlineFor( element, original, before )
	) {
		return false;
	}

	return setPath(
		elements,
		[ element, 'typography', 'textDecoration' ],
		ours ? underlineFor( element, original, background ) : null
	);
}

/**
 * Whether an element comes out gray on a background, and so is underlined rather than recolored.
 *
 * Only a link is: a heading that loses its hue is left to read as a heading.
 *
 * @param {string} element    - The element.
 * @param {*}      original   - The color the site gives it.
 * @param {*}      background - The background it sits on.
 * @return {string|null} `'underline'`, or null when nothing should be underlined.
 */
export function underlineFor( element, original, background ) {
	if ( 'link' !== element ) {
		return null;
	}

	const readable = readableFor( original, background );

	return null !== readable && isNeutral( readable ) ? 'underline' : null;
}

/**
 * The color an element should take on a background.
 *
 * @param {*} original   - The color the site gives the element, before anything made it readable.
 * @param {*} background - The background it sits on.
 * @return {string|null} The readable color, or null to leave the site's own alone.
 */
export function readableFor( original, background ) {
	const ratio = contrastRatio( original, background );

	// A color that cannot be judged is left as it was: contrast against an unknown is not a number.
	if ( null === ratio || ratio >= MINIMUM_CONTRAST ) {
		return null;
	}

	return readableOn( original, background );
}

/**
 * Write a value into a nested path, or remove what is there when it is null.
 *
 * @param {object}   tree  - The tree to write into, modified in place.
 * @param {string[]} path  - The keys to walk.
 * @param {*}        value - The value, or null to remove the key.
 * @return {boolean} True when the tree changed.
 */
function setPath( tree, path, value ) {
	const last = path[ path.length - 1 ];
	let at = tree;

	for ( const key of path.slice( 0, -1 ) ) {
		if ( null === value && ! at[ key ] ) {
			return false;
		}

		at[ key ] = at[ key ] ?? {};
		at = at[ key ];
	}

	if ( ( at[ last ] ?? null ) === value ) {
		return false;
	}

	if ( null === value ) {
		delete at[ last ];
	} else {
		at[ last ] = value;
	}

	return true;
}

/**
 * Drop the branches a removal emptied, so no element is left holding nothing.
 *
 * @param {object} elements - The design's `elements`, modified in place.
 * @return {object} The same `elements`.
 */
function prune( elements ) {
	Object.keys( elements ).forEach( element => {
		const entry = elements[ element ];

		if ( ! entry || 'object' !== typeof entry ) {
			return;
		}

		Object.keys( entry ).forEach( group => {
			const value = entry[ group ];

			if ( value && 'object' === typeof value && 0 === Object.keys( value ).length ) {
				delete entry[ group ];
			}
		} );

		if ( 0 === Object.keys( entry ).length ) {
			delete elements[ element ];
		}
	} );

	return elements;
}
