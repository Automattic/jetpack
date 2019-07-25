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

// function getFeatureHighlightViewData( featureHighlightData ) {
// 	switch ( featureHighlightData.name ) {
// 		case 'akismet':
// 			return {
// 				title: 'Anti-spam',
// 				amount: featureHighlightData.props.number || 0,
// 				description: 'Spam comments blocked.',
// 			};
// 		// TODO:
// 		// 'vaultpress-backups'
// 		// 'vaultpress-backup-archive'
// 		// 'vaultpress-storage-space'
// 		// 'vaultpress-automated-restores'
// 		// 'simple-payments'
// 		// 'support'
// 		// 'wordads-jetpack'
// 		default:
// 			return null;
// 	}
// }

const JetpackDisconnectDialogFeatures = ( { /*featureHighlights,*/ children, siteName } ) => {
	const featurePlaceholders = [
		{
			title: 'Brute Force Protection',
			description: 'The number of malicious login attempts blocked by Jetpack.',
			amount: 32030,
			gridIcon: 'lock',
		},
		{
			title: 'Contact Forms',
			description: 'The number of live Jetpack forms on your site right now.',
			amount: 31,
			gridIcon: 'align-image-center',
		},
		{
			title: 'Publicize',
			description: 'The number of live social media connections, powered by Jetpack.',
			amount: 3,
			gridIcon: 'share',
		},
		{
			title: 'Subscribers',
			description: 'The number of people subscribed to your updates through Jetpack.',
			amount: 4200,
			gridIcon: 'multiple-users',
		},
	];

	return (
		<div className="jetpack-disconnect-dialog">
			<Card>
				<h1 className="jetpack-disconnect-dialog__header">{ __( 'Disable Jetpack' ) }</h1>
			</Card>
			<Card>
				<p className="jetpack-disconnect-dialog__info">
					{ __(
						'Jetpack is currently powering several features of %(siteName)s. Once you disable Jetpack, these features will no longer be available and your site may no longer function the same way. We’ve highlighted some of the features you rely on below.',
						{
							args: {
								siteName,
							},
						}
					) }
				</p>
				<div className="jetpack-disconnect-dialog__features-grid">
					{ /* { featureHighlights
						.map( getFeatureHighlightViewData )
						.map( ( { amount, title, description } ) => (
							<SingleFeature title={ title } description={ description } amount={ amount } />
						) ) } */ }
					{ featurePlaceholders.map( ( { title, description, amount, gridIcon } ) => (
						<SingleFeature
							title={ title }
							description={ description }
							amount={ amount }
							gridIcon={ gridIcon }
						/>
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
	siteName: PropTypes.string,
};

export default JetpackDisconnectDialogFeatures;
