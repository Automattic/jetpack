/**
 * Compact "Chapters (N)" summary for the Details tab. Replaces the inline
 * footer hint: chapter editing now lives in the editor's Chapters tool, and
 * this row deep-links there (`/video/{id}/editor`).
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
 * player's chapters VTT, so the persisted state stays internally
 * consistent.
 *
 * The editor link renders only when the chapters editor is enabled — the
 * `/video/$id/editor` route is stripped from the route registry otherwise
 * (see `Admin_UI::CHAPTERS_EDITOR_ROUTE_PATHS`), so the link would dead-end.
 * With the gate off, the description textarea remains the chapter-editing
 * surface and this row is just the count plus the help link.
 */
import { useMemo } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { useLinkProps } from '@wordpress/route';
import { Link, Stack, Text } from '@wordpress/ui';
import { parseDescription } from '../../../client/utils/video-chapters/description';
import { isChaptersEditorEnabled } from '../../utils/chapters-editor';
import { videoTabPath } from '../video-nav';
import type { LibraryItem } from '../../types/library';
import type { ReactElement } from 'react';

type Props = {
	video: Pick< LibraryItem, 'id' >;
	description: string;
	onOpenHelp: () => void;
	confirmNavigation?: () => boolean;
};

/**
 * The "Edit chapters in the editor" deep link. Its own component so the
 * `useLinkProps` hook only runs when the chapters editor is enabled — with the
 * gate off the target route isn't registered, and building a location for an
 * unknown route makes the router warn.
 *
 * @param props                   - Component props.
 * @param props.videoId           - The video's attachment id.
 * @param props.confirmNavigation - Same guard the sub-nav uses; return false to
 *                                stay put.
 * @return The link element.
 */
function EditChaptersLink( {
	videoId,
	confirmNavigation,
}: {
	videoId: string;
	confirmNavigation?: () => boolean;
} ): ReactElement {
	const linkProps = useLinkProps( { to: videoTabPath( videoId, 'editor' ) } );

	return (
		<Link
			{ ...linkProps }
			onClick={ event => {
				// Same exit as the Editor sub-nav tab — it must honor the
				// same dirty-form guard, or this link becomes a silent-discard
				// path sitting right under the description textarea.
				if ( confirmNavigation && ! confirmNavigation() ) {
					event.preventDefault();
					return;
				}
				linkProps.onClick?.( event );
			} }
		>
			{ __( 'Edit chapters in the editor', 'jetpack-videopress-pkg' ) }
		</Link>
	);
}

/**
 * The chapters summary row for the Details card.
 *
 * @param props                   - Component props.
 * @param props.video             - The video (id for the editor deep link).
 * @param props.description       - The form's current description value.
 * @param props.onOpenHelp        - Opens the chapters help modal.
 * @param props.confirmNavigation - Same guard the sub-nav uses: invoked before
 *                                the deep link navigates away from a dirty
 *                                Details form; return false to stay put.
 * @return The summary element.
 */
export default function ChaptersSummary( {
	video,
	description,
	onOpenHelp,
	confirmNavigation,
}: Props ): ReactElement {
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
				{ isChaptersEditorEnabled() && (
					<EditChaptersLink videoId={ video.id } confirmNavigation={ confirmNavigation } />
				) }
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
