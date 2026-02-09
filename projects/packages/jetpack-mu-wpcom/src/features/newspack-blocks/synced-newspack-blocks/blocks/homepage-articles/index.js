/**
 * Newspack dependencies
 */
import colors from 'newspack-colors';
import { contentLoop as icon } from 'newspack-icons';

/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';
import { applyFilters } from '@wordpress/hooks';
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import edit from './edit';

/**
 * Style dependencies - will load in editor
 */
import './editor.scss';
import './view.scss';
import metadata from './block.json';
const { name, attributes, category } = metadata;

// Name must be exported separately.
export { name };

export const title = __( 'Content Loop', 'jetpack-mu-wpcom' );

export const settings = {
	title,
	icon: {
		src: icon,
		foreground: colors[ 'primary-400' ],
	},
	attributes,
	category,
	keywords: [
		__( 'posts', 'jetpack-mu-wpcom' ),
		__( 'articles', 'jetpack-mu-wpcom' ),
		__( 'latest', 'jetpack-mu-wpcom' ),
		__( 'homepage', 'jetpack-mu-wpcom' ),
		__( 'query', 'jetpack-mu-wpcom' ),
	],
	description: __( 'An advanced block that allows displaying content based on different parameters and visual configurations.', 'jetpack-mu-wpcom' ),
	styles: [
		{
			name: 'default',
			label: _x( 'Default', 'block style', 'jetpack-mu-wpcom' ),
			isDefault: true,
		},
		{
			name: 'borders',
			label: _x( 'Borders', 'block style', 'jetpack-mu-wpcom' ),
		},
	],
	supports: {
		html: false,
		align: [ 'wide', 'full' ],
		default: '',
	},
	edit,
	save: () => null, // to use view.php
	transforms: {
		from: [
			{
				type: 'block',
				blocks: [ 'core/latest-posts' ],
				transform: ( { displayPostContent, displayPostDate, postLayout, columns, postsToShow, categories } ) => {
					return createBlock( applyFilters( 'blocks.transforms_from_name', 'newspack-blocks/homepage-articles' ), {
						showExcerpt: displayPostContent,
						showDate: displayPostDate,
						postLayout,
						columns,
						postsToShow,
						showAuthor: false,
						categories: categories ? [ categories ] : [],
					} );
				},
			},
		],
		to: [
			{
				type: 'block',
				blocks: [ 'core/latest-posts' ],
				transform: ( { showExcerpt, showDate, postLayout, columns, postsToShow, categories } ) => {
					return createBlock( 'core/latest-posts', {
						displayPostContent: showExcerpt,
						displayPostDate: showDate,
						postLayout,
						columns,
						postsToShow,
						categories: categories[ 0 ] || '',
					} );
				},
			},
		],
	},
};
