import { InnerBlocks } from '@wordpress/block-editor';
import { compose } from '@wordpress/compose';
import { withSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import Context from '../_inc/context';
import { usePremiumContentAllowedBlocks } from '../_inc/premium';

function Edit( { hasInnerBlocks } ) {
	const allowedInnerBlocks = usePremiumContentAllowedBlocks();

	return (
		<Context.Consumer>
			{ ( { selectedTab } ) => (
				/** @see https://github.com/evcohen/eslint-plugin-jsx-a11y/blob/HEAD/docs/rules/no-static-element-interactions.md#case-the-event-handler-is-only-being-used-to-capture-bubbled-events */
				// eslint-disable-next-line
				<div hidden={ selectedTab.id === 'wall' } className={ selectedTab.className }>
					<InnerBlocks
						allowedBlocks={ allowedInnerBlocks }
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
		return {
			// @ts-ignore difficult to type with JSDoc
			hasInnerBlocks: !! select( 'core/block-editor' ).getBlocksByClientId( props.clientId )[ 0 ]
				.innerBlocks.length,
		};
	} ),
] )( Edit );
