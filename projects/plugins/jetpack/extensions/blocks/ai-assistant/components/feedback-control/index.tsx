/**
 * External dependencies
 */
import { getRedirectUrl } from '@automattic/jetpack-components';
import { BaseControl, ExternalLink } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import './style.scss';

function FeedbackControl() {
	const feedbackURL = getRedirectUrl( 'jetpack-ai-feedback' );

	return (
		<div className="jetpack-ai-feedback-control">
			<BaseControl label={ __( 'Feedback', 'jetpack' ) }>
				<p>
					{ __(
						'Your feedback is valuable in our commitment to refine and improve this feature.',
						'jetpack'
					) }
				</p>
				<ExternalLink href={ feedbackURL }>{ __( 'Share your feedback', 'jetpack' ) }</ExternalLink>
			</BaseControl>
		</div>
	);
}

export default FeedbackControl;
