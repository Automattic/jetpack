/**
 * External dependencies
 */
import React, { useMemo } from 'react';
import { select as syncSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import analytics from '@automattic/jetpack-analytics';
import restApi from '@automattic/jetpack-api';
import { AdminSectionHero, Container, Col } from '@automattic/jetpack-components';
import useConnection from './use-connection';
import SearchDashboard from './index';
import { STORE_ID } from 'store';

/**
 * Return Search Dashboard if connected, otherwise the connection screen.
 *
 * @returns {React.Component} SearchDashboardWithConnection component.
 */
export default function SearchDashboardWithConnection() {
	const { connectionStatus, renderConnectScreen, renderConnectionFooter } = useConnection();

	const isFullyConnected =
		Object.keys( connectionStatus ).length &&
		connectionStatus.isUserConnected &&
		connectionStatus.isRegistered;

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

	if ( ! isFullyConnected ) {
		return (
			<div className="jp-search-dashboard-connection-screen">
				<AdminSectionHero>
					<Container horizontalSpacing={ 3 } horizontalGap={ 3 }>
						<Col lg={ 12 } md={ 8 } sm={ 4 }>
							{ renderConnectScreen() }
						</Col>
						<Col lg={ 12 } md={ 8 } sm={ 4 }>
							{ renderConnectionFooter() }
						</Col>
					</Container>
				</AdminSectionHero>
			</div>
		);
	}

	return <SearchDashboard />;
}
