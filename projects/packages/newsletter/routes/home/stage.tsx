import AdminPage from '@automattic/jetpack-components/admin-page';
import { getSiteData } from '@automattic/jetpack-script-data';
import { QueryClientProvider } from '@tanstack/react-query';
import { useKeyboardShortcut } from '@wordpress/compose';
import { useCallback, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { queryClient } from '../../_inc/subscribers/lib/query-client';
import { OnboardingView } from './onboarding-view';
import { StatsView } from './stats-view';
import './route.scss';

/**
 * Which face of the Dashboard is showing.
 *
 * The Dashboard starts as an onboarding surface and is meant to graduate into a
 * stats dashboard once the newsletter has an audience.
 *
 * TODO: switch on real state — the intended rule is 3+ subscribers. That count
 * is not plumbed into this page yet (the nearest source is
 * `/wpcom/v2/subscribers/counts`, registered in the Jetpack plugin at
 * `_inc/lib/core-api/wpcom-endpoints/subscribers.php`). Until then the two views
 * are only switched by hand, so the stats design can be reviewed without having
 * to seed subscribers.
 */
type DashboardView = 'onboarding' | 'stats';

/** Remembers the hand-picked view across page loads. */
const VIEW_STORAGE_KEY = 'jetpack-newsletter-dashboard-view';

/**
 * Narrow an untrusted string to a view name.
 *
 * @param value - Candidate value from the URL or from storage.
 * @return The view, or undefined when the value isn't one.
 */
const asView = ( value: string | null ): DashboardView | undefined =>
	value === 'stats' || value === 'onboarding' ? value : undefined;

/**
 * Which view to open on.
 *
 * `?view=` wins over the remembered choice: it is the reliable way in — see the
 * shortcut below — and it makes either state a shareable link.
 *
 * @return The view to render first.
 */
const getInitialView = (): DashboardView => {
	if ( typeof window === 'undefined' ) {
		return 'onboarding';
	}

	const requested = asView( new URLSearchParams( window.location.search ).get( 'view' ) );

	if ( requested ) {
		return requested;
	}

	try {
		return asView( window.localStorage.getItem( VIEW_STORAGE_KEY ) ) ?? 'onboarding';
	} catch {
		// Storage can throw outright (Safari private browsing, blocked cookies).
		return 'onboarding';
	}
};

/**
 * Newsletter Mode "Dashboard" page.
 *
 * Owns the page chrome and which of the two views is showing; each view owns its
 * own content and state.
 *
 * @return Stage content.
 */
const Stage = (): JSX.Element => {
	const [ view, setView ] = useState< DashboardView >( getInitialView );

	const toggleView = useCallback( ( event: Event ) => {
		event.preventDefault();
		setView( current => ( current === 'stats' ? 'onboarding' : 'stats' ) );
	}, [] );

	// `mod` is ⌘ on macOS and Ctrl elsewhere.
	//
	// NOTE: Chrome and Firefox on macOS bind ⌘J to their own Downloads window, and
	// a page cannot take a browser shortcut back — so this may never fire there.
	// `?view=stats` / `?view=onboarding` is the way in that always works.
	useKeyboardShortcut( 'mod+j', toggleView );

	useEffect( () => {
		try {
			window.localStorage.setItem( VIEW_STORAGE_KEY, view );
		} catch {
			// Not being able to remember the choice is not worth failing over.
		}
	}, [ view ] );

	return (
		<AdminPage
			apiRoot={ getSiteData()?.rest_root }
			apiNonce={ getSiteData()?.rest_nonce }
			title={ __( 'Dashboard', 'jetpack-newsletter' ) }
			subTitle={ __(
				'Expand your reach, engage readers, and monetize your writing.',
				'jetpack-newsletter'
			) }
			// The mode's own nav is the frame here, so the Jetpack footer would be
			// out of place. This page only ever renders inside the mode, so it needs
			// no condition — unlike the Newsletter page, which is shared.
			showFooter={ false }
		>
			{ /* Both views can show the Recent Posts table, which fetches. */ }
			<QueryClientProvider client={ queryClient }>
				<div className="jetpack-newsletter-mode-page">
					{ view === 'stats' ? <StatsView /> : <OnboardingView /> }
				</div>
			</QueryClientProvider>
		</AdminPage>
	);
};

export { Stage as stage };
