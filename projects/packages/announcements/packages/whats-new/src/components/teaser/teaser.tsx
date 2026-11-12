/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { closeSmall } from '@wordpress/icons';
import { Button, Card, IconButton, Stack, Text } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import styles from './teaser.module.css';
import type { Announcement } from '../../types';

export type TeaserProps = {
	/*
	 * The announcement to tease.
	 */
	announcement: Announcement;

	/*
	 * Called when the reader asks for the full announcement.
	 */
	onOpen: () => void;

	/*
	 * Called when the reader dismisses the teaser.
	 */
	onDismiss: () => void;
};

/**
 * The card that teases one announcement. A labelled region that never takes focus on its own.
 *
 * @param {TeaserProps} props - The props.
 * @return The teaser.
 */
export function Teaser( { announcement, onOpen, onDismiss }: TeaserProps ) {
	const label = __( 'What’s new', 'jetpack-announcements' );

	return (
		<Card.Root render={ <section aria-label={ label } /> } className={ styles.teaser }>
			<Card.Header>
				<Stack direction="row" align="center" justify="space-between" gap="sm">
					<Text variant="body-sm" className={ styles.label }>
						{ label }
					</Text>
					<IconButton
						icon={ closeSmall }
						label={ __( 'Dismiss', 'jetpack-announcements' ) }
						variant="minimal"
						tone="neutral"
						size="small"
						onClick={ onDismiss }
					/>
				</Stack>
			</Card.Header>
			<Card.Content>
				<Stack direction="column" align="flex-start" gap="sm">
					<Text variant="heading-sm" render={ <h2 /> }>
						{ announcement.title }
					</Text>
					{ announcement.excerpt && <Text render={ <p /> }>{ announcement.excerpt }</Text> }
					<Button variant="outline" tone="neutral" size="compact" onClick={ onOpen }>
						{ __( 'Read more', 'jetpack-announcements' ) }
					</Button>
				</Stack>
			</Card.Content>
		</Card.Root>
	);
}
