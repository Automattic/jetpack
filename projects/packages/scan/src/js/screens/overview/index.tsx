import { useCallback, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Tabs } from '@wordpress/ui';
import { useSearchParams } from 'react-router';
import ActiveThreats from './active-threats';
import ScanHistory from './scan-history';
import type { FC } from 'react';

type ScanTab = 'active' | 'history';

const isScanTab = ( value: string | null ): value is ScanTab =>
	value === 'active' || value === 'history';

/**
 * Track the AdminPage header's height and expose it as a CSS variable on
 * `.admin-ui-page` so `.jetpack-scan-page__tabs-row` can sticky-stick
 * directly underneath. Mirrors Newsletter's `NewsletterPage` shell from
 * #48420 phase 3 — the header height isn't known at build time (subtitle
 * wrapping, action buttons, sandbox badges all change it) so we measure
 * it at runtime via `ResizeObserver`.
 */
function useStickyHeaderHeight(): void {
	useEffect( () => {
		const header = document.querySelector< HTMLElement >( '.admin-ui-page__header' );
		const target = document.querySelector< HTMLElement >( '.admin-ui-page' );
		if ( ! header || ! target ) {
			return;
		}
		const sync = () => {
			target.style.setProperty(
				'--jetpack-scan-page-header-height',
				`${ Math.ceil( header.getBoundingClientRect().height ) }px`
			);
		};
		sync();
		const observer = new ResizeObserver( sync );
		observer.observe( header );
		window.addEventListener( 'resize', sync );
		return () => {
			observer.disconnect();
			window.removeEventListener( 'resize', sync );
		};
	}, [] );
}

/**
 * Overview screen — tabbed Active threats / Scan history layout matching
 * Calypso's `client/dashboard/sites/scan/`. Tab selection is URL-synced
 * via `?tab=active|history` so deep-links and reloads round-trip.
 *
 * The shell mirrors Newsletter's unified page from #48420 phase 3: a
 * single `Tabs.Root` so the active-tab indicator slides smoothly between
 * tabs, plus a sticky tab row tucked under a sticky page header (height
 * tracked at runtime by `useStickyHeaderHeight`).
 *
 * @return The tabbed overview screen.
 */
const OverviewScreen: FC = () => {
	const [ searchParams, setSearchParams ] = useSearchParams();
	const tabParam = searchParams.get( 'tab' );
	const activeTab: ScanTab = isScanTab( tabParam ) ? tabParam : 'active';

	useStickyHeaderHeight();

	const handleTabChange = useCallback(
		( next: string | null ) => {
			if ( ! isScanTab( next ) ) {
				return;
			}
			setSearchParams(
				prev => {
					const updated = new URLSearchParams( prev );
					if ( next === 'active' ) {
						updated.delete( 'tab' );
					} else {
						updated.set( 'tab', next );
					}
					return updated;
				},
				{ replace: true }
			);
		},
		[ setSearchParams ]
	);

	return (
		<Tabs.Root value={ activeTab } onValueChange={ handleTabChange }>
			<div className="jetpack-scan-page__tabs-row">
				<Tabs.List variant="minimal">
					<Tabs.Tab value="active">{ __( 'Active threats', 'jetpack-scan-page' ) }</Tabs.Tab>
					<Tabs.Tab value="history">{ __( 'History', 'jetpack-scan-page' ) }</Tabs.Tab>
				</Tabs.List>
			</div>
			<Tabs.Panel value="active" focusable={ false }>
				<ActiveThreats />
			</Tabs.Panel>
			<Tabs.Panel value="history" focusable={ false }>
				<ScanHistory />
			</Tabs.Panel>
		</Tabs.Root>
	);
};

export default OverviewScreen;
