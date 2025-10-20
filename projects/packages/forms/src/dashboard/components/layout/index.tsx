/**
 * External dependencies
 */
import jetpackAnalytics from '@automattic/jetpack-analytics';
import { useBreakpointMatch } from '@automattic/jetpack-components';
import {
	TabPanel,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalHeading as Heading,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useCallback, useEffect, useMemo } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
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

const Layout = () => {
	const location = useLocation();
	const navigate = useNavigate();
	const [ isSm ] = useBreakpointMatch( 'sm' );

	const enableIntegrationsTab = useConfigValue( 'isIntegrationsEnabled' );
	const hasFeedback = useConfigValue( 'hasFeedback' );
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

		return hasFeedback ? 'responses' : 'about';
	}, [ location.pathname, tabs, hasFeedback ] );

	const isResponsesTab = getCurrentTab() === 'responses';

	const handleTabSelect = useCallback(
		( tabName: string ) => {
			if ( ! tabName ) {
				tabName = hasFeedback ? 'responses' : 'about';
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
		[ navigate, location.search, isSm, getCurrentTab, hasFeedback ]
	);

	return (
		<div className="jp-forms__layout">
			<div className="jp-forms__layout-header">
				<Heading level={ 1 } size="15px" lineHeight="32px">
					Forms
					{ /** "Forms" is a product name, do not translate. */ }
				</Heading>
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
		</div>
	);
};

export default Layout;
