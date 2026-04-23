/**
 * Editor preview for jetpack/results-count.
 *
 * Mirrors the formatter the shared store getter runs on the front end so the
 * preview reflects the same string designers style when the block hydrates.
 * The Inspector exposes a text input for the `template` attribute; render.php
 * pushes that value into `state.strings.resultsCountTemplate` (or leaves the
 * PHP-translated default in place when it's empty), which the store getter
 * then feeds into `formatResultsCountText` against live search state.
 */
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { PanelBody, TextControl } from '@wordpress/components';
import { createElement as h, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { formatResultsCountText } from './format';

// Sample values used to preview the template in the editor. Kept stable so
// the preview reads consistently regardless of the user's template choice.
const SAMPLE = { first: 1, last: 10, total: 42, query: 'boots' };

/**
 * Edit component for the results-count block.
 *
 * @param {object}   props               - Block props.
 * @param {object}   props.attributes    - Saved block attributes.
 * @param {Function} props.setAttributes - Attribute setter.
 * @return {object} Rendered element.
 */
export default function ResultsCountEdit( { attributes, setAttributes } ) {
	const blockProps = useBlockProps();
	/* translators: %1$d: first shown result (1-based), %2$d: last shown result, %3$d: total result count. */
	const defaultTemplate = __( 'Showing %1$d–%2$d of %3$d results', 'jetpack-search-pkg' );
	// Match render.php: a whitespace-only template falls back to the default
	// in the preview so the editor mirrors the front-end behaviour the
	// "Leave empty…" help text describes. The raw input is still stored.
	const template = ( attributes?.template || '' ).trim() || defaultTemplate;
	return h(
		Fragment,
		null,
		h(
			InspectorControls,
			null,
			h(
				PanelBody,
				{ title: __( 'Settings', 'jetpack-search-pkg' ) },
				h( TextControl, {
					__next40pxDefaultSize: true,
					__nextHasNoMarginBottom: true,
					label: __( 'Results count template', 'jetpack-search-pkg' ),
					value: attributes?.template || '',
					placeholder: defaultTemplate,
					onChange: value => setAttributes( { template: value } ),
					/* translators: The %1$d, %2$d, %3$d, and %4$s sequences are placeholder tokens authors type literally into the template — they must be preserved verbatim in the translation. */
					help: __(
						'Available placeholders: %1$d (first shown), %2$d (last shown), %3$d (total), %4$s (query). Leave empty to use the default translated template.',
						'jetpack-search-pkg'
					),
				} )
			)
		),
		h( 'p', blockProps, formatResultsCountText( template, SAMPLE ) )
	);
}
