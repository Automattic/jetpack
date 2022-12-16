/**
 * Panel that requests a review of the Jetpack Social Plugin
 * Shows in the post publish panel of the editor
 */

import { Button, ThemeProvider } from '@automattic/jetpack-components';
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { __, sprintf } from '@wordpress/i18n';
import { useCallback } from 'react';
import styles from './styles.module.scss';

const ReviewPrompt = ( { href, onClose } ) => {
	const { recordEvent } = useAnalytics( {
		pageViewEventName: 'social_plugin_review_prompt',
		pageViewNamespace: 'jetpack',
		pageViewSuffix: 'view',
	} );

	const recordReviewClick = useCallback( () => {
		recordEvent( 'jetpack_social_plugin_review_prompt_new_review_click' );
	}, [ recordEvent ] );

	const handleDismiss = useCallback( () => {
		recordEvent( 'jetpack_social_plugin_review_prompt_dismiss_click' );
		onClose();
	}, [ recordEvent, onClose ] );

	return (
		<ThemeProvider>
			<div className={ styles.prompt }>
				<h2 className={ styles.header }>
					{
						/* translators: %s is the celebration emoji */
						sprintf( __( 'Presto! %s', 'jetpack' ), String.fromCodePoint( 0x1f389 ) )
					}
				</h2>
				<p>
					{ __(
						'Just like that, Jetpack Social has shared your post to your connected social accounts.',
						'jetpack'
					) }
				</p>
				<p>
					{ __(
						'Please leave a review to let others know how easy getting your posts on social media can be!',
						'jetpack'
					) }
				</p>
				<div className={ styles.buttons }>
					<Button
						onClick={ recordReviewClick }
						isExternalLink
						href={ href }
						className={ styles.button }
					>
						{ __( 'Leave a Review', 'jetpack' ) }
					</Button>
					<Button onClick={ handleDismiss } variant="link" className={ styles.button }>
						{ __( 'Dismiss', 'jetpack' ) }
					</Button>
				</div>
			</div>
		</ThemeProvider>
	);
};

export default ReviewPrompt;
