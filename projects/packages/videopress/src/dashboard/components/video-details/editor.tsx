import AdminPage from '@automattic/jetpack-components/admin-page';
import { Breadcrumbs } from '@wordpress/admin-ui';
import { Button, ProgressBar } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Card, Skeleton, Stack, Text } from '@wordpress/ui';
import { isChaptersEditorEnabled } from '../../utils/chapters-editor';
import VideoNav from '../video-nav';
import ChaptersHelpModal from './chapters-help-modal';
import HeaderActions from './header-actions';
import LiveCelebration from './live-celebration';
import PreviewPlayer from './preview-player';
import PrivacySharingCard from './privacy-sharing-card';
import RatingCard from './rating-card';
import SubtitlesCard from './subtitles-card';
import ThumbnailCard from './thumbnail-card';
import { useVideoDetailsForm } from './use-video-details-form';
import VideoDetailsCard from './video-details-card';
import VideoInfoCard from './video-info-card';
import './editor.scss';
import type { LibraryItem, VideoRating } from '../../types/library';
import type { ReactElement } from 'react';

/**
 * Parent breadcrumb item — labelled "VideoPress" in every case, but the
 * link target depends on where the user arrived from. Overview's ranking
 * links tag their navigation with `state: { from: 'stats' }`; we read
 * that here so the breadcrumb routes back to the Overview tab instead of
 * defaulting to Library. TanStack stores user state on `window.history.state`,
 * so reading it directly avoids needing `useLocation` (which `@wordpress/route`
 * doesn't re-export from TanStack). Stable for the lifetime of the mount,
 * so no reactivity hook is needed.
 *
 * @return The parent breadcrumb item.
 */
export const getParentBreadcrumbItem = (): { label: string; to: string } => {
	const from = ( window.history.state as { from?: string } | null )?.from;
	return { label: 'VideoPress', to: from === 'stats' ? '/stats' : '/' };
};

export type EditorUploadState = {
	status: 'uploading' | 'processing' | 'failed';
	/** 0–100, matching the DS ProgressBar contract. Meaningful only while uploading. */
	progress: number;
	fileName: string;
	error?: string;
	/** Re-dispatches a failed upload. Only offered while `status` is 'failed'. */
	onRetry?: () => void;
};

export type EditorUploadSession = {
	/**
	 * The player slot's stage while the upload runs: progress, then processing,
	 * or the failure + retry. Cleared (undefined) once the bound video is
	 * playable, which hands the slot to the celebration / player.
	 */
	uploadState?: EditorUploadState;
	/**
	 * The one-time "your video is live" overlay. Present only between the video
	 * first becoming playable and the user dismissing it to the player.
	 */
	celebration?: { onDismiss: () => void };
	/**
	 * Save gate: the meta PATCH is keyed by attachment id, so Save must stay
	 * off until the surface is bound to a real media record — form dirtiness
	 * alone can't know that.
	 */
	saveDisabled: boolean;
};

export type EditorProps = {
	video: LibraryItem;
	onSave: (
		values: ReturnType< typeof useVideoDetailsForm >[ 'values' ],
		reset: ReturnType< typeof useVideoDetailsForm >[ 'reset' ]
	) => void;
	isSaving: boolean;
	onDelete: () => void;
	onDownload: () => void;
	onManageCaptions: () => void;
	chaptersOpen: boolean;
	setChaptersOpen: ( open: boolean ) => void;
	/**
	 * Present while this Editor hosts the upload flow's draft session (the
	 * /upload page's single-drop instant transition). Switches the chrome to
	 * embedded (the surface renders inside the dashboard tabs rather than
	 * owning an AdminPage), turns the player slot into the upload's stage, and
	 * keeps in-progress edits when the draft re-binds to the real record.
	 */
	uploadSession?: EditorUploadSession;
};

