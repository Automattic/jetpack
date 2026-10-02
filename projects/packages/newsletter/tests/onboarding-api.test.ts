const mockApiFetch = jest.fn();
const mockIsSimpleSite = jest.fn( () => false );
const mockGetSiteData = jest.fn( () => ( { wpcom: { blog_id: 123 } } ) );
const mockRestApi = {
	setApiRoot: jest.fn(),
	setApiNonce: jest.fn(),
	fetchSettings: jest.fn(),
	updateSettings: jest.fn(),
};

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: ( ...args: unknown[] ) => mockApiFetch( ...args ),
} ) );

jest.mock( '@automattic/jetpack-script-data', () => ( {
	__esModule: true,
	getSiteData: () => mockGetSiteData(),
	isSimpleSite: () => mockIsSimpleSite(),
} ) );

jest.mock( '@automattic/jetpack-api', () => ( {
	__esModule: true,
	default: mockRestApi,
} ) );

import {
	addNewsletterOnboardingSkippedSteps,
	fetchNewsletterOnboardingSkippedSteps,
} from '../src/settings/api';
import type { NewsletterOnboardingStepId } from '../src/settings/api';

const SETTING_NAME = 'jetpack_newsletter_onboarding_skipped_steps';
const STEP_IDS: NewsletterOnboardingStepId[] = [ 'subscribe_form', 'subscribers', 'send_newsletter' ];

describe( 'Newsletter onboarding Skip settings API', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockIsSimpleSite.mockReturnValue( false );
		mockGetSiteData.mockReturnValue( { wpcom: { blog_id: 123 } } );
	} );

	it( 'fetches the projection from the local WordPress settings endpoint', async () => {
		mockApiFetch.mockResolvedValue( { [ SETTING_NAME ]: [ 'subscribers' ] } );

		await expect( fetchNewsletterOnboardingSkippedSteps() ).resolves.toEqual( [ 'subscribers' ] );
		expect( mockApiFetch ).toHaveBeenCalledWith( { path: '/wp/v2/settings', method: 'GET' } );
		expect( mockRestApi.fetchSettings ).not.toHaveBeenCalled();
	} );

	it( 'adds skipped steps through the local WordPress settings endpoint', async () => {
		mockApiFetch.mockResolvedValue( { [ SETTING_NAME ]: STEP_IDS } );

		await expect( addNewsletterOnboardingSkippedSteps( STEP_IDS ) ).resolves.toEqual( STEP_IDS );
		expect( mockApiFetch ).toHaveBeenCalledWith( {
			path: '/wp/v2/settings',
			method: 'POST',
			data: { [ SETTING_NAME ]: STEP_IDS },
		} );
		expect( mockRestApi.updateSettings ).not.toHaveBeenCalled();
	} );

	it( 'fetches the projection from the existing Simple settings endpoint', async () => {
		mockIsSimpleSite.mockReturnValue( true );
		mockApiFetch.mockResolvedValue( { settings: { [ SETTING_NAME ]: [ 'send_newsletter' ] } } );

		await expect( fetchNewsletterOnboardingSkippedSteps() ).resolves.toEqual( [ 'send_newsletter' ] );
		expect( mockApiFetch ).toHaveBeenCalledWith( {
			path: '/rest/v1.4/sites/123/settings',
			method: 'GET',
		} );
	} );

	it( 'adds skipped steps through the existing Simple settings endpoint', async () => {
		mockIsSimpleSite.mockReturnValue( true );
		mockApiFetch.mockResolvedValue( { updated: { [ SETTING_NAME ]: STEP_IDS } } );

		await expect( addNewsletterOnboardingSkippedSteps( STEP_IDS ) ).resolves.toEqual( STEP_IDS );
		expect( mockApiFetch ).toHaveBeenCalledWith( {
			path: '/rest/v1.4/sites/123/settings',
			method: 'POST',
			data: { [ SETTING_NAME ]: STEP_IDS },
		} );
	} );

	it( 'does not fall back to the local endpoint when a Simple site ID is missing', async () => {
		mockIsSimpleSite.mockReturnValue( true );
		mockGetSiteData.mockReturnValue( { wpcom: { blog_id: 0 } } );

		await expect( fetchNewsletterOnboardingSkippedSteps() ).rejects.toThrow( 'site ID is required' );
		expect( mockApiFetch ).not.toHaveBeenCalled();
	} );
} );
