import { writable } from 'svelte/store';

type CategoryState = {
	name: string;
	progress: number;
	issues?: number;
	done: boolean;
};

export const categories = writable< CategoryState[] >( [
	{
		name: 'Homepage',
		progress: 100,
		issues: 22,
		done: true,
	},
	{
		name: 'Pages',
		progress: 100,
		issues: 7,
		done: true,
	},
	{
		name: 'Posts',
		progress: 37,
		issues: 0,
		done: false,
	},
	{
		name: 'Other Content',
		progress: 0,
		issues: 13,
		done: false,
	},
] );
