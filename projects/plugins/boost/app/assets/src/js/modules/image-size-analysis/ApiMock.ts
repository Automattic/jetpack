import { writable } from 'svelte/store';

export const categories = writable( [
	{
		name: 'Homepage',
		progress: 100,
	},
	{
		name: 'Pages',
		progress: 100,
	},
	{
		name: 'Posts',
		progress: 37,
	},
	{
		name: 'Other',
		progress: 0,
	},
] );
