/**
 * Panel that requests a review of the Jetpack Social Plugin
 * Shows in the post publish panel of the editor
 */

import { Button, ThemeProvider } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import styles from './styles.module.scss';

const ReviewPrompt = props => {
	const { href, onClose } = props;

	return (
		<ThemeProvider>
			<div className={ styles.prompt }>
				<p>
					<strong className={ styles.header }>{ __( 'Presto!', 'jetpack' ) } 🎉</strong>
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
					<Button isExternalLink href={ href } className={ styles.button }>
						{ __( 'Leave a Review', 'jetpack' ) }
					</Button>
					<Button onClick={ onClose } variant="link" className={ styles.button }>
						{ __( 'Dismiss', 'jetpack' ) }
					</Button>
				</div>
			</div>
		</ThemeProvider>
	);
};

export default ReviewPrompt;
