import { getRedirectUrl } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { HelpCard } from '../../help-card';
import { CodeIcon } from '../../icons/code';
import { CommentIcon } from '../../icons/comment';
import { ToolIcon } from '../../icons/tool';
import styles from './styles.module.scss';

/**
 * Renders the help cards for the Help section of My Jetpack.
 *
 * @return The rendered help cards component.
 */
export function HelpCards() {
	return (
		<div className={ styles.cards }>
			<HelpCard
				title={ __( 'Ask us a question', 'jetpack-my-jetpack' ) }
				link={ getRedirectUrl( 'jetpack-contact-support' ) }
				icon={ <CommentIcon /> }
				description={ __(
					'Have a question? Our AI Assistant can help, or connect you to our support team.',
					'jetpack-my-jetpack'
				) }
			/>
			<HelpCard
				title={ __( 'Troubleshooting', 'jetpack-my-jetpack' ) }
				link={ getRedirectUrl( 'jetpack-support' ) }
				icon={ <ToolIcon /> }
				description={ __(
					'Having trouble with Jetpack? Check out recommended steps to fix common problems.',
					'jetpack-my-jetpack'
				) }
			/>
			<HelpCard
				title={ __( 'Jetpack for developers', 'jetpack-my-jetpack' ) }
				link={ getRedirectUrl( 'jetpack-for-developers' ) }
				icon={ <CodeIcon /> }
				description={ __(
					'Want to test Jetpack features locally or add Featured Content and Social Links to your theme? Start here.',
					'jetpack-my-jetpack'
				) }
			/>
		</div>
	);
}
