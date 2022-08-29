/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import attributes from './attributes';
import { VideoPressIcon as icon } from './components/icons';
import edit from './edit';
import save from './save';
import './style.scss';

export const name = 'videopress-block';
export const namespace = 'jetpack';

export const title = __( 'VideoPress', 'jetpack' );
export const description = __(
	'Embed a video from your media library or upload a new one with VideoPress.',
	'jetpack'
);

export const settings = {
	title,
	description,
	icon,
	category: 'media',
	edit,
	save,
	attributes,
	supports: {
		align: true,
	},
	transforms: {
		from: [
			{
				type: 'block',
				blocks: [ 'core/video' ],
				transform: attrs => createBlock( 'jetpack/videopress-block', attrs ),
			},
		],
		to: [
			{
				type: 'block',
				blocks: [ 'core/video' ],
				transform: attrs => createBlock( 'core/video', attrs ),
			},
		],
	},
};
