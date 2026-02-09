/**
 * External dependencies
 */
import jetpackAnalytics from '@automattic/jetpack-analytics';
import { useBreakpointMatch } from '@automattic/jetpack-components';
import { useEffect } from '@wordpress/element';
import { Outlet, useLocation } from 'react-router';
/**
 * Internal dependencies
 */
import useConfigValue from '../../../hooks/use-config-value.ts';
import { adjustDashboardHeight } from '../../../util/adjust-dashboard-height.ts';
import Integrations from '../../integrations/index.tsx';
import './style.scss';
import '@wordpress/admin-ui/build-style/style.css';

const Layout = () => {
	const location = useLocation();
	const [ isSm ] = useBreakpointMatch( 'sm' );

	const enableIntegrationsTab = useConfigValue( 'isIntegrationsEnabled' );
	const showDashboardIntegrations = useConfigValue( 'showDashboardIntegrations' );
	const isLoadingConfig = enableIntegrationsTab === undefined;

	const isIntegrationsOpen = location.pathname === '/integrations';

	useEffect( () => {
		jetpackAnalytics.tracks.recordEvent( 'jetpack_forms_dashboard_page_view', {
			viewport: isSm ? 'mobile' : 'desktop',
		} );
	}, [ isSm ] );

	useEffect( () => {
		const container = document.getElementById( 'jp-forms-dashboard' );

		if ( ! container ) {
			return () => {};
		}

		const cleanup = adjustDashboardHeight( container );

		return () => {
			cleanup();
		};
	}, [] );

	return (
		<div className="jp-forms-layout">
			<div className="jp-forms-layout__content">
				{ ! isLoadingConfig && <Outlet /> }
				{ isIntegrationsOpen && showDashboardIntegrations && <Integrations /> }
			</div>
		</div>
	);
};

export default Layout;
