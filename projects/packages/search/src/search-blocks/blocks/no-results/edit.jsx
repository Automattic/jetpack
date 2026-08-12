/**
 * Editor preview for jetpack-search/no-results.
 *
 * A container of `no-results-slot` variants, one per condition. All three are
 * created up front so an author sees every empty state the search page can
 * reach and can edit any of them in place — or leave them, in which case each
 * renders its localized default copy exactly as before the block existed.
 *
 * Gutenberg gives a block a single `InnerBlocks` region, so per-condition
 * content has to live in child blocks; the variants are that mechanism rather
 * than something an author is meant to think about. The inspector only offers
 * to re-add a condition whose variant was deleted, and the default appender is
 * suppressed — it would insert a second `Any empty search` variant, which the
 * renderer would just stack on the first.
 */
import { InnerBlocks, InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { Button, PanelBody } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { conditionLabels } from './slot/edit';

const SLOT_BLOCK = 'jetpack-search/no-results-slot';
const CONDITIONS = [ 'any', 'filtered', 'error' ];
const ALLOWED = [ SLOT_BLOCK ];
const TEMPLATE = CONDITIONS.map( condition => [ SLOT_BLOCK, { condition } ] );

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
				// Normalized the same way `render.php` and the variant's own edit
				// do, so a hand-edited condition that renders as `any` also reads
				// as taken here — otherwise the panel offers a duplicate.
				// Joined rather than an array so `useSelect`'s `isShallowEqual`
				// comparison doesn't see a fresh object on every store change.
				used: slots
					.map( s =>
						CONDITIONS.includes( s.attributes?.condition ) ? s.attributes.condition : 'any'
					)
					.join( ',' ),
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
	const missing = CONDITIONS.filter( c => ! taken.includes( c ) );
	const labels = conditionLabels();

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Settings', 'jetpack-search-pkg' ) }>
					<p className="components-base-control__help">
						{ missing.length
							? __( 'Bring back a condition you removed.', 'jetpack-search-pkg' )
							: __(
									'Edit any of the messages below, or leave them for the default copy. Each one takes any blocks — links, images, buttons.',
									'jetpack-search-pkg'
							  ) }
					</p>
					{ missing.map( condition => (
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
				<InnerBlocks allowedBlocks={ ALLOWED } template={ TEMPLATE } renderAppender={ false } />
			</div>
		</>
	);
}

export const save = () => <InnerBlocks.Content />;
