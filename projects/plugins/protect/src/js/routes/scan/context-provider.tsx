import { getRedirectUrl } from '@automattic/jetpack-components';
import { useConnection } from '@automattic/jetpack-connection';
import {
	Threat,
	THREAT_ACTION_FIX,
	THREAT_ACTION_IGNORE,
	THREAT_ACTION_UNIGNORE,
	ThreatsContextProvider,
} from '@automattic/jetpack-scan';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { QUERY_CREDENTIALS_KEY } from '../../constants';
import useIgnoreThreatMutation from '../../data/scan/use-ignore-threat-mutation';
import useUnIgnoreThreatMutation from '../../data/scan/use-unignore-threat-mutation';
import useCredentialsQuery from '../../data/use-credentials-query';
import useAnalyticsTracks from '../../hooks/use-analytics-tracks';
import useFixers from '../../hooks/use-fixers';
import usePlan from '../../hooks/use-plan';
import useWafData from '../../hooks/use-waf-data';

/**
 * Scan Context Provider
 *
 * @param { object }          props          - Component props.
 * @param { React.ReactNode } props.children - Component children.
 *
 * @return { JSX.Element } ScanContextProvider component.
 */
export default function ScanContextProvider( { children } ) {
	const { siteSuffix, blogID } = window.jetpackProtectInitialState;
	const queryClient = useQueryClient();

	const { upgradePlan, hasPlan } = usePlan();
	const { wafSupported } = useWafData();
	const { recordEvent } = useAnalyticsTracks();
	const { fixersStatus, fixThreats } = useFixers();
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

	const actionCallbacks = {
		[ THREAT_ACTION_FIX ]: async (
			threats: Threat[],
			{ onActionPerformed }: { onActionPerformed: ( items: Threat[] ) => void }
		) => {
			await fixThreats( [ threats[ 0 ].id ] );
			onActionPerformed?.( threats );
		},
		[ THREAT_ACTION_IGNORE ]: async (
			threats: Threat[],
			{ onActionPerformed }: { onActionPerformed: ( items: Threat[] ) => void }
		) => {
			await ignoreThreatMutation.mutateAsync( threats[ 0 ].id );
			onActionPerformed?.( threats );
		},
		[ THREAT_ACTION_UNIGNORE ]: async (
			threats: Threat[],
			{ onActionPerformed }: { onActionPerformed: ( items: Threat[] ) => void }
		) => {
			await unignoreThreatMutation.mutateAsync( threats[ 0 ].id );
			onActionPerformed?.( threats );
		},
	};

	const [ pollCredentials, setPollCredentials ] = useState( false );

	const onUpgradePlan = useCallback( () => {
		recordEvent( 'jetpack_protect_threat_modal_get_scan_link_click' );
		upgradePlan();
	}, [ recordEvent, upgradePlan ] );

	/**
	 * Poll credentials as long as the modal is open.
	 */
	useEffect( () => {
		const interval = setInterval( () => {
			if ( ! pollCredentials ) {
				return;
			}

			if ( credentials && credentials.length > 0 ) {
				setPollCredentials( false );
			}

			queryClient.invalidateQueries( { queryKey: [ QUERY_CREDENTIALS_KEY ] } );
		}, 5_000 );

		return () => clearInterval( interval );
	}, [ queryClient, credentials, pollCredentials ] );

	return (
		<ThreatsContextProvider
			actionCallbacks={ actionCallbacks }
			credentials={ {
				available: !! credentials && credentials.length > 0,
				fetching: credentialsIsFetching,
				redirectUrl: getRedirectUrl( 'jetpack-settings-security-credentials', {
					site: String( blogID ?? siteSuffix ),
				} ),
				startPolling: () => setPollCredentials( true ),
				stopPolling: () => setPollCredentials( false ),
			} }
			connection={ {
				connected: isUserConnected && hasConnectedOwner,
				connecting: userIsConnecting,
				connect: handleConnectUser,
			} }
			upgradePlan={ ! hasPlan ? onUpgradePlan : undefined }
			referToCodeable={ wafSupported }
			fixersStatus={ fixersStatus }
			children={ children }
		/>
	);
}
