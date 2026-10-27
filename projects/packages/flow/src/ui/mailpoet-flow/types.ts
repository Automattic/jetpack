import { AutomationStatus } from '../../../listing/automation';

export type NextStep = {
	id: string;
};

export type Filter = {
	id: string;
	field_type: string;
	field_key: string;
	condition: string;
	args: Record< string, unknown >;
};

export type FilterGroup = {
	id: string;
	operator: 'and' | 'or';
	filters: Filter[];
};

export type Filters = {
	operator: 'and' | 'or';
	groups: FilterGroup[];
};

export type Step = {
	id: string;
	type: 'root' | 'trigger' | 'action';
	key: string;
	args: Record< string, unknown >;
	next_steps: NextStep[];
	filters?: Filters;
};

export type Steps = Record< string, Step > & { root: Step };

export type Automation = {
	id: number;
	name: string;
	status: AutomationStatus;
	created_at: string;
	updated_at: string;
	activated_at: string;
	author: {
		id: number;
		name: string;
	};
	stats: {
		has_values: boolean;
		totals: {
			entered: number;
			in_progress: number;
			exited: number;
		};
	};
	steps: Steps;
	meta: Record< string, unknown >;
};
