/**
 * External dependencies
 */
import { Fragment } from 'react';
import { __ } from '@wordpress/i18n';

import { FacebookPreview, TwitterPreview, SearchPreview } from '@automattic/social-previews';
import { SocialServiceIcon } from '../../shared/icons';

export const AVAILABLE_SERVICES = [
	{
		title: (
			<Fragment>
				<SocialServiceIcon serviceName="google" />
				{ __( 'Google Search', 'jetpack' ) }
			</Fragment>
		),
		icon: 'google',
		name: 'google',
		preview: SearchPreview,
	},
	{
		title: (
			<Fragment>
				<SocialServiceIcon serviceName="facebook" />
				{ __( 'Facebook', 'jetpack' ) }
			</Fragment>
		),
		icon: 'facebook',
		name: 'facebook',
		preview: props => <FacebookPreview type="article" { ...props } />,
	},
	{
		title: (
			<Fragment>
				<SocialServiceIcon serviceName="twitter" />
				{ __( 'Twitter', 'jetpack' ) }
			</Fragment>
		),
		icon: 'twitter',
		name: 'twitter',
		preview: props => (
			<TwitterPreview type={ props.image ? 'large_image_summary' : 'summary' } { ...props } />
		),
	},
];
