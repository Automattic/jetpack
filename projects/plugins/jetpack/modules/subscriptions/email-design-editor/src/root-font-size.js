/**
 * Carry the email's root font size into the canvas on the custom property captions read.
 *
 * The email image renderer wraps an image in `font-size: 0px` tables so mail clients leave no gap
 * under it, and the caption cell beneath would inherit that 0px once the canvas replaces the root
 * size with `inherit` so text can follow the Styles panel. WordPress.com therefore sizes that cell
 * from `var(--wpcom-email-root-font-size, <size at load>)`, and this sets the variable from the
 * live design so a caption follows the panel without a reload. See NL-1075 and NL-951.
 */

import { storeName as EMAIL_EDITOR_STORE } from '@woocommerce/email-editor';
import { store as coreStore } from '@wordpress/core-data';
import { dispatch, select, subscribe } from '@wordpress/data';

// What the panel stores for a preset pick. Rewritten to the custom property rather than resolved:
// the canvas defines the preset variables above the root container, so the caption then tracks
// whatever the body text shows. The `var( ... )` form sanitizing rewrites it to passes through.
const PRESET_SHORTHAND = /^var:preset\|font-size\|([\w-]+)$/;

// What may reach a declaration. A size is the creator's own input, and a `}` would end the rule
// early; the same set WordPress.com validates this value against.
const SAFE_VALUE = /^[a-z0-9.%(),+*/ -]+$/i;

// How our entry is recognised in a style array that also carries WordPress.com's email stylesheet.
// Matched as a prefix, never as a substring, so no other entry declaring the property is dropped.
const RULE_PREFIX = '.is-root-container{--wpcom-email-root-font-size:';

/**
 * The email's root font size, as the Styles panel's own merge resolves it.
 *
 * @param {object} theme  - The editor theme WordPress.com derived from the site.
 * @param {object} design - The creator's own layer over it.
 * @return {string|null} The size, or null when neither layer sets one.
 */
export function rootFontSize( theme, design ) {
	const size = design?.styles?.typography?.fontSize ?? theme?.styles?.typography?.fontSize;

	return 'string' === typeof size && size.trim() ? size.trim() : null;
}

/**
 * The root font size the screen opens on, before the editor has a store to read.
 *
 * @param {object} bundle - The response from the bootstrap route.
 * @return {string|null} The size, or null when the bundle sets none.
 */
export function bundleRootFontSize( bundle ) {
	return rootFontSize( bundle?.editor_theme, bundle?.global_styles?.record );
}

/**
 * The canvas rule that publishes a root font size, or nothing when there is none to publish.
 *
 * @param {*} fontSize - A stored font size.
 * @return {string|null} The CSS, or null to leave WordPress.com's fallback in force.
 */
export function rootFontSizeCss( fontSize ) {
	const value = cssValue( fontSize );

	return value ? `${ RULE_PREFIX }${ value }; }` : null;
}

/**
 * A stored font size as a value a declaration can hold.
 *
 * @param {*} fontSize - A stored font size.
 * @return {string|null} The value, or null when it is absent or not a size.
 */
function cssValue( fontSize ) {
	if ( 'string' !== typeof fontSize ) {
		return null;
	}

	const trimmed = fontSize.trim();
	const preset = PRESET_SHORTHAND.exec( trimmed );
	const value = preset ? `var(--wp--preset--font-size--${ preset[ 1 ] })` : trimmed;

	return SAFE_VALUE.test( value ) ? value : null;
}

/**
 * A canvas style array holding this root font size and no earlier one.
 *
 * @param {*} styles   - The canvas styles as they stand.
 * @param {*} fontSize - The root font size to publish.
 * @return {Array} The new styles.
 */
export function withRootFontSize( styles, fontSize ) {
	const kept = ( Array.isArray( styles ) ? styles : [] ).filter(
		entry => 'string' !== typeof entry?.css || ! entry.css.startsWith( RULE_PREFIX )
	);

	const css = rootFontSizeCss( fontSize );

	return css ? [ ...kept, { css } ] : kept;
}

/**
 * Republish the root font size whenever the creator changes it.
 *
 * The package appends the editor settings' `styles` to the canvas CSS it generates and reads those
 * settings from its own store, so re-dispatching them is what repaints the canvas; the design the
 * panel edits lives in core-data, which is what this watches. Only a change is dispatched, so the
 * settings the package assembled from everything else are left alone.
 *
 * @param {string|null} [initial] - The size the canvas was built with, which needs no repaint.
 * @return {Function} Stops watching, for a caller that unmounts the editor.
 */
export function watchRootFontSize( initial = null ) {
	let previous = initial;

	return subscribe( () => {
		const settings = select( EMAIL_EDITOR_STORE )?.getInitialEditorSettings?.();

		// Before the editor has taken the configuration there is nothing to append to, and
		// dispatching would replace it.
		if ( ! settings ) {
			return;
		}

		const design = select( EMAIL_EDITOR_STORE ).getGlobalEmailStylesPost();

		// The package answers null until the design record resolves, and the theme alone would
		// republish a size the creator has already replaced. The canvas opened on the right one.
		if ( ! design ) {
			return;
		}

		const current = rootFontSize( select( EMAIL_EDITOR_STORE ).getTheme(), design );

		if ( current === previous ) {
			return;
		}

		previous = current;

		dispatch( EMAIL_EDITOR_STORE ).setEditorSettings( {
			...settings,
			styles: withRootFontSize( settings.styles, current ),
		} );
	}, coreStore );
}
