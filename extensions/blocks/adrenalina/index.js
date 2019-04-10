/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { ExternalLink, Path } from '@wordpress/components';
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import renderMaterialIcon from '../../utils/render-material-icon';

/**
 * Style dependencies
 */
import './editor.scss';

export const name     = 'adrenalina';
export const title    = __( 'Adrenalina', 'jetpack' );
export const settings = {
	title,

	description: (
		<Fragment>
			<p>{ __( 'Adrenalina', 'jetpack' ) }</p>
			<ExternalLink href="#">{ __( 'Learn more about Adrenalina', 'jetpack' ) }</ExternalLink>
		</Fragment>
	),

	/* @TODO add icon */
	icon: renderMaterialIcon(
		<Path d="M9 15h2V9H9v6zm1-10c-.5 0-1 .5-1 1s.5 1 1 1 1-.5 1-1-.5-1-1-1zm0-4c-5 0-9 4-9 9s4 9 9 9 9-4 9-9-4-9-9-9zm0 16c-3.9 0-7-3.1-7-7s3.1-7 7-7 7 3.1 7 7-3.1 7-7 7z" />
	),

	category: 'jetpack',

	/* @TODO add keywords */
	keywords: [  ],

	supports: {
		html: false,
	},

	/* @TODO edit */
	
	edit: () => <div>Hi! The edit view for this block goes here.</div>,

	/* @TODO save */
	save: () => null,
};
