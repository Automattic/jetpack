/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { CheckboxControl } from '@wordpress/components';
import { compose } from '@wordpress/compose';
import { PostTypeSupportCheck } from '@wordpress/editor';
import { withDispatch, withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import JetpackSubscriptionsPanel from '../../shared/jetpack-subscriptions-panel';

const SubscriptionsCheckbox = ( { isPostExcludedFromSubs, editPost } ) => (
	<PostTypeSupportCheck supportKeys="jetpack-post-subscriptions">
		<JetpackSubscriptionsPanel>
			<CheckboxControl
				label={ __( 'Don’t send this post to subscribers.', 'jetpack' ) }
				checked={ isPostExcludedFromSubs }
				onChange={ value => {
					editPost( { jetpack_dont_email_post_to_subs: value } );
				} }
			/>
		</JetpackSubscriptionsPanel>
	</PostTypeSupportCheck>
);

// Fetch the post meta.
const applyWithSelect = withSelect( select => {
	const { getEditedPostAttribute } = select( 'core/editor' );
	const isPostExcludedFromSubs = getEditedPostAttribute( 'jetpack_dont_email_post_to_subs' );

	return { isPostExcludedFromSubs };
} );

// Provide method to update post meta.
const applyWithDispatch = withDispatch( dispatch => {
	const { editPost } = dispatch( 'core/editor' );

	return { editPost };
} );

// Combine the higher-order components.
export default compose( [ applyWithSelect, applyWithDispatch ] )( SubscriptionsCheckbox );
