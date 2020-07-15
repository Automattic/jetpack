
/**
 * WordPress dependencies
 */
import { Fragment, useEffect, useState } from '@wordpress/element';
import { createHigherOrderComponent, compose } from '@wordpress/compose';
import { withSelect, withDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { getUpgradeUrl } from '../plan-utils';

const JetpackPaidBlockEdit = OriginalBlockEdit => props => {
	const {
		plan,
		postId,
		postType,
		planSlug,
		isSavingPost,
		savePost,
		isEditedPostAutosaveable,
		isEditedPostDirty,
	} = props;

	const [ shouldRedirectToCheckoutPage, setShouldRedirect ] = useState( false );

	const checkoutUrl = getUpgradeUrl( { plan, planSlug, postId, postType } );

	useEffect( () => {
		if ( isSavingPost ) {
			return;
		}

	    if ( ! shouldRedirectToCheckoutPage ) {
		    return;
	    }

	    window.location.href = checkoutUrl;
	}, [ isSavingPost, shouldRedirectToCheckoutPage, checkoutUrl ] );

	const goToCheckoutPage = () => {
		if ( ! window?.location?.href ) {
			return;
		}

		/*
		 * If there are not unsaved values, redirect, or
		 * If the post is not autosaveable, redirect.
		 */
		if ( ! isEditedPostDirty || ! isEditedPostAutosaveable ) {
			return window.location.href = checkoutUrl;
		}

		// Save the post before to perform redirection.
		savePost();

		// Hack to ensuring getting the saving post status.
		setTimeout( () => setShouldRedirect( true ), 0 );
	};

	return (
		<Fragment>
			<OriginalBlockEdit { ...props } />
		</Fragment>
	);
};

export default createHigherOrderComponent(
	compose( [
		withSelect( select => {
			const editorSelector = select( 'core/editor' );
			const post = editorSelector.getCurrentPost();
			const PLAN_SLUG = 'value_bundle';

			return {
				plan: select( 'wordpress-com/plans' ).getPlan( PLAN_SLUG ),
				PLAN_SLUG,
				postId: post.id,
				postType: post.type,
				postStatus: post.status,
				isSavingPost: editorSelector.isSavingPost(),
				isEditedPostAutosaveable: editorSelector.isEditedPostAutosaveable(),
				isEditedPostDirty: editorSelector.isEditedPostDirty(),
			};
		} ),
		withDispatch( dispatch => {
			return {
				savePost: dispatch( 'core/editor' ).savePost,
			};
		} ),
		JetpackPaidBlockEdit,
	] ),
	'JetpackPaidBlockEdit'
);
