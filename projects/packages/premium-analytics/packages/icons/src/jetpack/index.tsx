/**
 * External dependencies
 */
import { SVG, Path } from '@wordpress/primitives';

// Keep the Jetpack brand colors instead of inheriting the package's neutral icon colors.
export const jetpack = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none">
		<Path
			d="M16 0C7.163 0 0 7.163 0 16s7.163 16 16 16 16-7.163 16-16S24.837 0 16 0Z"
			fill="#069e08"
		/>
		<Path d="M15 19H7L15 3V19Z" fill="#fff" />
		<Path d="M17 29V13H25L17 29Z" fill="#fff" />
	</SVG>
);
