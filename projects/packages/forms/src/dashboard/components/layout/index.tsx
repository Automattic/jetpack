/**
 * External dependencies
 */
import jetpackAnalytics from '@automattic/jetpack-analytics';
import { useBreakpointMatch } from '@automattic/jetpack-components';
import {
	Button,
	TabPanel,
	Icon,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalHeading as Heading,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useCallback, useEffect, useMemo } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { arrowLeft } from '@wordpress/icons';
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

	const isIntegrationsTab = location.pathname.includes( 'integrations' );

	const tabs = useMemo(
		() => [
			{
				name: 'responses',
				title: __( 'Responses', 'jetpack-forms' ),
				disabled: isIntegrationsTab,
			},
			{
				name: 'about',
				title: _x( 'About', 'About Forms', 'jetpack-forms' ),
				disabled: isIntegrationsTab,
			},
		],
		[ isIntegrationsTab ]
	);

	const getCurrentTab = useCallback( () => {
		const path = location.pathname.split( '/' )[ 1 ];
		const validTabNames = tabs.map( tab => tab.name );

		if ( validTabNames.includes( path ) ) {
			return path;
		}

		return hasFeedback ? 'responses' : 'about';
	}, [ location.pathname, hasFeedback, tabs ] );

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

	const integrationsLabel = __( 'Integrations', 'jetpack-forms' );
	const navigateToIntegrations = useCallback( () => {
		navigate( '/integrations' );
	}, [ navigate ] );
	const navigateBack = useCallback( () => navigate( -1 ), [ navigate ] );
	const navigateBackLabel = __( 'Back', 'jetpack-forms' );
	const navigateBackIcon = <Icon icon={ arrowLeft } />;

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
						{ enableIntegrationsTab && (
							<Button
								icon={ isIntegrationsTab ? navigateBackIcon : undefined }
								__next40pxDefaultSize
								className="jp-forms__export-button--large-greenXX"
								variant="secondary"
								onClick={ isIntegrationsTab ? navigateBack : navigateToIntegrations }
							>
								{ isIntegrationsTab ? navigateBackLabel : integrationsLabel }
							</Button>
						) }
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
