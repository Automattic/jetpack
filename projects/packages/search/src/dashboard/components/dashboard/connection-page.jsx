/**
 * External dependencies
 */
import React from 'react';
import { Container, Col, AdminSectionHero } from '@automattic/jetpack-components';

/**
 * Internal dependencies
 */
import useConnection from './use-connection';
import './connection-page.scss';

/**
 * defines ConnectionScreen.
 *
 * @returns {React.Component} ConnectionScreen component.
 */
export default function ConnectionScreen() {
	const { renderConnectScreen, renderConnectionFooter } = useConnection();

	return (
		<div className="jp-search-dashboard-connection-screen">
			{ /* WARNING: Update styles if AdminSectionHero is no longer targeted via > selector. */ }
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
