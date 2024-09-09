export type FixerStatus = 'not_started' | 'in_progress' | 'fixed' | 'not_fixed';

export type FixersStatus = {
	threats: {
		[ key: number ]: {
			status: FixerStatus;
			last_updated: string;
		};
	};
};
