/**
 * Spotify directory entry.
 */

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
		<rect width="220" height="220" rx="44" ry="44" fill="#1ED760" />
		<g transform="translate(26 26)">
			<circle cx="83.996" cy="84.019" r="83.742" fill="#FFFFFF" />
			<path
				fill="#1ED760"
				d="m122.4 120.78c-1.5 2.46-4.72 3.24-7.18 1.73-19.662-12.01-44.414-14.73-73.564-8.07-2.809 0.64-5.609-1.12-6.249-3.93-0.643-2.81 1.11-5.61 3.926-6.25 31.9-7.288 59.263-4.15 81.337 9.34 2.46 1.51 3.24 4.72 1.73 7.18zm10.25-22.802c-1.89 3.072-5.91 4.042-8.98 2.152-22.51-13.836-56.823-17.843-83.448-9.761-3.453 1.043-7.1-0.903-8.148-4.35-1.04-3.453 0.907-7.093 4.354-8.143 30.413-9.228 68.222-4.758 94.072 11.127 3.07 1.89 4.04 5.91 2.15 8.976v-0.001zm0.88-23.744c-26.99-16.031-71.52-17.505-97.289-9.684-4.138 1.255-8.514-1.081-9.768-5.219-1.254-4.14 1.08-8.513 5.221-9.771 29.581-8.98 78.756-7.245 109.83 11.202 3.73 2.209 4.95 7.016 2.74 10.733-2.2 3.722-7.02 4.949-10.73 2.739z"
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
