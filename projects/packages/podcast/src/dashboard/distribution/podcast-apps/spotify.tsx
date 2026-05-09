import type { PodcastApp } from './types';

const SpotifyLogo = () => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="40"
		height="40"
		viewBox="0 0 220 220"
		aria-hidden="true"
		focusable="false"
	>
		<rect width="220" height="220" fill="#1ED760" rx="44" ry="44" />
		<g transform="translate(26 26)">
			<circle cx="84" cy="84.02" r="83.74" fill="#FFFFFF" />
			<path
				fill="#1ED760"
				d="M122.4 120.78a5.2 5.2 0 0 1-7.18 1.73c-19.66-12.01-44.41-14.73-73.56-8.07a5.22 5.22 0 0 1-2.33-10.18c31.9-7.29 59.27-4.15 81.34 9.34a5.2 5.2 0 0 1 1.73 7.18m10.25-22.8a6.53 6.53 0 0 1-8.98 2.15c-22.51-13.84-56.82-17.84-83.45-9.76a6.54 6.54 0 0 1-3.8-12.5c30.42-9.22 68.23-4.75 94.08 11.13a6.53 6.53 0 0 1 2.15 8.98m.88-23.75c-26.99-16.03-71.52-17.5-97.29-9.68a7.83 7.83 0 1 1-4.55-14.99c29.58-8.98 78.76-7.24 109.83 11.2a7.82 7.82 0 1 1-7.99 13.47"
			/>
		</g>
	</svg>
);

export const spotify: PodcastApp = {
	id: 'spotify',
	name: 'Spotify',
	Logo: SpotifyLogo,
	submitUrl: 'https://creators.spotify.com/',
	learnMoreUrl:
		'https://support.spotify.com/creators/article/claiming-your-podcast-on-spotify-for-creators/',
	showHosts: [ 'open.spotify.com' ],
};
