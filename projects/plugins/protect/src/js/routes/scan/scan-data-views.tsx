import { ThreatsDataViews, getRedirectUrl } from '@automattic/jetpack-components';
import { useConnection } from '@automattic/jetpack-connection';
import {
	THREAT_ACTION_FIX,
	THREAT_ACTION_IGNORE,
	THREAT_ACTION_UNIGNORE,
	ThreatsContext,
	type Threat,
} from '@automattic/jetpack-scan';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
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
 * @param {Threat[]}               props.data                   - Array of threat objects to display.
 * @param {Record<string, string>} props.initialFilters         - Initial filters to apply to the data view.
 * @param {string[]}               props.initialFields          - Initial fields to display in the data view.
 * @param {boolean}                props.isSupportedEnvironment - Indicates if the current environment supports the required features.
 * @param {Function}               props.handleUpgradeClick     - Callback for handling upgrade button click.
 * @param {object}                 props.actionToConfirm        - Action to confirm.
 * @param {Function}               props.setActionToConfirm     - Set action to confirm.
 * @param {string}                 props.actionToConfirm.id     - Action ID.
 * @param {Array}                  props.actionToConfirm.items  - Array of threats to perform the action on.
 *
 * @return {JSX.Element} Rendered component.
 */
export default function ScanDataViews( {
	data,
	initialFilters,
	initialFields,
	isSupportedEnvironment,
	handleUpgradeClick,
	actionToConfirm,
	setActionToConfirm,
}: {
	data: Threat[];
	initialFilters?: React.ComponentProps< typeof ThreatsDataViews >[ 'initialFilters' ];
	initialFields?: string[];
	isSupportedEnvironment?: boolean;
	handleUpgradeClick?: () => void;
	actionToConfirm: { id: string; items: Threat[] };
	setActionToConfirm: ( action: { id: string; items: Threat[] } ) => void;
} ) {
	const { siteSuffix, blogID } = window.jetpackProtectInitialState;
	const queryClient = useQueryClient();

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

	const [ selectedThreat, setSelectedThreat ] = useState< Threat >();
	// const [ actionToConfirm, setActionToConfirm ] = useState< { id: string; items: Threat[] } >();

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

	/**
	 * Poll credentials as long as the modal is open.
	 */
	useEffect( () => {
		const interval = setInterval( () => {
			if ( ! credentials || credentials.length === 0 ) {
				queryClient.invalidateQueries( { queryKey: [ QUERY_CREDENTIALS_KEY ] } );
			}
		}, 5_000 );

		return () => clearInterval( interval );
	}, [ queryClient, credentials ] );

	return (
		<ThreatsContext.Provider
			value={ {
				actionCallbacks,
				credentials: {
					available: !! credentials && credentials.length > 0,
					fetching: credentialsIsFetching,
					redirectUrl: getRedirectUrl( 'jetpack-settings-security-credentials', {
						site: String( blogID ?? siteSuffix ),
					} ),
				},
				connection: {
					connected: isUserConnected && hasConnectedOwner,
					connecting: userIsConnecting,
					connect: handleConnectUser,
				},
				upgradePlan: handleUpgradeClick,
				referToCodeable: isSupportedEnvironment,
				selectedThreat,
				setSelectedThreat,
				actionToConfirm,
				setActionToConfirm,
				fixersStatus,
			} }
		>
			<ThreatsDataViews
				data={ data }
				initialFilters={ initialFilters }
				initialFields={ initialFields }
				header={ <ScanToggleGroupControl /> }
			/>
		</ThreatsContext.Provider>
	);
}
