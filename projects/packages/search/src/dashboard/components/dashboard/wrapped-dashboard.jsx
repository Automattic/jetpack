/**
 * External dependencies
 */
import React from 'react';
import { __ } from '@wordpress/i18n';

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

	const renderFooter = () => {
		return (
			<div className="jp-search-connection-screen__footer">
				<p>
					{ __(
						'Special introductory pricing, all renewals are at full price. 14 day money back guarantee.',
						'jetpack-search-pkg'
					) }
				</p>
				<p>
					{ __(
						'*Pricing will automatically adjust based on the number of records in your search index. ',
						'jetpack-search-pkg'
					) }
					<a href="https://jetpack.com/support/search/product-pricing/">Learn more</a>
				</p>
			</div>
		);
	};

	if ( ! isFullyConnected ) {
		return (
			<AdminSectionHero>
				<Container horizontalSpacing={ 3 } horizontalGap={ 3 }>
					<Col lg={ 12 } md={ 8 } sm={ 4 }>
						{ renderConnectScreen() }
					</Col>
					<Col lg={ 12 } md={ 8 } sm={ 4 }>
						{ renderFooter() }
					</Col>
				</Container>
			</AdminSectionHero>
		);
	}

	return <SearchDashboard />;
}
