/**
 * External dependencies
 */
import React, { useCallback, useEffect } from 'react';
import { AdminPage, Container, Col } from '@automattic/jetpack-components';

/**
 * Internal dependencies
 */
import { ActivationScreen } from '@automattic/jetpack-licensing';
import GoBackLink from '../go-back-link';
import restApi from '@automattic/jetpack-api';
import useAnalytics from '../../hooks/use-analytics';

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

	const onClickGoBack = useCallback( () => {
		recordEvent( 'jetpack_myjetpack_license_activation_back_link_click' );
	}, [ recordEvent ] );

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
