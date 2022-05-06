/**
 * External dependencies
 */
import React from 'react';
import { useSelect } from '@wordpress/data';
import { Container, Col, AdminSectionHero } from '@automattic/jetpack-components';

/**
 * Internal dependencies
 */
import Loading from './loading';
import useConnection from '../use-connection';
import './connection-page.scss';
import { STORE_ID } from 'store';

/**
 * defines ConnectionScreen.
 *
 * @param {object} props - Component properties.
 * @param {string} props.isLoading - should page show Loading spinner.
 * @returns {React.Component} ConnectionScreen component.
 */
export default function ConnectionScreen( { isLoading = false } ) {
	useSelect( select => select( STORE_ID ).getSearchPricing(), [] );

	const { renderConnectScreen, renderConnectionFooter } = useConnection();

	const isPageLoading = useSelect(
		select =>
			select( STORE_ID ).isResolving( 'getSearchPricing' ) ||
			! select( STORE_ID ).hasStartedResolution( 'getSearchPricing' ) ||
			isLoading,
		[ isLoading ]
	);

	return (
		<>
			{ isPageLoading && <Loading /> }
			{ ! isPageLoading && (
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
			) }
		</>
	);
}
