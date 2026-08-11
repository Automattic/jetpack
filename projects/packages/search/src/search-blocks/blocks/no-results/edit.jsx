/**
 * Editor preview for jetpack-search/no-results.
 *
 * Deliberately no `InnerBlocks` template, unlike `core/query-no-results`: an
 * auto-inserted placeholder paragraph serializes as an empty `<p>`, which
 * would displace the localized default copy `render.php` falls back to the
 * moment an author so much as clicks into a shipped template. The block stays
 * genuinely empty until the author adds something, and the preview below
 * stands in for what visitors would see meanwhile.
 *
 * The outline + label and `ButtonBlockAppender` are the container-boundary
 * mitigation described in AGENTS.md's "InnerBlocks appender boundary trap".
 */
import { InnerBlocks, InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { PanelBody, RadioControl } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

const FILTER_STATES = [ 'any', 'unfiltered', 'filtered' ];

// Mirrors `Search_Blocks::no_results_default_messages()` so the canvas shows
// what a visitor would get from an untouched block. A function, not a
// constant, so the `__()` calls run after the editor's i18n is loaded rather
// than being cached in the source locale at module init.
const defaultMessages = filterState => {
	const messages = [];
	if ( filterState !== 'filtered' ) {
		messages.push( __( 'No results found. Try a different search.', 'jetpack-search-pkg' ) );
	}
	if ( filterState !== 'unfiltered' ) {
		messages.push(
			__(
				'No results match these filters. Try clearing some, or searching for something else.',
				'jetpack-search-pkg'
			)
		);
	}
	return messages;
};

const displayWhenOptions = () => [
	{ label: __( 'Any empty search', 'jetpack-search-pkg' ), value: 'any' },
	{ label: __( 'No filters are active', 'jetpack-search-pkg' ), value: 'unfiltered' },
	{ label: __( 'Filters are active', 'jetpack-search-pkg' ), value: 'filtered' },
];

// Canvas labels, so two No Results blocks in one results region are tellable
// apart. Keyed rather than branched: a `return __( … )` per branch reads better
// but the production minifier folds the identical calls into one `__()` with a
// computed msgid, which `i18n-check-webpack-plugin` rejects and which would
// leave the strings untranslatable.
const editorLabels = () => ( {
	any: __( 'No Results', 'jetpack-search-pkg' ),
	unfiltered: __( 'No Results — no filters active', 'jetpack-search-pkg' ),
	filtered: __( 'No Results — filters active', 'jetpack-search-pkg' ),
} );

/**
 * Edit component for the no-results block.
 *
 * @param {object}   props               - Block props.
 * @param {object}   props.attributes    - Block attributes.
 * @param {Function} props.setAttributes - Attribute setter.
 * @param {string}   props.clientId      - Block client id.
 * @return {object} Rendered element.
 */
export default function NoResultsEdit( { attributes, setAttributes, clientId } ) {
	const stored = attributes?.filterState;
	const filterState = FILTER_STATES.includes( stored ) ? stored : 'any';
	const hasInnerBlocks = useSelect(
		select => select( 'core/block-editor' ).getBlockCount( clientId ) > 0,
		[ clientId ]
	);
	const blockProps = useBlockProps( {
		className: 'jetpack-search-no-results jetpack-search-no-results__editor-canvas',
	} );

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Settings', 'jetpack-search-pkg' ) }>
					<RadioControl
						label={ __( 'Display when', 'jetpack-search-pkg' ) }
						help={ __(
							'Add a second No Results block to show different content depending on whether filters are applied.',
							'jetpack-search-pkg'
						) }
						selected={ filterState }
						options={ displayWhenOptions() }
						onChange={ value => setAttributes( { filterState: value } ) }
					/>
				</PanelBody>
			</InspectorControls>
			<div { ...blockProps }>
				<span className="jetpack-search-no-results__editor-label">
					{ editorLabels()[ filterState ] }
				</span>
				{ ! hasInnerBlocks && (
					<div className="jetpack-search-no-results__default-preview">
						{ defaultMessages( filterState ).map( message => (
							<p key={ message }>{ message }</p>
						) ) }
					</div>
				) }
				<InnerBlocks renderAppender={ InnerBlocks.ButtonBlockAppender } />
			</div>
		</>
	);
}

export const save = () => <InnerBlocks.Content />;
