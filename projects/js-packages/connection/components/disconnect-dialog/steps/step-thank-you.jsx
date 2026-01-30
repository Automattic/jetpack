import { DecorativeCard } from '@automattic/jetpack-components';
import { Button } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import PropTypes from 'prop-types';

/**
 * Show the "thank you" step following survey submission
 *
 * @param {object} props - The properties.
 * @return {import('react').Component} - The StepThankYou Component
 */
const StepThankYou = props => {
	const { onExit, assetBaseUrl } = props;
	const disconnectImage = assetBaseUrl ? `${ assetBaseUrl }/disconnect-thanks.jpg` : undefined;

	return (
		<div className="jp-connection__disconnect-dialog__content">
			<DecorativeCard format="vertical" imageUrl={ disconnectImage } />

			<div className="jp-connection__disconnect-dialog__copy">
				<h1>{ __( 'Thank you!', 'jetpack-connection-js' ) }</h1>
				<p className="jp-connection__disconnect-dialog__large-text">
					{ createInterpolateElement(
						__(
							'Your answer has been submitted. <br/>Thanks for your input on how we can improve Jetpack.',
							'jetpack-connection-js'
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
					{ __( 'Back to my website', 'jetpack-connection-js' ) }
				</Button>
			</div>
		</div>
	);
};

StepThankYou.propTypes = {
	/** Callback function to close the disconnect modal. */
	onExit: PropTypes.func,
	/** Base URL for where image assets are served from (no trailing slash). */
	assetBaseUrl: PropTypes.string,
};

export default StepThankYou;
