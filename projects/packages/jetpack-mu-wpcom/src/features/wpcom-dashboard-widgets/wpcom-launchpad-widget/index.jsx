import { Launchpad } from '@automattic/launchpad';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRefEffect } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
import { useState } from 'react';
import { useSiteLaunchGatingVariant } from '../../../common/hooks';
import PreLaunchSiteModal from '../../../common/pre-launch-site-modal';
import { wpcomTrackEvent } from '../../../common/tracks';

import './style.scss';

const queryClient = new QueryClient();

/**
 * Set the href base of all relative links to the wordpress.com.
 *
 * @return {Function} A ref callback.
 */
function useSetHrefBase() {
	return useRefEffect( element => {
		const observer = new MutationObserver( () => {
			element.querySelectorAll( 'a' ).forEach( a => {
				const href = a.getAttribute( 'href' );
				if ( ! href || ! href.startsWith( '/' ) ) {
					return;
				}
				a.setAttribute( 'href', new URL( href, 'https://wordpress.com' ) );
			} );
		} );
		observer.observe( element, {
			attributes: true,
			childList: true,
			subtree: true,
		} );
		return () => {
			observer.unobserve( element );
		};
	}, [] );
}

const LaunchpadWidget = ( {
	siteDomain,
	siteIntent,
	siteName,
	siteUrl,
	sitePlan,
	hasCustomDomain,
} ) => {
	const [ , variant ] = useSiteLaunchGatingVariant();
	const [ showPreLaunchModal, setShowPreLaunchModal ] = useState( false );

	// Sites on a paid plan with a custom domain skip Calypso's domain and plan
	// steps, so we confirm with the pre-launch modal before handing off.
	const qualifiesForPreLaunch = !! sitePlan && hasCustomDomain;

	const launchUrl = addQueryArgs( 'https://wordpress.com/start/launch-site', {
		siteSlug: siteDomain,
		ref: 'wp-admin',
	} );

	const onTaskClick = task => {
		if ( ! task.isLaunchTask ) {
			return;
		}

		// Site launch gating: 'semi_gated_site_launch' is the shipped default. The other
		// branches are scaffolding for future experiments; see useSiteLaunchGatingVariant.
		switch ( variant ) {
			case 'semi_gated_site_launch':
			case null:
			default:
				// Qualifying sites confirm via the pre-launch modal; everyone else
				// goes straight to the launch flow, preserving today's behavior.
				if ( qualifiesForPreLaunch ) {
					wpcomTrackEvent( 'wpcom_launch_site_pre_launch_modal_shown' );
					setShowPreLaunchModal( true );
					return false;
				}
				window.location.assign( launchUrl );
				return false;
		}
	};

	return (
		<>
			<div ref={ useSetHrefBase() }>
				<Launchpad
					siteSlug={ siteDomain }
					checklistSlug={ siteIntent }
					launchpadContext="wpadmin-dashboard-widget"
					onTaskClick={ onTaskClick }
				/>
			</div>
			{ showPreLaunchModal && (
				<PreLaunchSiteModal
					siteName={ siteName }
					siteDomain={ siteDomain }
					homeUrl={ siteUrl }
					planName={ sitePlan?.product_name || __( 'Paid plan', 'jetpack-mu-wpcom' ) }
					launchUrl={ launchUrl }
					onClose={ () => setShowPreLaunchModal( false ) }
				/>
			) }
		</>
	);
};

export default props => {
	return (
		<QueryClientProvider client={ queryClient }>
			<LaunchpadWidget { ...props } />
		</QueryClientProvider>
	);
};
