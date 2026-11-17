import AdminPage from '@automattic/jetpack-components/admin-page';
import { useCallback, useEffect, useMemo, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useNavigate, useSearch } from '@wordpress/route';
import { Tabs } from '@wordpress/ui';
import Overview from './components/overview';
import PageBreadcrumbs from './components/page-breadcrumbs';
import SettingsTab from './components/settings-tab';
import { recordPageView } from './data/page-views';
import useProtectSettings from './data/use-protect-settings';
import sections from './sections';
import { CLOSED_INSPECTOR } from './sections/inspector-params';
import { REPORT_PARAM, parseThreatIds } from './sections/scan/group-threats';
import HeaderScanButton from './sections/scan/header-scan-button';
import ScanStartNotice from './sections/scan/scan-start-notice';
import { useScanPolling } from './sections/scan/store';
import { ThreatFileViewer } from './sections/scan/threat-file';
import ThreatReport from './sections/scan/threat-report';
import './route.scss';

/**
 * Resolve the router search to the view it shows, which is also the view a page view records.
 *
 * @param search    - The router search.
 * @param tabValues - The tabs on offer.
 * @param hasScan   - Whether the page has Scan state, without which there is no threat report.
 * @return The view.
 */
function resolveView( search: Record< string, unknown >, tabValues: string[], hasScan: boolean ) {
	const requestedTab = typeof search.tab === 'string' ? search.tab : '';
	const requestedSection = typeof search.section === 'string' ? search.section : undefined;
	const activeTab = tabValues.includes( requestedTab ) ? requestedTab : 'overview';
	const reportIds = parseThreatIds( search[ REPORT_PARAM ] );
	// Only a real Settings card goes to Tracks; `?section=` is free text from the URL.
	const pageViewSection =
		activeTab === 'settings' && sections.some( section => section.key === requestedSection )
			? requestedSection
			: undefined;
	return {
		activeTab,
		requestedSection,
		reportIds,
		showReport: reportIds.length > 0 && hasScan,
		pageViewSection,
	};
}

/**
 * Name the view a page view records, to tell two views apart.
 *
 * @param view                 - The view.
 * @param view.activeTab       - The tab.
 * @param view.pageViewSection - The Settings card, if any.
 * @param view.showReport      - Whether the threat report replaces the tabs.
 * @return The name.
 */
const keyOf = ( {
	activeTab,
	pageViewSection,
	showReport,
}: Pick< ReturnType< typeof resolveView >, 'activeTab' | 'pageViewSection' | 'showReport' > ) =>
	showReport ? 'report' : `${ activeTab }/${ pageViewSection ?? '' }`;

/**
 * The router search in a page URL; the router keeps its route in the `p` query arg.
 *
 * @param url - The page URL.
 * @return The search params.
 */
function searchOf( url: string ): Record< string, string > {
	const route = new URL( url ).searchParams.get( 'p' ) ?? '/';
	return Object.fromEntries( new URL( route, 'https://route.invalid' ).searchParams );
}

/**
 * Boot stage for the Protect dashboard: Overview, any section tabs, then Settings; the active one in `?tab=`.
 * With `?threats=` it shows just those threats instead, such as the ones in a threat email.
 *
 * `?section=` names the card the Settings tab scrolls to, which links from other screens use.
 *
 * @return The Protect page.
 */
