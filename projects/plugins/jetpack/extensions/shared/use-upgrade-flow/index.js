/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { useSelect, dispatch } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { doAction, hasAction } from '@wordpress/hooks';

/**
 * Internal dependencies
 */

// Provably we should move this store to somewhere more generic.
import '../components/upgrade-nudge/store';
import { getUpgradeUrl } from '../plan-utils';

const HOOK_OPEN_CHECKOUT_MODAL = 'a8c.wpcom-block-editor.openCheckoutModal';

function redirect( url, callback ) {
	if ( callback ) {
		callback( url );
	}
	window.top.location.href = url;
}

export default function useUpgradeFlow( planSlug, onRedirect = noop ) {
	const [ isRedirecting, setIsRedirecting ] = useState( false );

	const { checkoutUrl, isAutosaveablePost, isDirtyPost, planData, currentPost } = useSelect(
		select => {
			const editorSelector = select( 'core/editor' );
			const planSelector = select( 'wordpress-com/plans' );

			const { id: postId, type: postType } = editorSelector.getCurrentPost();
			const plan = planSelector && planSelector.getPlan( planSlug );

			return {
				checkoutUrl: getUpgradeUrl( { plan, planSlug, postId, postType } ),
				isAutosaveablePost: editorSelector.isEditedPostAutosaveable(),
				isDirtyPost: editorSelector.isEditedPostDirty(),
				planData: plan,
				currentPost: editorSelector.getCurrentPost(),
			};
		},
		[]
	);

	const isPostEditor = Object.keys( currentPost ).length > 0;

	// Alias. Save post by dispatch.
	const savePost = dispatch( 'core/editor' ).savePost;

	// For the site editor, save entities
	const entityRecords = useSelect( select => {
		return select( 'core' ).__experimentalGetDirtyEntityRecords();
	} );

	// Save
	const saveEntities = async () => {
		for ( let i = 0; i < entityRecords.length; i++ ) {
			// await is needed here due to the loop.
			await dispatch( 'core' ).saveEditedEntityRecord(
				entityRecords[ i ].kind,
				entityRecords[ i ].name,
				entityRecords[ i ].key
			);
		}
	};

	const goToCheckoutPage = async event => {
		event.preventDefault();

		// If this action is available, the feature is enabled to open the checkout
		// in a modal rather than redirect the user there, away from the editor.
		if ( hasAction( HOOK_OPEN_CHECKOUT_MODAL ) ) {
			event.preventDefault();

			if ( isPostEditor ) {
				savePost( event );
			} else {
				saveEntities( event );
			}

			doAction( HOOK_OPEN_CHECKOUT_MODAL, { products: [ planData ] } );
			return;
		}

		if ( ! window?.top?.location?.href ) {
			return;
		}

		event.preventDefault();

		// Lock re-redirecting attempts.
		if ( isRedirecting ) {
			return;
		}

		setIsRedirecting( true );

		/**
		 * If there are not unsaved values, redirect.
		 * If the post is not auto-savable, redirect.
		 */
		if ( isPostEditor && ( ! isDirtyPost || ! isAutosaveablePost ) ) {
			return redirect( checkoutUrl, onRedirect );
		}

		// Save the post in the post editor or entities in the site editor. Then redirect.
		if ( isPostEditor ) {
			savePost( event ).then( () => redirect( checkoutUrl, onRedirect ) );
		} else {
			saveEntities( event ).then( () => redirect( checkoutUrl, onRedirect ) );
		}
	};

	return [ checkoutUrl, goToCheckoutPage, isRedirecting ];
}
