/**
 * Types
 */
import type { BlockStyleAttributes } from './types';

export type BlockStyleVars = {
	// One `has-vpap-<property>` class per setting the block carries.
	classes: string[];
	// The matching `--vpap-<property>` custom properties.
	style: Record< string, string >;
};

const SAFE_VALUE = /^[A-Za-z0-9 ,.%#/+"'()-]+$/;
const UNSAFE_FUNCTION = /(url|expression|image)\s*\(/i;

/**
 * Turn a preset slug into its global-styles variable.
 *
 * @param type - Preset type, e.g. `font-size`.
 * @param slug - Preset slug.
 * @return The `var()` reference, or undefined without a usable slug.
 */
function preset( type: string, slug?: string ): string | undefined {
	return slug && /^[a-z0-9-]+$/i.test( slug )
		? `var(--wp--preset--${ type }--${ slug.toLowerCase() })`
		: undefined;
}

/**
 * Keep a style value to what a font or color setting can hold: presets
 * (including the `var:preset|type|slug` notation) and plain CSS values.
 *
 * @param value - Raw attribute value.
 * @return The value, or undefined when it is empty or unsafe.
 */
function sanitizeValue( value: unknown ): string | undefined {
	if ( typeof value === 'number' ) {
		value = String( value );
	}
	if ( typeof value !== 'string' ) {
		return undefined;
	}

	let text = value.trim();
	const presetRef = text.match( /^var:preset\|([a-z0-9-]+)\|([a-z0-9-]+)$/i );
	if ( presetRef ) {
		text = `var(--wp--preset--${ presetRef[ 1 ].toLowerCase() }--${ presetRef[ 2 ].toLowerCase() })`;
	}

	if ( ! text || ! SAFE_VALUE.test( text ) || UNSAFE_FUNCTION.test( text ) ) {
		return undefined;
	}

	return text;
}

/**
 * The typography and color settings the Styles tab stores on the block, as
 * marker classes and CSS custom properties the stylesheet applies to the
 * headings. Mirrors All_Playlists_Block::block_style_vars().
 *
 * @param attributes - Block attributes.
 * @return Classes and custom properties for the block wrapper.
 */
export function blockStyleVars( attributes: BlockStyleAttributes ): BlockStyleVars {
	const typography = attributes.style?.typography ?? {};
	const values: Record< string, unknown > = {
		'font-family': preset( 'font-family', attributes.fontFamily ) ?? typography.fontFamily,
		'font-size': preset( 'font-size', attributes.fontSize ) ?? typography.fontSize,
		'font-style': typography.fontStyle,
		'font-weight': typography.fontWeight,
		'line-height': typography.lineHeight,
		'letter-spacing': typography.letterSpacing,
		'text-transform': typography.textTransform,
		'text-decoration': typography.textDecoration,
		color: preset( 'color', attributes.textColor ) ?? attributes.style?.color?.text,
	};

	const classes: string[] = [];
	const style: Record< string, string > = {};
	for ( const [ property, raw ] of Object.entries( values ) ) {
		const value = sanitizeValue( raw );
		if ( value === undefined ) {
			continue;
		}
		classes.push( `has-vpap-${ property }` );
		style[ `--vpap-${ property }` ] = value;
	}

	return { classes, style };
}
