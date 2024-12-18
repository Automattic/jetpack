export type FixerStatus = 'not_started' | 'in_progress' | 'fixed' | 'not_fixed';

/**
 * Threat Fix Status
 *
 * Individual fixer status for a threat.
 */
export type ThreatFixStatusError = {
	error: string;
};

export type ThreatFixStatusSuccess = {
	status: FixerStatus;
	lastUpdated: string;
};

export type ThreatFixStatus = ThreatFixStatusError | ThreatFixStatusSuccess;

/**
 * Fixers Status
 *
 * Overall status of all fixers.
 */
type FixersStatusBase = {
	ok: boolean; // Discriminator for overall success
};

export type FixersStatusError = FixersStatusBase & {
	ok: false;
	error: string;
};

export type FixersStatusSuccess = FixersStatusBase & {
	ok: true;
	threats: {
		[ key: number ]: ThreatFixStatus;
	};
};

export type FixersStatus = FixersStatusSuccess | FixersStatusError;
