/**
 * External dependencies
 */
import Card from 'components/card';
import React from 'react';
import PropTypes from 'prop-types';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */

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
				amount: featureHighlightData.props.number || 0,
				description: 'Spam comments blocked.',
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
		<div className="jetpack-disconnect-dialog">
			<Card>
				<h1 className="jetpack-disconnect-dialog__header">{ __( 'Disable Jetpack' ) }</h1>
			</Card>
			<Card>
				<p>
					{ __(
						'Before you log out of Jetpack we wanted to let you d know that there are a few features you are using that rely on the connection to the WordPress.com Cloud. Once the connection is broken these features will no longer be available.'
					) }
				</p>
				<div>
					{ featureHighlights
						.map( getFeatureHighlightViewData )
						.map( ( { amount, title, description } ) => (
							<SingleFeature title={ title } description={ description } amount={ amount } />
						) ) }
				</div>
				<p>{ __( 'Are you sure you want to log out (and deactivate)?' ) }</p>
				{ children }
			</Card>
		</div>
	);
};

JetpackDisconnectDialogFeatures.propTypes = {
	featureHighlights: PropTypes.array,
};

export default JetpackDisconnectDialogFeatures;
