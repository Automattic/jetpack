import { QueryClientProvider } from '@tanstack/react-query';
import { Page } from '@wordpress/admin-ui';
import { SlotFillProvider } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Tabs } from '@wordpress/ui';
import { JetpackFooter } from '@/components/jetpack-footer';
import { isJetpackActive } from '@/lib/is-jetpack-active';
import { createQueryClient } from '@/lib/query-client';
import { AccountTab } from '@/routes/account-tab';
import { SettingsTab } from '@/routes/settings-tab';
import '@/styles/app.scss';

const queryClient = createQueryClient();

type TabValue = 'account' | 'settings';

/**
 * Read the initial tab from `?tab=` so deep-links work. Falls back to the
 * account tab — the most common entry point.
 *
 * @return The tab to mount initially.
 */
function getInitialTab(): TabValue {
	if ( typeof window === 'undefined' ) {
		return 'account';
	}
	const value = new URL( window.location.href ).searchParams.get( 'tab' );
	return value === 'settings' ? 'settings' : 'account';
}

/**
 * Mirror the active tab back into the URL with `history.replaceState`. Keeps
 * deep-links working without polluting the back-button history (each tab
 * switch shouldn't be a navigation event).
 *
 * @param value - The new active tab value.
 */
function syncTabToUrl( value: TabValue ): void {
	if ( typeof window === 'undefined' ) {
		return;
	}
	const url = new URL( window.location.href );
	url.searchParams.set( 'tab', value );
	window.history.replaceState( null, '', url.toString() );
}

/**
 * Root component for the Akismet experimental admin UI.
 *
 * Mounts the @wordpress/admin-ui `<Page>` shell with two tabs (Account +
 * Settings), wrapped in `SlotFillProvider` (required by `<Page>`) and
 * `QueryClientProvider`. Footer is conditional on Jetpack being active.
 *
 * @return The rendered tree.
 */
export function App(): JSX.Element {
	return (
		<SlotFillProvider>
			<QueryClientProvider client={ queryClient }>
				<Page className="akismet-experimental" title={ __( 'Akismet Anti-Spam', 'akismet' ) }>
					<Tabs.Root
						defaultValue={ getInitialTab() }
						onValueChange={ value => syncTabToUrl( value as TabValue ) }
					>
						<Tabs.List>
							<Tabs.Tab value="account">{ __( 'Account', 'akismet' ) }</Tabs.Tab>
							<Tabs.Tab value="settings">{ __( 'Settings', 'akismet' ) }</Tabs.Tab>
						</Tabs.List>
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
