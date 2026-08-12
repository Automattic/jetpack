/**
 * Editor preview for jetpack-search/no-results-slot.
 *
 * One condition's content inside the No Results container. Deliberately no
 * `InnerBlocks` template: an auto-inserted placeholder paragraph serializes as
 * an empty `<p>`, which would displace the localized default copy `render.php`
 * falls back to the moment an author so much as clicks into a shipped
 * template. The variant stays genuinely empty until the author adds something,
 * and the preview below stands in for what visitors would see meanwhile.
 *
 * The outline + label and `ButtonBlockAppender` are the container-boundary
 * mitigation described in AGENTS.md's "InnerBlocks appender boundary trap".
 *
 * `condition` is set once, by whatever created the variant, and deliberately
 * has no editing control: every condition already exists in the container, so
 * repointing one could only duplicate a condition or vacate another.
 */
import { InnerBlocks, store as blockEditorStore, useBlockProps } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

const CONDITIONS = [ 'any', 'filtered', 'error' ];

// Mirrors `No_Results::render_default_copy()` so the canvas shows
// what a visitor would get from an untouched variant. A function, not a
// constant, so the `__()` calls run after the editor's i18n is loaded rather
// than being cached in the source locale at module init.
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
	// Three stacked previews push the rest of the template off-screen, and only
	// one of them can ever be on screen for a visitor. An untouched variant is
	// a one-liner until it's selected; one with authored content always renders
	// in full, so nothing an author wrote is ever out of sight.
	const isCollapsed = ! hasInnerBlocks && ! isActive;
	const blockProps = useBlockProps( {
		className: [
			'jetpack-search-no-results__variant',
			'jetpack-search-no-results__editor-canvas',
			isCollapsed ? 'jetpack-search-no-results__editor-canvas--collapsed' : '',
		]
			.filter( Boolean )
			.join( ' ' ),
	} );
	const messages = defaultMessages( condition );

	return (
		<div { ...blockProps }>
			<span className="jetpack-search-no-results__editor-label">
				{ conditionLabels()[ condition ] }
			</span>
			{ isCollapsed && (
				<span className="jetpack-search-no-results__editor-summary">{ messages[ 0 ] }</span>
			) }
			{ ! isCollapsed && ! hasInnerBlocks && (
				<div className="jetpack-search-no-results__default-preview">
					{ messages.map( message => (
						<p key={ message }>{ message }</p>
					) ) }
				</div>
			) }
			{ /* Mounted even while collapsed — the inner drop target comes from
			     `useInnerBlocksProps`, so unmounting it makes a drag onto a
			     collapsed variant resolve to the container, whose `allowedBlocks`
			     then rejects it. Empty and appender-less, it has no size. */ }
			<InnerBlocks renderAppender={ isCollapsed ? false : InnerBlocks.ButtonBlockAppender } />
		</div>
	);
}

export const save = () => <InnerBlocks.Content />;
