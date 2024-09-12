export type FixerStatus = 'not_started' | 'in_progress' | 'fixed' | 'not_fixed';

export type FixersStatus = {
	ok: boolean;
	threats: {
		[ key: number ]: {
			status: FixerStatus;
			last_updated: string;
		};
	};
};
