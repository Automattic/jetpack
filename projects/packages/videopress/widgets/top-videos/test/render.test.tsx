/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import { video as videoIcon } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import TopVideos from '../render';
import type { ReactNode } from 'react';

const mockLeaderboard = jest.fn();
const mockDownloadButton = jest.fn();
const mockWidgetRoot = jest.fn();
const mockUseStatsVideoPlays = jest.fn();
const mockDescribeError = jest.fn();
const mockUseEntityRecords = jest.fn();
const mockCanUser = jest.fn();
const mockHasFinishedResolution = jest.fn();
const mockIsSimpleSite = jest.fn();

jest.mock( '@automattic/jetpack-script-data', () => ( {
	getAdminUrl: ( path: string ) => `https://example.com/blog/wp-admin/${ path }`,
	isSimpleSite: () => mockIsSimpleSite(),
} ) );

jest.mock( '@wordpress/core-data', () => ( {
	store: {},
	useEntityRecords: ( ...args: unknown[] ) => mockUseEntityRecords( ...args ),
} ) );

jest.mock( '@wordpress/data', () => ( {
	useSelect: ( selector: ( select: () => Record< string, jest.Mock > ) => unknown ) =>
		selector( () => ( {
			canUser: mockCanUser,
			hasFinishedResolution: mockHasFinishedResolution,
		} ) ),
} ) );

// The SDK has no implementation outside the dashboard, so the suite stands in for it.
jest.mock( '@automattic/jetpack-premium-analytics-sdk', () => ( {
	Leaderboard: ( props: { footer?: ReactNode } ) => {
		mockLeaderboard( props );
		return <div>{ props.footer }</div>;
	},
	ReportLink: ( { report }: { report: string } ) => <a href={ `#${ report }` }>View all</a>,
	ExporterCsvDownloadButton: ( props: Record< string, unknown > ) => {
		mockDownloadButton( props );
		return <button>Download CSV</button>;
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

const refetch = jest.fn();

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

	it( 'links the footer to the Videos report', () => {
		render( <TopVideos attributes={ {} } /> );

		expect( screen.getByRole( 'link', { name: 'View all' } ) ).toHaveAttribute( 'href', '#videos' );
	} );

	it( 'offers the Videos report CSV from the footer, by report id', () => {
		render( <TopVideos attributes={ {} } /> );

		expect( screen.getByRole( 'button', { name: 'Download CSV' } ) ).toBeInTheDocument();
		expect( mockDownloadButton ).toHaveBeenCalledWith( {
			report: 'videos',
			status: { isLoading: false, isFetching: false, isError: false },
			rowCount: 2,
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

	it( 'offers general media upload and hides the footer when no VideoPress media exists', () => {
		mockUseStatsVideoPlays.mockReturnValue( videoPlays( { comparisonRows: { rows: [] } } ) );
		mockUseEntityRecords.mockReturnValue( { records: [], hasResolved: true } );

		render( <TopVideos attributes={ {} } /> );

		expect( mockUseEntityRecords ).toHaveBeenCalledWith(
			'postType',
			'attachment',
			{ per_page: 1, _fields: 'id', videopress_has_guid: 1 },
			{ enabled: true }
		);
		expect( leaderboardProps().empty ).toMatchObject( {
			description: 'You don’t have videos uploaded yet.',
			action: {
				label: 'Upload video',
				href: 'https://example.com/blog/wp-admin/media-new.php',
			},
		} );
		expect( screen.queryByRole( 'link', { name: 'View all' } ) ).not.toBeInTheDocument();
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
		expect( leaderboardProps().empty.description ).toBe( 'You don’t have videos uploaded yet.' );
	} );

	it.each( [
		[ 'an existing video', { records: [ { id: 42 } ], hasResolved: true } ],
		[ 'a failed media query', { records: null, hasResolved: true } ],
	] )( 'keeps the generic empty state and footer for %s', ( _, media ) => {
		mockUseStatsVideoPlays.mockReturnValue( videoPlays( { comparisonRows: { rows: [] } } ) );
		mockUseEntityRecords.mockReturnValue( media );

		render( <TopVideos attributes={ {} } /> );

		expect( leaderboardProps().status.isLoading ).toBe( false );
		expect( leaderboardProps().empty ).toBeUndefined();
		expect( screen.getByRole( 'link', { name: 'View all' } ) ).toBeInTheDocument();
	} );

	it.each( [
		[ 'the user cannot upload', false ],
		[ 'the permission request fails', undefined ],
	] )( 'keeps the generic empty state without querying media when %s', ( _, canUser ) => {
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
		expect( leaderboardProps().empty ).toBeUndefined();
		expect( screen.getByRole( 'link', { name: 'View all' } ) ).toBeInTheDocument();
	} );
} );
