import { useGlobalNotices } from '@automattic/jetpack-components/global-notices';
import { Tooltip } from '@wordpress/components';
import { useCallback, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Link, useNavigate } from '@wordpress/route';
import { Button, Card, Text, VisuallyHidden } from '@wordpress/ui';
import DashboardLayout from '../../src/dashboard/components/dashboard-layout';
import { TAB_PATHS } from '../../src/dashboard/components/dashboard-tabs';
import FetchErrorNotice from '../../src/dashboard/components/fetch-error-notice';
import FreeTierNotice from '../../src/dashboard/components/overview/free-tier-notice';
import QueryClientWrapper from '../../src/dashboard/components/query-client-wrapper';
import UploadDropzone from '../../src/dashboard/components/upload-dropzone';
import {
	selectFilesForPlan,
	UPLOAD_BATCH_CONTEXT,
	UPLOAD_ONBOARDING_CONTEXT,
} from '../../src/dashboard/components/upload-dropzone/select-files';
import { useFreeTier } from '../../src/dashboard/hooks/use-free-tier';
import { useLibrary } from '../../src/dashboard/hooks/use-library';
import { TOP_VIDEOS_LIMIT, useStats } from '../../src/dashboard/hooks/use-stats';
import { useUpload } from '../../src/dashboard/hooks/use-upload';
import RecentVideoCard from './recent-video-card';
import { resolveViewsSlot } from './views-slot';
import './style.scss';
import type { View } from '@wordpress/dataviews';

// The rail shows the four most recent videos. Fixed, not user-controlled:
// Home is a landing pad, and anyone who wants to page or sort has the Library
// tab one click away.
const RECENTS_PER_PAGE = 4;

const RECENTS_VIEW: View = {
	type: 'grid',
	page: 1,
	perPage: RECENTS_PER_PAGE,
	fields: [],
	filters: [],
	search: '',
	sort: { field: 'uploadDate', direction: 'desc' },
};

const SKELETON_KEYS = [ 'a', 'b', 'c', 'd' ];

