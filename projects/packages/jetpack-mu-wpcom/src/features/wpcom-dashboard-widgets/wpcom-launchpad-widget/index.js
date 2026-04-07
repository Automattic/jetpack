import { useExperimentWithAuth } from '@automattic/jetpack-explat';
import { Launchpad } from '@automattic/launchpad';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRefEffect } from '@wordpress/compose';
import { addQueryArgs } from '@wordpress/url';
import { useState } from 'react';
import CelebrateLaunchModal from '../../../common/celebrate-launch/celebrate-launch-modal';
import { useLaunchSiteMutation } from '../../../common/hooks';

import './style.scss';

const queryClient = new QueryClient();

const data = typeof window === 'object' ? window.JETPACK_MU_WPCOM_DASHBOARD_WIDGETS : {};

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

const LaunchpadWidget = ( { siteDomain, siteIntent } ) => {
	const [ , experimentData ] = useExperimentWithAuth( 'calypso_standardized_site_launch_gating' );
	const [ showCelebrateLaunchModal, setShowCelebrateLaunchModal ] = useState( false );

	const variationName = experimentData?.variationName;

	const { mutate: launchSite } = useLaunchSiteMutation( data.blogId, () =>
		setShowCelebrateLaunchModal( true )
	);

	const onTaskClick = task => {
		// If not a launch task or no variant (control), resort to default behavior.
		if ( ! task.isLaunchTask || ! variationName ) {
			return;
		}

		if ( variationName === 'ungated_site_launch' ) {
			launchSite();
			return false;
		}

		if ( variationName === 'gated_site_launch' ) {
			window.location.assign(
				addQueryArgs( 'https://wordpress.com/start/launch-site', {
					siteSlug: siteDomain,
					ref: 'wp-admin',
				} )
			);
			return false;
		}
	};

	// Control: launchpad handles the API call, redirect to celebrate on success.
	const onSiteLaunched = () => {
		const url = new URL( window.location.href );
		url.searchParams.set( 'celebrate-launch', 'true' );
		window.location.href = url.toString();
	};

	return (
		<>
			<div ref={ useSetHrefBase() }>
				<Launchpad
					siteSlug={ siteDomain }
					checklistSlug={ siteIntent }
					launchpadContext="wpadmin-dashboard-widget"
					onSiteLaunched={ onSiteLaunched }
					onTaskClick={ onTaskClick }
				/>
			</div>
			{ showCelebrateLaunchModal && (
				<CelebrateLaunchModal
					{ ...data }
					onRequestClose={ () => {
						setShowCelebrateLaunchModal( false );
						window.location.reload();
					} }
				/>
			) }
		</>
	);
};

export default ( { siteDomain, siteIntent } ) => {
	return (
		<QueryClientProvider client={ queryClient }>
			<LaunchpadWidget siteDomain={ siteDomain } siteIntent={ siteIntent } />
		</QueryClientProvider>
	);
};
