/**
 * Compact "Chapters (N)" summary for the Details tab. Replaces the inline
 * footer hint: chapter editing now lives in the Chapters tab, and this row
 * deep-links there (`/video/{id}/chapters`).
 *
 * The count stays a pure lens over the description string (parseDescription
 * on the form's CURRENT value), so it live-updates while the user types
 * chapter lines into the description textarea above.
 *
 * Accepted last-write-wins risk: the description textarea here and the
 * Chapters tab both save the WHOLE description meta — there is no
 * merge. Unsaved edits held on one surface are overwritten when the other
 * saves (e.g. Details open in one tab while chapters are saved from the
 * Chapters tab in another). Accepted as a single-user, same-session flow:
 * both writers serialize through the same meta field, and each save
 * re-syncs the player's chapters VTT, so the persisted state stays
 * internally consistent.
 */
import { useMemo } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { useLinkProps } from '@wordpress/route';
import { Link, Stack, Text } from '@wordpress/ui';
import { parseDescription } from '../../../client/utils/video-chapters/description';
import { videoTabPath } from '../video-nav';
import type { LibraryItem } from '../../types/library';
import type { ReactElement } from 'react';

type Props = {
	video: Pick< LibraryItem, 'id' >;
	description: string;
	onOpenHelp: () => void;
};

/**
 * The chapters summary row for the Details card.
 *
 * @param props             - Component props.
 * @param props.video       - The video (id for the Chapters tab deep link).
 * @param props.description - The form's current description value.
 * @param props.onOpenHelp  - Opens the chapters help modal.
 * @return The summary element.
 */
export default function ChaptersSummary( { video, description, onOpenHelp }: Props ): ReactElement {
	const { rows } = useMemo( () => parseDescription( description ), [ description ] );
	const linkProps = useLinkProps( { to: videoTabPath( video.id, 'chapters' ) } );

	return (
		<Stack
			direction="row"
			gap="sm"
			align="center"
			justify="space-between"
			className="vp-chapters-summary"
		>
			<Stack direction="row" gap="sm" align="center">
				<Text>
					{ sprintf(
						/* translators: %d: number of chapters in the description. */
						__( 'Chapters (%d)', 'jetpack-videopress-pkg' ),
						rows.length
					) }
				</Text>
				<Link { ...linkProps }>{ __( 'Edit chapters', 'jetpack-videopress-pkg' ) }</Link>
			</Stack>
			<Link
				href="#"
				onClick={ event => {
					event.preventDefault();
					onOpenHelp();
				} }
			>
				{ __( 'Learn how chapters work', 'jetpack-videopress-pkg' ) }
			</Link>
		</Stack>
	);
}
