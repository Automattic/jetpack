import { createContext } from 'react';
import { FixersStatus } from '../types/fixers.js';
import { Threat } from '../types/threats.js';

/**
 * Generic context for threat components.
 */
export type ThreatsContextInterface = {
	/** Callback functions for threat actions. */
	actionCallbacks: Record<
		string,
		(
			items: Threat[],
			{ onActionPerformed }: { onActionPerformed: ( i: Threat[] ) => void }
		) => void
	>;

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

export const ThreatsContext = createContext< ThreatsContextInterface | null >( null );
