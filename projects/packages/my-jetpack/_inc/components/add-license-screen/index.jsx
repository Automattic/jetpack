/*
 * External dependencies
 */
import { AdminPage, Container, Col } from '@automattic/jetpack-components';
import { useConnection } from '@automattic/jetpack-connection';
import { ActivationScreen } from '@automattic/jetpack-licensing';
import React, { useCallback, useState, useMemo } from 'react';
/*
 * Internal dependencies
 */
import { QUERY_LICENSES_KEY } from '../../data/constants';
import useJetpackApiQuery from '../../data/use-jetpack-api-query';
import { getMyJetpackWindowInitialState } from '../../data/utils/get-my-jetpack-window-state';
import useAnalytics from '../../hooks/use-analytics';
import GoBackLink from '../go-back-link';

/**
 * The AddLicenseScreen component of the My Jetpack app.
 *
 * @returns {object} The AddLicenseScreen component.
 */
export default function AddLicenseScreen() {
	const { recordEvent } = useAnalytics();
	const { data: licenses = [], isLoading: fetchingAvailableLicenses } = useJetpackApiQuery( {
		name: QUERY_LICENSES_KEY,
		queryFn: async api => ( await api.getUserLicenses() )?.items,
	} );
	const { userConnectionData } = useConnection();
	const [ hasActivatedLicense, setHasActivatedLicense ] = useState( false );

	// They might not have a display name set in wpcom, so fall back to wpcom login or local username.
	const displayName =
		userConnectionData?.currentUser?.wpcomUser?.display_name ||
		userConnectionData?.currentUser?.wpcomUser?.login ||
		userConnectionData?.currentUser?.username;

	const onClickGoBack = useCallback( () => {
		recordEvent( 'jetpack_myjetpack_license_activation_back_link_click' );
	}, [ recordEvent ] );

	const handleActivationSuccess = useCallback( () => {
		setHasActivatedLicense( true );
	}, [] );

	const availableLicenses = useMemo(
		() =>
			licenses.filter(
				( { attached_at, revoked_at } ) => attached_at === null && revoked_at === null
			),
		[ licenses ]
	);

	const { siteSuffix = '', adminUrl = '' } = getMyJetpackWindowInitialState();

	return (
		<AdminPage showHeader={ false } showBackground={ false }>
			<Container horizontalSpacing={ 3 } horizontalGap={ 3 }>
				<Col>
					<GoBackLink onClick={ onClickGoBack } reload={ hasActivatedLicense } />
				</Col>
				<Col>
					<ActivationScreen
						currentRecommendationsStep={ null }
						availableLicenses={ availableLicenses }
						fetchingAvailableLicenses={ fetchingAvailableLicenses }
						onActivationSuccess={ handleActivationSuccess }
						siteAdminUrl={ adminUrl }
						siteRawUrl={ siteSuffix }
						displayName={ displayName }
					/>
				</Col>
			</Container>
		</AdminPage>
	);
}
