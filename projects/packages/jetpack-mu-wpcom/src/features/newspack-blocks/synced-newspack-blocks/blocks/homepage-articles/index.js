/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';
import { Path, SVG } from '@wordpress/components';
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

export const title = __( 'Homepage Posts', 'jetpack-mu-wpcom' );

export const icon = (
	<SVG xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
		<Path d="M6.5 14.25H11v-1.5H6.5zM14.5 11.25h-8v-1.5h8zM6.5 8.25h8v-1.5h-8z" />
		<Path
			clipRule="evenodd"
			d="M4.625 3C3.728 3 3 3.728 3 4.625v11.75C3 17.272 3.728 18 4.625 18h11.75c.897 0 1.625-.728 1.625-1.625V4.625C18 3.728 17.272 3 16.375 3zm11.75 1.5H4.625a.125.125 0 00-.125.125v11.75c0 .069.056.125.125.125h11.75a.125.125 0 00.125-.125V4.625a.125.125 0 00-.125-.125z"
			fillRule="evenodd"
		/>
		<Path d="M20.25 8v11c0 .69-.56 1.25-1.249 1.25H6v1.5h13.001A2.749 2.749 0 0021.75 19V8z" />
	</SVG>
);

export const settings = {
	title,
	icon: {
		src: icon,
		foreground: '#36f',
	},
	attributes,
	category,
	keywords: [
		__( 'posts', 'jetpack-mu-wpcom' ),
		__( 'articles', 'jetpack-mu-wpcom' ),
		__( 'latest', 'jetpack-mu-wpcom' ),
	],
	description: __( 'A block for displaying homepage posts.', 'jetpack-mu-wpcom' ),
	styles: [
		{ name: 'default', label: _x( 'Default', 'block style', 'jetpack-mu-wpcom' ), isDefault: true },
		{ name: 'borders', label: _x( 'Borders', 'block style', 'jetpack-mu-wpcom' ) },
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
				transform: ( {
					displayPostContent,
					displayPostDate,
					postLayout,
					columns,
					postsToShow,
					categories,
				} ) => {
					return createBlock(
						applyFilters( 'blocks.transforms_from_name', 'newspack-blocks/homepage-articles' ),
						{
							showExcerpt: displayPostContent,
							showDate: displayPostDate,
							postLayout,
							columns,
							postsToShow,
							showAuthor: false,
							categories: categories ? [ categories ] : [],
						}
					);
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
