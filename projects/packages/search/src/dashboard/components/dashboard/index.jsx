/**
 * External dependencies
 */
import React, { Fragment, useMemo } from 'react';
import { __ } from '@wordpress/i18n';

/**
 * WordPress dependencies
 */
import { useSelect, useDispatch, select as syncSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { JetpackFooter, JetpackLogo } from '@automattic/jetpack-components';
import analytics from '@automattic/jetpack-analytics';
import restApi from '@automattic/jetpack-api';
import ModuleControl from 'components/module-control';
import MockedSearch from 'components/mocked-search';
import { STORE_ID } from '../../store';
import 'scss/rna-styles.scss';
import './style.scss';
import NoticesList from '../global-notices';

/**
 * SearchDashboard component definition.
 *
 * @returns {React.Component} Search dashboard component.
 */
export default function SearchDashboard() {
	const siteAdminUrl = syncSelect( STORE_ID ).getSiteAdminUrl();
	const aboutPageUrl = siteAdminUrl + 'admin.php?page=jetpack_about';

	useSelect( select => select( STORE_ID ).getSearchPlanInfo(), [] );
	useSelect( select => select( STORE_ID ).getSearchModuleStatus(), [] );

	const isLoading = useSelect(
		select =>
			select( STORE_ID ).isResolving( 'getSearchPlanInfo' ) ||
			! select( STORE_ID ).hasStartedResolution( 'getSearchPlanInfo' ) ||
			select( STORE_ID ).isResolving( 'getSearchModuleStatus' ) ||
			! select( STORE_ID ).hasStartedResolution( 'getSearchModuleStatus' )
	);

	const handleLocalNoticeDismissClick = useDispatch( STORE_ID ).removeNotice;
	const notices = useSelect( select => select( STORE_ID ).getNotices(), [] );

	const initializeAnalytics = () => {
		const tracksUser = syncSelect( STORE_ID ).getWpcomUser();
		const blogId = syncSelect( STORE_ID ).getBlogId();

		if ( tracksUser ) {
			analytics.initialize( tracksUser.ID, tracksUser.login, {
				blog_id: blogId,
			} );
		}
	};

	useMemo( () => {
		const apiRootUrl = syncSelect( STORE_ID ).getAPIRootUrl();
		const apiNonce = syncSelect( STORE_ID ).getAPINonce();
		apiRootUrl && restApi.setApiRoot( apiRootUrl );
		apiNonce && restApi.setApiNonce( apiNonce );
		initializeAnalytics();
		analytics.tracks.recordEvent( 'jetpack_search_admin_page_view', {
			current_version: syncSelect( STORE_ID ).getVersion(),
		} );
	}, [] );

	const renderHeader = () => {
		return (
			<div className="jp-search-dashboard-header jp-search-dashboard-wrap">
				<div className="jp-search-dashboard-row">
					<div className="lg-col-span-12 md-col-span-8 sm-col-span-4">
						<div className="jp-search-dashboard-header__logo-container">
							<JetpackLogo className="jp-search-dashboard-header__masthead" />
						</div>
					</div>
				</div>
			</div>
		);
	};

	const renderMockedSearchInterface = () => {
		return (
			<div className="jp-search-dashboard-top jp-search-dashboard-wrap">
				<div className="jp-search-dashboard-row">
					<div className="jp-search-dashboard-top__title lg-col-span-6 md-col-span-7 sm-col-span-4">
						<h1>
							{ __( "Help your visitors find exactly what they're looking for, fast", 'jetpack' ) }
						</h1>
					</div>
					<div className=" lg-col-span-6 md-col-span-1 sm-col-span-0"></div>
				</div>
				<div className="jp-search-dashboard-row" aria-hidden="true">
					<div className="lg-col-span-1 md-col-span-1 sm-col-span-0"></div>
					<div className="jp-search-dashboard-top__mocked-search-interface lg-col-span-10 md-col-span-6 sm-col-span-4">
						<MockedSearch />
					</div>
					<div className="lg-col-span-1 md-col-span-1 sm-col-span-0"></div>
				</div>
			</div>
		);
	};

	const renderModuleControl = () => {
		return (
			<div className="jp-search-dashboard-bottom">
				<ModuleControl />
			</div>
		);
	};

	const renderFooter = () => {
		return (
			<div className="jp-search-dashboard-footer jp-search-dashboard-wrap">
				<div className="jp-search-dashboard-row">
					<JetpackFooter
						a8cLogoHref={ aboutPageUrl }
						moduleName={ __( 'Jetpack Search', 'jetpack' ) }
						className="lg-col-span-12 md-col-span-8 sm-col-span-4"
					/>
				</div>
			</div>
		);
	};

	return (
		<div className="jp-search-dashboard-page">
			{ isLoading && (
				<img
					className="jp-search-dashboard-page-loading-spinner"
					width="32"
					height="32"
					alt={ __( 'Loading', 'jetpack' ) }
					src="//en.wordpress.com/i/loading/loading-64.gif"
				/>
			) }
			{ ! isLoading && (
				<Fragment>
					{ renderHeader() }
					{ renderMockedSearchInterface() }
					{ renderModuleControl() }
					{ renderFooter() }
				</Fragment>
			) }
			<NoticesList
				notices={ notices }
				handleLocalNoticeDismissClick={ handleLocalNoticeDismissClick }
			/>
		</div>
	);
}
