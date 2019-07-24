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
import SingleFeature from './single-feature';

/**
 * Style dependencies
 */
import './style.scss';

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

const JetpackDisconnectDialogFeatures = ( { featureHighlights, children } ) => {
	return (
		<Card>
			<h2>{ __( 'Log Out of Jetpack (and deactivate)?' ) }</h2>
			<p>
				{ __(
					'Before you log out of Jetpack we wanted to let you d know that there are a few features you are using that rely on the connection to the WordPress.com Cloud. Once the connection is broken these features will no longer be available.'
				) }
			</p>
			<div>
				{ featureHighlights
					.map( getFeatureHighlightViewData )
					.map( ( { title, description, iconPath, iconAlt } ) => (
						<SingleFeature
							title={ title }
							description={ description }
							iconPath={ iconPath }
							iconAlt={ iconAlt }
						/>
					) ) }
			</div>
			<p>{ __( 'Are you sure you want to log out (and deactivate)?' ) }</p>
			{ children }
		</Card>
	);
};

JetpackDisconnectDialogFeatures.propTypes = {
	featureHighlights: PropTypes.array,
};

export default JetpackDisconnectDialogFeatures;
