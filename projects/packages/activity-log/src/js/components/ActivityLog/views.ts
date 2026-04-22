import type { View } from '@wordpress/dataviews';

export const DEFAULT_VIEW: View = {
	type: 'table',
	perPage: 20,
	sort: {
		field: 'published',
		direction: 'desc',
	},
	fields: [ 'published', 'event', 'actor' ],
	layout: {
		density: 'balanced',
		styles: {
			published: { minWidth: '200px' },
			published_utc: { minWidth: '200px' },
			actor: { minWidth: '100px' },
			event: { minWidth: '520px' },
		},
	},
	showLevels: false,
};
