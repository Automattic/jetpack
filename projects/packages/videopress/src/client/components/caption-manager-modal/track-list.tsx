/**
 * External dependencies
 */
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { download, pencil, replace, trash } from '@wordpress/icons';
/**
 * Types
 */
import type { SavedCaptionTrack } from '../../lib/video-tracks/caption-tracks';
import type { VideoTextTrack } from '../../lib/video-tracks/types';
import type { ReactElement } from 'react';

/**
 * A published/managed VideoPress track shown in the list.
 */
export type ManagedTrackRow = {
	type: 'managed';
	key: string;
	title: string;
	metaLabels: string[];
	isGenerated: boolean;
	isReady: boolean;
	track: VideoTextTrack;
};

/**
 * A locally stored draft caption track shown in the list.
 */
export type DraftTrackRow = {
	type: 'draft';
	key: string;
	title: string;
	captionTrack: SavedCaptionTrack;
};

/**
 * A single row in the subtitle track list — either a managed track or a draft.
 */
export type CaptionTrackRow = ManagedTrackRow | DraftTrackRow;

type TrackListProps = {
	rows: CaptionTrackRow[];
	isLoading: boolean;
	emptyMessage: string;
	deletingTrackKey: string | null;
	downloadingTrackKey: string | null;
	isSavingUpload: boolean;
	isPublishing: boolean;
	isLoadingTrackText: boolean;
	onEditManaged: ( track: VideoTextTrack ) => void;
	onReplaceManaged: ( track: VideoTextTrack ) => void;
	onDownloadManaged: ( track: VideoTextTrack ) => void;
	onDeleteManaged: ( track: VideoTextTrack ) => void;
	onEditDraft: ( captionTrack: SavedCaptionTrack ) => void;
	onDeleteDraft: ( captionTrack: SavedCaptionTrack ) => void;
};

/**
 * Presentational list of a video's subtitle tracks: published/managed tracks
 * and local drafts merged into one list, each with its available actions.
 *
 * @param props                     - Component props.
 * @param props.rows                - Merged track rows to render.
 * @param props.isLoading           - Whether the caption tracks are still loading.
 * @param props.emptyMessage        - Message shown when there are no tracks.
 * @param props.deletingTrackKey    - Key of the track currently being deleted.
 * @param props.downloadingTrackKey - Key of the track currently being downloaded.
 * @param props.isSavingUpload      - Whether an upload is in progress.
 * @param props.isPublishing        - Whether a publish is in progress.
 * @param props.isLoadingTrackText  - Whether track content is loading.
 * @param props.onEditManaged       - Edit a managed track.
 * @param props.onReplaceManaged    - Replace a managed track's file.
 * @param props.onDownloadManaged   - Download a managed track.
 * @param props.onDeleteManaged     - Delete a managed track.
 * @param props.onEditDraft         - Edit a draft track.
 * @param props.onDeleteDraft       - Delete a draft track.
 * @return The track list, or the empty/loading placeholder.
 */
export default function TrackList( {
	rows,
	isLoading,
	emptyMessage,
	deletingTrackKey,
	downloadingTrackKey,
	isSavingUpload,
	isPublishing,
	isLoadingTrackText,
	onEditManaged,
	onReplaceManaged,
	onDownloadManaged,
	onDeleteManaged,
	onEditDraft,
	onDeleteDraft,
}: TrackListProps ): ReactElement {
	if ( ! rows.length ) {
		return (
			<div className="videopress-caption-manager__empty">
				{ isLoading ? __( 'Loading subtitle tracks…', 'jetpack-videopress-pkg' ) : emptyMessage }
			</div>
		);
	}

	return (
		<div className="videopress-caption-manager__track-list">
			{ rows.map( row => {
				const isDeleting = deletingTrackKey === row.key;

				if ( row.type === 'draft' ) {
					return (
						<div
							className="videopress-caption-manager__track"
							key={ `draft-${ row.captionTrack.id }` }
						>
							<div className="videopress-caption-manager__track-meta">
								<strong>{ row.title }</strong>
								<span>{ __( 'Draft', 'jetpack-videopress-pkg' ) }</span>
							</div>
							<div className="videopress-caption-manager__track-actions">
								<Button
									variant="link"
									icon={ pencil }
									onClick={ () => onEditDraft( row.captionTrack ) }
									disabled={
										isSavingUpload || isPublishing || isLoadingTrackText || !! deletingTrackKey
									}
								>
									{ __( 'Edit', 'jetpack-videopress-pkg' ) }
								</Button>
								<Button
									variant="link"
									icon={ trash }
									isDestructive
									isBusy={ isDeleting }
									disabled={ isSavingUpload || isPublishing || !! deletingTrackKey }
									onClick={ () => onDeleteDraft( row.captionTrack ) }
								>
									{ __( 'Delete', 'jetpack-videopress-pkg' ) }
								</Button>
							</div>
						</div>
					);
				}

				const isDownloading = downloadingTrackKey === row.key;

				return (
					<div className="videopress-caption-manager__track" key={ `managed-${ row.key }` }>
						<div className="videopress-caption-manager__track-meta">
							<strong>{ row.title }</strong>
							{ row.metaLabels.length ? <span>{ row.metaLabels.join( ' · ' ) }</span> : null }
						</div>
						<div className="videopress-caption-manager__track-actions">
							<Button
								variant="link"
								icon={ pencil }
								onClick={ () => onEditManaged( row.track ) }
								disabled={ isSavingUpload || isPublishing || !! deletingTrackKey || ! row.isReady }
							>
								{ __( 'Edit', 'jetpack-videopress-pkg' ) }
							</Button>
							<Button
								variant="link"
								icon={ replace }
								onClick={ () => onReplaceManaged( row.track ) }
								disabled={
									isSavingUpload ||
									isPublishing ||
									!! deletingTrackKey ||
									! row.isReady ||
									row.isGenerated
								}
							>
								{ __( 'Replace file', 'jetpack-videopress-pkg' ) }
							</Button>
							<Button
								variant="link"
								icon={ download }
								isBusy={ isDownloading }
								onClick={ () => onDownloadManaged( row.track ) }
								disabled={
									isSavingUpload ||
									isPublishing ||
									isDownloading ||
									!! deletingTrackKey ||
									! row.isReady
								}
							>
								{ __( 'Download', 'jetpack-videopress-pkg' ) }
							</Button>
							<Button
								variant="link"
								icon={ trash }
								isDestructive
								isBusy={ isDeleting }
								disabled={ isSavingUpload || isDeleting || isDownloading || isPublishing }
								onClick={ () => onDeleteManaged( row.track ) }
							>
								{ __( 'Delete', 'jetpack-videopress-pkg' ) }
							</Button>
						</div>
					</div>
				);
			} ) }
		</div>
	);
}
