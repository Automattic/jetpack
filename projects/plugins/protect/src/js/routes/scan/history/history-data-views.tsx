import {
	ThreatsDataViews,
	HISTORIC_TABLE_FIELDS,
	getRedirectUrl,
} from '@automattic/jetpack-components';
import { useConnection } from '@automattic/jetpack-connection';
import { type Threat } from '@automattic/jetpack-scan';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { QUERY_CREDENTIALS_KEY } from '../../../constants';
import useHistoryQuery from '../../../data/scan/use-history-query';
import useUnIgnoreThreatMutation from '../../../data/scan/use-unignore-threat-mutation';
import useCredentialsQuery from '../../../data/use-credentials-query';
import ScanToggleGroupControl from '../scan-toggle-group-control';

/**
 * Scan History Data Viewd
 *
 * @return {JSX.Element} HistoryDataViews component.
 */
export default function HistoryDataViews() {
	const { siteSuffix, blogID } = window.jetpackProtectInitialState;

	const queryClient = useQueryClient();
	const { filter } = useParams();
	const { data: history } = useHistoryQuery();
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

	const filters = useMemo( () => {
		if ( filter ) {
			return [
				{
					field: 'status',
					value: filter,
					operator: 'isAny',
				},
			];
		}
	}, [ filter ] );

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

	// TODO: Optimize imports and actions shared between this component and ScanResultsDataViews

	return (
		<ThreatsDataViews
			status="historic"
			data={ history ? history.threats : [] }
			initialFilters={ filters }
			initialFields={ HISTORIC_TABLE_FIELDS }
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
			header={ <ScanToggleGroupControl /> }
		/>
	);
}
