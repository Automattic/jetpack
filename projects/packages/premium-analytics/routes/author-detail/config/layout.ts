import { PA_COLUMN_COUNT } from '../../grid';
import type { DashboardWidget } from '@wordpress/widget-dashboard';

/**
 * Fixed widget composition for the author detail page (WOOA7S-2124) on the
 * three-column detail grid. The remaining prototype cards wait on author-scoped
 * Stats endpoints (WOOA7S-2137).
 */
export const AUTHOR_DETAIL_LAYOUT: DashboardWidget[] = [
	{
		uuid: 'author-views',
		type: 'jpa/author-views',
		attributes: { chartType: 'line' },
		placement: { width: PA_COLUMN_COUNT, height: 2, order: 1 },
	},
	{
		uuid: 'author-popular-post',
		type: 'jpa/popular-post--author',
		attributes: { authorScoped: true },
		placement: { width: 2, height: 2, order: 2 },
	},
	{
		uuid: 'author-latest-post',
		type: 'jpa/latest-post--author',
		attributes: { authorScoped: true },
		placement: { width: 1, height: 2, order: 3 },
	},
	{
		uuid: 'author-top-posts',
		type: 'jpa/author-top-posts',
		placement: { width: PA_COLUMN_COUNT, height: 2, order: 4 },
	},
];