/**
 * The player slot while an upload is in flight: the same dark 16:9 frame the
 * player uses, carrying the file name and the upload's real state instead of
 * an embed that couldn't exist yet. No cancel — v1 treats a started upload as
 * committed; the failure state offers the retry.
 *
 * @param props             - Component props.
 * @param props.uploadState - The upload's current state.
 * @return The stage element.
 */
const UploadStagePanel = ( { uploadState }: { uploadState: EditorUploadState } ): ReactElement => {
	const { status, progress, fileName, error, onRetry } = uploadState;

	if ( status === 'failed' ) {
		return (
			<div className="vp-video-details__player vp-upload-stage is-failed" role="alert">
				<Text variant="body-md" render={ <span /> } className="vp-upload-stage__name">
					{ fileName }
				</Text>
				<Text variant="body-sm" render={ <span /> } className="vp-upload-stage__error">
					{ error ?? __( 'The video could not be uploaded.', 'jetpack-videopress-pkg' ) }
				</Text>
				{ onRetry && (
					<Button variant="secondary" onClick={ onRetry }>
						{ __( 'Retry upload', 'jetpack-videopress-pkg' ) }
					</Button>
				) }
			</div>
		);
	}

	return (
		<div className="vp-video-details__player vp-upload-stage" aria-live="polite">
			<Text variant="body-md" render={ <span /> } className="vp-upload-stage__name">
				{ fileName }
			</Text>
			{ /* No value while processing — the transcode reports no percentage,
			     so the bar goes indeterminate rather than lying at 100. */ }
			<ProgressBar
				className="vp-upload-stage__bar"
				value={ status === 'uploading' ? progress : undefined }
			/>
			<Text variant="body-sm" render={ <span /> } className="vp-upload-stage__status">
				{ status === 'uploading'
					? sprintf(
							/* translators: %d: upload progress percentage. */
							__( 'Uploading… %d%%', 'jetpack-videopress-pkg' ),
							Math.round( progress )
					  )
					: __( 'Upload complete — processing…', 'jetpack-videopress-pkg' ) }
			</Text>
		</div>
	);
};

/**
 * Skeleton stand-in for a card whose real content needs the VideoPress GUID
 * (the thumbnail poster, the subtitle tracks, the link/shortcode read-outs).
 * Rendering the card shell up front keeps the page's shape stable through the
 * upload — the real card fills the same slot when the record lands instead of
 * popping into a page the user is already typing on.
 *
 * @param props       - Component props.
 * @param props.title - The card title the real card will keep.
 * @return The placeholder card element.
 */
const PendingCard = ( { title }: { title: string } ): ReactElement => (
	<Card.Root>
		<Card.Header>
			<Card.Title>{ title }</Card.Title>
		</Card.Header>
		<Card.Content>
			<Stack direction="column" gap="md">
				<Skeleton className="vp-video-details__pending-line" />
				<Skeleton className="vp-video-details__pending-line is-short" />
			</Stack>
		</Card.Content>
	</Card.Root>
);

/**
 * The Video details edit surface: the authoring canvas, the preview player,
 * and the settings panel, plus the header Save actions. Used by the
 * /video/:id route (full AdminPage chrome) and by the upload flow's draft
 * session (embedded inside the dashboard tabs via `uploadSession`).
 *
 * @param props                  - Component props.
 * @param props.video            - The video record being edited (a draft item during an upload session).
 * @param props.onSave           - Persists the form values; receives them with the form's reset.
 * @param props.isSaving         - Whether a save (or delete) is in flight; holds Save off.
 * @param props.onDelete         - Deletes the video.
 * @param props.onDownload       - Opens the source file.
 * @param props.onManageCaptions - Opens the caption manager.
 * @param props.chaptersOpen     - Whether the chapters help modal is open.
 * @param props.setChaptersOpen  - Opens/closes the chapters help modal.
 * @param props.uploadSession    - Draft-session state; see EditorProps.
 * @return The editor element.
 */
