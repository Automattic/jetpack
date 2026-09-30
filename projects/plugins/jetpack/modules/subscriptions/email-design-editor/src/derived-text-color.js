/**
 * Keep the email's text color readable on the background the creator picked.
 *
 * Core's color panel offers no hook for a background change, so this watches the design record the
 * panel writes — `root`/`globalStyles` in core-data — and derives the text color, and the
 * inherited link and heading colors, from `styles.color.background` there. Writing them into the
 * record rather than at render is what puts real values in the Styles controls, so the creator
 * can see them and override them. See NL-959.
 */

import { storeName as EMAIL_EDITOR_STORE } from '@woocommerce/email-editor';
import { store as coreStore } from '@wordpress/core-data';
import { dispatch, select, subscribe } from '@wordpress/data';
import { nextElements, MANAGED } from './readable-elements';
import {
	colorToStore,
	contrastRatio,
	deriveTextColor,
	isSameColor,
	MINIMUM_CONTRAST,
} from './text-color';

// What the editor stores for a palette pick, in both the shorthand the package rewrites values to
// and the CSS custom property it rewrites them from.
const PRESET_SHORTHAND = /^var:preset\|color\|([\w-]+)$/;
const PRESET_VARIABLE = /^var\(\s*--wp--preset--color--([\w-]+)\s*\)$/;

// Palette origins, least specific first, so a later one wins on a repeated slug.
const PALETTE_ORIGINS = [ 'default', 'theme', 'custom' ];

/**
 * Derive the text color whenever the creator changes the background.
 *
 * @param {number|null} id        - The global-styles id the bundle named.
 * @param {object}      inherited - The colors the site gives text, links and headings, keyed by
 *                                `text` and by element.
 * @return {Function} Stops watching, for a caller that unmounts the editor.
 */
export function watchDerivedTextColor( id, inherited = {} ) {
	if ( ! id ) {
		return () => {};
	}

	const read = () => select( coreStore ).getEditedEntityRecord( 'root', 'globalStyles', id );

	// The background to measure changes against is whatever is stored, which is not a change the
	// creator made. Taken here when the record is already loaded, so that a pick arriving before any
	// other store activity is seen as a change rather than swallowed as the baseline.
	const opened = read();

	let previous = opened?.styles?.color?.background;
	let previousColors = managedColors( opened );
	let seeded = !! opened;

	return subscribe( () => {
		const record = read();

		if ( ! record ) {
			return;
		}

		const background = record.styles?.color?.background;
		const colors = managedColors( record );

		if ( ! seeded ) {
			previous = background;
			previousColors = colors;
			seeded = true;
			return;
		}

		// Clearing a color asks for the default back, which is a derivation the same way a new
		// background is -- and the panel writes it without touching the background.
		if ( background === previous && ! wasCleared( previousColors, colors ) ) {
			previousColors = colors;
			return;
		}

		// Moved on before the write below, which runs this listener again.
		const before = previous;
		previous = background;
		previousColors = colors;

		// A background arriving with nothing pending is the record resolving, not a pick. Without
		// this, loading a blog's inherited design would write a text color it never had.
		if ( ! select( coreStore ).hasEditsForEntityRecord( 'root', 'globalStyles', id ) ) {
			return;
		}

		const styles = nextStyles( record, before, background, inherited );

		if ( ! styles ) {
			return;
		}

		// Left out of the undo stack rather than given a step of its own: one undo then puts the
		// background back, and this watcher re-derives from it.
		dispatch( coreStore ).editEntityRecord(
			'root',
			'globalStyles',
			id,
			{ styles },
			{ undoIgnore: true }
		);
	}, coreStore );
}

/**
 * The design's `styles` with everything the new background calls for.
 *
 * @param {object} record     - The edited design record.
 * @param {*}      before     - The background before the change.
 * @param {*}      background - The background after it.
 * @param {object} inherited  - The colors the site gives text, links and headings, keyed by `text`
 *                            and by element.
 * @return {object|null} The new `styles`, or null when nothing changes.
 */
function nextStyles( record, before, background, inherited ) {
	// Resolved once, here, so the text color and the element colors are derived from the same
	// literal: `parseColor` refuses a `var:preset|color|slug`, and every element would be skipped.
	const from = resolvePresetColor( before, record );
	const to = resolvePresetColor( background, record );
	const withText = withDerivedTextColor( record, from, to, inherited?.text );
	const styles = withText ?? record.styles ?? {};
	const elements = nextElements( styles, from, to, inherited );

	if ( null === elements ) {
		return withText;
	}

	const next = { ...styles };

	if ( 0 === Object.keys( elements ).length ) {
		delete next.elements;
	} else {
		next.elements = elements;
	}

	return next;
}

/**
 * Every color this watcher manages, as the record stores them now.
 *
 * @param {object} record - The edited design record.
 * @return {object} The stored colors, keyed by `text` and by element.
 */
