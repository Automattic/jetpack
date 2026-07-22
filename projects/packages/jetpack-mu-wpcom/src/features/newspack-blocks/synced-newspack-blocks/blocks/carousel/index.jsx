/**
 * WordPress dependencies
 */
import { Path, SVG } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import edit from './edit';

/**
 * Style dependencies - will load in editor
 */
import './view.scss';
import './editor.scss';
import metadata from './block.json';
const { name, attributes, category } = metadata;

// Name must be exported separately.
export { name };

export const title = __( 'Content Carousel', 'jetpack-mu-wpcom' );

export const icon = (
	<SVG xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
		<Path
			clipRule="evenodd"
			d="M7 18V6a2 2 0 012-2h6a2 2 0 012 2v12a2 2 0 01-2 2H9a2 2 0 01-2-2zM8.5 6v12a.5.5 0 00.5.5h6a.5.5 0 00.5-.5V6a.5.5 0 00-.5-.5H9a.5.5 0 00-.5.5z"
			fillRule="evenodd"
		/>
		<Path d="M4 18.5v-13h1.5v13zM18.5 5.5v13H20v-13z" />
	</SVG>
);

export const settings = {
	title,
	icon: {
		src: icon,
		foreground: '#406ebc',
	},
	attributes,
	category,
	keywords: [
		__( 'posts', 'jetpack-mu-wpcom' ),
		__( 'articles', 'jetpack-mu-wpcom' ),
		__( 'latest', 'jetpack-mu-wpcom' ),
		__( 'query', 'jetpack-mu-wpcom' ),
	],
	description: __(
		'An advanced block that displays content in a carousel format with customizable parameters and visual configurations.',
		'jetpack-mu-wpcom'
	),
	supports: {
		html: false,
		align: [ 'center', 'wide', 'full' ],
	},
	edit,
	save: () => null, // to use view.php
};
