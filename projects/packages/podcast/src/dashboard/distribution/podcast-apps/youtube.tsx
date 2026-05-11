import type { PodcastApp } from './types';

const YouTubeLogo = () => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="40"
		height="40"
		viewBox="0 0 300 300"
		aria-hidden="true"
		focusable="false"
	>
		<rect width="300" height="300" fill="red" ry="49.14" />
		<path
			fill="#fff"
			d="M149.94 79.22s-63.22 0-79.09 4.13A26.1 26.1 0 0 0 53 101.34c-4.13 15.86-4.13 48.72-4.13 48.72s0 32.99 4.13 48.6a25.7 25.7 0 0 0 17.86 17.87c16 4.25 79.09 4.25 79.09 4.25s63.34 0 79.2-4.13a25.1 25.1 0 0 0 17.75-17.86c4.25-15.74 4.25-48.6 4.25-48.6s.12-32.99-4.25-48.85a25 25 0 0 0-17.74-17.74c-15.87-4.38-79.21-4.38-79.21-4.38m-20.12 40.48 52.6 30.36-52.6 30.24z"
		/>
	</svg>
);

export const youtube: PodcastApp = {
	id: 'youtube',
	name: 'YouTube',
	Logo: YouTubeLogo,
	submitUrl: 'https://studio.youtube.com',
	learnMoreUrl: 'https://support.google.com/youtube/answer/13973017',
	showHosts: [ 'youtube.com', 'm.youtube.com', 'youtu.be', 'music.youtube.com' ],
};
