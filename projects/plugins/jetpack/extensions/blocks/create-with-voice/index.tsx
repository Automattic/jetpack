/**
 * External dependencies
 */
import { __, _x } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { getIconColor } from '../../shared/block-icons';
import attributes from './attributes';
/**
 * Style dependencies
 */
import edit from './edit';
import './editor.scss';

export const name = 'create-with-voice';
export const blockName = `jetpack/${ name }`;
export const title = __( 'Create with voice', 'jetpack' );
export const settings = {
	apiVersion: 2,
	title,
	description: (
		<p>
			{ __(
				'Transform your spoken words into publish-ready blocks with AI effortlessly.',
				'jetpack'
			) }
		</p>
	),
	icon: {
		src: 'microphone',
		foreground: getIconColor(),
	},
	category: 'text',
	keywords: [
		_x( 'AI', 'block search term', 'jetpack' ),
		_x( 'GPT', 'block search term', 'jetpack' ),
		_x( 'AL', 'block search term', 'jetpack' ),
		_x( 'Magic', 'block search term', 'jetpack' ),
		_x( 'help', 'block search term', 'jetpack' ),
		_x( 'assistant', 'block search term', 'jetpack' ),
	],
	supports: {
		html: false,
		multiple: true,
		reusable: false,
	},
	edit,
	save: () => null,
	attributes,
};
