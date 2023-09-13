import { InnerBlocks } from '@wordpress/block-editor';
import { registerBlockType } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import { getIconColor } from '../../../shared/block-icons';
import edit from './edit';

registerBlockType( 'jetpack/blogroll-name', {
	title: __( 'Blogroll Name', 'jetpack' ),
	icon: {
		src: 'text',
		foreground: getIconColor(),
	},
	parent: [ 'blogroll-item' ],
	supports: {
		color: {
			background: true,
			link: true,
			text: true,
		},
		typography: {
			fontSize: true,
			lineHeight: true,
		},
		inserter: false,
	},
	usesContext: [ 'openLinksNewWindow', 'name', 'url' ],
	edit,
	save: () => <InnerBlocks.Content />,
} );
