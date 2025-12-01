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
import Integrations from '../../integrations/index.tsx';

import './style.scss';
import '@wordpress/admin-ui/build-style/style.css';
const Layout = () => {
	const location = useLocation();
	const [ isSm ] = useBreakpointMatch( 'sm' );

	const enableIntegrationsTab = useConfigValue( 'isIntegrationsEnabled' );
	const isLoadingConfig = enableIntegrationsTab === undefined;

	const isIntegrationsOpen = location.pathname === '/integrations';

	useEffect( () => {
		jetpackAnalytics.tracks.recordEvent( 'jetpack_forms_dashboard_page_view', {
			viewport: isSm ? 'mobile' : 'desktop',
		} );
	}, [ isSm ] );

	return (
		<div className="jp-forms-layout">
			<div className="jp-forms-layout__content">
				{ ! isLoadingConfig && <Outlet /> }
				{ isIntegrationsOpen && <Integrations /> }
			</div>
		</div>
	);
};

export default Layout;
