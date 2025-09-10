/**
 * External dependencies
 */
import jetpackAnalytics from '@automattic/jetpack-analytics';
import { useBreakpointMatch } from '@automattic/jetpack-components';
import { TabPanel } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useCallback, useEffect, useMemo } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { Outlet, useLocation, useNavigate } from 'react-router';
/**
 * Internal dependencies
 */
import useFormsConfig from '../../../hooks/use-forms-config';
import EmptySpamButton from '../../components/empty-spam-button';
import EmptyTrashButton from '../../components/empty-trash-button';
import ExportResponsesButton from '../../inbox/export-responses';
import { config } from '../../index';
import { store as dashboardStore } from '../../store';
import ActionsDropdownMenu from '../actions-dropdown-menu';
import CreateFormButton from '../create-form-button';
import JetpackFormsLogo from '../logo';

import './style.scss';

const Layout = () => {
	const location = useLocation();
	const navigate = useNavigate();
	const [ isSm ] = useBreakpointMatch( 'sm' );
	const formsConfig = useFormsConfig();

	const enableIntegrationsTab = Boolean( formsConfig?.isIntegrationsEnabled );

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
			{
				name: 'about',
				title: _x( 'About', 'About Forms', 'jetpack-forms' ),
			},
		],
		[ enableIntegrationsTab ]
	);

	const getCurrentTab = useCallback( () => {
		const path = location.pathname.split( '/' )[ 1 ];
		const validTabNames = tabs.map( tab => tab.name );

		if ( validTabNames.includes( path ) ) {
			return path;
		}

		return config( 'hasFeedback' ) ? 'responses' : 'about';
	}, [ location.pathname, tabs ] );

	const isResponsesTab = getCurrentTab() === 'responses';

	const handleTabSelect = useCallback(
		( tabName: string ) => {
			if ( ! tabName ) {
				tabName = config( 'hasFeedback' ) ? 'responses' : 'about';
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

	return (
		<div className="jp-forms__layout">
			<div className="jp-forms__layout-header">
				<div className="jp-forms__logo-wrapper">
					<JetpackFormsLogo />
				</div>
				{ isSm ? (
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
				) }
			</div>
			<TabPanel
				className="jp-forms__dashboard-tabs"
				tabs={ tabs }
				initialTabName={ getCurrentTab() }
				onSelect={ handleTabSelect }
				key={ getCurrentTab() }
			>
				{ () => <Outlet /> }
			</TabPanel>
		</div>
	);
};

export default Layout;
