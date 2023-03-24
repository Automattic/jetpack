import restApi from '@automattic/jetpack-api';
import { AdminPage, Container, Col } from '@automattic/jetpack-components';
import { useConnection } from '@automattic/jetpack-connection';
import React, { useCallback, useEffect } from 'react';
import useAnalytics from '../../hooks/use-analytics';
import usePurchases from '../../hooks/use-purchases';
import GoBackLink from '../go-back-link';
import GoldenToken from '../golden-token';

/**
 * The RedeemToken component of the My Jetpack app.
 *
 * @returns {object} The RedeemTokenScreen component.
 */
export default function RedeemTokenScreen() {
	useEffect( () => {
		const { apiRoot, apiNonce } = window?.myJetpackRest || {};
		restApi.setApiRoot( apiRoot );
		restApi.setApiNonce( apiNonce );
	}, [] );

	const { recordEvent } = useAnalytics();

	const onClickGoBack = useCallback(
		event => {
			recordEvent( 'jetpack_myjetpack_redeem_token_back_link_click' );

			if ( document.referrer.includes( window.location.host ) ) {
				// Prevent default here to minimize page change within the My Jetpack app.
				event.preventDefault();
				history.back();
			}
		},
		[ recordEvent ]
	);

	const purchases = usePurchases();
	// Any purchase with the partner_slug of 'goldenticket' is considered a golden token.
	const goldenToken = purchases.filter( golden => golden.partner_slug === 'goldenticket' );
	const hasGoldenToken = goldenToken.length > 0;
	const { userConnectionData } = useConnection();

	return (
		<AdminPage showHeader={ false } showBackground={ false }>
			<Container horizontalSpacing={ 3 } horizontalGap={ 3 }>
				<Col>
					<GoBackLink onClick={ onClickGoBack } />
				</Col>
				<Col>
					<GoldenToken
						hasGoldenToken={ hasGoldenToken }
						userConnectionData={ userConnectionData }
					/>
				</Col>
			</Container>
		</AdminPage>
	);
}
