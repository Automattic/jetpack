import { ThreatsDataViews, getRedirectUrl } from '@automattic/jetpack-components';
import { useConnection } from '@automattic/jetpack-connection';
import { type Threat } from '@automattic/jetpack-scan';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { QUERY_CREDENTIALS_KEY } from '../../constants';
import useIgnoreThreatMutation from '../../data/scan/use-ignore-threat-mutation';
import useUnIgnoreThreatMutation from '../../data/scan/use-unignore-threat-mutation';
import useCredentialsQuery from '../../data/use-credentials-query';
import useFixers from '../../hooks/use-fixers';
import ScanToggleGroupControl from './scan-toggle-group-control';

/**
 * ScanDataViews component for rendering ThreatsDataViews variants.
 *
 * @param {object}                 props                        - Component properties.
 * @param {'current' | 'historic'} props.status                 - The status of the data view, either 'current' or 'historic'.
 * @param {Threat[]}               props.data                   - Array of threat objects to display.
 * @param {Record<string, string>} props.initialFilters         - Initial filters to apply to the data view.
 * @param {string[]}               props.initialFields          - Initial fields to display in the data view.
 * @param {boolean}                props.isSupportedEnvironment - Indicates if the current environment supports the required features.
 * @param {Function}               props.handleUpgradeClick     - Callback for handling upgrade button click.
 *
 * @return {JSX.Element} Rendered component.
 */
export default function ScanDataViews( {
	status,
	data,
	initialFilters,
	initialFields,
	isSupportedEnvironment,
	handleUpgradeClick,
}: {
	status?: 'current' | 'historic';
	data: Threat[];
	initialFilters?: { field: string; value: string; operator: string }[];
	initialFields?: string[];
	isSupportedEnvironment?: boolean;
	handleUpgradeClick?: () => void;
} ) {
	const { siteSuffix, blogID } = window.jetpackProtectInitialState;
	const queryClient = useQueryClient();

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
			status={ status }
			data={ data }
			initialFilters={ initialFilters }
			initialFields={ initialFields }
			isSupportedEnvironment={ isSupportedEnvironment }
			onFixThreats={ handleFixClick }
			onIgnoreThreats={ handleIgnoreClick }
			onUnignoreThreats={ handleUnignoreClick }
			handleUpgradeClick={ handleUpgradeClick }
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
