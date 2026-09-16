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

// Keyed rather than branched: a `return __( … )` per branch reads better but
// the production minifier folds the identical calls into one `__()` with a
// computed msgid, which `i18n-check-webpack-plugin` rejects and which would
// leave the strings untranslatable.
export const conditionLabels = () => ( {
	any: __( 'Any empty search', 'jetpack-search-pkg' ),
	filtered: __( 'Filters are active', 'jetpack-search-pkg' ),
	error: __( 'Search failed', 'jetpack-search-pkg' ),
} );

/**
 * Per-condition display name for a variant, used as the block's `__experimentalLabel` so List view,
 * the breadcrumb, and the block toolbar name the condition instead of repeating the block title.
 *
 * @param {object} attributes - Block attributes.
 * @return {string} The condition's label.
 */
export const conditionLabel = attributes => {
	const stored = attributes?.condition;
	return conditionLabels()[ CONDITIONS.includes( stored ) ? stored : 'any' ];
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
	const stored = attributes?.condition;
	const condition = CONDITIONS.includes( stored ) ? stored : 'any';
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
			{ /* `ButtonBlockAppender` bounds the insertion target: see AGENTS.md's "InnerBlocks
			     appender boundary trap". Gated on selection to keep three stacked variants quiet;
			     core exempts a custom appender from that gate rather than requiring it. `InnerBlocks`
			     stays mounted either way, because the drop target comes from `useInnerBlocksProps`
			     and the container's `allowedBlocks` rejects a direct drop. */ }
			<InnerBlocks renderAppender={ isActive ? InnerBlocks.ButtonBlockAppender : false } />
		</div>
	);
}

export const save = () => <InnerBlocks.Content />;
