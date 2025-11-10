/**
 * External dependencies
 */
import jetpackAnalytics from '@automattic/jetpack-analytics';
import { useBreakpointMatch, JetpackLogo } from '@automattic/jetpack-components';
import { NavigableRegion, Page } from '@wordpress/admin-ui';
import { useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Outlet, useLocation } from 'react-router';
/**
 * Internal dependencies
 */
import useConfigValue from '../../../hooks/use-config-value';
import EmptySpamButton from '../../components/empty-spam-button';
import EmptyTrashButton from '../../components/empty-trash-button';
import ExportResponsesButton from '../../inbox/export-responses';
import Integrations from '../../integrations';
import { store as dashboardStore } from '../../store';
import ActionsDropdownMenu from '../actions-dropdown-menu';
import CreateFormButton from '../create-form-button';
import IntegrationsButton from '../integrations-button';
import Header from './header';

import './style.scss';
// eslint-disable-next-line import/no-unresolved -- aliased to the package's built asset in webpack config.
import '@wordpress/admin-ui/build-style/style.css';
const Layout = () => {
	const location = useLocation();
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
	const isIntegrationsOpen = location.pathname === '/integrations';

	useEffect( () => {
		jetpackAnalytics.tracks.recordEvent( 'jetpack_forms_dashboard_page_view', {
			viewport: isSm ? 'mobile' : 'desktop',
		} );
	}, [ isSm ] );

	const headerActions = isSm ? (
		<>
			{ isResponsesTrashView && <EmptyTrashButton /> }
			{ isResponsesSpamView && <EmptySpamButton /> }
			<ActionsDropdownMenu exportData={ { show: true } } />
		</>
	) : (
		<>
			{ ! isResponsesTrashView && ! isResponsesSpamView && (
				<>
					{ enableIntegrationsTab && <IntegrationsButton /> }
					<CreateFormButton label={ __( 'Create form', 'jetpack-forms' ) } />
				</>
			) }
			<ExportResponsesButton isPrimary={ ! isResponsesTrashView && ! isResponsesSpamView } />
			{ isResponsesTrashView && <EmptyTrashButton /> }
			{ isResponsesSpamView && <EmptySpamButton /> }
		</>
	);

	return (
		<Page className="jp-forms__layout">
			<Header
				title={
					<div className="jp-forms__layout-header-title">
						<JetpackLogo showText={ false } width={ 20 } /> Forms
					</div>
				}
				subTitle={ __(
					'View and manage all your form submissions in one place.',
					'jetpack-forms'
				) }
				actions={ headerActions }
			/>
			<NavigableRegion
				className="admin-ui-page__content"
				ariaLabel={ __( 'Forms dashboard content', 'jetpack-forms' ) }
			>
				{ ! isLoadingConfig && <Outlet /> }
			</NavigableRegion>
			{ isIntegrationsOpen && <Integrations /> }
		</Page>
	);
};

export default Layout;
