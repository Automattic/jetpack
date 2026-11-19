/**
 * Icons for the skill categories, from the WordPress icon set; categories come
 * from the remote catalog, so one missing here gets a generic grid. The set has
 * no lightning bolt or accessibility figure, so those are drawn on its 24-unit grid.
 */

import {
	category as categoryIcon,
	cog,
	grid,
	megaphone,
	pencil,
	shield,
	trendingUp,
} from '@wordpress/icons';
import { Path, SVG } from '@wordpress/primitives';

const bolt = (
	<SVG viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
		<Path d="M13.3 3.5 6 13.2h5l-1 7.3 7.5-9.9h-5.1l.9-7.1Zm-1.4 4.9-.4 3.7h2.9l-3.3 4.4.4-3.4H9l2.9-4.7Z" />
	</SVG>
);

const accessibility = (
	<SVG viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
		<Path
			fillRule="evenodd"
			d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20Zm0 1.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17Zm1.25 4a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0ZM7 9.5h10V11h-3.25v2.25l1.5 4.25-1.4.5L12 14.2 10.15 18l-1.4-.5 1.5-4.25V11H7V9.5Z"
		/>
	</SVG>
);

// One icon per category, none shared, so the icon alone tells categories apart.
const CATEGORY_ICONS = {
	accessibility,
	general: categoryIcon,
	marketing: megaphone,
	performance: bolt,
	seo: trendingUp,
	'setup-launch': cog,
	'site-health': shield,
	writing: pencil,
};

/**
 * A category's icon.
 *
 * @param {string} slug - The category's slug.
 * @return {object} The icon.
 */
export const getCategoryIcon = slug => CATEGORY_ICONS[ slug ] ?? grid;
