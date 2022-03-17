/**
 * External dependencies
 */
import { useAutosaveAndRedirect } from '@automattic/jetpack-shared-extension-utils';
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { doAction, hasAction } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import '../../components/upgrade-nudge/store';
// Uncomment this when plan-utils is migrated to shared-extension-utils
// import { getUpgradeUrl } from '../plan-utils';

const getUpgradeUrl = () => 'https://wordpress.com';

const HOOK_OPEN_CHECKOUT_MODAL = 'a8c.wpcom-block-editor.openCheckoutModal';

/**
 * @param planSlug
 * @param onRedirect
 */
export default function useUpgradeFlow( planSlug, onRedirect = noop ) {
	const { checkoutUrl, planData } = useSelect( select => {
		const editorSelector = select( 'core/editor' );
		const planSelector = select( 'wordpress-com/plans' );

		const { id: postId, type: postType } = editorSelector.getCurrentPost();
		const plan = planSelector && planSelector.getPlan( planSlug );

		return {
			checkoutUrl: getUpgradeUrl( { plan, planSlug, postId, postType } ),
			planData: plan,
		};
	}, [] );

	const { autosave, autosaveAndRedirect, isRedirecting } = useAutosaveAndRedirect(
		checkoutUrl,
		onRedirect
	);

	const goToCheckoutPage = async event => {
		event.preventDefault();

		// If this action is available, the feature is enabled to open the checkout
		// in a modal rather than redirect the user there, away from the editor.
		if ( hasAction( HOOK_OPEN_CHECKOUT_MODAL ) ) {
			event.preventDefault();

			autosave( event );

			doAction( HOOK_OPEN_CHECKOUT_MODAL, { products: [ planData ] } );
			return;
		}

		autosaveAndRedirect( event );
	};

	return [ checkoutUrl, goToCheckoutPage, isRedirecting, planData ];
}
