/**
 * External dependencies
 */
import React from 'react';
import PropTypes from 'prop-types';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import Card from 'components/card';
import Button from 'components/button';
import Feature from './feature';

/**
 * Style dependencies
 */
import './style.scss';

// const features = [
// 	{
// 		title: 'Tiled Galleries',
// 		iconPath: '',
// 		iconAlt: '',
// 		description: '14 enabled',
// 	},
// 	{
// 		title: 'Jetpack CDN',
// 		iconPath: '',
// 		iconAlt: '',
// 		description: 'Fast loading images',
// 	},
// 	{
// 		title: 'Shortcodes',
// 		iconPath: '',
// 		iconAlt: '',
// 		description: '54 in-use',
// 	},
// 	{
// 		title: 'Jetpack Protect',
// 		iconPath: '',
// 		iconAlt: '',
// 		description: '140 Intrusions blocked',
// 	},
// 	{
// 		title: 'Widget Visibility',
// 		iconPath: '',
// 		iconAlt: '',
// 		description: 'Advanced widget control',
// 	},
// 	{
// 		title: 'Sitemaps',
// 		iconPath: '',
// 		iconAlt: '',
// 		description: 'SEO Feature',
// 	},
// ];

function getFeatureHighlightViewData( featureHighlightData ) {
	switch ( featureHighlightData.name ) {
		case 'akismet':
			return {
				title: 'Anti-spam',
				iconPath: '',
				iconAlt: '',
				description: `${ featureHighlightData.props.number } spam comments blocked.`,
			};
		// TODO:
		// 'vaultpress-backups'
		// 'vaultpress-backup-archive'
		// 'vaultpress-storage-space'
		// 'vaultpress-automated-restores'
		// 'simple-payments'
		// 'support'
		// 'wordads-jetpack'
		default:
			return null;
	}
}

const JetpackDisconnectDialog = props => {
	return (
		<Card>
			<h2>{ __( 'Log Out of Jetpack (and deactivate)?' ) }</h2>
			<p>
				{ __(
					'Before you log out of Jetpack we wanted to let you d know that there are a few features you are using that rely on the connection to the WordPress.com Cloud. Once the connection is broken these features will no longer be available.'
				) }
			</p>
			<div>
				{ props.featureHighlights
					.map( getFeatureHighlightViewData )
					.map( ( { title, description, iconPath, iconAlt } ) => (
						<Feature
							title={ title }
							description={ description }
							iconPath={ iconPath }
							iconAlt={ iconAlt }
						/>
					) ) }
			</div>
			<p>{ __( 'Are you sure you want to log out (and deactivate)?' ) }</p>
			<Button compact>{ __( "I'd like to stay logged in" ) }</Button>
			<Button compact scary>
				{ __( 'Log out of Jetpack' ) }
			</Button>
		</Card>
	);
};

JetpackDisconnectDialog.propTypes = {
	featureHighlights: PropTypes.array,
};

export default JetpackDisconnectDialog;
