import { useAiFeature } from '@automattic/jetpack-ai-client';
import { renderHook, act } from '@testing-library/react';
import { useSelect, useDispatch } from '@wordpress/data';
import useGenerateAll from '../hooks/use-generate-all';
import { suggestGuidelines } from '../lib/api';
import { areAllSectionDraftsEmpty, readAllSectionDrafts } from '../lib/drafts';
import { recordGuidelinesEvent } from '../lib/tracks';

jest.mock( '@wordpress/data', () => ( {
	useSelect: jest.fn(),
	useDispatch: jest.fn(),
	createReduxStore: jest.fn(),
	register: jest.fn(),
} ) );
jest.mock( '@automattic/jetpack-ai-client', () => ( { useAiFeature: jest.fn() } ) );
// The notices store is only an opaque token here (passed to the mocked
// useDispatch); mock it so the real module doesn't pull in @wordpress/components.
jest.mock( '@wordpress/notices', () => ( { store: {} } ) );
jest.mock( '../lib/api', () => ( { suggestGuidelines: jest.fn() } ) );
jest.mock( '../lib/drafts', () => ( {
	readAllSectionDrafts: jest.fn(),
	areAllSectionDraftsEmpty: jest.fn(),
} ) );
jest.mock( '../lib/tracks', () => ( { recordGuidelinesEvent: jest.fn() } ) );

const bag = {
	createErrorNotice: jest.fn(),
	startLoading: jest.fn(),
	stopLoading: jest.fn(),
	setSuggestion: jest.fn(),
	showUpgradeNotice: jest.fn(),
};

function setup( { hasFeature = true, loading = false } ) {
	useAiFeature.mockReturnValue( { hasFeature } );
	useDispatch.mockReturnValue( bag );
	useSelect.mockImplementation( map => map( () => ( { isLoading: () => loading } ) ) );
}

describe( 'useGenerateAll', () => {
	beforeEach( () => jest.clearAllMocks() );

	it( 'exposes the current loading state and feature flag', () => {
		setup( { hasFeature: true, loading: true } );
		const { result } = renderHook( () => useGenerateAll() );
		expect( result.current.loading ).toBe( true );
		expect( result.current.hasFeature ).toBe( true );
	} );

	it( 'shows the upgrade notice and does not call the API without an AI plan', async () => {
		setup( { hasFeature: false } );
		const { result } = renderHook( () => useGenerateAll() );

		await act( async () => {
			await result.current.generate();
		} );

		expect( bag.showUpgradeNotice ).toHaveBeenCalledTimes( 1 );
		expect( recordGuidelinesEvent ).toHaveBeenCalledWith( 'upgrade_notice', {
			trigger: 'generate_all',
		} );
		expect( suggestGuidelines ).not.toHaveBeenCalled();
	} );

	it( 'generates for all empty sections and applies each returned suggestion', async () => {
		setup( {} );
		readAllSectionDrafts.mockReturnValue( { site: '', copy: '', images: '', additional: '' } );
		areAllSectionDraftsEmpty.mockReturnValue( true );
		suggestGuidelines.mockResolvedValue( {
			suggestions: { site: 'S', copy: 'C' },
		} );

		const { result } = renderHook( () => useGenerateAll() );
		await act( async () => {
			await result.current.generate();
		} );

		// All-empty snapshot => no existing content, and the tracked action is "generate".
		expect( suggestGuidelines ).toHaveBeenCalledWith(
			[ 'site', 'copy', 'images', 'additional' ],
			{}
		);
		expect( recordGuidelinesEvent ).toHaveBeenCalledWith( 'generate_all', { action: 'generate' } );
		expect( bag.setSuggestion ).toHaveBeenCalledWith( 'site', 'S' );
		expect( bag.setSuggestion ).toHaveBeenCalledWith( 'copy', 'C' );
		expect( bag.setSuggestion ).toHaveBeenCalledTimes( 2 );
		expect( bag.stopLoading ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'passes only the non-empty drafts as existing content and records an improve action', async () => {
		setup( {} );
		readAllSectionDrafts.mockReturnValue( {
			site: 'A blog.',
			copy: '',
			images: '',
			additional: '',
		} );
		areAllSectionDraftsEmpty.mockReturnValue( false );
		suggestGuidelines.mockResolvedValue( { suggestions: { site: 'S2' } } );

		const { result } = renderHook( () => useGenerateAll() );
		await act( async () => {
			await result.current.generate();
		} );

		expect( suggestGuidelines ).toHaveBeenCalledWith( [ 'site', 'copy', 'images', 'additional' ], {
			site: 'A blog.',
		} );
		expect( recordGuidelinesEvent ).toHaveBeenCalledWith( 'generate_all', { action: 'improve' } );
	} );

	it( 'surfaces an error notice when nothing usable comes back', async () => {
		setup( {} );
		readAllSectionDrafts.mockReturnValue( { site: '', copy: '', images: '', additional: '' } );
		areAllSectionDraftsEmpty.mockReturnValue( true );
		suggestGuidelines.mockResolvedValue( { suggestions: {} } );

		const { result } = renderHook( () => useGenerateAll() );
		await act( async () => {
			await result.current.generate();
		} );

		expect( bag.setSuggestion ).not.toHaveBeenCalled();
		expect( bag.createErrorNotice ).toHaveBeenCalledTimes( 1 );
		expect( bag.stopLoading ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'surfaces an error notice when the request rejects', async () => {
		setup( {} );
		readAllSectionDrafts.mockReturnValue( { site: '', copy: '', images: '', additional: '' } );
		areAllSectionDraftsEmpty.mockReturnValue( true );
		suggestGuidelines.mockRejectedValue( new Error( 'network' ) );

		const { result } = renderHook( () => useGenerateAll() );
		await act( async () => {
			await result.current.generate();
		} );

		expect( bag.createErrorNotice ).toHaveBeenCalledTimes( 1 );
		expect( bag.stopLoading ).toHaveBeenCalledTimes( 1 );
	} );
} );
