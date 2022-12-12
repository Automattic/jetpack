/**
 * Panel that requests a review of the Jetpack Social Plugin
 * Shows in the post publish panel of the editor
 */

import { Button, ThemeProvider } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import useSocialMediaConnections from '../../hooks/use-social-media-connections';
import styles from './styles.module.scss';

// TODO: check to see if the panel should show based on whether the post was shared on social
// TODO: allow for dismissal

const ReviewPrompt = () => {
	// Checks the connections enabled for the post
	const { hasConnections } = useSocialMediaConnections();

	if ( hasConnections ) {
		return (
			<ThemeProvider>
				<div className={ styles.prompt }>
					<p>
						<strong className={ styles.header }>{ __( 'Presto!', 'jetpack' ) }🎉</strong>
					</p>
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
						<Button isExternalLink className={ styles.button }>
							Leave a Review
						</Button>
						<Button variant="link" className={ styles.button }>
							Maybe Later
						</Button>
					</div>
				</div>
			</ThemeProvider>
		);
	}

	return null;
};

export default ReviewPrompt;
