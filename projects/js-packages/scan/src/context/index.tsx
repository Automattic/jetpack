import { __ } from '@wordpress/i18n';
import { createContext, useMemo, useState } from 'react';
import { THREAT_ACTIONS, ThreatAction } from '../actions/index.js';
import { FixersStatus } from '../types/fixers.js';
import { Threat } from '../types/threats.js';

/**
 * Generic context for threat components.
 */
export type ThreatsContextInterface = {
	/** Threat actions. */
	actions: Record< string, ThreatAction >;

	/** The pending action to confirm. */
	actionToConfirm?: {
		/** The unique action ID. */
		id: string;
		/** The items to run the action against. */
		items: Threat[];
	};

	/** Set the pending action to confirm. */
	setActionToConfirm?: React.Dispatch<
		React.SetStateAction< { id: string; items: Threat[] } | undefined >
	>;

	/** The site's credentials state. */
	credentials?: {
		/** When enabled, site credentials are available. */
		available: boolean;
		/** When enabled, the credentials state is currently fetching. */
		fetching: boolean;
		/** The post-connection redirect URL. */
		redirectUrl: string;
		/** Callback function to start polling the credentials status. */
		startPolling?: () => void;
		/** Callback function to stop polling the credentials status. */
		stopPolling?: () => void;
	};

	/** The site's Jetpack connection state. */
	connection?: {
		/** When enabled, Jetpack connection is healthy. */
		connected: boolean;
		/** When enabled, Jetpack connection is currently in progress. */
		connecting: boolean;
		/** Callback function to start Jetpack connection flow. */
		connect: () => void;
	};

	/** The status of all current fixers. */
	fixersStatus?: FixersStatus;

	/** When enabled, refer to Codeable when a threat has no known fix. */
	referToCodeable: boolean;

	/** The threat to display. */
	selectedThreat?: Threat;

	/** Set the selected threat to display. */
	setSelectedThreat?: ( threat: Threat ) => void;

	/** Callback to upgrade to a Scan plan. */
	upgradePlan?: () => void;
};

type ThreatsContextProviderProps = Partial< ThreatsContextInterface > & {
	/** Callback functions keyed by threat action ID. */
	actionCallbacks?: Record<
		string,
		(
			items: Threat[],
			{ onActionPerformed }: { onActionPerformed: ( i: Threat[] ) => void }
		) => void
	>;

	/** Threat data to use in initial component state. */
	initialSelectedThreat?: Threat;

	/** Action confirmation data to use in initial component state. */
	initialActionToConfirm?: { id: string; items: Threat[] };

	/** Component children. */
	children: React.ReactNode;
};

export const ThreatsContext = createContext< ThreatsContextInterface | null >( null );

export const ThreatsContextProvider = ( {
	actionCallbacks,
	connection,
	credentials,
	fixersStatus,
	referToCodeable,
	upgradePlan,
	children,
	initialSelectedThreat,
	initialActionToConfirm,
}: ThreatsContextProviderProps ): JSX.Element => {
	const [ selectedThreat, setSelectedThreat ] = useState( initialSelectedThreat );
	const [ actionToConfirm, setActionToConfirm ] = useState( initialActionToConfirm );

	/**
	 * Threat Actions
	 */
	const actions: Record< string, ThreatAction > = useMemo( () => {
		// Merge the default actions with the provided actions.
		return Object.values( THREAT_ACTIONS ).reduce(
			( result, action ) => {
				const threatAction: ThreatAction = {
					...action,
					callback: ( items: Threat[], { onActionPerformed } = {} ) => {
						// Handle actions that require confirmation.
						if (
							action.requiresConfirmation &&
							( ! actionToConfirm || actionToConfirm.id !== action.id )
						) {
							setActionToConfirm( { id: action.id, items } );
							onActionPerformed?.( items );
							return;
						}

						// Run the action.
						actionCallbacks[ action.id ]( items, { onActionPerformed } );
					},
				};
				result[ action.id ] = threatAction;
				return result;
			},
			{
				view: {
					id: 'view',
					label: __( 'Show Details', 'jetpack-scan' ),
					callback: ( items: Threat[] ) => {
						setSelectedThreat( items[ 0 ] );
					},
				},
			}
		);
	}, [ actionCallbacks, actionToConfirm ] );

	return (
		<ThreatsContext.Provider
			value={ {
				actions,
				selectedThreat,
				setSelectedThreat,
				actionToConfirm,
				setActionToConfirm,
				connection,
				credentials,
				fixersStatus,
				referToCodeable,
				upgradePlan,
			} }
			children={ children }
		/>
	);
};
