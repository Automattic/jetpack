/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	FacebookPreview,
	TwitterPreview,
	TwitterThreadPreview,
	SearchPreview,
} from '@automattic/social-previews';

export const AVAILABLE_SERVICES = [
	{
		title: __( 'Google Search', 'jetpack' ),
		icon: 'google',
		name: 'google',
		preview: SearchPreview,
	},
	{
		title: __( 'Facebook', 'jetpack' ),
		icon: 'facebook',
		name: 'facebook',
		preview: props => <FacebookPreview type="article" { ...props } />,
	},
	{
		title: __( 'Twitter', 'jetpack' ),
		icon: 'twitter',
		name: 'twitter',
		preview: props =>
			props.isTweetStorm ? (
				<TwitterThreadPreview { ...props } />
			) : (
				<TwitterPreview type={ props.image ? 'large_image_summary' : 'summary' } { ...props } />
			),
	},
];
