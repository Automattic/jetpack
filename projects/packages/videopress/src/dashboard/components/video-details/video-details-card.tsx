import { TextareaControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Card, InputControl, Stack } from '@wordpress/ui';
import ChaptersEditor from './chapters-editor';
import type { LibraryItem } from '../../types/library';
import type { ReactElement } from 'react';

type Props = {
	video: Pick< LibraryItem, 'guid' | 'isPrivate' | 'durationSeconds' >;
	title: string;
	description: string;
	onChange: ( partial: { title?: string; description?: string } ) => void;
	onOpenChapters: () => void;
};

/**
 * Form card for the editable text fields: title and description, plus the
 * structured chapters editor (a lens over the description — see
 * chapters-editor.tsx), whose header links the Chapters help modal.
 *
 * @param props                - Component props.
 * @param props.video          - The video (probe identity + duration for chapter validation).
 * @param props.title          - Current title value.
 * @param props.description    - Current description value.
 * @param props.onChange       - Partial-update handler from the form hook.
 * @param props.onOpenChapters - Opens the chapters help modal.
 * @return The card element.
 */
export default function VideoDetailsCard( {
	video,
	title,
	description,
	onChange,
	onOpenChapters,
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
					<ChaptersEditor
						video={ video }
						description={ description }
						onChange={ onChange }
						onOpenHelp={ onOpenChapters }
					/>
				</Stack>
			</Card.Content>
		</Card.Root>
	);
}
