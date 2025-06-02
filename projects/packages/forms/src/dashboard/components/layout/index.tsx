/**
 * External dependencies
 */
import jetpackAnalytics from '@automattic/jetpack-analytics';
import { JetpackFooter, useBreakpointMatch } from '@automattic/jetpack-components';
import { shouldUseInternalLinks } from '@automattic/jetpack-shared-extension-utils';
import { TabPanel } from '@wordpress/components';
import { useCallback, useEffect, useMemo } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import clsx from 'clsx';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
/**
 * Internal dependencies
 */
import ExportResponsesButton from '../../inbox/export-responses';
import { config } from '../../index';
import ActionsDropdownMenu from '../actions-dropdown-menu';
import CreateFormButton from '../create-form-button';
import JetpackFormsLogo from '../logo';

import './style.scss';

const Layout = ( {
	className = '',
	showFooter = false,
}: {
	className?: string;
	showFooter?: boolean;
} ) => {
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
		<div className={ clsx( 'jp-forms__layout', className ) }>
			<div className="jp-forms__layout-header">
				<div className="jp-forms__logo-wrapper">
					<JetpackFormsLogo />
				</div>
				{ isSm ? (
					<ActionsDropdownMenu exportData={ { show: isResponsesTab } } />
				) : (
					<div className="jp-forms__layout-header-actions">
						{ isResponsesTab && <ExportResponsesButton /> }
						<CreateFormButton label={ __( 'Create form', 'jetpack-forms' ) } />
					</div>
				) }
			</div>
			<TabPanel
				className="jp-forms__dashboard-tabs"
				tabs={ tabs }
				initialTabName={ getCurrentTab() }
				onSelect={ handleTabSelect }
			>
				{ () => <Outlet /> }
			</TabPanel>
			{ showFooter && (
				<JetpackFooter
					className="jp-forms__layout-footer"
					moduleName={ __( 'Jetpack Forms', 'jetpack-forms' ) }
					useInternalLinks={ shouldUseInternalLinks() }
				/>
			) }
		</div>
	);
};

export default Layout;
