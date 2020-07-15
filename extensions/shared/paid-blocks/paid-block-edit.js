
/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { createHigherOrderComponent, compose } from '@wordpress/compose';
import { BlockControls } from '@wordpress/block-editor';
import { ToolbarGroup, Button } from '@wordpress/components';
import { withSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { getUpgradeUrl } from './utils';

const JetpackPaidBlockEdit = OriginalBlockEdit => props => {
	const { plan, postId, postType, planSlug } = props;

	const goToCheckoutPage = () => {
		if ( ! window?.location?.href ) {
			return;
		}

		// Redirect to checkout page.
		window.location.href = getUpgradeUrl( { plan, planSlug, postId, postType } );
	};

	return (
		<Fragment>
			<BlockControls>
				<ToolbarGroup>
					<Button
						aria-label={ __( 'Upgrade to Premium to use this block', 'jetpack' ) }
						onClick={ goToCheckoutPage }
						label={ __(
							'Upgrade to Premium to use this block.',
							'jetpack'
						) }
						showTooltip={ true }
					>
						{ __( 'Upgrade', 'jetpack' ) }
					</Button>
				</ToolbarGroup>
			</BlockControls>

			<OriginalBlockEdit { ...props } />
		</Fragment>
	);
};

export default createHigherOrderComponent(
	compose( [
		withSelect( select => {
			const editorSelector = select( 'core/editor' );
			const post = editorSelector.getCurrentPost();
			const planSlug = 'value_bundle';

			return {
				plan: select( 'wordpress-com/plans' ).getPlan( planSlug ),
				planSlug,
				postId: post.id,
				postType: post.type,
				postStatus: post.status,
			};
		} ),
		JetpackPaidBlockEdit,
	] ),
	'JetpackPaidBlockEdit'
);
