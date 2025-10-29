/**
 * External dependencies
 */
import jetpackAnalytics from '@automattic/jetpack-analytics';
import { useBreakpointMatch, JetpackLogo } from '@automattic/jetpack-components';
import { NavigableRegion, Page } from '@wordpress/admin-ui';
import { TabPanel } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useCallback, useEffect, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Outlet, useLocation, useNavigate } from 'react-router';
/**
 * Internal dependencies
 */
import useConfigValue from '../../../hooks/use-config-value';
import EmptySpamButton from '../../components/empty-spam-button';
import EmptyTrashButton from '../../components/empty-trash-button';
import ExportResponsesButton from '../../inbox/export-responses';
import { store as dashboardStore } from '../../store';
import ActionsDropdownMenu from '../actions-dropdown-menu';
import CreateFormButton from '../create-form-button';

import './style.scss';
// eslint-disable-next-line import/no-unresolved -- aliased to the package's built asset in webpack config.
import '@wordpress/admin-ui/build-style/style.css';
const Layout = () => {
	const location = useLocation();
	const navigate = useNavigate();
	const [ isSm ] = useBreakpointMatch( 'sm' );

	const enableIntegrationsTab = useConfigValue( 'isIntegrationsEnabled' );
	const isLoadingConfig = enableIntegrationsTab === undefined;

	const { currentStatus } = useSelect(
		select => ( {
			currentStatus: select( dashboardStore ).getCurrentStatus(),
		} ),
		[]
	);

	const isResponsesTrashView = currentStatus.includes( 'trash' );
	const isResponsesSpamView = currentStatus.includes( 'spam' );

	useEffect( () => {
		jetpackAnalytics.tracks.recordEvent( 'jetpack_forms_dashboard_page_view', {
			viewport: isSm ? 'mobile' : 'desktop',
		} );
	}, [ isSm ] );

	const tabs = useMemo(
		() => [
			{
				name: 'responses',
				title: __( 'Responses', 'jetpack-forms' ),
			},
			...( enableIntegrationsTab
				? [ { name: 'integrations', title: __( 'Integrations', 'jetpack-forms' ) } ]
				: [] ),
		],
		[ enableIntegrationsTab ]
	);

	const getCurrentTab = useCallback( () => {
		const path = location.pathname.split( '/' )[ 1 ];
		const validTabNames = tabs.map( tab => tab.name );

		if ( validTabNames.includes( path ) ) {
			return path;
		}

		return 'responses';
	}, [ location.pathname, tabs ] );

	const isResponsesTab = getCurrentTab() === 'responses';

	const handleTabSelect = useCallback(
		( tabName: string ) => {
			if ( ! tabName ) {
				tabName = 'responses';
			}

			const currentTab = getCurrentTab();

			if ( currentTab !== tabName ) {
				jetpackAnalytics.tracks.recordEvent( 'jetpack_forms_dashboard_tab_change', {
					tab: tabName,
					viewport: isSm ? 'mobile' : 'desktop',
					previous_tab: currentTab,
				} );
			}

			navigate( {
				pathname: `/${ tabName }`,
				search: tabName === 'responses' ? location.search : '',
			} );
		},
		[ navigate, location.search, isSm, getCurrentTab ]
	);

	const headerActions = isSm ? (
		<>
			{ isResponsesTab && isResponsesTrashView && <EmptyTrashButton /> }
			{ isResponsesTab && isResponsesSpamView && <EmptySpamButton /> }
			<ActionsDropdownMenu exportData={ { show: isResponsesTab } } />
		</>
	) : (
		<div className="jp-forms__layout-header-actions">
			{ isResponsesTab && <ExportResponsesButton /> }
			{ isResponsesTab && isResponsesTrashView && <EmptyTrashButton /> }
			{ isResponsesTab && isResponsesSpamView && <EmptySpamButton /> }
			{ ! isResponsesTrashView && ! isResponsesSpamView && (
				<CreateFormButton label={ __( 'Create form', 'jetpack-forms' ) } />
			) }
		</div>
	);

	return (
		<Page
			className="jp-forms__layout"
			title={
				<div className="jp-forms__layout-header-title">
					<JetpackLogo showText={ false } width={ 24 } /> Forms
				</div>
			}
			actions={ headerActions }
		>
			<NavigableRegion
				className="admin-ui-page__content"
				ariaLabel={ __( 'Forms dashboard content', 'jetpack-forms' ) }
			>
				{ ! isLoadingConfig && (
					<TabPanel
						className="jp-forms__dashboard-tabs"
						tabs={ tabs }
						initialTabName={ getCurrentTab() }
						onSelect={ handleTabSelect }
						key={ getCurrentTab() }
					>
						{ () => <Outlet /> }
					</TabPanel>
				) }
			</NavigableRegion>
		</Page>
	);
};

export default Layout;
