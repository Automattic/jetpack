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
 *
 * Results per page: also the single source of truth for how many results
 * each fetch returns (initial + load-more). Seeds `state.resultsPerPage`;
 * `0`/unset resolves live to the site's `posts_per_page` Reading setting at
 * render time, so a later change to that setting still applies.
 */
import { InspectorControls, InnerBlocks, useBlockProps } from '@wordpress/block-editor';
import { PanelBody, TextControl } from '@wordpress/components';
import { useMemo } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
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
	const maxResultsPerPage = window?.JetpackSearchBlocksConfig?.maxResultsPerPage ?? 100;
	const defaultResultsPerPage = window?.JetpackSearchBlocksConfig?.defaultResultsPerPage ?? 10;

	// Empty clears back to `0` (auto) — must short-circuit before the numeric
	// clamp, since `Number( '' )` is `0` and `Math.max( 1, 0 )` would floor an
	// intentionally-cleared field to `1`, defeating the auto contract.
	const handleResultsPerPageChange = value => {
		if ( value === '' || value === undefined || value === null ) {
			setAttributes( { resultsPerPage: 0 } );
			return;
		}
		const parsed = Number( value );
		if ( ! Number.isFinite( parsed ) ) {
			setAttributes( { resultsPerPage: 0 } );
			return;
		}
		setAttributes( {
			resultsPerPage: Math.min( Math.max( 1, Math.round( parsed ) ), maxResultsPerPage ),
		} );
	};

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
				<PanelBody title={ __( 'Pagination', 'jetpack-search-pkg' ) } initialOpen={ false }>
					<TextControl
						type="number"
						label={ __( 'Results per page', 'jetpack-search-pkg' ) }
						help={ __( "Leave blank to match the site's Reading setting.", 'jetpack-search-pkg' ) }
						min={ 1 }
						max={ maxResultsPerPage }
						value={ attributes?.resultsPerPage || '' }
						placeholder={ sprintf(
							// translators: %d is the site's "Blog pages show at most" Reading setting.
							__( 'Site default (%d)', 'jetpack-search-pkg' ),
							defaultResultsPerPage
						) }
						onChange={ handleResultsPerPageChange }
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
