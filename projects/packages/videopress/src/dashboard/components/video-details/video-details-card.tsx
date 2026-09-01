import { TextareaControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Card, InputControl, Stack } from '@wordpress/ui';
import ChaptersSummary from './chapters-summary';
import type { LibraryItem } from '../../types/library';
import type { ReactElement } from 'react';

type Props = {
	video: LibraryItem;
	title: string;
	description: string;
	onChange: ( partial: { title?: string; description?: string } ) => void;
	onOpenChapters: () => void;
	confirmNavigation?: () => boolean;
};

/**
 * The words this video is described by: the title, the description, and the
 * chapters that description produces.
 *
 * Everything here is free text a person writes and Save commits, which is the
 * whole membership rule. Two things that used to sit in this card have left
 * on that basis — the file name, which is a fact about the upload rather than
 * something anyone writes, and the thumbnail control, which does not go
 * through Save and now shows the poster it replaces.
 *
 * @param props                   - Component props.
 * @param props.video             - The current video record.
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
					{ /*
					 * Deliberately `@wordpress/components`' TextareaControl and
					 * not `@wordpress/ui`'s Textarea primitive. The two label
					 * styles already agree — `@wordpress/components`
					 * src/utils/base-label.ts is 11px / fontWeightEmphasis /
					 * uppercase, and `@wordpress/ui`
					 * src/utils/css/field.module.css gives Field.Label
					 * font-size-xs (11px), font-weight-emphasis, uppercase — so
					 * there is nothing to fix by swapping, and `@wordpress/ui`
					 * has no TextareaControl equivalent to swap to. (Its
					 * Textarea primitive is `use-with-caution`, but so are the
					 * Field and InputControl in this same Stack, so that is not
					 * a reason to single it out.) Leave this be.
					 */ }
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
