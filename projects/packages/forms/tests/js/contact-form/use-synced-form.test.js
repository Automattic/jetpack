/**
 * Tests for useSyncedForm hook logic
 */

import { beforeEach, describe, expect, it, jest } from '@jest/globals';

// Mock WordPress dependencies
const mockParse = jest.fn();
const mockUseEntityRecord = jest.fn();
const mockUseSelect = jest.fn();

await jest.unstable_mockModule( '@wordpress/blocks', () => ( {
	parse: mockParse,
} ) );

await jest.unstable_mockModule( '@wordpress/core-data', () => ( {
	store: 'core',
	useEntityRecord: mockUseEntityRecord,
} ) );

await jest.unstable_mockModule( '@wordpress/data', () => ( {
	useSelect: mockUseSelect,
} ) );

await jest.unstable_mockModule( '@wordpress/element', () => ( {
	useMemo: fn => fn(),
} ) );

const { useSyncedForm } = await import(
	'../../../src/blocks/contact-form/hooks/use-synced-form.ts'
);

describe( 'useSyncedForm', () => {
	/**
	 * useSelect is called twice in useSyncedForm:
	 * 1st call returns resolutionError, 2nd call returns pendingEdits.
	 * Use mockReturnValueOnce to control each call independently.
	 *
	 * @param {object}  root0                 - Mock configuration.
	 * @param {object}  root0.record          - Entity record to return.
	 * @param {boolean} root0.isResolving     - Whether the entity is resolving.
	 * @param {boolean} root0.hasEdits        - Whether the entity has pending edits.
	 * @param {string}  root0.status          - Resolution status.
	 * @param {object}  root0.resolutionError - Resolution error object.
	 * @param {object}  root0.pendingEdits    - Pending edits object.
	 */
	const setupMocks = ( {
		record = null,
		isResolving = false,
		hasEdits = false,
		status = 'SUCCESS',
		resolutionError = null,
		pendingEdits = null,
	} = {} ) => {
		mockUseEntityRecord.mockReset();
		mockUseSelect.mockReset();
		mockUseEntityRecord.mockReturnValue( { record, isResolving, hasEdits, status } );
		mockUseSelect.mockReturnValueOnce( resolutionError ).mockReturnValueOnce( pendingEdits );
	};

	beforeEach( () => {
		jest.clearAllMocks();
		setupMocks();
	} );

	it( 'returns null values when ref is undefined', () => {
		const result = useSyncedForm( undefined );

		expect( result.isLoading ).toBe( false );
		expect( result.syncedAttributes ).toBeNull();
		expect( result.syncedInnerBlocks ).toBeNull();
		expect( result.syncedForm ).toBeNull();
		expect( result.errorType ).toBeNull();
	} );

	it( 'returns loading state when resolving', () => {
		setupMocks( { isResolving: true } );

		const result = useSyncedForm( 123 );

		expect( result.isLoading ).toBe( true );
	} );

	it( 'uses pending block edits when available', () => {
		const pendingBlocks = [
			{
				name: 'jetpack/contact-form',
				attributes: { to: 'test@example.com', lock: { remove: true } },
				innerBlocks: [ { name: 'jetpack/field-name' } ],
			},
		];

		setupMocks( {
			record: { content: { raw: '<!-- old content -->' } },
			hasEdits: true,
			pendingEdits: { blocks: pendingBlocks },
		} );

		const result = useSyncedForm( 123 );

		expect( result.syncedAttributes ).toEqual( {
			to: 'test@example.com',
			ref: 123,
		} );
		expect( result.syncedInnerBlocks ).toEqual( [ { name: 'jetpack/field-name' } ] );
	} );

	it( 'parses pending content edits when blocks not available', () => {
		const parsedBlocks = [
			{
				name: 'jetpack/contact-form',
				attributes: { subject: 'Contact Us' },
				innerBlocks: [],
			},
		];

		setupMocks( {
			record: { content: { raw: '<!-- saved content -->' } },
			hasEdits: true,
			pendingEdits: { content: '<!-- pending content -->' },
		} );
		mockParse.mockReturnValue( parsedBlocks );

		const result = useSyncedForm( 456 );

		expect( mockParse ).toHaveBeenCalledWith( '<!-- pending content -->' );
		expect( result.syncedAttributes ).toEqual( {
			subject: 'Contact Us',
			ref: 456,
		} );
	} );

	it( 'falls back to saved record when no pending edits', () => {
		const savedBlocks = [
			{
				name: 'jetpack/contact-form',
				attributes: { to: 'saved@example.com' },
				innerBlocks: [ { name: 'jetpack/field-email' } ],
			},
		];

		setupMocks( {
			record: { content: { raw: '<!-- saved form -->' } },
		} );
		mockParse.mockReturnValue( savedBlocks );

		const result = useSyncedForm( 789 );

		expect( mockParse ).toHaveBeenCalledWith( '<!-- saved form -->' );
		expect( result.syncedAttributes ).toEqual( {
			to: 'saved@example.com',
			ref: 789,
		} );
	} );

	it( 'strips lock attribute from synced attributes', () => {
		const blocksWithLock = [
			{
				name: 'jetpack/contact-form',
				attributes: { to: 'test@example.com', lock: { move: true, remove: true } },
				innerBlocks: [],
			},
		];

		setupMocks( {
			record: { content: { raw: '...' } },
			hasEdits: true,
			pendingEdits: { blocks: blocksWithLock },
		} );

		const result = useSyncedForm( 123 );

		expect( result.syncedAttributes.lock ).toBeUndefined();
		expect( result.syncedAttributes.to ).toBe( 'test@example.com' );
	} );

	it( 'returns null when block is not jetpack/contact-form', () => {
		const wrongBlock = [
			{
				name: 'core/paragraph',
				attributes: {},
				innerBlocks: [],
			},
		];

		setupMocks( {
			record: { content: { raw: '...' } },
			hasEdits: true,
			pendingEdits: { blocks: wrongBlock },
		} );

		const result = useSyncedForm( 123 );

		expect( result.syncedAttributes ).toBeNull();
		expect( result.syncedInnerBlocks ).toBeNull();
	} );

	describe( 'errorType', () => {
		it( 'returns permission_denied when resolution error has status 403', () => {
			setupMocks( {
				resolutionError: { status: 403 },
			} );

			const result = useSyncedForm( 123 );

			expect( result.errorType ).toBe( 'permission_denied' );
			expect( result.syncedForm ).toBeNull();
		} );

		it( 'returns not_found when resolution error has status 404', () => {
			setupMocks( {
				resolutionError: { status: 404 },
			} );

			const result = useSyncedForm( 123 );

			expect( result.errorType ).toBe( 'not_found' );
			expect( result.syncedForm ).toBeNull();
		} );

		it( 'returns not_found when record is null with no resolution error', () => {
			setupMocks();

			const result = useSyncedForm( 123 );

			expect( result.errorType ).toBe( 'not_found' );
		} );

		it( 'returns null errorType when record exists', () => {
			const savedBlocks = [
				{
					name: 'jetpack/contact-form',
					attributes: { to: 'test@example.com' },
					innerBlocks: [],
				},
			];

			setupMocks( {
				record: { content: { raw: '<!-- form -->' } },
			} );
			mockParse.mockReturnValue( savedBlocks );

			const result = useSyncedForm( 123 );

			expect( result.errorType ).toBeNull();
		} );

		it( 'returns null errorType when ref is undefined', () => {
			const result = useSyncedForm( undefined );

			expect( result.errorType ).toBeNull();
		} );

		it( 'returns null errorType while still resolving', () => {
			setupMocks( { isResolving: true } );

			const result = useSyncedForm( 123 );

			expect( result.errorType ).toBeNull();
		} );
	} );
} );
