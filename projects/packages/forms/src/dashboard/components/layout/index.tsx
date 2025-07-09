/**
 * External dependencies
 */
import jetpackAnalytics from '@automattic/jetpack-analytics';
import { useBreakpointMatch } from '@automattic/jetpack-components';
import {
	__experimentalHeading as Heading, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalHStack as HStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalVStack as VStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	FlexItem,
	TabPanel,
} from '@wordpress/components';
import { useCallback, useEffect, useMemo } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { Outlet, useLocation, useNavigate } from 'react-router';
/**
 * Internal dependencies
 */
import ExportResponsesButton from '../../inbox/export-responses';
import { config } from '../../index';
import ActionsDropdownMenu from '../actions-dropdown-menu';
import CreateFormButton from '../create-form-button';

import './style.scss';

const Layout = () => {
	const location = useLocation();
	const navigate = useNavigate();
	const [ isSm ] = useBreakpointMatch( 'sm' );

	const enableIntegrationsTab = config( 'enableIntegrationsTab' );

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
			<VStack className="jp-forms__layout-header" as="header" spacing={ 0 }>
				<HStack className="jp-forms__layout-header__page-title">
					<Heading as="h2" level={ 3 } weight={ 500 }>
						Forms
					</Heading>
					<FlexItem>
						{ isSm ? (
							<ActionsDropdownMenu exportData={ { show: isResponsesTab } } />
						) : (
							<HStack>
								{ isResponsesTab && <ExportResponsesButton /> }
								<CreateFormButton label={ __( 'Create form', 'jetpack-forms' ) } />
							</HStack>
						) }
					</FlexItem>
				</HStack>
			</VStack>
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
