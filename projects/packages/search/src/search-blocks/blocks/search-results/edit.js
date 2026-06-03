/**
 * Editor preview for jetpack-search/search-results.
 *
 * Renders an InnerBlocks region pre-populated with the result-display stack
 * (count + sort row, results list, load-more). The results-list block owns
 * its empty-state and error-state messages internally. Container owns no
 * behavior beyond the post-type-scope inspector setting — render.php is a
 * Group-like wrapper that emits `$content` and lets each inner block
 * contribute its own markup and Interactivity API directives.
 *
 * Post-type scope: this block is the single source of truth for "which
 * post types this search experience covers." The scope seeds
 * `state.staticPostTypes` on render and applies to every fetch the store
 * makes — initial hydration, typed searches, filter/sort, load-more.
 */
import { InspectorControls, InnerBlocks, useBlockProps } from '@wordpress/block-editor';
import { PanelBody } from '@wordpress/components';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import PostTypeScopeControl, { MODE_INCLUDE, MODE_EXCLUDE } from '../../editor/post-type-control';

const TEMPLATE = [
	[
		'core/group',
		{ layout: { type: 'flex', flexWrap: 'nowrap', justifyContent: 'space-between' } },
		[ [ 'jetpack-search/results-count' ], [ 'jetpack-search/results-sort' ] ],
	],
	[ 'jetpack-search/results-list' ],
	[ 'jetpack-search/results-load-more' ],
	[ 'jetpack-search/powered-by' ],
];

const ALLOWED = [
	'core/group',
	'jetpack-search/results-count',
	'jetpack-search/results-sort',
	'jetpack-search/results-list',
	'jetpack-search/results-load-more',
	'jetpack-search/powered-by',
];

/**
 * Edit component for the search-results block.
 *
 * @param {object}   props               - Block props.
 * @param {object}   props.attributes    - Saved block attributes.
 * @param {Function} props.setAttributes - Attribute setter.
 * @return {object} Rendered element.
 */
export default function SearchResultsEdit( { attributes, setAttributes } ) {
	const blockProps = useBlockProps( { className: 'jetpack-search-search-results' } );
	const mode = attributes?.postTypeMode === MODE_INCLUDE ? MODE_INCLUDE : MODE_EXCLUDE;
	const postTypes = useMemo(
		() => ( Array.isArray( attributes?.postTypes ) ? attributes.postTypes : [] ),
		[ attributes?.postTypes ]
	);

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Search scope', 'jetpack-search-pkg' ) } initialOpen={ false }>
					<p
						className="components-base-control__help"
						style={ {
							color: 'rgba(30, 30, 30, 0.62)',
							fontSize: '12px',
							fontStyle: 'italic',
							marginTop: 0,
							marginBottom: '12px',
						} }
					>
						{ __(
							'Limit which post types this search experience covers. Leave the list empty to search everything.',
							'jetpack-search-pkg'
						) }
					</p>
					<PostTypeScopeControl
						mode={ mode }
						postTypes={ postTypes }
						onChange={ ( { mode: nextMode, postTypes: nextPostTypes } ) =>
							setAttributes( { postTypeMode: nextMode, postTypes: nextPostTypes } )
						}
					/>
				</PanelBody>
			</InspectorControls>
			<div { ...blockProps }>
				<InnerBlocks template={ TEMPLATE } allowedBlocks={ ALLOWED } />
			</div>
		</>
	);
}

export const save = () => <InnerBlocks.Content />;
