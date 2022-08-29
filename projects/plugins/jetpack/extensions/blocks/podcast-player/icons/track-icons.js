import { Path, SVG } from '@wordpress/components';

const sharedProps = {
	height: '24',
	viewBox: '0 0 24 24',
	width: '24',
	xmlns: 'http://www.w3.org/2000/svg',
};

export const playing = (
	<SVG { ...sharedProps }>
		<Path d="M0 0h24v24H0V0z" fill="none" />
		<Path d="M3 9v6h4l5 5V4L7 9H3zm7-.17v6.34L7.83 13H5v-2h2.83L10 8.83zM16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77 0-4.28-2.99-7.86-7-8.77z" />
	</SVG>
);

export const error = (
	<SVG { ...sharedProps }>
		<Path d="M0 0h24v24H0V0z" fill="none" />
		<Path d="M11 15h2v2h-2zm0-8h2v6h-2zm.99-5C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" />
	</SVG>
);
