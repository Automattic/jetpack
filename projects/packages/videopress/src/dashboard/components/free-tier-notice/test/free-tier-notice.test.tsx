import analytics from '@automattic/jetpack-analytics';
import useProductCheckoutWorkflow from '@automattic/jetpack-connection/hooks/use-product-checkout-workflow';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FreeTierNotice, { FREE_TIER_AT_LIMIT_MESSAGE } from '..';
import { mockApiFetch } from '../../../test-utils/mock-api-fetch';
import { createTestWrapper } from '../../../test-utils/query-client-wrapper';

jest.mock( '@automattic/jetpack-analytics', () => ( {
	__esModule: true,
	default: {
		initialize: jest.fn(),
		tracks: { recordEvent: jest.fn() },
	},
} ) );

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );

jest.mock( '@automattic/jetpack-connection/hooks/use-product-checkout-workflow', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );

const mockedCheckoutWorkflow = useProductCheckoutWorkflow as jest.Mock;
const mockedAnalytics = analytics as unknown as {
	tracks: { recordEvent: jest.Mock };
};

const setInitialState = ( state: unknown ) => {
	( window as unknown as { JPVIDEOPRESS_INITIAL_STATE?: unknown } ).JPVIDEOPRESS_INITIAL_STATE =
		state;
};

const setScriptData = () => {
	( window as unknown as { JetpackScriptData?: unknown } ).JetpackScriptData = {
		site: { admin_url: 'https://example.com/wp-admin/' },
	};
};

const DEFAULT_STATE = {
	product: { slug: 'jetpack_videopress' },
	siteData: { adminUrl: 'https://example.com/wp-admin/' },
};

let mockRun: jest.Mock;

describe( 'FreeTierNotice', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		setInitialState( DEFAULT_STATE );
		mockRun = jest.fn();
		mockedCheckoutWorkflow.mockReturnValue( { run: mockRun } );
		setScriptData();
		mockApiFetch( () => ( { detached: 0 } ) );
	} );

	it( 'records the notice and its current video count when rendered', async () => {
		render( <FreeTierNotice location="library_at_limit" videoCount={ 1 } />, {
			wrapper: createTestWrapper(),
		} );
		await Promise.resolve();
		expect( screen.getByRole( 'link', { name: 'Upgrade' } ) ).toBeInTheDocument();
		expect( mockedAnalytics.tracks.recordEvent ).toHaveBeenCalledWith(
			'jetpack_videopress_upsell_impression',
			{
				location: 'library_at_limit',
				video_count_known: true,
				video_count: 1,
			}
		);
	} );

	it( 'drives the shared checkout workflow with the VideoPress product and redirect', () => {
		render( <FreeTierNotice location="overview" />, { wrapper: createTestWrapper() } );

		expect( mockedCheckoutWorkflow ).toHaveBeenCalledWith( {
			productSlug: 'jetpack_videopress',
			// Relative to wp-admin; the REST endpoint makes it absolute via
			// `admin_url()`. An absolute URL here would be doubled and 404.
			redirectUrl: 'admin.php?page=jetpack-videopress',
			useBlogIdSuffix: true,
			from: 'jetpack-videopress',
		} );
	} );

	it( 'renders the free-plan copy by default', () => {
		render( <FreeTierNotice location="overview" />, { wrapper: createTestWrapper() } );

		expect(
			screen.getByText(
				'You’re on the free plan, which allows 1 video upload. Upgrade for more storage and unlimited uploads.'
			)
		).toBeInTheDocument();
	} );

	it( 'renders the provided message instead of the default copy', () => {
		render( <FreeTierNotice location="library_at_limit" message={ FREE_TIER_AT_LIMIT_MESSAGE } />, {
			wrapper: createTestWrapper(),
		} );

		expect(
			screen.getByText( 'You’ve reached the free plan’s 1-video limit. Upgrade to upload more.' )
		).toBeInTheDocument();
		expect( screen.queryByText( /You’re on the free plan/ ) ).not.toBeInTheDocument();
	} );

	it.each( [ 'overview', 'library_at_limit', 'settings_at_limit' ] as const )(
		'records the %s notice location and starts checkout on click',
		async location => {
			const user = userEvent.setup();
			const { rerender } = render( <FreeTierNotice location={ location } />, {
				wrapper: createTestWrapper(),
			} );
			rerender( <FreeTierNotice location={ location } /> );
			await Promise.resolve();
			expect( mockedAnalytics.tracks.recordEvent ).toHaveBeenCalledTimes( 1 );
			expect( mockedAnalytics.tracks.recordEvent ).toHaveBeenCalledWith(
				'jetpack_videopress_upsell_impression',
				{ location, video_count_known: false }
			);

			await user.click( screen.getByRole( 'link', { name: 'Upgrade' } ) );

			expect( mockedAnalytics.tracks.recordEvent ).toHaveBeenCalledWith(
				'jetpack_videopress_upgrade_trigger_link_click',
				{ location }
			);
			expect( mockedAnalytics.tracks.recordEvent ).toHaveBeenCalledTimes( 2 );
			// `run` is deferred to a microtask; userEvent's await flushes it.
			expect( mockRun ).toHaveBeenCalledTimes( 1 );
		}
	);

	it( 'offers an unattached license next to the upgrade', async () => {
		mockApiFetch( () => ( { detached: 1 } ) );
		render( <FreeTierNotice location="overview" />, { wrapper: createTestWrapper() } );

		await expect(
			screen.findByRole( 'link', { name: 'Activate license' } )
		).resolves.toHaveAttribute(
			'href',
			'https://example.com/wp-admin/admin.php?page=my-jetpack#/add-license'
		);
		expect( screen.getByRole( 'link', { name: 'Upgrade' } ) ).toBeInTheDocument();
	} );
} );
