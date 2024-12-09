import { ThreatsDataViews, getRedirectUrl } from '@automattic/jetpack-components';
import { useConnection } from '@automattic/jetpack-connection';
import { Threat } from '@automattic/jetpack-scan';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { QUERY_CREDENTIALS_KEY } from '../../constants';
import useHistoryQuery from '../../data/scan/use-history-query';
import useIgnoreThreatMutation from '../../data/scan/use-ignore-threat-mutation';
import useScanStatusQuery from '../../data/scan/use-scan-status-query';
import useUnIgnoreThreatMutation from '../../data/scan/use-unignore-threat-mutation';
import useCredentialsQuery from '../../data/use-credentials-query';
import useAnalyticsTracks from '../../hooks/use-analytics-tracks';
import useFixers from '../../hooks/use-fixers';
import usePlan from '../../hooks/use-plan';
import useWafData from '../../hooks/use-waf-data';

/**
 * Scan Results Data View
 *
 * @param {object} props         - Component props.
 * @param {Array}  props.filters - Default filters to apply to the data view.
 *
 * @return {JSX.Element} ScanResultDataView component.
 */
export default function ScanResultsDataView( {
	filters = [],
}: {
	filters: React.ComponentProps< typeof ThreatsDataViews >[ 'filters' ];
} ) {
	const { siteSuffix, blogID } = window.jetpackProtectInitialState;
	const queryClient = useQueryClient();

	const { wafSupported } = useWafData();
	const { data: scanStatus } = useScanStatusQuery();
	const { data: history } = useHistoryQuery();

	const { recordEvent } = useAnalyticsTracks();
	const { hasPlan, upgradePlan } = usePlan();

	const { fixThreats } = useFixers();
	const ignoreThreatMutation = useIgnoreThreatMutation();
	const unignoreThreatMutation = useUnIgnoreThreatMutation();

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

	const handleUnignoreClick = useCallback(
		async ( threats: Threat[] ) => {
			await unignoreThreatMutation.mutateAsync( threats[ 0 ].id );
		},
		[ unignoreThreatMutation ]
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

	return (
		<ThreatsDataViews
			data={ [ ...scanStatus.threats, ...( history ? history.threats : [] ) ] }
			filters={ filters }
			handleUpgradeClick={ ! hasPlan ? getScan : null }
			isSupportedEnvironment={ wafSupported }
			onFixThreats={ handleFixClick }
			onIgnoreThreats={ handleIgnoreClick }
			onUnignoreThreats={ handleUnignoreClick }
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
		/>
	);
}
