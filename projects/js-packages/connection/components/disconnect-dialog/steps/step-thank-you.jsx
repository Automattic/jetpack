import { DecorativeCard } from '@automattic/jetpack-components';
import { Button } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import PropTypes from 'prop-types';
import React from 'react';
import disconnectImage from '../images/disconnect-thanks.jpg';

/**
 * Show the "thank you" step following survey submission
 *
 * @param {object} props - The properties.
 * @returns {React.Component} - The StepThankYou Component
 */
const StepThankYou = props => {
	const { onExit } = props;

	return (
		<div className="jp-connection__disconnect-dialog__content">
			<DecorativeCard format="vertical" imageUrl={ disconnectImage } />

			<div className="jp-connection__disconnect-dialog__copy">
				<h1>{ __( 'Thank you!', 'jetpack' ) }</h1>
				<p className="jp-connection__disconnect-dialog__large-text">
					{ createInterpolateElement(
						__(
							'Your answer has been submitted. <br/>Thanks for your input on how we can improve Jetpack.',
							'jetpack'
						),
						{
							br: <br />,
						}
					) }
				</p>
				<Button
					variant="primary"
					onClick={ onExit }
					className="jp-connection__disconnect-dialog__btn-back-to-wp"
				>
					{ __( 'Back to my website', 'jetpack' ) }
				</Button>
			</div>
		</div>
	);
};

StepThankYou.PropTypes = {
	/** Callback function to close the disconnect modal. */
	onExit: PropTypes.func,
	/** Base URL for where webpack-ed images will be stored for the consumer of this component. */
	assetBaseUrl: PropTypes.string,
};

export default StepThankYou;
