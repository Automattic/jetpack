/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import { AdminSectionHero, Container, Col } from '@automattic/jetpack-components';
import useConnection from './use-connection';
import SearchDashboard from './index';

/**
 * Return Search Dashboard if connected, otherwise the connection screen.
 *
 * @returns {React.Component} SearchDashboardWithConnection component.
 */
export default function SearchDashboardWithConnection() {
	const [ connectionStatus, renderConnectScreen ] = useConnection();

	const isFullyConnected =
		Object.keys( connectionStatus ).length &&
		connectionStatus.isUserConnected &&
		connectionStatus.isRegistered;

	if ( ! isFullyConnected ) {
		return (
			<div className="content">
				<AdminSectionHero>
					<Container horizontalSpacing={ 3 } horizontalGap={ 3 }>
						<Col lg={ 12 } md={ 8 } sm={ 4 }>
							{ renderConnectScreen() }
						</Col>
					</Container>
				</AdminSectionHero>
			</div>
		);
	}

	return <SearchDashboard />;
}
