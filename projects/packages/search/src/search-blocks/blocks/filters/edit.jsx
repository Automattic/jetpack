/**
 * Editor preview for jetpack-search/filters.
 *
 * Renders an InnerBlocks region pre-populated with the most common Jetpack
 * Search filters. The container itself owns no behavior — it's a Group-like
 * wrapper, so the front-end render.php just emits `$content` inside the
 * block-wrapper div and lets each inner filter contribute its own markup.
 *
 * The default appender's hover-triggered click zone isn't visually bounded,
 * so a click just outside this InnerBlocks region silently inserts the new
 * filter as a sibling in the parent instead of a child here — it never joins
 * the composition (doesn't sync to Collapsible Filters, doesn't render inside
 * the sidebar wrapper), with no indication anything went wrong (SEARCH-317).
 * `ButtonBlockAppender` bounds the insertion target inside the container, the
 * editor-only outline+label makes the boundary visible before a click, and
 * the Notice below catches any stray filter block that still ends up outside
 * — see AGENTS.md's "Editor preview gotchas" for the general pattern.
 */
import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';
import { Notice } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

const TEMPLATE = [
	[ 'jetpack-search/active-filters' ],
	[ 'jetpack-search/filter-checkbox', { filterType: 'taxonomy', taxonomy: 'category' } ],
	[ 'jetpack-search/filter-checkbox', { filterType: 'taxonomy', taxonomy: 'post_tag' } ],
	[ 'jetpack-search/filter-checkbox', { filterType: 'author' } ],
	[ 'jetpack-search/filter-checkbox', { filterType: 'post_type' } ],
	[ 'jetpack-search/filter-date', { interval: 'year' } ],
];

const ALLOWED = [
	'jetpack-search/active-filters',
	'jetpack-search/clear-filters',
	'jetpack-search/filter-checkbox',
	'jetpack-search/filter-date',
];

/**
 * Edit component for the filters block.
 *
 * @param {object} props          - Block props.
 * @param {string} props.clientId - This block's client id.
 * @return {object} Rendered element.
 */
export default function FiltersEdit( { clientId } ) {
	const hasStraySibling = useSelect(
		select => {
			const { getBlockRootClientId, getBlocks } = select( 'core/block-editor' );
			const parentClientId = getBlockRootClientId( clientId );
			return getBlocks( parentClientId ).some(
				block => block.clientId !== clientId && ALLOWED.includes( block.name )
			);
		},
		[ clientId ]
	);

	const blockProps = useBlockProps( {
		className: 'jetpack-search-filters jetpack-search-filters__editor-canvas',
	} );
	return (
		<div { ...blockProps }>
			<span className="jetpack-search-filters__editor-label">
				{ __( 'Filters', 'jetpack-search-pkg' ) }
			</span>
			{ hasStraySibling && (
				<Notice status="warning" isDismissible={ false }>
					{ __(
						"A filter block sits outside this container and won't be part of these filters (or sync to the Collapsible Filters panel). Move it inside, or delete it if unintended.",
						'jetpack-search-pkg'
					) }
				</Notice>
			) }
			<InnerBlocks
				template={ TEMPLATE }
				allowedBlocks={ ALLOWED }
				renderAppender={ InnerBlocks.ButtonBlockAppender }
			/>
		</div>
	);
}

export const save = () => <InnerBlocks.Content />;
