/**
 * One icon per skill category, from the WordPress icon set. The set has no
 * lightning bolt, so Performance draws its own on the same 24-unit grid.
 */

import {
	chartBar,
	cog,
	layout,
	megaphone,
	pencil,
	people,
	seen,
	shield,
	tool,
	trendingUp,
} from '@wordpress/icons';
import { Path, SVG } from '@wordpress/primitives';

const bolt = (
	<SVG viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
		<Path d="M13.3 3.5 6 13.2h5l-1 7.3 7.5-9.9h-5.1l.9-7.1Zm-1.4 4.9-.4 3.7h2.9l-3.3 4.4.4-3.4H9l2.9-4.7Z" />
	</SVG>
);

export const CATEGORY_ICONS = {
	admin: chartBar,
	content: pencil,
	inspection: seen,
	maintenance: tool,
	marketing: megaphone,
	'page-building': layout,
	performance: bolt,
	seo: trendingUp,
	security: shield,
	setup: cog,
	users: people,
};
