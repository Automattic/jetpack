import AdminPage from '@automattic/jetpack-components/admin-page';
import { useCallback, useEffect, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useNavigate, useSearch } from '@wordpress/route';
import { Tabs } from '@wordpress/ui';
import Overview from './components/overview';
import PageBreadcrumbs, { hasJetpackCrumb } from './components/page-breadcrumbs';
import SettingsTab from './components/settings-tab';
import { recordPageView } from './data/page-views';
import useProtectSettings from './data/use-protect-settings';
import sections from './sections';
import { CLOSED_INSPECTOR } from './sections/inspector-params';
import { REPORT_PARAM, parseThreatIds } from './sections/scan/group-threats';
import HeaderScanButton from './sections/scan/header-scan-button';
import ScanStartNotice from './sections/scan/scan-start-notice';
import { useScanPolling } from './sections/scan/store';
import ThreatReport from './sections/scan/threat-report';
import './route.scss';

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
	const requestedTab = typeof search.tab === 'string' ? search.tab : '';
	const requestedSection = typeof search.section === 'string' ? search.section : undefined;
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
	const activeTab = tabValues.includes( requestedTab ) ? requestedTab : 'overview';
	const { load } = settings;
	const reportIds = parseThreatIds( search[ REPORT_PARAM ] );
	const showReport = reportIds.length > 0 && Boolean( state.scan );

	useEffect( () => {
		if ( activeTab === 'settings' && ! showReport ) {
			load();
		}
	}, [ activeTab, load, showReport ] );

	// Only a real Settings card goes to Tracks; `?section=` is free text from the URL.
	const pageViewSection =
		activeTab === 'settings' && sections.some( section => section.key === requestedSection )
			? requestedSection
			: undefined;
	useEffect( () => {
		if ( ! showReport ) {
			recordPageView( activeTab, pageViewSection );
		}
	}, [ activeTab, pageViewSection, showReport ] );

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
			</AdminPage>
		);
	}

	const showTrail = hasJetpackCrumb();
	return (
		<AdminPage
			className="jp-protect-dashboard"
			breadcrumbs={ showTrail ? <PageBreadcrumbs /> : undefined }
			// "Protect" is a product name and is not translated.
			title={ showTrail ? undefined : 'Protect' }
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
		</AdminPage>
	);
};

export { Stage as stage };
