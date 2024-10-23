/**
 * External dependencies
 */
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
/**
 * Types
 */
import type React from 'react';

export const FeatureFetchFailureScreen: React.FC< {
	onCancel: () => void;
	onRetry?: () => void;
} > = ( { onCancel, onRetry } ) => {
	const errorMessage = __(
		'We are sorry. There was an error loading your Jetpack AI plan data. Please, try again.',
		'jetpack-ai-client'
	);

	const errorMessageWithoutRetry = __(
		'We are sorry. There was an error loading your Jetpack AI plan data. Please, reload the page and try again.',
		'jetpack-ai-client'
	);

	return (
		<div className="jetpack-ai-logo-generator-modal__notice-message-wrapper">
			<div className="jetpack-ai-logo-generator-modal__notice-message">
				<span className="jetpack-ai-logo-generator-modal__loading-message">
					{ onRetry ? errorMessage : errorMessageWithoutRetry }
				</span>
			</div>
			<div className="jetpack-ai-logo-generator-modal__notice-actions">
				<Button variant="tertiary" onClick={ onCancel }>
					{ __( 'Cancel', 'jetpack-ai-client' ) }
				</Button>
				{ onRetry && (
					<Button variant="primary" onClick={ onRetry }>
						{ __( 'Try again', 'jetpack-ai-client' ) }
					</Button>
				) }
			</div>
		</div>
	);
};
