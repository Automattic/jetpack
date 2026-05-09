import type { PodcastApp } from './types';

const PocketCastsLogo = () => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="40"
		height="40"
		viewBox="0 0 32 32"
		aria-hidden="true"
		focusable="false"
	>
		<circle cx="16" cy="15" r="15" fill="#fff" />
		<path
			fill="#f43e37"
			fillRule="evenodd"
			clipRule="evenodd"
			d="M16 32a16 16 0 1 0 0-32 16 16 0 0 0 0 32m0-28.44a12.44 12.44 0 1 0 0 24.88v-3.1A9.33 9.33 0 1 1 25.33 16h3.11c0-6.87-5.57-12.44-12.44-12.44M8.53 16A7.47 7.47 0 0 0 16 23.47v-2.72A4.75 4.75 0 1 1 20.75 16h2.72a7.47 7.47 0 0 0-14.94 0"
		/>
	</svg>
);

export const pocketcasts: PodcastApp = {
	id: 'pocketcasts',
	name: 'Pocket Casts',
	Logo: PocketCastsLogo,
	submitUrl: 'https://pocketcasts.com/submit',
	learnMoreUrl: 'https://support.pocketcasts.com/knowledge-base/submitting-podcasts/',
	showHosts: [ 'pca.st', 'pocketcasts.com' ],
};
