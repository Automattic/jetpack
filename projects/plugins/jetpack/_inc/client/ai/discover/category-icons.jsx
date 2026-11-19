/**
 * Icons for the skill categories, all outlined as the WordPress icon set is;
 * categories come from the remote catalog, so one missing here gets a generic
 * grid. The set's cog and pencil are partly solid, and it has no lightning bolt
 * or accessibility figure, so those four are drawn here in its outline style.
 */

import {
	category as categoryIcon,
	grid,
	megaphone,
	shield,
	starEmpty,
	trendingUp,
} from '@wordpress/icons';
import { Circle, Path, SVG } from '@wordpress/primitives';

const OUTLINE = {
	viewBox: '0 0 24 24',
	xmlns: 'http://www.w3.org/2000/svg',
	style: { fill: 'none' },
	stroke: 'currentColor',
	strokeWidth: 1.5,
	strokeLinecap: 'round',
	strokeLinejoin: 'round',
};

const bolt = (
	<SVG { ...OUTLINE }>
		<Path d="M13 3.75 6.5 13h5l-1 7.25L17.5 11h-5l.5-7.25Z" />
	</SVG>
);

const accessibility = (
	<SVG { ...OUTLINE }>
		<Circle cx="12" cy="12" r="8.25" />
		<Circle cx="12" cy="7.75" r="1" />
		<Path d="M8 10.25h8M12 10.25v3.5M12 13.75l-2 3.5M12 13.75l2 3.5" />
	</SVG>
);

const cog = (
	<SVG { ...OUTLINE }>
		<Circle cx="12" cy="12" r="2.5" />
		<Path d="M10.6 4.75h2.8l.45 2.1 1.5.86 2.04-.67 1.4 2.42-1.6 1.43v1.72l1.6 1.43-1.4 2.42-2.04-.67-1.5.86-.45 2.1h-2.8l-.45-2.1-1.5-.86-2.04.67-1.4-2.42 1.6-1.43v-1.72l-1.6-1.43 1.4-2.42 2.04.67 1.5-.86.45-2.1Z" />
	</SVG>
);

const pencil = (
	<SVG { ...OUTLINE }>
		<Path d="M15 5.25 18.75 9 9.5 18.25H5.75V14.5L15 5.25ZM13 7.25 16.75 11" />
	</SVG>
);

// One icon per category, none shared, so the icon alone tells categories apart.
const CATEGORY_ICONS = {
	accessibility,
	'good-first-skills': starEmpty,
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
