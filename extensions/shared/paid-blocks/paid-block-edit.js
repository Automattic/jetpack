
/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { createHigherOrderComponent } from '@wordpress/compose';
import { BlockControls } from '@wordpress/block-editor';
import { ToolbarGroup, Button } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { getUpgradeUrl, isUpgradable } from './utils';

export default createHigherOrderComponent(
	OriginalBlockEdit => props => {
		const planSlug = 'value_bundle';
		const { plan, postId, postType } = useSelect( select => {
			return {
				plan: select( 'wordpress-com/plans' ).getPlan( planSlug ),
				postId: select( 'core/editor' ).getCurrentPostId(),
				postType: select( 'core/editor' ).getCurrentPostType(),
			};
		} );

		if ( ! isUpgradable( props?.name ) ) {
			return <OriginalBlockEdit { ...props } />;
		}

		const goToCheckoutPage = () => {
			window.location = getUpgradeUrl( { plan, planSlug, postId, postType } );
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
	},
	'JetpackPaidBlockEdit'
);
