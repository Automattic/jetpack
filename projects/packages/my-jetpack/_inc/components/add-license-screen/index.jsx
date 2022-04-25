/**
 * External dependencies
 */
import React, { useEffect } from 'react';
import { AdminPage, Container, Col } from '@automattic/jetpack-components';

/**
 * Internal dependencies
 */
import { ActivationScreen } from '@automattic/jetpack-licensing';
import GoBackLink from '../go-back-link';
import restApi from '@automattic/jetpack-api';

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

	return (
		<AdminPage showHeader={ false } showBackground={ false }>
			<Container horizontalSpacing={ 3 } horizontalGap={ 3 }>
				<Col>
					<GoBackLink onClick={ null } />
				</Col>
				<Col>
					<ActivationScreen
						siteRawUrl={ window?.myJetpackInitialState?.rawUrl }
						onActivationSuccess={ undefined }
						siteAdminUrl={ window?.myJetpackInitialState?.adminUrl }
						currentRecommendationsStep={ null }
					/>
				</Col>
			</Container>
		</AdminPage>
	);
}
