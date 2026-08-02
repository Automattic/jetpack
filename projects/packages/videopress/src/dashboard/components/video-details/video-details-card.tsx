import { TextareaControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Card, InputControl, Stack } from '@wordpress/ui';
import ChaptersSummary from './chapters-summary';
import type { LibraryItem } from '../../types/library';
import type { ReactElement } from 'react';

type Props = {
	video: Pick< LibraryItem, 'id' >;
	title: string;
	description: string;
	onChange: ( partial: { title?: string; description?: string } ) => void;
	onOpenChapters: () => void;
	confirmNavigation?: () => boolean;
};

/**
 * Form card for the editable text fields: title and description, plus the
 * compact chapters summary (count derived from the description, a deep link
 * into the Editor tab, and the Chapters help modal link — see
 * chapters-summary.tsx).
 *
 * @param props                   - Component props.
 * @param props.video             - The video (id for the editor deep link).
 * @param props.title             - Current title value.
 * @param props.description       - Current description value.
 * @param props.onChange          - Partial-update handler from the form hook.
 * @param props.onOpenChapters    - Opens the chapters help modal.
 * @param props.confirmNavigation - Dirty-form guard forwarded to the chapters
 *                                deep link (same guard the sub-nav uses).
 * @return The card element.
 */
export default function VideoDetailsCard( {
	video,
	title,
	description,
	onChange,
	onOpenChapters,
	confirmNavigation,
}: Props ): ReactElement {
	return (
		<Card.Root>
			<Card.Header>
				<Card.Title>{ __( 'Video details', 'jetpack-videopress-pkg' ) }</Card.Title>
			</Card.Header>
			<Card.Content>
				<Stack direction="column" gap="md">
					<InputControl
						label={ __( 'Title', 'jetpack-videopress-pkg' ) }
						value={ title }
						onValueChange={ next => onChange( { title: next } ) }
					/>
					<TextareaControl
						__nextHasNoMarginBottom
						label={ __( 'Description', 'jetpack-videopress-pkg' ) }
						value={ description }
						onChange={ next => onChange( { description: next } ) }
						rows={ 5 }
					/>
					<ChaptersSummary
						video={ video }
						description={ description }
						onOpenHelp={ onOpenChapters }
						confirmNavigation={ confirmNavigation }
					/>
				</Stack>
			</Card.Content>
		</Card.Root>
	);
}