function managedColors( record ) {
	const styles = record?.styles;
	const colors = { text: styles?.color?.text };

	MANAGED.forEach( element => {
		colors[ element ] = styles?.elements?.[ element ]?.color?.text;
	} );

	return colors;
}

/**
 * Whether the creator emptied a color this watcher manages.
 *
 * @param {object} before - The colors before the change.
 * @param {object} after  - The colors after it.
 * @return {boolean} True when one of them went from set to unset.
 */
function wasCleared( before, after ) {
	return Object.keys( after ).some(
		key => null !== ( before[ key ] ?? null ) && null === ( after[ key ] ?? null )
	);
}

/**
 * The text color a background calls for, given the one the site would otherwise supply.
 *
 * The rule the renderer applies: a site's own text color is kept when it already reads on the
 * background, so clearing the control restores it rather than stamping a tint over it. Absent and
 * unreadable both derive; a color that cannot be judged is kept, as contrast against an unknown is
 * not a number.
 *
 * @param {*} inherited  - The text color the site supplies, or undefined when it supplies none.
 * @param {*} background - The background.
 * @return {string|null} The color to store, or null to store none and inherit.
 */
export function textFor( inherited, background ) {
	if ( null === ( inherited ?? null ) ) {
		return deriveTextColor( background );
	}

	const ratio = contrastRatio( inherited, background );

	return null === ratio || ratio >= MINIMUM_CONTRAST ? null : deriveTextColor( background );
}

/**
 * The design's `styles` with the text color the new background calls for.
 *
 * A text color the creator chose survives a background change; one this derived for the previous
 * background does not, which is what makes the Text control both real and overridable.
 *
 * @param {object} record     - The edited design record.
 * @param {*}      before     - The background before the change, resolved.
 * @param {*}      background - The background after it, resolved.
 * @param {*}      inherited  - The text color the site supplies.
 * @return {object|null} The new `styles`, or null when the text color should be left alone.
 */
function withDerivedTextColor( record, before, background, inherited ) {
	const text = record.styles?.color?.text;
	const hasText = undefined !== text && null !== text;

	if ( hasText && ! isSameColor( text, colorToStore( textFor, inherited, before ) ) ) {
		return null;
	}

	const derived = colorToStore( textFor, inherited, background );

	if ( null === derived ) {
		// Nothing to derive from, so a text color that only existed for the old background goes too.
		return hasText ? withoutTextColor( record.styles ) : null;
	}

	if ( isSameColor( text, derived ) ) {
		return null;
	}

	return {
		...record.styles,
		color: { ...record.styles?.color, text: derived },
	};
}

/**
 * The design's `styles` with no text color, and no empty branch left where it was.
 *
 * @param {object} styles - The design's `styles`.
 * @return {object} The new `styles`.
 */
function withoutTextColor( styles ) {
	const color = { ...styles.color };
	delete color.text;

	const next = { ...styles };

	if ( 0 === Object.keys( color ).length ) {
		delete next.color;
	} else {
		next.color = color;
	}

	return next;
}

/**
 * Resolve a palette pick to the color it stands for, leaving anything else as it is.
 *
 * @param {*}      value  - A stored color.
 * @param {object} record - The edited design record, whose own palette wins over the theme's.
 * @return {*} A literal color, or the value unchanged.
 */
function resolvePresetColor( value, record ) {
	if ( 'string' !== typeof value ) {
		return value;
	}

	const trimmed = value.trim();
	const match = PRESET_SHORTHAND.exec( trimmed ) ?? PRESET_VARIABLE.exec( trimmed );

	if ( ! match ) {
		return value;
	}

	const theme = select( EMAIL_EDITOR_STORE )?.getTheme?.();
	const palettes = [ theme?.settings?.color?.palette, record?.settings?.color?.palette ];

	let resolved;

	for ( const palette of palettes ) {
		for ( const entry of paletteEntries( palette ) ) {
			if ( entry?.slug === match[ 1 ] && entry?.color ) {
				resolved = entry.color;
			}
		}
	}

	// A slug with no entry stays as it was, so the caller derives nothing rather than guessing.
	return resolved ?? value;
}

/**
 * Flatten a palette that may be one list or one list per origin.
 *
 * `editor_theme` carries the raw theme.json shape and a creator's own swatches arrive keyed by
 * origin, so both reach this.
 *
 * @param {*} palette - A palette.
 * @return {Array} Its entries, least specific origin first.
 */
function paletteEntries( palette ) {
	if ( Array.isArray( palette ) ) {
		return palette;
	}

	if ( ! palette || 'object' !== typeof palette ) {
		return [];
	}

	return PALETTE_ORIGINS.flatMap( origin =>
		Array.isArray( palette[ origin ] ) ? palette[ origin ] : []
	);
}
