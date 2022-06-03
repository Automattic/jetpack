import { Path, Rect, SVG } from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';
import { getIconColor } from '../../shared/block-icons';
import getCategoryWithFallbacks from '../../shared/get-category-with-fallbacks';
import edit from './edit';
import save from './save';
import slideshowExample1 from './slideshow_example-1.jpg';
import slideshowExample2 from './slideshow_example-2.jpg';
import slideshowExample3 from './slideshow_example-3.jpg';
import transforms from './transforms';

export const icon = (
	<SVG xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
		<Path
			d="M21 8V19C21 20.1046 20.1057 21 19.0011 21C15.8975 21 9.87435 21 6 21"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.5"
		/>
		<Rect
			x="3.75"
			y="3.75"
			width="13.5"
			height="13.5"
			rx="0.875"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.5"
		/>
		<Path d="M9 14L12 11L9 8" fill="none" stroke="currentColor" strokeWidth="1.5" />
	</SVG>
);

const attributes = {
	align: {
		default: 'center',
		type: 'string',
	},
	autoplay: {
		type: 'boolean',
		default: false,
	},
	delay: {
		type: 'number',
		default: 3,
	},
	ids: {
		default: [],
		type: 'array',
	},
	images: {
		type: 'array',
		default: [],
		source: 'query',
		selector: '.swiper-slide',
		query: {
			alt: {
				source: 'attribute',
				selector: 'img',
				attribute: 'alt',
				default: '',
			},
			caption: {
				type: 'string',
				source: 'html',
				selector: 'figcaption',
			},
			id: {
				source: 'attribute',
				selector: 'img',
				attribute: 'data-id',
			},
			url: {
				source: 'attribute',
				selector: 'img',
				attribute: 'src',
			},
		},
	},
	effect: {
		type: 'string',
		default: 'slide',
	},
	sizeSlug: {
		type: 'string',
	},
};

const exampleAttributes = {
	align: 'center',
	autoplay: true,
	ids: [ 22, 23 ],
	images: [
		{
			alt: '',
			caption: '',
			id: 22,
			url: slideshowExample1,
		},
		{
			alt: '',
			caption: '',
			id: 23,
			url: slideshowExample2,
		},
		{
			alt: '',
			caption: '',
			id: 23,
			url: slideshowExample3,
		},
	],
	effect: 'slide',
};

export const name = 'slideshow';

export const settings = {
	title: __( 'Slideshow', 'jetpack' ),
	category: getCategoryWithFallbacks( 'media', 'layout' ),
	keywords: [
		_x( 'image', 'block search term', 'jetpack' ),
		_x( 'gallery', 'block search term', 'jetpack' ),
		_x( 'slider', 'block search term', 'jetpack' ),
	],
	description: __( 'Add an interactive slideshow.', 'jetpack' ),
	attributes,
	supports: {
		align: [ 'center', 'wide', 'full' ],
		html: false,
	},
	icon: {
		src: icon,
		foreground: getIconColor(),
	},
	edit,
	save,
	transforms,
	example: {
		attributes: exampleAttributes,
	},
};
