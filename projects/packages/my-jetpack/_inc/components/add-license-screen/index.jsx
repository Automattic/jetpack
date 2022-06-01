import restApi from '@automattic/jetpack-api';
import { AdminPage, Container, Col } from '@automattic/jetpack-components';
import { ActivationScreen } from '@automattic/jetpack-licensing';
import React, { useCallback, useEffect } from 'react';
import useAnalytics from '../../hooks/use-analytics';
import GoBackLink from '../go-back-link';

/**
 * The AddLicenseScreen component of the My Jetpack app.
 *
 * @returns {object} The AddLicenseScree component.
 */
export default function AddLicenseScreen() {
	useEffect( () => {
		const { apiRoot, apiNonce } = window?.myJetpackRest || {};
		restApi.setApiRoot( apiRoot );
		restApi.setApiNonce( apiNonce );
	}, [] );

	const { recordEvent } = useAnalytics();

	const onClickGoBack = useCallback(
		event => {
			recordEvent( 'jetpack_myjetpack_license_activation_back_link_click' );

			if ( document.referrer.includes( window.location.host ) ) {
				// Prevent default here to minimize page change within the My Jetpack app.
				event.preventDefault();
				history.back();
			}
		},
		[ recordEvent ]
	);

	return (
		<AdminPage showHeader={ false } showBackground={ false }>
			<Container horizontalSpacing={ 3 } horizontalGap={ 3 }>
				<Col>
					<GoBackLink onClick={ onClickGoBack } />
				</Col>
				<Col>
					<ActivationScreen
						siteRawUrl={ window?.myJetpackInitialState?.siteSuffix }
						onActivationSuccess={ undefined }
						siteAdminUrl={ window?.myJetpackInitialState?.adminUrl }
						currentRecommendationsStep={ null }
					/>
				</Col>
			</Container>
		</AdminPage>
	);
}
