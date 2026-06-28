import type { PodcastApp } from './types';

const YouTubeMusicLogo = () => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="40"
		height="40"
		viewBox="0 0 176 176"
		aria-hidden="true"
		focusable="false"
	>
		<circle fill="#FF0000" cx="88" cy="88" r="88" />
		<path
			fill="#FFFFFF"
			d="M88,46c23.1,0,42,18.8,42,42s-18.8,42-42,42s-42-18.8-42-42S64.9,46,88,46 M88,42 c-25.4,0-46,20.6-46,46s20.6,46,46,46s46-20.6,46-46S113.4,42,88,42L88,42z"
		/>
		<polygon fill="#FFFFFF" points="72,111 111,87 72,65" />
	</svg>
);

export const youtube: PodcastApp = {
	id: 'youtube',
	name: 'YouTube Music',
	Logo: YouTubeMusicLogo,
	submitUrl: 'https://studio.youtube.com',
	learnMoreUrl: 'https://support.google.com/youtube/answer/13973017',
};
