import type { PodcastApp } from './types';

const AmazonLogo = () => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="40"
		height="40"
		viewBox="0 0 1024 1024"
		aria-hidden="true"
		focusable="false"
	>
		<rect fill="#25d1da" width="1024" height="1024" rx="227" ry="227" />
		<g fill="#ffffff">
			<rect x="336" y="372" width="80" height="280" rx="40" ry="40" />
			<rect x="472" y="272" width="80" height="480" rx="40" ry="40" />
			<rect x="608" y="372" width="80" height="280" rx="40" ry="40" />
		</g>
	</svg>
);

export const amazon: PodcastApp = {
	id: 'amazon',
	name: 'Amazon Music',
	Logo: AmazonLogo,
	submitUrl: 'https://podcasters.amazon.com',
	showHosts: [
		'music.amazon.com',
		'music.amazon.co.uk',
		'music.amazon.de',
		'music.amazon.co.jp',
		'music.amazon.com.au',
		'music.amazon.fr',
		'music.amazon.ca',
		'music.amazon.es',
	],
};
