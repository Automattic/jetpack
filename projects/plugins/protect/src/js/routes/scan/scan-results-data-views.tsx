import { ThreatsDataViews, getRedirectUrl } from '@automattic/jetpack-components';
import { useConnection } from '@automattic/jetpack-connection';
import { type Threat } from '@automattic/jetpack-scan';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { QUERY_CREDENTIALS_KEY } from '../../constants';
import useIgnoreThreatMutation from '../../data/scan/use-ignore-threat-mutation';
import useScanStatusQuery from '../../data/scan/use-scan-status-query';
import useCredentialsQuery from '../../data/use-credentials-query';
import useAnalyticsTracks from '../../hooks/use-analytics-tracks';
import useFixers from '../../hooks/use-fixers';
import usePlan from '../../hooks/use-plan';
import useWafData from '../../hooks/use-waf-data';
import ScanToggleGroupControl from './scan-toggle-group-control';

/**
 * Scan Results Data Views
 *
 * @return {JSX.Element} ScanResultDataViews component.
 */
export default function ScanResultsDataViews() {
	const { siteSuffix, blogID } = window.jetpackProtectInitialState;
	const queryClient = useQueryClient();

	const { wafSupported } = useWafData();
	const { data: status } = useScanStatusQuery();

	const { recordEvent } = useAnalyticsTracks();
	const { hasPlan, upgradePlan } = usePlan();

	const { fixThreats } = useFixers();
	const ignoreThreatMutation = useIgnoreThreatMutation();

	const { data: credentials, isLoading: credentialsIsFetching } = useCredentialsQuery();
	const { isUserConnected, hasConnectedOwner, userIsConnecting, handleConnectUser } = useConnection(
		{
			redirectUri: 'admin.php?page=jetpack-protect',
			from: 'scan',
			autoTrigger: false,
			skipUserConnection: false,
			skipPricingPage: true,
		}
	);

	const [ isModalOpen, setIsModalOpen ] = useState( false );
	const onModalOpen = useCallback( () => setIsModalOpen( true ), [] );
	const onModalClose = useCallback( () => setIsModalOpen( false ), [] );

	const getScan = useCallback( () => {
		recordEvent( 'jetpack_protect_threat_modal_get_scan_link_click' );
		upgradePlan();
	}, [ recordEvent, upgradePlan ] );

	const handleFixClick = useCallback(
		async ( threats: Threat[] ) => {
			await fixThreats( [ threats[ 0 ].id as number ] );
		},
		[ fixThreats ]
	);

	const handleIgnoreClick = useCallback(
		async ( threats: Threat[] ) => {
			await ignoreThreatMutation.mutateAsync( threats[ 0 ].id );
		},
		[ ignoreThreatMutation ]
	);

	/**
	 * Poll credentials as long as the modal is open.
	 */
	useEffect( () => {
		if ( ! isModalOpen ) {
			return;
		}
		const interval = setInterval( () => {
			if ( ! credentials || credentials.length === 0 ) {
				queryClient.invalidateQueries( { queryKey: [ QUERY_CREDENTIALS_KEY ] } );
			}
		}, 5_000 );

		return () => clearInterval( interval );
	}, [ isModalOpen, queryClient, credentials ] );

	// TODO: Optimize imports and actions shared between this component and HistoryDataViews

	return (
		<ThreatsDataViews
			data={ status ? status.threats : [] }
			isSupportedEnvironment={ wafSupported }
			onFixThreats={ handleFixClick }
			onIgnoreThreats={ handleIgnoreClick }
			handleUpgradeClick={ ! hasPlan ? getScan : null }
			isUserConnected={ isUserConnected }
			hasConnectedOwner={ hasConnectedOwner }
			userIsConnecting={ userIsConnecting }
			handleConnectUser={ handleConnectUser }
			credentials={ credentials }
			credentialsIsFetching={ credentialsIsFetching }
			credentialsRedirectUrl={ getRedirectUrl( 'jetpack-settings-security-credentials', {
				site: String( blogID ?? siteSuffix ),
			} ) }
			onModalOpen={ onModalOpen }
			onModalClose={ onModalClose }
			header={ <ScanToggleGroupControl /> }
		/>
	);
}
