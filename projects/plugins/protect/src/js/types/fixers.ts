export type FixerStatus = 'not_started' | 'in_progress' | 'fixed' | 'not_fixed';

export type FixersStatus = {
	ok: boolean;
	error?: string;
	threats?: {
		[ key: number ]: ThreatFixStatus;
	};
};

export type ThreatFixStatus = {
	error?: string;
	status?: FixerStatus;
	last_updated?: string;
};
