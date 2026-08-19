/*
 * Normalizes the several ways Jetpack form fields store their selectable options, so the
 * conditional-logic rule builder can offer a value dropdown regardless of field type.
 *
 * Three schemes exist in the package:
 *
 * 1. `jetpack/field-select` keeps a plain string array in its `options` attribute.
 * 2. `jetpack/field-single-choice` and `jetpack/field-multiple-choice` use `jetpack/option`
 *    inner blocks, normally nested one level down under a `jetpack/options` wrapper.
 * 3. `jetpack/field-image-select` uses `jetpack/input-image-option` inner blocks under a
 *    `jetpack/fieldset-image-options` wrapper.
 */

type MinimalBlock = {
	name?: string;
	attributes?: Record< string, unknown >;
	innerBlocks?: MinimalBlock[];
};

export type FieldOption = {
	value: string;
	label: string;
};

/**
 * Inner block names that carry a selectable option label.
 */
const OPTION_BLOCK_NAMES = [ 'jetpack/option', 'jetpack/input-image-option' ];

/**
 * Reduce a list of raw labels to unique, non-blank options in first-seen order.
 *
 * @param labels - Raw label values, possibly blank, padded or duplicated.
 * @return Normalized option list.
 */
const toOptions = ( labels: unknown[] ): FieldOption[] => {
	const seen = new Set< string >();
	const options: FieldOption[] = [];

	labels.forEach( raw => {
		if ( typeof raw !== 'string' ) {
			return;
		}
		const label = raw.trim();
		if ( '' === label || seen.has( label ) ) {
			return;
		}
		seen.add( label );
		options.push( { value: label, label } );
	} );

	return options;
};

/**
 * Recursively collect option labels from a block's descendants.
 *
 * @param blocks - Blocks to walk.
 * @param labels - Accumulator for discovered labels.
 */
const collectOptionLabels = ( blocks: MinimalBlock[] | undefined, labels: unknown[] ): void => {
	if ( ! Array.isArray( blocks ) ) {
		return;
	}

	blocks.forEach( block => {
		if ( ! block ) {
			return;
		}
		if ( block.name && OPTION_BLOCK_NAMES.includes( block.name ) ) {
			labels.push( block.attributes?.label );
			return;
		}
		collectOptionLabels( block.innerBlocks, labels );
	} );
};

/**
 * Resolve the options a field offers, for use as conditional-logic rule values.
 *
 * @param block - The field block instance, as returned by `getBlock()`.
 * @return Option list; empty for field types that have no fixed options.
 */
export const getFieldOptions = ( block?: MinimalBlock | null ): FieldOption[] => {
	if ( ! block ) {
		return [];
	}

	// A rating has no option blocks: its choices are its own scale, so they are derived from
	// the configured maximum. Offering 1..max also keeps an author from writing a rule
	// against 6 stars out of 5, which could never match.
	if ( 'jetpack/field-rating' === block.name ) {
		const max = Number( block.attributes?.max );
		const steps = Number.isFinite( max ) && max > 0 ? Math.floor( max ) : 5;

		return Array.from( { length: steps }, ( _, index ) => ( {
			value: String( index + 1 ),
			label: String( index + 1 ),
		} ) );
	}

	if ( 'jetpack/field-select' === block.name ) {
		const options = block.attributes?.options;
		return Array.isArray( options ) ? toOptions( options ) : [];
	}

	const labels: unknown[] = [];
	collectOptionLabels( block.innerBlocks, labels );
	return toOptions( labels );
};
