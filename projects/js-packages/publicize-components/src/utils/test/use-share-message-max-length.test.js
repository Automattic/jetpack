import { renderHook } from '@testing-library/react';
import useSocialMediaConnections from '../../hooks/use-social-media-connections';
import {
	MAXIMUM_MESSAGE_LENGTH,
	useShareMessageMaxLength,
	getShareMessageMaxLength,
} from '../use-share-message-max-length';

jest.mock( '../../hooks/use-social-media-connections', () => jest.fn() );

describe( 'getShareMessageMaxLength', () => {
	it( 'returns default max length when no services are provided', () => {
		expect( getShareMessageMaxLength() ).toBe( MAXIMUM_MESSAGE_LENGTH );
		expect( getShareMessageMaxLength( [] ) ).toBe( MAXIMUM_MESSAGE_LENGTH );
	} );

	it( 'returns character limit of a single service', () => {
		const services = [ 'bluesky' ];
		expect( getShareMessageMaxLength( services ) ).toBe( 300 );
	} );

	it( 'returns the minimum character limit among multiple services', () => {
		const services = [ 'twitter', 'facebook' ];
		expect( getShareMessageMaxLength( services ) ).toBe( 10000 );
	} );

	it( 'ignores undefined character limits', () => {
		const services = [ 'twitter', 'linkedin' ];
		expect( getShareMessageMaxLength( services ) ).toBe( 3000 );
	} );

	it( 'ignores services that are not in RESTRICTIONS', () => {
		const services = [ 'twitter', 'unknown-service', 'linkedin' ];
		expect( getShareMessageMaxLength( services ) ).toBe( 3000 );
	} );
} );

describe( 'useShareMessageMaxLength', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'returns default max length when no connections are enabled', () => {
		useSocialMediaConnections.mockReturnValue( { enabledConnections: [] } );
		const { result } = renderHook( useShareMessageMaxLength );
		expect( result.current ).toBe( MAXIMUM_MESSAGE_LENGTH );
	} );

	it( 'returns character limit of a single enabled connection', () => {
		useSocialMediaConnections.mockReturnValue( {
			enabledConnections: [ { service_name: 'bluesky' } ],
		} );
		const { result } = renderHook( useShareMessageMaxLength );
		expect( result.current ).toBe( 300 );
	} );

	it( 'returns the minimum character limit among multiple connections', () => {
		useSocialMediaConnections.mockReturnValue( {
			enabledConnections: [ { service_name: 'twitter' }, { service_name: 'facebook' } ],
		} );

		const { result } = renderHook( useShareMessageMaxLength );
		expect( result.current ).toBe( 10000 );
	} );

	it( 'ignores undefined character limits', () => {
		useSocialMediaConnections.mockReturnValue( {
			enabledConnections: [ { service_name: 'twitter' }, { service_name: 'linkedin' } ],
		} );

		const { result } = renderHook( useShareMessageMaxLength );
		expect( result.current ).toBe( 3000 );
	} );
} );
