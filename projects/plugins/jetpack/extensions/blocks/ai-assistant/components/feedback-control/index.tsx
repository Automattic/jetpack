/**
 * External dependencies
 */
import { getRedirectUrl } from '@automattic/jetpack-components';
import { BaseControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Link } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import './style.scss';

function FeedbackControl() {
	const feedbackURL = getRedirectUrl( 'jetpack-ai-feedback' );

	return (
		<div className="jetpack-ai-feedback-control">
			<BaseControl>
				<BaseControl.VisualLabel>{ __( 'Feedback', 'jetpack' ) }</BaseControl.VisualLabel>
				<p>
					{ __(
						'Your feedback is valuable in our commitment to refine and improve this feature.',
						'jetpack'
					) }
				</p>
				<Link openInNewTab href={ feedbackURL }>
					{ __( 'Share your feedback', 'jetpack' ) }
				</Link>
			</BaseControl>
		</div>
	);
}

export default FeedbackControl;
