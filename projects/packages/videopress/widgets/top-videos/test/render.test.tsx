/**
 * External dependencies
 */
import { act, render, screen } from '@testing-library/react';
import { video as videoIcon } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import TopVideos from '../render';
import manifest from '../widget.json';
import type { ReactNode } from 'react';

const mockLeaderboard = jest.fn();
const mockReportActions = jest.fn();
const mockWidgetRoot = jest.fn();
const mockUseStatsVideoPlays = jest.fn();
const mockDescribeError = jest.fn();
const mockUseEntityRecords = jest.fn();
const mockCanUser = jest.fn();
const mockHasFinishedResolution = jest.fn();
const mockIsSimpleSite = jest.fn();
const mockCurrentUserCan = jest.fn();
const mockInvalidateResolution = jest.fn();
const mockVideoUploader = jest.fn();
const mockStartVideoUpload = jest.fn();

jest.mock( '@automattic/jetpack-script-data', () => ( {
	currentUserCan: ( capability: string ) => mockCurrentUserCan( capability ),
	getAdminUrl: ( path: string ) => `https://example.com/blog/wp-admin/${ path }`,
	isSimpleSite: () => mockIsSimpleSite(),
} ) );

jest.mock( '@wordpress/core-data', () => ( {
	store: {},
	useEntityRecords: ( ...args: unknown[] ) => mockUseEntityRecords( ...args ),
} ) );

jest.mock( '@wordpress/data', () => ( {
	useDispatch: () => ( { invalidateResolution: mockInvalidateResolution } ),
	useSelect: ( selector: ( select: () => Record< string, jest.Mock > ) => unknown ) =>
		selector( () => ( {
			canUser: mockCanUser,
			hasFinishedResolution: mockHasFinishedResolution,
		} ) ),
} ) );

// The SDK has no implementation outside the dashboard, so the suite stands in for it.
jest.mock( '@automattic/jetpack-premium-analytics-sdk', () => ( {
	Leaderboard: ( props: Record< string, unknown > ) => {
		mockLeaderboard( props );
		return <div />;
	},
	useReportActions: ( options: Record< string, unknown > ) => {
		mockReportActions( options );
		return true;
	},
	WidgetRoot: ( { children, ...props }: { children: ReactNode } ) => {
		mockWidgetRoot( props );
		return children;
	},
	describeError: ( ...args: unknown[] ) => mockDescribeError( ...args ),
	getVideoPosterUrl: ( poster?: string ) => poster && `${ poster }?resize=100%2C56`,
	useStatsVideoPlays: ( ...args: unknown[] ) => mockUseStatsVideoPlays( ...args ),
	useWidgetRootContext: () => ( { reportParams: { from: '2026-06-01', to: '2026-06-16' } } ),
} ) );

jest.mock( '../../../src/dashboard/utils/start-video-upload', () => ( {
	startVideoUpload: ( ...args: unknown[] ) => mockStartVideoUpload( ...args ),
} ) );

// The uploader body has its own suite; the real hook keeps the phase, as in the widget.
jest.mock( '../components/video-uploader', () => ( {
	useVideoUpload: jest.requireActual( '../components/video-uploader/use-video-upload' )
		.useVideoUpload,
	VideoUploader: ( props: Record< string, unknown > ) => {
		mockVideoUploader( props );
		return <div>Upload your first video</div>;
	},
} ) );

const refetch = jest.fn();
const noPlaysEmpty = {
	icon: videoIcon,
	description: 'No video plays in this period yet.',
	action: {
		label: 'Manage videos',
		href: 'https://example.com/blog/wp-admin/admin.php?page=jetpack-videopress',
	},
};

const videoPlays = ( overrides: Record< string, unknown > = {} ) => ( {
	primary: { isPending: false, isError: false },
	comparisonRows: {
		rows: [
			{
				id: 101,
				label: 'Walkthrough',
				link: 'https://example.com/a/',
				plays: 100,
				previousPlays: 80,
				poster: 'https://i0.wp.com/v/a.jpg',
			},
			{ id: 102, label: 'Teaser', link: null, plays: 40 },
		],
	},
	hasComparison: true,
	isLoading: false,
	isFetching: false,
	isError: false,
	error: null,
	refetch,
	...overrides,
} );

