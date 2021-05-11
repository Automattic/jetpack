/**
 * WordPress dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { useDispatch, withSelect } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Context from '../_inc/context';

function Edit( { hasInnerBlocks, parentClientId, isSelected } ) {
	const { selectBlock } = useDispatch( 'core/block-editor' );

	useEffect( () => {
		if ( isSelected ) {
			// The subscriber view is managed by the parent premium-content/container block,
			// so here we ensure that the parent block is selected instead.
			selectBlock( parentClientId );
		}
	}, [ selectBlock, isSelected, parentClientId ] );

	return (
		<Context.Consumer>
			{ ( { selectedTab, stripeNudge } ) => (
				/** @see https://github.com/evcohen/eslint-plugin-jsx-a11y/blob/HEAD/docs/rules/no-static-element-interactions.md#case-the-event-handler-is-only-being-used-to-capture-bubbled-events */
				// eslint-disable-next-line
				<div hidden={ selectedTab.id === 'wall' } className={ selectedTab.className }>
					{ stripeNudge }
					<InnerBlocks
						renderAppender={ ! hasInnerBlocks && InnerBlocks.ButtonBlockAppender }
						templateLock={ false }
						templateInsertUpdatesSelection={ false }
						template={ [
							[ 'core/heading', { content: __( 'Subscriber Content', 'jetpack' ), level: 3 } ],
							[
								'core/paragraph',
								{
									content: __(
										'Add content here that will only be visible to your subscribers.',
										'jetpack'
									),
								},
							],
						] }
					/>
				</div>
			) }
		</Context.Consumer>
	);
}

export default compose( [
	withSelect( ( select, props ) => {
		const { getBlockParents, getSelectedBlockClientId } = select( 'core/block-editor' );

		const selectedBlockClientId = getSelectedBlockClientId();
		const parents = getBlockParents( selectedBlockClientId );
		const parentClientId = parents.length ? parents[ parents.length - 1 ] : undefined;

		return {
			parentClientId,
			// @ts-ignore difficult to type with JSDoc
			hasInnerBlocks: !! select( 'core/block-editor' ).getBlocksByClientId( props.clientId )[ 0 ]
				.innerBlocks.length,
		};
	} ),
] )( Edit );
