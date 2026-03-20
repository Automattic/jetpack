import { useExperimentWithAuth } from '@automattic/jetpack-explat';
import { Launchpad } from '@automattic/launchpad';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRefEffect } from '@wordpress/compose';
import { addQueryArgs } from '@wordpress/url';

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

/**
 * DashboardLaunchpad component.
 *
 * @param {object} props            - Props.
 * @param {string} props.siteDomain - The site domain.
 * @param {string} props.siteIntent - The site intent.
 *
 * @return {import('react').JSX.Element} The DashboardLaunchpad component.
 */
function DashboardLaunchpad( { siteDomain, siteIntent } ) {
	const [ , experimentData ] = useExperimentWithAuth( 'calypso_standardized_site_launch_gating' );

	const experimentAssignment = experimentData?.variationName;

	const handleTaskClick = task => {
		// No experiment assignment (i.e., control) or not the site launch task
		if ( task.id !== 'site_launched' || ! experimentAssignment ) {
			return;
		}

		// Ungated site launch. When the action is completed, handleSiteLaunched will be called.
		if ( experimentAssignment === 'ungated_site_launch' ) {
			return;
		}

		if ( experimentAssignment === 'gated_site_launch' ) {
			window.location.assign(
				addQueryArgs( 'https://wordpress.com/start/launch-site', {
					siteSlug: siteDomain,
					ref: 'wp-admin',
				} )
			);
			return false;
		}

		throw new Error( 'Invalid experiment assignment' );
	};

	return (
		<Launchpad
			siteSlug={ siteDomain }
			checklistSlug={ siteIntent }
			launchpadContext="wpadmin-dashboard-widget"
			/**
			 * This prop will be introduced in https://github.com/Automattic/wp-calypso/pull/109434.
			 * Then we'll need to update the Launchpad package version.
			 */
			onTaskClick={ handleTaskClick }
			onSiteLaunched={ () => {
				const url = new URL( window.location.href );
				url.searchParams.set( 'celebrate-launch', 'true' );
				window.location.href = url.toString();
			} }
		/>
	);
}

export default props => {
	return (
		<QueryClientProvider client={ queryClient }>
			<div ref={ useSetHrefBase() }>
				<DashboardLaunchpad { ...props } />
			</div>
		</QueryClientProvider>
	);
};
