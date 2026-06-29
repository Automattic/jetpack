/**
 * VideoPress module icon for the Divi 5 module library.
 *
 * The "V" mark is reused from the VideoPress block icon. It is a single,
 * flat-color path with no fill set, so it inherits `currentColor` and matches
 * Divi's icon styling. `component` returns the inner SVG markup only.
 *
 * Divi always renders icons in a fixed `0 0 16 16` viewBox (the exported
 * `viewBox` below is ignored), so the path — authored in the block's `0 0 29 21`
 * space — is scaled and centred into that grid via the `transform`, leaving a
 * margin that matches the sibling Video/Video Slider icons.
 */

// Unique icon name, referenced as `moduleIcon` in module.json.
export const name = 'jetpack/videopress-logo';

export const viewBox = '0 0 16 16';

export const component = () => (
	<path
		fillRule="evenodd"
		clipRule="evenodd"
		transform="translate(2 3.655) scale(0.41379)"
		d="M2.79037 0.59375C4.0363 0.59375 5.13102 1.41658 5.47215 2.60947L8.8452 14.4044C8.8486 14.4164 8.85411 14.4273 8.86124 14.4368L12.8572 0.59375H15.0927H21.2721C25.6033 0.59375 28.5066 3.39892 28.5066 7.64565C28.5066 11.9411 25.5272 14.6196 21.0818 14.6196H18.1499H14.3719L13.6379 16.8813C12.9796 18.9095 11.0827 20.2839 8.94152 20.2839C6.80035 20.2839 4.90341 18.9095 4.24517 16.8813L0.137069 4.22276C-0.444671 2.43022 0.898038 0.59375 2.79037 0.59375ZM15.7374 10.4119H20.0156C21.8718 10.4119 22.9856 9.35018 22.9856 7.64565C22.9856 5.93137 21.8718 4.91839 20.0156 4.91839H17.5202L15.7374 10.4119Z"
	/>
);
