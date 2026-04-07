import { jest } from '@jest/globals';

// Mock @actions/core before importing the module under test.
const mockGetInput = jest.fn< ( name: string ) => string >();
jest.unstable_mockModule( '@actions/core', () => ( {
	getInput: mockGetInput,
} ) );

// Mock @linear/sdk before importing the module under test.
const mockCreateIssue = jest.fn();
const mockLinearClient = jest.fn().mockImplementation( () => ( {
	createIssue: mockCreateIssue,
} ) );
jest.unstable_mockModule( '@linear/sdk', () => ( {
	LinearClient: mockLinearClient,
} ) );

// Dynamic import after mocks are set up (required for ESM).
const { default: createLinearIssue } = await import( '../src/utils/linear/create-linear-issue.ts' );

describe( 'createLinearIssue', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	test( 'returns null when linear_api_key is not provided', async () => {
		mockGetInput.mockReturnValue( '' );

		const result = await createLinearIssue( 'Test title', 'Test description', 'team-123' );

		expect( result ).toBeNull();
		expect( mockLinearClient ).not.toHaveBeenCalled();
	} );

	test( 'creates a Linear issue and returns its details', async () => {
		mockGetInput.mockImplementation( ( name: string ) => {
			if ( name === 'linear_api_key' ) {
				return 'test-api-key';
			}
			return '';
		} );

		const mockIssue = {
			id: 'issue-id-123',
			url: 'https://linear.app/team/issue/TEAM-42',
			identifier: 'TEAM-42',
		};
		mockCreateIssue.mockResolvedValue( {
			success: true,
			issue: Promise.resolve( mockIssue ),
		} );

		const result = await createLinearIssue( 'Test title', 'Test description', 'team-123' );

		expect( mockLinearClient ).toHaveBeenCalledWith( { apiKey: 'test-api-key' } );
		expect( mockCreateIssue ).toHaveBeenCalledWith( {
			teamId: 'team-123',
			title: 'Test title',
			description: 'Test description',
		} );
		expect( result ).toEqual( {
			id: 'issue-id-123',
			url: 'https://linear.app/team/issue/TEAM-42',
			identifier: 'TEAM-42',
		} );
	} );

	test( 'uses explicit apiKey parameter over getInput fallback', async () => {
		mockGetInput.mockReturnValue( '' );

		const mockIssue = {
			id: 'issue-id-456',
			url: 'https://linear.app/team/issue/TEAM-99',
			identifier: 'TEAM-99',
		};
		mockCreateIssue.mockResolvedValue( {
			success: true,
			issue: Promise.resolve( mockIssue ),
		} );

		const result = await createLinearIssue(
			'Explicit key title',
			'Explicit key description',
			'team-456',
			'explicit-api-key'
		);

		expect( mockLinearClient ).toHaveBeenCalledWith( { apiKey: 'explicit-api-key' } );
		expect( result ).toEqual( mockIssue );
	} );

	test( 'returns null when issue creation fails', async () => {
		mockGetInput.mockImplementation( ( name: string ) => {
			if ( name === 'linear_api_key' ) {
				return 'test-api-key';
			}
			return '';
		} );

		mockCreateIssue.mockResolvedValue( {
			success: false,
			issue: Promise.resolve( null ),
		} );

		const result = await createLinearIssue( 'Test title', 'Test description', 'team-123' );

		expect( result ).toBeNull();
	} );

	test( 'returns null when createIssue throws an error', async () => {
		mockGetInput.mockImplementation( ( name: string ) => {
			if ( name === 'linear_api_key' ) {
				return 'test-api-key';
			}
			return '';
		} );

		mockCreateIssue.mockRejectedValue( new Error( 'API error' ) );

		const result = await createLinearIssue( 'Test title', 'Test description', 'team-123' );

		expect( result ).toBeNull();
	} );
} );
