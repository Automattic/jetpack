/**
 * External dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { ExternalLink, Path, Rect, SVG } from '@wordpress/components';
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './editor.scss';
import { isAtomicSite, isSimpleSite } from '../../shared/site-type-utils';
import edit from './edit';
import save from './save';
import { supportsCollections } from '../../shared/block-category';

export const name = 'markdown';

const exampleTitle = __( 'Try Markdown', 'jetpack' );
const exampleDescription = __(
	'Markdown is a text formatting syntax that is converted into HTML. You can _emphasize_ text or **make it strong** with just a few characters.',
	'jetpack'
);

const supportLink =
	isSimpleSite() || isAtomicSite()
		? 'https://en.support.wordpress.com/markdown-quick-reference/'
		: 'https://jetpack.com/support/jetpack-blocks/markdown-block/';

export const settings = {
	title: __( 'Markdown', 'jetpack' ),

	description: (
		<Fragment>
			<p>
				{ __(
					'Use regular characters and punctuation to style text, links, and lists.',
					'jetpack'
				) }
			</p>
			<ExternalLink href={ supportLink }>{ __( 'Support reference', 'jetpack' ) }</ExternalLink>
		</Fragment>
	),

	icon: (
		<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 208 128">
			<Rect
				width="198"
				height="118"
				x="5"
				y="5"
				ry="10"
				stroke="currentColor"
				strokeWidth="10"
				fill="none"
			/>
			<Path d="M30 98v-68h20l20 25 20-25h20v68h-20v-39l-20 25-20-25v39zM155 98l-30-33h20v-35h20v35h20z" />
		</SVG>
	),

	category: supportsCollections() ? 'formatting' : 'jetpack',

	keywords: [
		_x( 'formatting', 'block search term', 'jetpack' ),
		_x( 'syntax', 'block search term', 'jetpack' ),
		_x( 'markup', 'block search term', 'jetpack' ),
	],

	attributes: {
		//The Markdown source is saved in the block content comments delimiter
		source: { type: 'string' },
	},

	supports: {
		html: false,
	},

	edit,

	save,

	example: {
		attributes: {
			source: `## ## ${ exampleTitle }\n\n${ exampleDescription }`,
		},
	},
};