const Editor = ( {
	video,
	onSave,
	isSaving,
	onDelete,
	onDownload,
	onManageCaptions,
	chaptersOpen,
	setChaptersOpen,
	uploadSession,
}: EditorProps ): ReactElement => {
	const { values, update, isDirty, reset } = useVideoDetailsForm( video, {
		// The draft session hands the form a synthetic record first and the
		// real one once the upload settles; the id change between them must
		// not wipe what the user has typed in the meantime.
		preserveDirtyOnRebind: Boolean( uploadSession ),
	} );

	const uploadState = uploadSession?.uploadState;

	// The sub-nav's only sibling tab is the Editor, whose route is stripped
	// from the registry when the chapters editor is off — a one-tab strip
	// would be pointless chrome, and its Editor tab would dead-end. The
	// embedded draft session never shows it: its Editor tab is a route
	// navigation, which would abandon the /upload session mid-upload.
	const showVideoNav = ! uploadSession && isChaptersEditorEnabled();

	const openChapters = useCallback( () => {
		setChaptersOpen( true );
	}, [ setChaptersOpen ] );

	const closeChapters = useCallback( () => {
		setChaptersOpen( false );
	}, [ setChaptersOpen ] );

	const onRatingChange = useCallback(
		( next: VideoRating ) => {
			update( { rating: next } );
		},
		[ update ]
	);

	const handleSave = useCallback( () => {
		onSave( values, reset );
	}, [ onSave, values, reset ] );

	// Guard the sub-nav against losing unsaved form edits: the Editor tab
	// is a sibling route, so switching tabs unmounts this form entirely.
	const confirmNavigation = useCallback( () => {
		return (
			! isDirty ||
			// eslint-disable-next-line no-alert -- deliberate synchronous guard; the sub-nav navigation can't await a custom dialog.
			window.confirm(
				__(
					'You have unsaved changes. Leave this page and discard them?',
					'jetpack-videopress-pkg'
				)
			)
		);
	}, [ isDirty ] );

	const canSave = isDirty && ! isSaving && ! uploadSession?.saveDisabled;

	// `.trim()` matters for the heading in both chromes. Breadcrumbs only
	// short-circuits on `items.length === 0`, so a whitespace-only title would
	// render an empty <h1> — and that <h1> is the page's only accessible name.
	const headingLabel = values.title.trim() || __( 'Untitled', 'jetpack-videopress-pkg' );

	let playerSlot = <PreviewPlayer video={ video } />;
	if ( uploadState ) {
		playerSlot = <UploadStagePanel uploadState={ uploadState } />;
	} else if ( uploadSession?.celebration ) {
		playerSlot = (
			<LiveCelebration video={ video } onDismiss={ uploadSession.celebration.onDismiss } />
		);
	}

	const headerActions = (
		<HeaderActions
			guid={ video.guid || undefined }
			canSave={ canSave }
			onSave={ handleSave }
			onManageCaptions={ onManageCaptions }
			onDownload={ onDownload }
			onDelete={ onDelete }
			// Until the attachment exists every item in the ⋯ menu would be a
			// silent no-op, and a menu of no-ops is worse than no menu.
			showMenu={ ! uploadState }
		/>
	);

	const layout = (
		<div className="vp-video-details__layout">
			<div className="vp-video-details__canvas">
				<VideoDetailsCard
					video={ video }
					title={ values.title }
					description={ values.description }
					onChange={ update }
					onOpenChapters={ openChapters }
					confirmNavigation={ confirmNavigation }
				/>
				{ uploadState ? (
					<>
						<PendingCard title={ __( 'Thumbnail', 'jetpack-videopress-pkg' ) } />
						<PendingCard title={ __( 'Subtitles', 'jetpack-videopress-pkg' ) } />
					</>
				) : (
					<>
						<ThumbnailCard video={ video } />
						<SubtitlesCard video={ video } onManageSubtitles={ onManageCaptions } />
					</>
				) }
			</div>
			{ /*
			 * Deliberately a sibling of the canvas rather than the first
			 * child of the aside: it is placed by grid area, so the stacked
			 * layout below 1100px can lead with the player while the
			 * settings stay at the bottom.
			 */ }
			{ playerSlot }
			<aside
				className="vp-video-details__inspector"
				aria-label={ __( 'Video settings', 'jetpack-videopress-pkg' ) }
			>
				{ uploadState ? (
					<PendingCard title={ __( 'Video info', 'jetpack-videopress-pkg' ) } />
				) : (
					<VideoInfoCard video={ video } />
				) }
				{ /*
				 * Interactive even in the draft session: both cards only write
				 * form values, and the eventual save is the attachment-id-keyed
				 * meta PATCH — no GUID involved, so there is nothing to disable.
				 */ }
				<PrivacySharingCard
					privacy={ values.privacy }
					displayEmbed={ values.displayEmbed }
					allowDownloads={ values.allowDownloads }
					onChange={ update }
				/>
				<RatingCard value={ values.rating } onChange={ onRatingChange } />
			</aside>
		</div>
	);

	if ( uploadSession ) {
		// Embedded chrome: the upload flow already sits inside DashboardLayout's
		// AdminPage (masthead + tabs), and AdminPage inside AdminPage renders a
		// second masthead and footer inside the tab panel. A header row stands
		// in for the breadcrumb bar: the same live form-driven title, the same
		// Save actions.
		return (
			<div className="vp-video-details is-embedded">
				<div className="vp-video-details__embedded-header">
					<Text variant="body-lg" render={ <h2 /> } className="vp-video-details__embedded-title">
						{ headingLabel }
					</Text>
					{ headerActions }
				</div>
				{ layout }
				<ChaptersHelpModal isOpen={ chaptersOpen } onClose={ closeChapters } />
			</div>
		);
	}

	return (
		<AdminPage
			breadcrumbs={
				// display: contents wrapper — a pure scoping hook so the
				// stylesheet can clamp long video titles in the current-item
				// crumb (Breadcrumbs' own class names are CSS-module hashes).
				<div className="vp-video-details__breadcrumbs">
					{ /*
					 * The crumb reads the FORM's title, not the saved record, so
					 * the page heading tracks what is being typed without
					 * committing it. Two side benefits over reading
					 * `video.title`: no old→new flicker when the post-save
					 * refetch lands, and the 2s processing `refetchInterval`
					 * can't clobber the crumb mid-edit.
					 */ }
					<Breadcrumbs items={ [ getParentBreadcrumbItem(), { label: headingLabel } ] } />
				</div>
			}
			actions={ headerActions }
		>
			{ showVideoNav && (
				<VideoNav
					videoId={ video.id }
					activeTab="details"
					confirmNavigation={ confirmNavigation }
				/>
			) }
			<div className="vp-video-details">
				{ /*
				 * Placement rule for this screen: the canvas holds what a person
				 * authors about this video — the words, the still, the captions.
				 * The right-hand column holds the video itself, the values that
				 * address it, and the settings picked once from a fixed set.
				 *
				 * The split is authoring vs. configuring rather than editable vs.
				 * read-only, which is why Privacy & sharing and Rating sit beside
				 * the read-outs: all three are things you set and leave, not
				 * things you write.
				 *
				 * The player used to lead the canvas. It was measured at 502px
				 * tall on a 1080p display — over half the visible page before a
				 * single field had been read — while the settings it pushed
				 * down could not fit their own column and grew a second
				 * scrollbar with no visible boundary. Those are the same
				 * problem, and moving one element fixes both.
				 */ }
				{ layout }
			</div>
			<ChaptersHelpModal isOpen={ chaptersOpen } onClose={ closeChapters } />
		</AdminPage>
	);
};

export default Editor;
