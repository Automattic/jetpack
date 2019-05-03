/**
 * External dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { ExternalLink, Path, SVG } from '@wordpress/components';
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './editor.scss';
import edit from './edit';
import save from './save';

export const name = 'markdown';

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
			<ExternalLink href="https://en.support.wordpress.com/markdown-quick-reference/">
				{ __( 'Support reference', 'jetpack' ) }
			</ExternalLink>
		</Fragment>
	),

	icon: (
		<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
			<Path fill="none" d="M0 0h24v24H0V0z" />
			<Path d="M21 12h-2.25V8.25H16.5V12h-2.25l3.375 3.75L21 12zM6 15.75v-4.5l2.25 3 2.25-3v4.5h2.25v-7.5H10.5l-2.25 3-2.25-3H3.75v7.5H6zm16.5 3.75h-21C.547 19.5 0 18.954 0 18V6c0-.954.547-1.5 1.5-1.5h21c.954 0 1.5.546 1.5 1.5v12c0 .954-.546 1.5-1.5 1.5z" />
		</SVG>
	),

	category: 'jetpack',

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
};
