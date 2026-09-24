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

// Mirrors `No_Results::render_default_copy()`. An unscoped variant previews both lines even though
// a visitor only ever sees one, so the author sees every state the variant covers.
// A function, not a constant, so the `__()` calls run after the editor's i18n is loaded rather than
// being cached in the source locale at module init.
const defaultMessages = condition => {
	if ( condition === 'error' ) {
		return [ __( 'Something went wrong. Please try again.', 'jetpack-search-pkg' ) ];
	}
	const messages = [];
	if ( condition !== 'filtered' ) {
		messages.push( __( 'No results found. Try a different search.', 'jetpack-search-pkg' ) );
	}
	messages.push(
		__(
			'No results match these filters. Try clearing some, or searching for something else.',
			'jetpack-search-pkg'
		)
	);
	return messages;
};

const normalizeCondition = stored => ( CONDITIONS.includes( stored ) ? stored : 'any' );

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
	any: __(
		'Shown when a search finds no results. Add blocks to replace the default message.',
		'jetpack-search-pkg'
	),
	filtered: __(
		'Shown when a search with filters applied finds no results. Add blocks to replace the default message.',
		'jetpack-search-pkg'
	),
	error: __(
		'Shown when the search request fails. Add blocks to replace the default message.',
		'jetpack-search-pkg'
	),
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
	const { hasInnerBlocks, isActive } = useSelect(
		select => {
			const editor = select( blockEditorStore );
			return {
				hasInnerBlocks: editor.getBlockCount( clientId ) > 0,
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

	return (
		<div { ...blockProps } data-testid="no-results-variant">
			{ ! hasInnerBlocks &&
				defaultMessages( condition ).map( message => <p key={ message }>{ message }</p> ) }
			{ /* Never unmount `InnerBlocks`: the drop target comes from `useInnerBlocksProps`, and
			     without it a drag onto an unselected variant resolves to the container, which rejects
			     it. See AGENTS.md's "InnerBlocks appender boundary trap". */ }
			<InnerBlocks renderAppender={ isActive ? InnerBlocks.ButtonBlockAppender : false } />
		</div>
	);
}

export const save = () => <InnerBlocks.Content />;
