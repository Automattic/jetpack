/**
 * Panel that requests a review of the Jetpack Social Plugin
 * Shows in the post publish panel of the editor
 */

import { ThemeProvider } from '@automattic/jetpack-components';
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { Notice } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { useCallback } from 'react';

const ReviewPrompt = ( { href, onClose } ) => {
	const { recordEvent } = useAnalytics( {
		pageViewEventName: 'social_plugin_review_prompt',
		pageViewNamespace: 'jetpack',
		pageViewSuffix: 'view',
	} );

	const handleDismiss = useCallback( () => {
		recordEvent( 'jetpack_social_plugin_review_prompt_dismiss_click' );
		onClose();
	}, [ recordEvent, onClose ] );

	return (
		<ThemeProvider>
			<Notice
				isDismissible={ false }
				status="info"
				actions={ [
					{
						variant: 'primary',
						label: __( 'Leave a Review', 'jetpack-publicize-components' ),
						url: href,
						className: 'is-compact',
					},
					{
						variant: 'secondary',
						label: __( 'Dismiss', 'jetpack-publicize-components' ),
						noDefaultClasses: true,
						className: 'is-compact',
						onClick: handleDismiss,
					},
				] }
			>
				{ sprintf(
					/* translators: %s is the celebration emoji */
					__( 'Presto! %s', 'jetpack-publicize-components' ),
					String.fromCodePoint( 0x1f389 )
				) }
				<p>
					{ __(
						'Just like that, Jetpack Social has shared your post to your connected social accounts.',
						'jetpack-publicize-components'
					) }
				</p>
				<p>
					{ __(
						'Please leave a review to let others know how easy getting your posts on social media can be!',
						'jetpack-publicize-components'
					) }
				</p>
			</Notice>
		</ThemeProvider>
	);
};

export default ReviewPrompt;
