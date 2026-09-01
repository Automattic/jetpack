import { getRedirectUrl } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { useCallback } from 'react';
import { HelpCard } from '../../help-card';
import { CodeIcon } from '../../icons/code';
import { CommentIcon } from '../../icons/comment';
import { ToolIcon } from '../../icons/tool';
import styles from './styles.module.scss';
import { useHelpTracking } from './use-help-tracking';

/**
 * Renders the help cards for the Help section of My Jetpack.
 *
 * @return The rendered help cards component.
 */
export function HelpCards() {
	const { trackHelpRequest } = useHelpTracking();

	const handleAskQuestionClick = useCallback( () => {
		trackHelpRequest( 'contact_support', 'clicked_ask_us_a_question_card' );
	}, [ trackHelpRequest ] );

	const handleTroubleshootingClick = useCallback( () => {
		trackHelpRequest( 'documentation', 'clicked_troubleshooting_card' );
	}, [ trackHelpRequest ] );

	const handleDeveloperClick = useCallback( () => {
		trackHelpRequest( 'documentation', 'clicked_developer_resources_card' );
	}, [ trackHelpRequest ] );

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
				onClick={ handleAskQuestionClick }
			/>
			<HelpCard
				title={ __( 'Troubleshooting', 'jetpack-my-jetpack' ) }
				link={ getRedirectUrl( 'jetpack-support' ) }
				icon={ <ToolIcon /> }
				description={ __(
					'Having trouble with Jetpack? Check out recommended steps to fix common problems.',
					'jetpack-my-jetpack'
				) }
				onClick={ handleTroubleshootingClick }
			/>
			<HelpCard
				title={ __( 'Jetpack for developers', 'jetpack-my-jetpack' ) }
				link={ getRedirectUrl( 'jetpack-for-developers' ) }
				icon={ <CodeIcon /> }
				description={ __(
					'Want to test Jetpack features locally or add Featured Content and Social Links to your theme? Start here.',
					'jetpack-my-jetpack'
				) }
				onClick={ handleDeveloperClick }
			/>
		</div>
	);
}