const StageInner = () => {
	const navigate = useNavigate();
	const { items, isLoading, isError, error: libraryError, refetch } = useLibrary( RECENTS_VIEW );
	const { isFree, isUnlimited, isAtLimit } = useFreeTier();
	const { stats, isError: statsIsError, hasData: statsHasData } = useStats();
	const { startUpload } = useUpload();
	const { createInfoNotice } = useGlobalNotices();

	// Header upload action. In the returning-user shape there is no Upload TAB,
	// so this button is the tab strip's replacement — "one click away" rather
	// than gone. It navigates to the upload route rather than picking a file
	// here: that route owns the whole flow (progress, details, publish). A
	// picker on Home is only safe when it navigates the moment the files are
	// queued, which is what the emptied-library dropzone below does; a header
	// picker that left the user on Home would upload with nowhere to report
	// progress, which is exactly how it read before.
	const goToUpload = useCallback( () => {
		if ( isAtLimit ) {
			return;
		}
		navigate( { href: TAB_PATHS.upload } );
	}, [ isAtLimit, navigate ] );

	const openVideoDetails = useCallback(
		( id: string ) => {
			navigate( { href: `/video/${ id }` } );
		},
		[ navigate ]
	);

	// The emptied-library hand-off. Files start in the shared queue under the
	// onboarding flow's context tag, then land where that flow expects them: a
	// single file resumes /upload straight into its edit session (see the
	// adoption-aware step in routes/upload/stage.tsx); a batch goes to the
	// Library, whose in-flight rows and the upload pill own multi-file
	// progress — the same split the /upload dropzone makes. No pill
	// suppression here: navigation is immediate, so this screen never shows
	// progress of its own.
	const allowMultiple = ! isFree || isUnlimited;
	const onEmptyStateFiles = useCallback(
		( selected: File[] ) => {
			if ( isAtLimit ) {
				return;
			}
			const { files, discardedNotice } = selectFilesForPlan( selected, allowMultiple );
			if ( ! files.length ) {
				return;
			}
			if ( discardedNotice ) {
				createInfoNotice( discardedNotice );
			}
			// A batch is tagged apart from the single flow: it has no surface of
			// its own here or on /upload, so it must not be adopted as one — nor
			// announced once per file when the user chains through "Add details".
			const context = files.length === 1 ? UPLOAD_ONBOARDING_CONTEXT : UPLOAD_BATCH_CONTEXT;
			files.forEach( file => startUpload( file, context ) );
			navigate( { href: files.length === 1 ? TAB_PATHS.upload : '/' } );
		},
		[ allowMultiple, createInfoNotice, isAtLimit, navigate, startUpload ]
	);

	// The same discipline the Analytics screen applies at
	// `routes/overview/stage.tsx`: a failed stats request with nothing cached
	// behind it must not be rendered as data. Here that means no card is
	// allowed to claim a views figure — or to claim zero.
	const statsAvailable = statsHasData && ! statsIsError;
	const viewsById = useMemo( () => {
		const map = new Map< string, number >();
		stats.topVideos.forEach( video => map.set( video.id, video.views ) );
		return map;
	}, [ stats.topVideos ] );
	// `stats.topVideos` is capped at TOP_VIDEOS_LIMIT, so a video's absence
	// from a FULL list proves nothing about its views. See views-slot.ts.
	const rankingTruncated = stats.topVideos.length >= TOP_VIDEOS_LIMIT;

	const uploadButton = (
		<Tooltip
			text={
				isAtLimit
					? __(
							'You’ve reached the free plan’s 1-video limit. Upgrade to upload more.',
							'jetpack-videopress-pkg'
					  )
					: __( 'Upload a new video', 'jetpack-videopress-pkg' )
			}
		>
			<Button
				className="vp-home__upload-button"
				size="compact"
				onClick={ goToUpload }
				aria-disabled={ isAtLimit }
			>
				{ __( 'Upload video', 'jetpack-videopress-pkg' ) }
			</Button>
		</Tooltip>
	);

	const showEmptyState = ! isLoading && ! isError && items.length === 0;

	return (
		// The header carries the upload action alone. "Add to a post or page"
		// was removed by design review: nobody adds a video to a post from the
		// overview — that hand-off belongs to a specific video's screens. And
		// while the emptied-library dropzone is on screen (or the library is
		// still loading toward it), even that one action goes: the dropzone's
		// button is the screen's single CTA, and a second "Upload video" in the
		// header is the same invitation twice. The gate is "has videos", not
		// "settled", so the button never flashes in during the skeleton pass —
		// it first appears with the cards it belongs above.
		<DashboardLayout activeTab="home" actions={ items.length > 0 ? uploadButton : undefined }>
			<div className="vp-home">
				{ isFree && <FreeTierNotice /> }

				<section className="vp-home__section" aria-labelledby="vp-home-recents-heading">
					{ showEmptyState ? (
						// A "Recent videos" label over no recents is noise, so the
						// empty state swaps the section head for a visually-hidden
						// heading — hidden heading over aria-label so the page keeps
						// a heading to navigate by (see the `render` note below) and
						// the section's aria-labelledby keeps its target. Its text
						// carries the "no videos yet" status the deleted EmptyState
						// title used to announce.
						<VisuallyHidden render={ <h2 id="vp-home-recents-heading" /> }>
							{ __( 'No videos yet — upload a video', 'jetpack-videopress-pkg' ) }
						</VisuallyHidden>
					) : (
						<div className="vp-home__section-head">
							{ /* `render` is what makes this an actual <h2>. Without it the
							     section's aria-labelledby points at a plain <span>, so the
							     screen is a page with no headings to navigate by. */ }
							<Text
								variant="heading-md"
								render={ <h2 /> }
								id="vp-home-recents-heading"
								className="vp-home__section-title"
							>
								{ __( 'Recent videos', 'jetpack-videopress-pkg' ) }
							</Text>
							{ items.length > 0 && (
								<Link to="/">{ __( 'View all', 'jetpack-videopress-pkg' ) }</Link>
							) }
						</div>
					) }

					{ isError && items.length === 0 ? (
						// A failed listing must not read as an empty library — the
						// empty state below invites an upload, which is the wrong
						// advice when the videos are simply unreachable. Same rule as
						// the Library grid.
						<FetchErrorNotice
							className="vp-home__error"
							message={ __( 'We couldn’t load your recent videos.', 'jetpack-videopress-pkg' ) }
							error={ libraryError }
							onRetry={ () => void refetch() }
						/>
					) : (
						<div className="vp-home__rail">
							{ isLoading &&
								items.length === 0 &&
								SKELETON_KEYS.map( key => (
									<Card.Root key={ key } className="vp-home__card vp-home__card--skeleton">
										<div className="vp-home__card-media" />
										<div className="vp-home__card-body">
											<span className="vp-home__skeleton-line" />
											<span className="vp-home__skeleton-line vp-home__skeleton-line--narrow" />
										</div>
									</Card.Root>
								) ) }
							{ items.map( item => (
								<RecentVideoCard
									key={ item.id }
									item={ item }
									views={ viewsById.get( item.id ) }
									viewsSlot={ resolveViewsSlot( {
										statsAvailable,
										views: viewsById.get( item.id ),
										rankingTruncated,
									} ) }
									onOpen={ openVideoDetails }
								/>
							) ) }
						</div>
					) }

					{ showEmptyState && (
						// The dropzone stands alone — no EmptyState shell above it.
						// Design review's rule: one screen, one job, one CTA. The
						// shell's heading duplicated the dropzone's own hint, and its
						// useful line — the "it will show up here" promise — moved
						// into the sub copy below. Single-file copy: an empty library
						// means the (new) first video, whatever the plan allows.
						<div className="vp-home__empty-upload">
							<UploadDropzone
								onFiles={ onEmptyStateFiles }
								disabled={ isAtLimit }
								allowMultiple={ allowMultiple }
								copyVariant="single"
								subCopy={ __(
									'Your video will show up here, ready to share or drop into a post.',
									'jetpack-videopress-pkg'
								) }
							/>
						</div>
					) }
				</section>
			</div>
		</DashboardLayout>
	);
};

const Stage = () => (
	<QueryClientWrapper>
		<StageInner />
	</QueryClientWrapper>
);

export { Stage as stage };
