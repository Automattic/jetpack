import { __ } from '@wordpress/i18n';
import { ThreatsContextInterface } from '../context/index.js';
import { Threat } from '../types/threats.js';
import { getFixerAction, getFixerDescription } from '../utils/index.js';

export type ThreatAction = {
	id: string;
	label: string | ( ( threat: Threat ) => string );
	description?: string | ( ( threat: Threat ) => string );
	isEligible: ( threat: Threat, context: ThreatsContextInterface ) => boolean;
};

export const THREAT_ACTION_FIX = 'fix';
export const THREAT_ACTION_IGNORE = 'ignore';
export const THREAT_ACTION_UNIGNORE = 'unignore';

export const THREAT_ACTIONS: Record< string, ThreatAction > = {
	[ THREAT_ACTION_FIX ]: {
		id: THREAT_ACTION_FIX,
		label: ( threat: Threat ) => {
			return getFixerAction( threat );
		},
		description: ( threat: Threat ) => {
			return getFixerDescription( threat );
		},
		isEligible( threat, context ) {
			if ( ! context.connection?.connected ) {
				return false;
			}
			if ( ! context.credentials?.available ) {
				return false;
			}

			return !! threat.fixable;
		},
	},
	[ THREAT_ACTION_IGNORE ]: {
		id: THREAT_ACTION_IGNORE,
		label: __( 'Ignore threat', 'jetpack-scan' ),
		isEligible( threat, context ) {
			if ( ! context.connection?.connected ) {
				return false;
			}

			return threat.status === 'current';
		},
	},
	[ THREAT_ACTION_UNIGNORE ]: {
		id: THREAT_ACTION_UNIGNORE,
		label: __( 'Stop ignoring threat', 'jetpack-scan' ),
		isEligible( threat, context ) {
			if ( ! context.connection?.connected ) {
				return false;
			}

			return threat.status === 'ignored';
		},
	},
};