const leaderboardProps = () => mockLeaderboard.mock.lastCall?.[ 0 ];
const uploaderProps = () => mockVideoUploader.mock.lastCall?.[ 0 ];
const uploadCallbacks = () => mockStartVideoUpload.mock.lastCall?.[ 1 ];
const videoFile = new File( [ 'x' ], 'holiday.mp4', { type: 'video/mp4' } );

describe( 'Top videos widget', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockUseStatsVideoPlays.mockReturnValue( videoPlays() );
		mockDescribeError.mockReturnValue( { description: 'Described.' } );
		// What the hook returns while disabled.
		mockUseEntityRecords.mockReturnValue( { records: [], hasResolved: false } );
		mockCanUser.mockReturnValue( true );
		mockHasFinishedResolution.mockReturnValue( true );
		mockIsSimpleSite.mockReturnValue( false );
		mockCurrentUserCan.mockReturnValue( true );
	} );

	it( 'requests its own number of videos for the dashboard window', () => {
		render( <TopVideos attributes={ {} } /> );

		expect( mockUseStatsVideoPlays ).toHaveBeenCalledWith(
			{ from: '2026-06-01', to: '2026-06-16', max: 10 },
			{ maxRows: 10 }
		);
	} );

	it( 'hands the host attributes and error handler to the widget root', () => {
		const attributes = { reportParams: { from: '2026-06-01', to: '2026-06-16' } };
		const setError = jest.fn();

		render( <TopVideos attributes={ attributes } setError={ setError } /> );

		expect( mockWidgetRoot ).toHaveBeenCalledWith( { attributes, setError } );
	} );

	it( 'turns each video into a row that links to its detail page', () => {
		render( <TopVideos attributes={ {} } /> );

		expect( leaderboardProps().rows ).toEqual( [
			{
				id: '101',
				label: 'Walkthrough',
				value: 100,
				previousValue: 80,
				media: {
					kind: 'thumbnail',
					url: 'https://i0.wp.com/v/a.jpg?resize=100%2C56',
					alt: '',
					fallbackIcon: videoIcon,
				},
				action: { kind: 'videoLink', id: 101, href: 'https://example.com/a/' },
			},
			{
				id: '102',
				label: 'Teaser',
				value: 40,
				previousValue: undefined,
				media: {
					kind: 'thumbnail',
					url: undefined,
					alt: '',
					fallbackIcon: videoIcon,
				},
				action: { kind: 'videoLink', id: 102, href: null },
			},
		] );
	} );

	it( 'passes the request status through', () => {
		mockUseStatsVideoPlays.mockReturnValue( videoPlays( { isFetching: true } ) );

		render( <TopVideos attributes={ {} } /> );

		expect( leaderboardProps().status ).toEqual( {
			isLoading: false,
			isFetching: true,
			isError: false,
			hasComparison: true,
			refetch,
		} );
	} );

	it( 'counts a pending query as loading', () => {
		mockUseStatsVideoPlays.mockReturnValue(
			videoPlays( { primary: { isPending: true }, comparisonRows: undefined } )
		);

		render( <TopVideos attributes={ {} } /> );

		expect( leaderboardProps().status.isLoading ).toBe( true );
		expect( leaderboardProps().rows ).toEqual( [] );
	} );

	it( 'keeps a failed refetch quiet while rows are on screen', () => {
		mockUseStatsVideoPlays.mockReturnValue( videoPlays( { isError: true } ) );

		render( <TopVideos attributes={ {} } /> );

		expect( leaderboardProps().status.isError ).toBe( false );
	} );

	it( 'reports the failure when there are no rows to show', () => {
		const error = { status: 500 };
		mockUseStatsVideoPlays.mockReturnValue(
			videoPlays( { isError: true, error, comparisonRows: { rows: [] } } )
		);

		render( <TopVideos attributes={ {} } /> );

		expect( leaderboardProps().status.isError ).toBe( true );
		expect( mockDescribeError ).toHaveBeenCalledWith( error, {
			retryDescription: "We couldn't load video plays. Please try again in a moment.",
			onRetry: refetch,
		} );
		expect( leaderboardProps().error ).toEqual( { description: 'Described.' } );
	} );

	it( 'declares View all to the Videos report in its manifest', () => {
		expect( manifest.actions ).toEqual( [
			{
				id: 'view-all',
				label: 'View all',
				relevance: 'high',
				href: 'admin.php?page=jetpack-premium-analytics-wp-admin&p=%2Freports%2Fvideos',
			},
		] );
	} );

	it( 'declares the Videos report CSV, by report id, to the host', () => {
		render( <TopVideos attributes={ {} } /> );

		expect( mockReportActions ).toHaveBeenLastCalledWith( {
			csv: {
				report: 'videos',
				status: { isLoading: false, isFetching: false, isError: false },
				rowCount: 2,
			},
		} );
	} );

	it( 'skips the media query while video plays are present', () => {
		render( <TopVideos attributes={ {} } /> );

		expect( mockUseEntityRecords ).toHaveBeenCalledWith(
			'postType',
			'attachment',
			{ per_page: 1, _fields: 'id', videopress_has_guid: 1 },
			{ enabled: false }
		);
		expect( mockCanUser ).not.toHaveBeenCalled();
	} );

	it( 'offers the upload dropzone, with the report actions, when no VideoPress media exists', () => {
		mockUseStatsVideoPlays.mockReturnValue( videoPlays( { comparisonRows: { rows: [] } } ) );
		mockUseEntityRecords.mockReturnValue( { records: [], hasResolved: true } );

		render( <TopVideos attributes={ {} } /> );

		expect( mockUseEntityRecords ).toHaveBeenCalledWith(
			'postType',
			'attachment',
			{ per_page: 1, _fields: 'id', videopress_has_guid: 1 },
			{ enabled: true }
		);
		expect( mockLeaderboard ).not.toHaveBeenCalled();
		expect( screen.getByText( 'Upload your first video' ) ).toBeInTheDocument();
		expect( mockReportActions ).toHaveBeenLastCalledWith( {
			csv: {
				report: 'videos',
				status: { isLoading: false, isFetching: false, isError: false },
				rowCount: 0,
			},
		} );
	} );

	it( 'keeps the upload on screen and refreshes the media check once it lands', () => {
		mockUseStatsVideoPlays.mockReturnValue( videoPlays( { comparisonRows: { rows: [] } } ) );
		mockUseEntityRecords.mockReturnValue( { records: [], hasResolved: true } );
		const { rerender } = render( <TopVideos attributes={ {} } /> );

		act( () => uploaderProps().onUpload( videoFile ) );
		const media = { id: 7, guid: 'abc', src: 'https://videopress.com/v/abc' };
		act( () => uploadCallbacks().onSuccess( media ) );
		// The refreshed check now finds the video; the upload body must not give way to the chart.
		mockUseEntityRecords.mockReturnValue( { records: [ { id: 7 } ], hasResolved: true } );
		rerender( <TopVideos attributes={ {} } /> );

		expect( mockInvalidateResolution ).toHaveBeenCalledWith( 'getEntityRecords', [
			'postType',
			'attachment',
			{ per_page: 1, _fields: 'id', videopress_has_guid: 1 },
		] );
		expect( mockLeaderboard ).not.toHaveBeenCalled();
		expect( uploaderProps().phase ).toEqual( { status: 'uploaded', file: videoFile, media } );
	} );

	it.each( [
		[ 'reloads for a new range', { isLoading: true, comparisonRows: undefined } ],
		[ 'fails', { isError: true, error: { status: 500 }, comparisonRows: { rows: [] } } ],
	] )( 'keeps an upload in flight on screen while the stats request %s', ( _, stats ) => {
		mockUseStatsVideoPlays.mockReturnValue( videoPlays( { comparisonRows: { rows: [] } } ) );
		mockUseEntityRecords.mockReturnValue( { records: [], hasResolved: true } );
		const { rerender } = render( <TopVideos attributes={ {} } /> );
		act( () => uploaderProps().onUpload( videoFile ) );

		mockUseStatsVideoPlays.mockReturnValue( videoPlays( stats ) );
		rerender( <TopVideos attributes={ {} } /> );

		expect( mockLeaderboard ).not.toHaveBeenCalled();
		expect( uploaderProps().phase ).toEqual( {
			status: 'uploading',
			file: videoFile,
			progress: 0,
		} );
	} );

	it( 'keeps the widget loading while the empty library check is pending', () => {
		mockUseStatsVideoPlays.mockReturnValue( videoPlays( { comparisonRows: { rows: [] } } ) );
		mockUseEntityRecords.mockReturnValue( { records: null, hasResolved: false } );

		render( <TopVideos attributes={ {} } /> );

		expect( leaderboardProps().status.isLoading ).toBe( true );
		expect( leaderboardProps().empty ).toBeUndefined();
	} );

	it( 'keeps the widget loading while upload permission is unresolved', () => {
		mockUseStatsVideoPlays.mockReturnValue( videoPlays( { comparisonRows: { rows: [] } } ) );
		mockCanUser.mockReturnValue( undefined );
		mockHasFinishedResolution.mockReturnValue( false );

		render( <TopVideos attributes={ {} } /> );

		expect( leaderboardProps().status.isLoading ).toBe( true );
		expect( mockUseEntityRecords ).toHaveBeenCalledWith(
			'postType',
			'attachment',
			{ per_page: 1, _fields: 'id', videopress_has_guid: 1 },
			{ enabled: false }
		);
	} );

	it( 'uses the Simple-site video filter before concluding that the library is empty', () => {
		mockUseStatsVideoPlays.mockReturnValue( videoPlays( { comparisonRows: { rows: [] } } ) );
		mockIsSimpleSite.mockReturnValue( true );
		mockUseEntityRecords.mockReturnValue( { records: [], hasResolved: true } );

		render( <TopVideos attributes={ {} } /> );

		expect( mockUseEntityRecords ).toHaveBeenCalledWith(
			'postType',
			'attachment',
			{ per_page: 1, _fields: 'id', videopress_has_guid: 1, videopress_only_videos: 1 },
			{ enabled: true }
		);
		expect( screen.getByText( 'Upload your first video' ) ).toBeInTheDocument();
	} );

	it.each( [
		[ 'an existing video', { records: [ { id: 42 } ], hasResolved: true } ],
		[ 'a failed media query', { records: null, hasResolved: true } ],
	] )( 'names the missing plays and links the videos for %s', ( _, media ) => {
		mockUseStatsVideoPlays.mockReturnValue( videoPlays( { comparisonRows: { rows: [] } } ) );
		mockUseEntityRecords.mockReturnValue( media );

		render( <TopVideos attributes={ {} } /> );

		expect( leaderboardProps().status.isLoading ).toBe( false );
		expect( leaderboardProps().empty ).toEqual( noPlaysEmpty );
	} );

	it( 'leaves Manage videos out for users who cannot open the VideoPress dashboard', () => {
		mockUseStatsVideoPlays.mockReturnValue( videoPlays( { comparisonRows: { rows: [] } } ) );
		mockUseEntityRecords.mockReturnValue( { records: [ { id: 42 } ], hasResolved: true } );
		mockCurrentUserCan.mockReturnValue( false );

		render( <TopVideos attributes={ {} } /> );

		expect( mockCurrentUserCan ).toHaveBeenCalledWith( 'manage_options' );
		expect( leaderboardProps().empty ).toEqual( { ...noPlaysEmpty, action: undefined } );
	} );

	it.each( [
		[ 'the user cannot upload', false ],
		[ 'the permission request fails', undefined ],
	] )( 'names the missing plays without an action or a media query when %s', ( _, canUser ) => {
		mockUseStatsVideoPlays.mockReturnValue( videoPlays( { comparisonRows: { rows: [] } } ) );
		mockCanUser.mockReturnValue( canUser );

		render( <TopVideos attributes={ {} } /> );

		expect( leaderboardProps().status.isLoading ).toBe( false );

		expect( mockUseEntityRecords ).toHaveBeenCalledWith(
			'postType',
			'attachment',
			{ per_page: 1, _fields: 'id', videopress_has_guid: 1 },
			{ enabled: false }
		);
		expect( leaderboardProps().empty ).toEqual( { ...noPlaysEmpty, action: undefined } );
	} );
} );
