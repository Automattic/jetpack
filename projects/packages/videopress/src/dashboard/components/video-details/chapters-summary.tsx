/**
 * Compact "Chapters (N)" summary for the Details tab. Replaces the inline
 * structured chapters editor: chapter editing now lives in the Studio
 * editor's Chapters tool, and this row deep-links there
 * (`/video/{id}/editor?tool=chapters`).
 *
 * The count stays a pure lens over the description string (parseDescription
 * on the form's CURRENT value), so it live-updates while the user types
 * chapter lines into the description textarea above.
 *
 * Accepted last-write-wins risk: the description textarea here and the
 * editor's Chapters tool both save the WHOLE description meta — there is no
 * merge. Unsaved edits held on one surface are overwritten when the other
 * saves (e.g. Details open in one tab while chapters are saved from the
 * editor in another). Accepted as a single-user, same-session flow: both
 * writers serialize through the same meta field, and each save re-syncs the
 * player's chapters VTT, so the persisted state stays internally consistent.
 *
 * The editor link renders only when the Studio flag is on — the
 * `/video/$id/editor` route is stripped from the route registry otherwise
 * (see `Admin_UI::STUDIO_ROUTE_PATHS`), so the link would dead-end in the
 * editor's NotFound. With the flag off, the description textarea remains the
 * chapter-editing surface and this row is just the count plus the help link.
 */
import { useMemo } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { useLinkProps } from '@wordpress/route';
import { Link, Stack, Text } from '@wordpress/ui';
import { parseDescription } from '../../utils/chapters';
import { isStudioEnabled } from '../../utils/studio';
import { videoTabPath } from '../video-nav';
import type { LibraryItem } from '../../types/library';
import type { ReactElement } from 'react';

type Props = {
	video: Pick< LibraryItem, 'id' >;
	description: string;
	onOpenHelp: () => void;
};

/**
 * The "Edit chapters in the editor" deep link. Own component so the
 * `useLinkProps` hook only runs when Studio is enabled — with the flag off
 * the target route isn't registered and building its location would warn.
 *
 * @param props         - Component props.
 * @param props.videoId - The video's attachment id.
 * @return The link element.
 */
function EditChaptersLink( { videoId }: { videoId: string } ): ReactElement {
	const linkProps = useLinkProps( {
		to: videoTabPath( videoId, 'editor' ),
		// Read by the editor's initialToolFromLocation(); serializes to
		// `?tool=chapters`.
		search: { tool: 'chapters' },
	} );

	return (
		<Link { ...linkProps }>{ __( 'Edit chapters in the editor', 'jetpack-videopress-pkg' ) }</Link>
	);
}

/**
 * The chapters summary row for the Details card.
 *
 * @param props             - Component props.
 * @param props.video       - The video (id for the editor deep link).
 * @param props.description - The form's current description value.
 * @param props.onOpenHelp  - Opens the chapters help modal.
 * @return The summary element.
 */
export default function ChaptersSummary( { video, description, onOpenHelp }: Props ): ReactElement {
	const { rows } = useMemo( () => parseDescription( description ), [ description ] );

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
				{ isStudioEnabled() && <EditChaptersLink videoId={ video.id } /> }
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
