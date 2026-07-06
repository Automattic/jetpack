import { __ } from '@wordpress/i18n';
import { Button, Card } from '@wordpress/ui';
import ChapterOutline from '../../../client/components/chapter-outline';
import type { ReactElement } from 'react';

type Props = {
	description: string;
	onManageChapters: () => void;
};

/**
 * Card surfacing the video's chapters: a read-only list parsed from the
 * description, and the entry point to the chapter manager modal.
 *
 * @param props                  - Component props.
 * @param props.description      - The current (possibly unsaved) description.
 * @param props.onManageChapters - Opens the chapter manager modal.
 * @return The card element.
 */
export default function ChaptersCard( { description, onManageChapters }: Props ): ReactElement {
	return (
		<Card.Root>
			<Card.Header>
				<Card.Title>{ __( 'Chapters', 'jetpack-videopress-pkg' ) }</Card.Title>
			</Card.Header>
			<Card.Content>
				<ChapterOutline description={ description } />
				<Button variant="outline" onClick={ onManageChapters }>
					{ __( 'Manage chapters', 'jetpack-videopress-pkg' ) }
				</Button>
			</Card.Content>
		</Card.Root>
	);
}
