/**
 * External Dependencies
 */
import React from 'react';

/**
 * Internal Dependencies
 */
import DecorativeCard from '../../decorative-card';
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import disconnectImage from '../images/disconnect-thanks.jpg';

/**
 * Show the "thank you" step following survey submission
 *
 * @param {Function} props.onExit - Callback function to close the disconnect modal.
 * @param {string} props.assetBaseUrl - Base URL for where webpack-ed images will be stored for the consumer of this component.
 * @returns {React.Component} - The StepThankYou Component
 */

const StepThankYou = props => {
	const { onExit, assetBaseUrl } = props;

	return (
		<div className="jp-disconnect-dialog__content">
			<DecorativeCard format="vertical" imageUrl={ assetBaseUrl + disconnectImage } />

			<div className="jp-disconnect-dialog__copy">
				<h1>{ __( 'Thank you!', 'jetpack' ) }</h1>
				<p className="jp-disconnect-dialog__large-text">
					{ createInterpolateElement(
						__(
							'Your answer has been recorded. <br/>Thanks for your input on how we can improve Jetpack.',
							'jetpack'
						),
						{
							br: <br />,
						}
					) }
				</p>
				<Button isPrimary onClick={ onExit } className="jp-disconnect-dialog__btn-back-to-wp">
					{ __( 'Back to my website', 'jetpack' ) }
				</Button>
			</div>
		</div>
	);
};

export default StepThankYou;
