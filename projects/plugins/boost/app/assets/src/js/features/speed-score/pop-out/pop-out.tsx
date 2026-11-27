import styles from './pop-out.module.scss';
import { __ } from '@wordpress/i18n';
import { close } from '@wordpress/icons';
import { Button as UIButton, Card, IconButton, ButtonLink, Stack, Text } from '@wordpress/ui';
import { ReactNode } from 'react';
import { getRedirectUrl } from '@automattic/jetpack-components';

/**
 * Messages which can be shown to the user based on direction of score change.
 */
type ScoreChangeMessage = {
	id: 'score_increase' | 'score_decrease';
	title: string;
	body: string | ReactNode;
	cta: string;
	ctaLink: string;
};

export const fasterMessage: ScoreChangeMessage = {
	id: 'score_increase',
	title: __( 'Your site got faster', 'jetpack-boost' ),
	body: <p>{ __( `That's great! If you’re happy, why not rate Boost?`, 'jetpack-boost' ) }</p>,
	cta: __( 'Rate the Plugin', 'jetpack-boost' ),
	ctaLink: getRedirectUrl( 'boost-rate-plugin' ),
};

export const slowerMessage: ScoreChangeMessage = {
	id: 'score_decrease',
	title: __( 'Speed score has fallen', 'jetpack-boost' ),
	body: (
		<>
			<p>
				{ __(
					'Most of the time Jetpack Boost will increase your site speed, but there may be cases where your score does not increase.',
					'jetpack-boost'
				) }
			</p>
			<p>
				{ __(
					'Try refreshing your score, and if it doesn’t help, check our guide on improving your site speed score:',
					'jetpack-boost'
				) }
			</p>
		</>
	),
	cta: __( 'Read the guide', 'jetpack-boost' ),
	ctaLink: getRedirectUrl( 'boost-improve-site-speed-score' ),
};

type PopOutProps = {
	message: ScoreChangeMessage;
	onClose: () => void;
	onDismiss: () => void;
	isVisible: boolean;
};

/**
 * The pop out built from core UI components, for the modern Overview.
 *
 * @param {PopOutProps} props
 * @return {ReactNode} Modern PopOut component.
 */
export const ModernPopOut = ( { message, onClose, onDismiss, isVisible }: PopOutProps ) => (
	<div className={ styles[ 'modern-wrapper' ] } hidden={ ! isVisible }>
		<Card.Root className={ styles[ 'modern-card' ] }>
			<Card.Content>
				<Stack direction="column" gap="md">
					<Stack direction="row" align="center" justify="space-between" gap="sm">
						<Text variant="heading-md" render={ <h3 /> }>
							{ message.title }
						</Text>
						<IconButton
							icon={ close }
							label={ __( 'Dismiss', 'jetpack-boost' ) }
							variant="minimal"
							tone="neutral"
							size="small"
							onClick={ onClose }
						/>
					</Stack>
					<Text variant="body-md" render={ <div /> } className={ styles[ 'modern-body' ] }>
						{ message.body }
					</Text>
					<Stack direction="row" wrap="wrap" gap="sm">
						<ButtonLink size="compact" href={ message.ctaLink } openInNewTab onClick={ onDismiss }>
							{ message.cta }
						</ButtonLink>
						<UIButton variant="minimal" size="compact" onClick={ onDismiss }>
							{ __( 'Do not show me again', 'jetpack-boost' ) }
						</UIButton>
					</Stack>
				</Stack>
			</Card.Content>
		</Card.Root>
	</div>
);
