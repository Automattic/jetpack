import { __ } from '@wordpress/i18n';
import { Threat } from '../types/threats.js';
import { getFixerDescription } from '../utils/index.js';

/**
 * Threat Action IDs.
 */
export const THREAT_ACTION_VIEW = 'view';
export const THREAT_ACTION_FIX = 'fix';
export const THREAT_ACTION_IGNORE = 'ignore';
export const THREAT_ACTION_UNIGNORE = 'unignore';

export type ThreatAction = {
	/** Unique ID of the action. */
	id:
		| typeof THREAT_ACTION_VIEW
		| typeof THREAT_ACTION_FIX
		| typeof THREAT_ACTION_IGNORE
		| typeof THREAT_ACTION_UNIGNORE;

	/** Label of the action. */
	label: string | ( ( threats: Threat[] ) => string );

	/** Description of the action. */
	description?: string | ( ( threats: Threat[] ) => string );

	/** Callback function which determines whether the action is eligible to run for a given threat. */
	isEligible?: ( threat: Threat ) => boolean;

	/** Callback function to run the action. */
	callback: (
		threats: Threat[],
		{ onActionPerformed }?: { onActionPerformed?: ( items: Threat[] ) => void }
	) => void;

	/** Whether the action should use a confirmation flow. */
	requiresConfirmation?: boolean;

	/** Whether the action requires a Jetpack connection. */
	requiresConnection?: boolean;

	/** Wether the action requires site credentials. */
	requiresCredentials?: boolean;
};

type ThreatActionBase = Omit< ThreatAction, 'callback' >;

type ThreatActionsObject = Partial< Record< ThreatAction[ 'id' ], ThreatActionBase > >;

/**
 * Threat Actions.
 *
 * Threat action properties keyed by action ID.
 */
export const THREAT_ACTIONS: ThreatActionsObject = {
	[ THREAT_ACTION_FIX ]: {
		id: THREAT_ACTION_FIX,
		label: __( 'Show Auto-Fix', 'jetpack-scan' ),
		description: ( threats: Threat[] ) => {
			return getFixerDescription( threats[ 0 ] );
		},
		isEligible( threat ) {
			return !! threat.fixable;
		},
		requiresConfirmation: true,
		requiresConnection: true,
		requiresCredentials: true,
	},
	[ THREAT_ACTION_IGNORE ]: {
		id: THREAT_ACTION_IGNORE,
		label: __( 'Ignore', 'jetpack-scan' ),
		isEligible( threat ) {
			return threat.status === 'current';
		},
		requiresConfirmation: true,
		requiresConnection: true,
	},
	[ THREAT_ACTION_UNIGNORE ]: {
		id: THREAT_ACTION_UNIGNORE,
		label: __( 'Stop Ignoring', 'jetpack-scan' ),
		isEligible( threat ) {
			return threat.status === 'ignored';
		},
		requiresConnection: true,
	},
};
