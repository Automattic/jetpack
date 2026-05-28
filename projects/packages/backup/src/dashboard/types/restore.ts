export type RestoreItems = {
	themes: boolean;
	plugins: boolean;
	roots: boolean;
	contents: boolean;
	sqls: boolean;
	uploads: boolean;
};

export const DEFAULT_RESTORE_ITEMS: RestoreItems = {
	themes: true,
	plugins: true,
	roots: true,
	contents: true,
	sqls: true,
	uploads: true,
};

export type RestoreState =
	| { phase: 'idle' }
	| { phase: 'submitting' }
	| { phase: 'progress'; percent: number }
	| { phase: 'success' }
	| { phase: 'error'; message: string };
