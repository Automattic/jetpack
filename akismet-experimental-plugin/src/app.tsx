import { QueryClientProvider } from '@tanstack/react-query';
import { Page } from '@wordpress/admin-ui';
import { SlotFillProvider } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Tabs } from '@wordpress/ui';
import { JetpackFooter } from '@/components/jetpack-footer';
import { isJetpackActive } from '@/lib/is-jetpack-active';
import { createQueryClient } from '@/lib/query-client';
import { AccountTab } from '@/routes/account-tab';
import { ActivityTab } from '@/routes/activity-tab';
import { OverviewTab } from '@/routes/overview-tab';
import { SettingsTab } from '@/routes/settings-tab';
import type { ActivityCategory } from '@/routes/activity/activity-types';
import '@/styles/app.scss';

const queryClient = createQueryClient();

type TabValue = 'overview' | 'activity' | 'account' | 'settings';

const TAB_VALUES: ReadonlyArray< TabValue > = [ 'overview', 'activity', 'account', 'settings' ];

const ACTIVITY_CATEGORIES: ReadonlyArray< ActivityCategory > = [
	'comments',
	'forms',
	'logins',
	'checkouts',
	'bots',
	'brute-force',
];

/**
 * Read the initial tab from `?tab=` so deep-links work. Falls back to
 * the Overview tab — the new default landing surface as of Plan 2.
 *
 * @return The tab to mount initially.
 */
function getInitialTab(): TabValue {
	if ( typeof window === 'undefined' ) {
		return 'overview';
	}
	const value = new URL( window.location.href ).searchParams.get( 'tab' );
	return ( TAB_VALUES as readonly string[] ).includes( value ?? '' )
		? ( value as TabValue )
		: 'overview';
}

/**
 * Read the initial Activity category filter from `?category=`. The
 * Overview cards' "See activity →" buttons set this so Activity opens
 * pre-filtered.
 *
 * @return The category id, or null when unset / invalid.
 */
function getInitialActivityCategory(): ActivityCategory | null {
	if ( typeof window === 'undefined' ) {
		return null;
	}
	const value = new URL( window.location.href ).searchParams.get( 'category' );
	return ( ACTIVITY_CATEGORIES as readonly string[] ).includes( value ?? '' )
		? ( value as ActivityCategory )
		: null;
}

/**
 * Mirror the active tab + (optional) Activity category back into the URL
 * with `history.replaceState`. Keeps deep-links working without polluting
 * the back-button history.
 *
 * @param value    - The new active tab value.
 * @param category - Optional category to pin on the Activity tab.
 */
function syncTabToUrl( value: TabValue, category?: ActivityCategory | null ): void {
	if ( typeof window === 'undefined' ) {
		return;
	}
	const url = new URL( window.location.href );
	url.searchParams.set( 'tab', value );
	if ( value === 'activity' && category ) {
		url.searchParams.set( 'category', category );
	} else {
		url.searchParams.delete( 'category' );
	}
	window.history.replaceState( null, '', url.toString() );
}

/**
 * Root component for the Akismet experimental admin UI.
 *
 * Mounts the @wordpress/admin-ui `<Page>` shell with four tabs
 * (Overview / Activity / Account / Settings), wrapped in
 * `SlotFillProvider` (required by `<Page>`) and `QueryClientProvider`.
 *
 * @return The rendered tree.
 */
export function App(): JSX.Element {
	const [ activeTab, setActiveTab ] = useState< TabValue >( getInitialTab() );
	const [ activityCategory, setActivityCategory ] = useState< ActivityCategory | null >(
		getInitialActivityCategory()
	);

	return (
		<SlotFillProvider>
			<QueryClientProvider client={ queryClient }>
				<Page className="akismet-experimental" title={ __( 'Akismet Anti-Spam', 'akismet' ) }>
					<Tabs.Root
						value={ activeTab }
						onValueChange={ value => {
							const next = value as TabValue;
							setActiveTab( next );
							// Clear the category filter when leaving the Activity tab.
							if ( next !== 'activity' ) {
								setActivityCategory( null );
								syncTabToUrl( next, null );
							} else {
								syncTabToUrl( next, activityCategory );
							}
						} }
					>
						<Tabs.List>
							<Tabs.Tab value="overview">{ __( 'Overview', 'akismet' ) }</Tabs.Tab>
							<Tabs.Tab value="activity">{ __( 'Activity', 'akismet' ) }</Tabs.Tab>
							<Tabs.Tab value="account">{ __( 'Account', 'akismet' ) }</Tabs.Tab>
							<Tabs.Tab value="settings">{ __( 'Settings', 'akismet' ) }</Tabs.Tab>
						</Tabs.List>
						<Tabs.Panel value="overview">
							<OverviewTab
								onNavigateToAccount={ () => {
									setActiveTab( 'account' );
									syncTabToUrl( 'account' );
								} }
								onNavigateToActivity={ category => {
									setActivityCategory( category );
									setActiveTab( 'activity' );
									syncTabToUrl( 'activity', category );
								} }
							/>
						</Tabs.Panel>
						<Tabs.Panel value="activity">
							<ActivityTab initialCategoryFilter={ activityCategory } />
						</Tabs.Panel>
						<Tabs.Panel value="account">
							<AccountTab />
						</Tabs.Panel>
						<Tabs.Panel value="settings">
							<SettingsTab />
						</Tabs.Panel>
					</Tabs.Root>
				</Page>
				{ isJetpackActive() && <JetpackFooter /> }
			</QueryClientProvider>
		</SlotFillProvider>
	);
}
