/**
 * Editor preview for jetpack-search/no-results.
 *
 * A container of `no-results-slot` variants, one per condition. The inspector
 * is the only way to add one — the default appender would insert a second
 * `Any empty search` variant, which the renderer would just stack on the
 * first. Choosing a condition adds the slot for it and nothing else.
 *
 * Deliberately no `InnerBlocks` template: an empty container renders the same
 * filter-aware default pair `results-list` always emitted, so the shipped
 * templates can carry a self-closing block and still translate. Auto-inserting
 * a variant would dirty every template the moment an author clicked into it.
 */
import { InnerBlocks, InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { Button, PanelBody } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { conditionLabels } from '../no-results-slot/edit';

const SLOT_BLOCK = 'jetpack-search/no-results-slot';
const CONDITIONS = [ 'any', 'filtered', 'error' ];
const ALLOWED = [ SLOT_BLOCK ];

/**
 * Edit component for the no-results block.
 *
 * @param {object} props          - Block props.
 * @param {string} props.clientId - Block client id.
 * @return {object} Rendered element.
 */
export default function NoResultsEdit( { clientId } ) {
	const { used, count } = useSelect(
		select => {
			const blockEditor = select( 'core/block-editor' );
			const slots = blockEditor.getBlocks( clientId );
			return {
				// Joined rather than an array so `useSelect`'s `isShallowEqual`
				// comparison doesn't see a fresh object on every store change.
				used: slots.map( s => s.attributes?.condition ?? 'any' ).join( ',' ),
				count: slots.length,
			};
		},
		[ clientId ]
	);
	const { insertBlock } = useDispatch( 'core/block-editor' );
	const blockProps = useBlockProps( {
		className: 'jetpack-search-no-results jetpack-search-no-results__editor-container',
	} );
	const taken = used ? used.split( ',' ) : [];
	const available = CONDITIONS.filter( c => ! taken.includes( c ) );
	const labels = conditionLabels();

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Settings', 'jetpack-search-pkg' ) }>
					<p className="components-base-control__help">
						{ __(
							'Add a variant for each condition you want to word differently. With none added, the default message covers every empty search.',
							'jetpack-search-pkg'
						) }
					</p>
					{ available.map( condition => (
						<Button
							key={ condition }
							__next40pxDefaultSize
							variant="secondary"
							onClick={ () =>
								insertBlock( createBlock( SLOT_BLOCK, { condition } ), count, clientId )
							}
						>
							{ labels[ condition ] }
						</Button>
					) ) }
				</PanelBody>
			</InspectorControls>
			<div { ...blockProps }>
				{ count === 0 && (
					<div className="jetpack-search-no-results__variant jetpack-search-no-results__editor-canvas">
						<span className="jetpack-search-no-results__editor-label">
							{ __( 'No Results', 'jetpack-search-pkg' ) }
						</span>
						<div className="jetpack-search-no-results__default-preview">
							<p>{ __( 'No results found. Try a different search.', 'jetpack-search-pkg' ) }</p>
							<p>
								{ __(
									'No results match these filters. Try clearing some, or searching for something else.',
									'jetpack-search-pkg'
								) }
							</p>
						</div>
					</div>
				) }
				<InnerBlocks allowedBlocks={ ALLOWED } renderAppender={ false } />
			</div>
		</>
	);
}

export const save = () => <InnerBlocks.Content />;
