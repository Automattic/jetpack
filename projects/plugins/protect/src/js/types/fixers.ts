export type FixerStatus = 'not_started' | 'in_progress' | 'fixed' | 'not_fixed';

// Discriminated union for top-level error
export type FixersStatusTopLevelError = {
	ok: false; // Discriminator for overall failure
	error: string; // When `ok` is false, top-level error is required
};

// Discriminated union for threat-level errors
export type FixersStatusThreatError = {
	ok: true; // Discriminator for overall success
	threats: {
		[ key: number ]: ThreatFixError; // At least one threat has an error
	};
};

// Discriminated union for success scenario
export type FixersStatusSuccess = {
	ok: true; // Discriminator for overall success
	threats: {
		[ key: number ]: ThreatFixStatusSuccess; // Threats with successful statuses
	};
};

// Union type for fixers status (top-level or threat-level error, or success)
export type FixersStatus =
	| FixersStatusTopLevelError
	| FixersStatusThreatError
	| FixersStatusSuccess;

// Threat-level error (discriminated)
export type ThreatFixError = {
	error: string; // Discriminator for threat-level error
};

// Threat-level success (discriminated)
export type ThreatFixStatusSuccess = {
	status: FixerStatus; // Threat fix status (one of 'not_started', 'in_progress', etc.)
	last_updated: string; // Last updated timestamp
};

export type ThreatFixStatus = ThreatFixError | ThreatFixStatusSuccess;
