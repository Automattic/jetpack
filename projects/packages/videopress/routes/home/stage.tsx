import { useGlobalNotices } from '@automattic/jetpack-components/global-notices';
import { Tooltip } from '@wordpress/components';
import { useCallback, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Link, useNavigate } from '@wordpress/route';
import { Button, Card, EmptyState, Text } from '@wordpress/ui';
import DashboardLayout from '../../src/dashboard/components/dashboard-layout';
import { TAB_PATHS } from '../../src/dashboard/components/dashboard-tabs';
import FetchErrorNotice from '../../src/dashboard/components/fetch-error-notice';
import FreeTierNotice from '../../src/dashboard/components/overview/free-tier-notice';
import QueryClientWrapper from '../../src/dashboard/components/query-client-wrapper';
import UploadDropzone from '../../src/dashboard/components/upload-dropzone';
import {
	selectFilesForPlan,
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
			files.forEach( file => startUpload( file, UPLOAD_ONBOARDING_CONTEXT ) );
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
		// overview — that hand-off belongs to a specific video's screens.
		<DashboardLayout activeTab="home" actions={ uploadButton }>
			<div className="vp-home">
				{ isFree && <FreeTierNotice /> }

				<section className="vp-home__section" aria-labelledby="vp-home-recents-heading">
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
						<>
							{ /* The heading/description keep the EmptyState shell, but the
							     action is the real first-run dropzone, not a button that
							     bounces to /upload. It sits as a sibling because
							     EmptyState.Root caps its own width — too narrow for a
							     drop target. Single-file copy: an empty library means
							     the (new) first video, whatever the plan allows. */ }
							<EmptyState.Root className="vp-home__empty">
								<EmptyState.Title>
									{ __( 'No videos yet', 'jetpack-videopress-pkg' ) }
								</EmptyState.Title>
								<EmptyState.Description>
									{ __(
										'Upload your first video and it will show up here, ready to share or drop into a post.',
										'jetpack-videopress-pkg'
									) }
								</EmptyState.Description>
							</EmptyState.Root>
							<div className="vp-home__empty-upload">
								<UploadDropzone
									onFiles={ onEmptyStateFiles }
									disabled={ isAtLimit }
									allowMultiple={ allowMultiple }
									copyVariant="single"
								/>
							</div>
						</>
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
