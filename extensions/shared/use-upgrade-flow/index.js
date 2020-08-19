/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { useSelect, dispatch } from '@wordpress/data';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */

// Provably we should move this store to somewhere more generic.
import '../components/upgrade-nudge/store';
import { getUpgradeUrl } from '../plan-utils';

function redirect( url, callback ) {
	if ( callback ) {
		callback( url );
	}
	window.top.location.href = url;
}

export default function useUpgradeFlow( planSlug, onRedirect = noop ) {
	const [ isRedirecting, setIsRedirecting ] = useState( false );

	const { checkoutUrl, isAutosaveablePost, isDirtyPost } = useSelect( select => {
		const editorSelector = select( 'core/editor' );
		const planSelector = select( 'wordpress-com/plans' );

		const { id: postId, type: postType } = editorSelector.getCurrentPost();
		const plan = planSelector && planSelector.getPlan( planSlug );

		return {
			checkoutUrl: getUpgradeUrl( { plan, planSlug, postId, postType } ),
			isAutosaveablePost: editorSelector.isEditedPostAutosaveable(),
			isDirtyPost: editorSelector.isEditedPostDirty(),
		};
	}, [] );

	// Alias. Save post by dispatch.
	const savePost = dispatch( 'core/editor' ).savePost;

	const goToCheckoutPage = async event => {
		if ( ! window?.top?.location?.href ) {
			return;
		}

		event.preventDefault();

		// Lock re-redirecting attempts.
		if ( isRedirecting ) {
			return;
		}

		setIsRedirecting( true );

		/*
		 * If there are not unsaved values, redirect.
		 * If the post is not auto-savable, redirect.
		 */
		if ( ! isDirtyPost || ! isAutosaveablePost ) {
			return redirect( checkoutUrl, onRedirect );
		}

		// Save the post. Then redirect.
		savePost( event ).then( () => redirect( checkoutUrl, onRedirect ) );
	};

	return [ checkoutUrl, goToCheckoutPage, isRedirecting ];
}
