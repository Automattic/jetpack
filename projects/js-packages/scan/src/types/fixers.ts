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
