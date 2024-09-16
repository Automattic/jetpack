export type FixerStatus = 'not_started' | 'in_progress' | 'fixed' | 'not_fixed';

export type FixersStatus = {
	ok: boolean;
	threats: {
		[ key: number ]: ThreatFixStatus;
	};
};

export type ThreatFixStatus = {
	status: FixerStatus;
	last_updated: string;
};
