/**
 * External Dependencies
 */
import React from 'react';

/**
 * Internal Dependencies
 */
import { JetpackLogo } from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';

const StepDisconnectConfirm = props => {
	const { onExit, onProvideFeedback } = props;

	return (
		<div>
			<JetpackLogo />

			<h1>
				{ createInterpolateElement(
					__( 'Jetpack has been <br/>successfully disconnected.', 'jetpack' ),
					{
						br: <br />,
					}
				) }
			</h1>

			<Button isPrimary onClick={ onExit } className="jp-disconnect-dialog__btn-back-to-wp">
				{ __( 'Back to WordPress', 'jetpack' ) }
			</Button>
			<a href="#" onClick={ onProvideFeedback }>
				Provide some feedback.
			</a>
		</div>
	);
};

export default StepDisconnectConfirm;
