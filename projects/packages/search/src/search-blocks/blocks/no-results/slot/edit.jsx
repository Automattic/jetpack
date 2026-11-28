/**
 * Editor preview for jetpack-search/no-results-slot.
 *
 * Deliberately no `InnerBlocks` template: an auto-inserted placeholder paragraph serializes as an
 * empty `<p>`, which would displace the localized default copy `render.php` falls back to the
 * moment an author so much as clicks into a shipped template.
 *
 * `condition` is set once, by whatever created the variant, and has no editing control: every
 * condition already exists in the container, so repointing one could only duplicate a condition or
 * vacate another.
 */
import { InnerBlocks, store as blockEditorStore, useBlockProps } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

const CONDITIONS = [ 'any', 'filtered', 'error' ];

const normalizeCondition = stored => ( CONDITIONS.includes( stored ) ? stored : 'any' );

// Mirrors `No_Results::render_default_copy()`. An unscoped variant yields the filtered state to a
// `filtered` sibling on the front end, so it previews the filtered line only when there is none.
// A function, not a constant, so the `__()` calls run after the editor's i18n is loaded rather than
// being cached in the source locale at module init.
const defaultMessages = ( condition, hasFilteredSibling ) => {
	if ( condition === 'error' ) {
		return [ { text: __( 'Something went wrong. Please try again.', 'jetpack-search-pkg' ) } ];
	}
	const filtered = __(
		'No results match these filters. Try clearing some, or searching for something else.',
		'jetpack-search-pkg'
	);
	if ( condition === 'filtered' ) {
		return [ { text: filtered } ];
	}
	const unfiltered = __( 'No results found. Try a different search.', 'jetpack-search-pkg' );
	if ( hasFilteredSibling ) {
		return [ { text: unfiltered } ];
	}
	return [
		{ label: __( 'Without filters', 'jetpack-search-pkg' ), text: unfiltered },
		{ label: __( 'With filters', 'jetpack-search-pkg' ), text: filtered },
	];
};

// Keyed rather than branched: a `return __( … )` per branch reads better but
// the production minifier folds the identical calls into one `__()` with a
// computed msgid, which `i18n-check-webpack-plugin` rejects and which would
// leave the strings untranslatable.
export const conditionLabels = () => ( {
	any: __( 'Any Empty Search', 'jetpack-search-pkg' ),
	filtered: __( 'Filters Are Active', 'jetpack-search-pkg' ),
	error: __( 'Search Failed', 'jetpack-search-pkg' ),
} );

const conditionDescriptions = () => ( {
	any: __( 'Shown when a search finds no results.', 'jetpack-search-pkg' ),
	filtered: __(
		'Shown when a search with filters applied finds no results.',
		'jetpack-search-pkg'
	),
	error: __( 'Shown when the search request fails.', 'jetpack-search-pkg' ),
} );

/**
 * One variation per condition, so the settings sidebar, List view, and breadcrumb all name the
 * condition. Scoped out of the inserter and the block switcher: a variant's condition never changes.
 *
 * @return {object[]} Block variations.
 */
export const conditionVariations = () => {
	const labels = conditionLabels();
	const descriptions = conditionDescriptions();
	return CONDITIONS.map( condition => ( {
		name: condition,
		title: labels[ condition ],
		description: descriptions[ condition ],
		attributes: { condition },
		scope: [],
		isActive: attributes => normalizeCondition( attributes?.condition ) === condition,
	} ) );
};

/**
 * Edit component for the no-results-slot block.
 *
 * @param {object} props            - Block props.
 * @param {object} props.attributes - Block attributes.
 * @param {string} props.clientId   - Block client id.
 * @return {object} Rendered element.
 */
export default function NoResultsSlotEdit( { attributes, clientId } ) {
	const condition = normalizeCondition( attributes?.condition );
	const { hasInnerBlocks, hasFilteredSibling, isActive } = useSelect(
		select => {
			const editor = select( blockEditorStore );
			return {
				hasInnerBlocks: editor.getBlockCount( clientId ) > 0,
				// Stands in for the front end's page-global `hasScopedNoResultsFiltered`: one container per page.
				hasFilteredSibling: editor
					.getBlockOrder( editor.getBlockRootClientId( clientId ) )
					.some( id => editor.getBlockAttributes( id )?.condition === 'filtered' ),
				isActive:
					editor.isBlockSelected( clientId ) || editor.hasSelectedInnerBlock( clientId, true ),
			};
		},
		[ clientId ]
	);
	// Placement matches where `render.php` puts the modifier relative to
	// `get_block_wrapper_attributes()`; the trigger does not. The server keys it on empty rendered
	// output, so a variant holding blocks that render to nothing styles as authored here and as
	// default there.
	const blockProps = useBlockProps( {
		className: hasInnerBlocks
			? 'jetpack-search-no-results__variant'
			: 'jetpack-search-no-results__variant jetpack-search-no-results--default',
	} );

	const messages = hasInnerBlocks ? [] : defaultMessages( condition, hasFilteredSibling );

	return (
		<div { ...blockProps } data-testid="no-results-variant">
			{ messages.map( ( { label, text } ) => (
				<p key={ text }>
					{ label && <span className="jetpack-search-no-results__preview-label">{ label }</span> }
					{ text }
				</p>
			) ) }
			{ messages.length > 0 && (
				<p className="jetpack-search-no-results__hint">
					{ messages.length > 1
						? __( 'Default messages. Add blocks to replace them.', 'jetpack-search-pkg' )
						: __( 'Default message. Add blocks to replace it.', 'jetpack-search-pkg' ) }
				</p>
			) }
			{ /* Never unmount `InnerBlocks`: the drop target comes from `useInnerBlocksProps`, and
			     without it a drag onto an unselected variant resolves to the container, which rejects
			     it. See AGENTS.md's "InnerBlocks appender boundary trap". */ }
			<InnerBlocks renderAppender={ isActive ? InnerBlocks.ButtonBlockAppender : false } />
		</div>
	);
}

export const save = () => <InnerBlocks.Content />;
