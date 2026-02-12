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
	beforeEach( () => {
		jest.clearAllMocks();
		mockUseEntityRecord.mockReturnValue( {
			record: null,
			isResolving: false,
			hasEdits: false,
		} );
		mockUseSelect.mockReturnValue( null );
	} );

	it( 'returns null values when ref is undefined', () => {
		const result = useSyncedForm( undefined );

		expect( result.isLoading ).toBe( false );
		expect( result.syncedAttributes ).toBeNull();
		expect( result.syncedInnerBlocks ).toBeNull();
		expect( result.syncedForm ).toBeNull();
	} );

	it( 'returns loading state when resolving', () => {
		mockUseEntityRecord.mockReturnValue( {
			record: null,
			isResolving: true,
			hasEdits: false,
		} );

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

		mockUseEntityRecord.mockReturnValue( {
			record: { content: { raw: '<!-- old content -->' } },
			isResolving: false,
			hasEdits: true,
		} );
		mockUseSelect.mockReturnValue( { blocks: pendingBlocks } );

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

		mockUseEntityRecord.mockReturnValue( {
			record: { content: { raw: '<!-- saved content -->' } },
			isResolving: false,
			hasEdits: true,
		} );
		mockUseSelect.mockReturnValue( { content: '<!-- pending content -->' } );
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

		mockUseEntityRecord.mockReturnValue( {
			record: { content: { raw: '<!-- saved form -->' } },
			isResolving: false,
			hasEdits: false,
		} );
		mockUseSelect.mockReturnValue( null );
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

		mockUseEntityRecord.mockReturnValue( {
			record: { content: { raw: '...' } },
			isResolving: false,
			hasEdits: true,
		} );
		mockUseSelect.mockReturnValue( { blocks: blocksWithLock } );

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

		mockUseEntityRecord.mockReturnValue( {
			record: { content: { raw: '...' } },
			isResolving: false,
			hasEdits: true,
		} );
		mockUseSelect.mockReturnValue( { blocks: wrongBlock } );

		const result = useSyncedForm( 123 );

		expect( result.syncedAttributes ).toBeNull();
		expect( result.syncedInnerBlocks ).toBeNull();
	} );
} );