const Stage = () => {
	// `@wordpress/route` types no route tree, so `from` and the navigate argument below need a cast.
	const search: Record< string, unknown > = useSearch( { from: '/' as never, strict: false } );
	const navigate = useNavigate();
	const openTab = useCallback(
		( next: string, params?: Record< string, string > ) => {
			navigate( {
				search: ( prev: Record< string, unknown > ) => ( {
					...prev,
					// Leaving a tab closes the inspector, whose threat belongs to the list on that tab.
					...CLOSED_INSPECTOR,
					section: undefined,
					[ REPORT_PARAM ]: undefined,
					...params,
					tab: next === 'overview' ? undefined : next,
				} ),
			} as Parameters< typeof navigate >[ 0 ] );
		},
		[ navigate ]
	);
	const goTo = useCallback( ( next: string ) => openTab( next ), [ openTab ] );
	const settings = useProtectSettings();
	// Above the report's early return, so every view follows a running scan.
	useScanPolling();
	const context = useMemo( () => ( { settings, openTab } ), [ settings, openTab ] );

	const state = window.jetpackProtectDashboard ?? {};
	const sectionTabs = sections.flatMap( section =>
		section.tab && section.tab.isAvailable( { ...context, state: state[ section.key ] } )
			? [ { key: section.key, ...section.tab } ]
			: []
	);
	const tabValues = [ 'overview', ...sectionTabs.map( tab => tab.value ), 'settings' ];
	const hasScan = Boolean( state.scan );
	const { activeTab, requestedSection, reportIds, showReport, pageViewSection } = resolveView(
		search,
		tabValues,
		hasScan
	);
	const { load } = settings;

	useEffect( () => {
		if ( activeTab === 'settings' && ! showReport ) {
			load();
		}
	}, [ activeTab, load, showReport ] );

	useEffect( () => {
		if ( ! showReport ) {
			recordPageView( activeTab, pageViewSection );
		}
	}, [ activeTab, pageViewSection, showReport ] );

	// The admin shell keeps this page mounted, so a return to it is a new visit: see the admin-ui README.
	const view = keyOf( { activeTab, pageViewSection, showReport } );
	const hiddenView = useRef( view );
	const tabList = tabValues.join();
	useEffect( () => {
		const onHidden = ( event: Event ) => {
			if ( ( event as CustomEvent ).detail?.page === 'jetpack-protect' ) {
				hiddenView.current = view;
			}
		};
		const onShown = ( event: Event ) => {
			const { page, firstShow, routeChanged, url } = ( event as CustomEvent ).detail ?? {};
			if ( page !== 'jetpack-protect' || firstShow || showReport ) {
				return;
			}
			// The effect above records a return to another view, but not to another URL of the same one.
			if (
				! routeChanged ||
				keyOf( resolveView( searchOf( url ), tabList.split( ',' ), hasScan ) ) ===
					hiddenView.current
			) {
				recordPageView( activeTab, pageViewSection );
			}
		};
		window.addEventListener( 'jetpack-admin-shell:page-hidden', onHidden );
		window.addEventListener( 'jetpack-admin-shell:page-shown', onShown );
		return () => {
			window.removeEventListener( 'jetpack-admin-shell:page-hidden', onHidden );
			window.removeEventListener( 'jetpack-admin-shell:page-shown', onShown );
		};
	}, [ view, activeTab, pageViewSection, showReport, tabList, hasScan ] );

	if ( showReport ) {
		const reportTitle = __( 'Threats from your alert', 'jetpack-protect-pkg' );
		return (
			<AdminPage
				className="jp-protect-dashboard"
				breadcrumbs={ <PageBreadcrumbs current={ reportTitle } /> }
				ariaLabel={ reportTitle }
			>
				<div className="jp-protect-dashboard__body">
					<ThreatReport
						ids={ reportIds }
						hasHistory={ sectionTabs.some( tab => tab.key === 'history' ) }
						openTab={ openTab }
					/>
				</div>
				<ThreatFileViewer />
			</AdminPage>
		);
	}

	return (
		<AdminPage
			className="jp-protect-dashboard"
			// "Protect" is a product name and is not translated.
			title="Protect"
			ariaLabel="Protect"
			actions={ state.scan ? <HeaderScanButton /> : undefined }
		>
			<Tabs.Root value={ activeTab } onValueChange={ goTo }>
				<div className="jp-admin-page-tabs jp-admin-page-tabs--minimal">
					<Tabs.List variant="minimal">
						<Tabs.Tab value="overview">{ __( 'Overview', 'jetpack-protect-pkg' ) }</Tabs.Tab>
						{ sectionTabs.map( tab => (
							<Tabs.Tab key={ tab.value } value={ tab.value }>
								{ tab.label() }
							</Tabs.Tab>
						) ) }
						<Tabs.Tab value="settings">{ __( 'Settings', 'jetpack-protect-pkg' ) }</Tabs.Tab>
					</Tabs.List>
				</div>
				<div className="jp-protect-dashboard__body">
					<ScanStartNotice />
					<Tabs.Panel value="overview">
						{ activeTab === 'overview' && <Overview { ...context } /> }
					</Tabs.Panel>
					{ sectionTabs.map( ( { key, value, Panel } ) => (
						<Tabs.Panel key={ value } value={ value }>
							{ activeTab === value && <Panel { ...context } state={ state[ key ] } /> }
						</Tabs.Panel>
					) ) }
					<Tabs.Panel value="settings">
						{ activeTab === 'settings' && (
							<SettingsTab { ...context } section={ requestedSection } />
						) }
					</Tabs.Panel>
				</div>
			</Tabs.Root>
			<ThreatFileViewer />
		</AdminPage>
	);
};

export { Stage as stage };
