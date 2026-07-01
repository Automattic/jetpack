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

/**
 * The mutation currently in flight, if any. Any busy mutation disables the
 * whole list; keyed actions also mark their own row as busy.
 */
export type TrackListBusy =
	| { action: 'upload' | 'publish' }
	| { action: 'delete' | 'download'; key: string }
	| null;

type TrackListProps = {
	rows: CaptionTrackRow[];
	isLoading: boolean;
	emptyMessage: string;
	busy: TrackListBusy;
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
 * @param props                   - Component props.
 * @param props.rows              - Merged track rows to render.
 * @param props.isLoading         - Whether the caption tracks are still loading.
 * @param props.emptyMessage      - Message shown when there are no tracks.
 * @param props.busy              - Mutation currently in flight, if any.
 * @param props.onEditManaged     - Edit a managed track.
 * @param props.onReplaceManaged  - Replace a managed track's file.
 * @param props.onDownloadManaged - Download a managed track.
 * @param props.onDeleteManaged   - Delete a managed track.
 * @param props.onEditDraft       - Edit a draft track.
 * @param props.onDeleteDraft     - Delete a draft track.
 * @return The track list, or the empty/loading placeholder.
 */
export default function TrackList( {
	rows,
	isLoading,
	emptyMessage,
	busy,
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

	const isBusy = !! busy;

	return (
		<div className="videopress-caption-manager__track-list">
			{ rows.map( row => {
				const isDeleting = busy?.action === 'delete' && busy.key === row.key;

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
									disabled={ isBusy }
								>
									{ __( 'Edit', 'jetpack-videopress-pkg' ) }
								</Button>
								<Button
									variant="link"
									icon={ trash }
									isDestructive
									isBusy={ isDeleting }
									disabled={ isBusy }
									onClick={ () => onDeleteDraft( row.captionTrack ) }
								>
									{ __( 'Delete', 'jetpack-videopress-pkg' ) }
								</Button>
							</div>
						</div>
					);
				}

				const isDownloading = busy?.action === 'download' && busy.key === row.key;

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
								disabled={ isBusy || ! row.isReady }
							>
								{ __( 'Edit', 'jetpack-videopress-pkg' ) }
							</Button>
							<Button
								variant="link"
								icon={ replace }
								onClick={ () => onReplaceManaged( row.track ) }
								disabled={ isBusy || ! row.isReady || row.isGenerated }
							>
								{ __( 'Replace file', 'jetpack-videopress-pkg' ) }
							</Button>
							<Button
								variant="link"
								icon={ download }
								isBusy={ isDownloading }
								onClick={ () => onDownloadManaged( row.track ) }
								disabled={ isBusy || ! row.isReady }
							>
								{ __( 'Download', 'jetpack-videopress-pkg' ) }
							</Button>
							<Button
								variant="link"
								icon={ trash }
								isDestructive
								isBusy={ isDeleting }
								disabled={ isBusy }
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
