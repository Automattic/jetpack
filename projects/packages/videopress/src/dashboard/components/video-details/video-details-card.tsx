import { TextareaControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Card, Field, InputControl, Stack, Text } from '@wordpress/ui';
import ChaptersSummary from './chapters-summary';
import ThumbnailControl from './thumbnail-control';
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
 * The single card below the player holding everything about this video that
 * a person reads or writes: the file it came from, the title and description
 * they own, the chapters those lines produce, and the thumbnail control.
 *
 * Grouping is the point. These used to be split across the canvas and the
 * inspector, which put the file name a column away from the title it names
 * and the thumbnail control a column away from the video it re-posters.
 *
 * The thumbnail is last and separated by a rule because it is the one
 * control here that does not go through Save — see thumbnail-control.tsx.
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
					{ /*
					 * Read-only, and derived from the source URL rather than
					 * stored (use-library.ts), so it is a labelled read-out and
					 * not a control. `nativeLabel={ false }` with a <span>
					 * because there is no form element for a <label> to point
					 * at; Field.Label's own styling is what keeps it matching
					 * the real field labels below it.
					 */ }
					<Field.Root>
						<Field.Label nativeLabel={ false } render={ <span /> }>
							{ __( 'File name', 'jetpack-videopress-pkg' ) }
						</Field.Label>
						<Text className="vp-video-details__readout">{ video.filename }</Text>
					</Field.Root>
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
					<ThumbnailControl video={ video } />
				</Stack>
			</Card.Content>
		</Card.Root>
	);
}
