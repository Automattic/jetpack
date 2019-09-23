/**
 * External dependencies
 */
import Button from 'components/button';
import Card from 'components/card';
import Gridicon from 'components/gridicon';
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

const JetpackDisconnectDialogFeatures = ( {
	siteBenefits,
	onCloseButtonClick,
	onContinueButtonClick,
	siteName,
	showModalClose,
} ) => {
	// TODO: remove test data before merging
	siteBenefits = siteBenefits.concat( [
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
			gridIcon: 'user',
		},
	] );

	console.log( `hello 2` );

	return (
		<div className="jetpack-termination-dialog__features">
			<Card>
				<div className="jetpack-termination-dialog__header">
					<h1>{ __( 'Disable Jetpack' ) }</h1>
					{ showModalClose && (
						<Gridicon
							icon="cross"
							className="jetpack-termination-dialog__close-icon"
							onClick={ onCloseButtonClick }
						/>
					) }
				</div>
			</Card>
			<Card>
				<p className="jetpack-termination-dialog__info">
					{ __(
						'Jetpack is currently powering several features of %(siteName)s. Once you disable Jetpack, these features will no longer be available and your site may no longer function the same way. We’ve highlighted some of the features you rely on below.',
						{
							args: {
								siteName,
							},
						}
					) }
				</p>
				<div className="jetpack-termination-dialog__features-list">
					{ siteBenefits.map( ( { title, description, amount, gridIcon } ) => (
						<SingleFeature
							amount={ amount }
							description={ description }
							gridIcon={ gridIcon }
							title={ title }
						/>
					) ) }
				</div>

				<div className="jetpack-termination-dialog__get-help">
					<p>
						{ __( 'Have a question? We’d love to help!' ) }{' '}
						<a href="https://jetpack.com/contact-support/">
							{ __( 'Chat now with the Jetpack support team.' ) }
						</a>
					</p>
				</div>
			</Card>
			<Card>
				<div className="jetpack-termination-dialog__button-row">
					<p>{ __( 'Are you sure you want to log out (and deactivate)?' ) }</p>
					<div>
						<Button onClick={ onCloseButtonClick }>{ __( 'Close' ) }</Button>
						<Button primary onClick={ onContinueButtonClick }>
							{ __( 'Continue' ) }
						</Button>
					</div>
				</div>
			</Card>
		</div>
	);
};

JetpackDisconnectDialogFeatures.propTypes = {
	featureHighlights: PropTypes.array,
	siteName: PropTypes.string,
};

export default JetpackDisconnectDialogFeatures;
