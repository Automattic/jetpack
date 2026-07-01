/* eslint-disable import/order */
import { clearMockedScriptData, mockScriptData } from '../../../utils/test-utils';

mockScriptData();

jest.mock( '@automattic/jetpack-script-data', () => {
	const actual = jest.requireActual( '@automattic/jetpack-script-data' );
	return {
		...actual,
		siteHasFeature: jest.fn(),
	};
} );

jest.mock( '@wordpress/data', () => {
	const actual = jest.requireActual( '@wordpress/data' );
	const mocks = { useSelect: jest.fn() };
	return new Proxy( actual, {
		get( target, property ) {
			return mocks[ property as keyof typeof mocks ] ?? target[ property as keyof typeof target ];
		},
	} );
} );

jest.mock( '../../use-per-network-customization', () => ( {
	usePerNetworkCustomization: jest.fn(),
} ) );

jest.mock( '../../use-post-meta', () => ( {
	usePostMeta: jest.fn(),
} ) );

jest.mock( '../../use-social-preview-post-data', () => ( {
	useSocialPreviewPostData: jest.fn(),
} ) );

jest.mock( '../../use-social-media-message', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );

jest.mock( '../../use-featured-image', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );

jest.mock( '../../use-media-details', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );

jest.mock( '../../use-sig-preview', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );

import { act, renderHook } from '@testing-library/react';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useRenderMessageInputs, useRenderMessageItems } from '../';
import useFeaturedImage from '../../use-featured-image';
import useMediaDetails from '../../use-media-details';
import { usePerNetworkCustomization } from '../../use-per-network-customization';
import { usePostMeta } from '../../use-post-meta';
import useSigPreview from '../../use-sig-preview';
import useSocialMediaMessage from '../../use-social-media-message';
import { useSocialPreviewPostData } from '../../use-social-preview-post-data';
import { store as socialStore } from '../../../social-store';
import type { Connection } from '../../../social-store/types';

const mockSiteHasFeature = jest.requireMock( '@automattic/jetpack-script-data' )
	.siteHasFeature as jest.Mock;
const mockUseSelect = useSelect as jest.Mock;
const mockUsePerNetworkCustomization = usePerNetworkCustomization as jest.Mock;
const mockUsePostMeta = usePostMeta as jest.Mock;
const mockUseSocialPreviewPostData = useSocialPreviewPostData as jest.Mock;
const mockUseSocialMediaMessage = useSocialMediaMessage as jest.Mock;
const mockUseFeaturedImage = useFeaturedImage as jest.Mock;
const mockUseMediaDetails = useMediaDetails as jest.Mock;
const mockUseSigPreview = useSigPreview as jest.Mock;

const conn = ( overrides: Partial< Connection > = {} ): Connection =>
	( {
		connection_id: 'c1',
		display_name: 'User',
		external_handle: '@user',
		external_id: 'ext1',
		profile_link: 'https://example.com',
		profile_picture: 'https://example.com/pic.jpg',
		service_label: 'Bluesky',
		service_name: 'bluesky',
		shared: false,
		status: 'ok',
		wpcom_user_id: 1,
		enabled: true,
		...overrides,
	} ) as Connection;

/**
 * The hook reads `connections` and `siteMessageTemplate` from a single
 * `useSelect` call that returns an object. Tests pass `connections` here;
 * `siteMessageTemplate` defaults to `''` so per-network items fall back to
 * empty when no override.
 *
 * @param {Array<Connection>} connections         - The connections returned to the hook.
 * @param {string}            siteMessageTemplate - The saved site message template.
 */
const mockSelect = ( connections: Connection[], siteMessageTemplate = '' ) => {
	mockConnections = connections;
	mockMessageTemplate = siteMessageTemplate;
};

const allFeaturesOn = ( feature: string ) =>
	[ 'social-message-templates', 'social-image-generator', 'social-enhanced-publishing' ].includes(
		feature
	);

let mockConnections: Connection[];
let mockPostIntent: {
	title: string;
	excerpt: string;
	content: string;
};
let mockMessageTemplate: string;

describe( 'useRenderMessageItems', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		jest.useFakeTimers();

		mockConnections = [];
		mockPostIntent = {
			title: 'Edited title',
			excerpt: 'Edited excerpt',
			content: 'Edited content',
		};
		mockMessageTemplate = '';
		mockUseSelect.mockImplementation( mapSelect => {
			const result = mapSelect( store => {
				if ( store === socialStore ) {
					return {
						getConnections: () => mockConnections,
						getSocialSettings: () => ( { messageTemplate: mockMessageTemplate } ),
					};
				}

				if ( store === editorStore ) {
					return {
						getEditedPostAttribute: ( attribute: string ) =>
							mockPostIntent[ attribute as keyof typeof mockPostIntent ],
					};
				}

				return {};
			} );

			return result &&
				typeof result === 'object' &&
				'title' in result &&
				'excerpt' in result &&
				'content' in result
				? mockPostIntent
				: result;
		} );

		mockSiteHasFeature.mockImplementation( allFeaturesOn );
		mockUsePerNetworkCustomization.mockReturnValue( { isEnabled: false, toggle: jest.fn() } );
		mockUsePostMeta.mockReturnValue( { mediaSource: undefined } );
		mockUseSocialPreviewPostData.mockReturnValue( { media: [] } );
		mockUseSocialMediaMessage.mockReturnValue( {
			message: 'Global',
			updateMessage: jest.fn(),
			maxLength: 280,
		} );
		mockUseFeaturedImage.mockReturnValue( 0 );
		mockUseMediaDetails.mockReturnValue( [ null, false ] );
		mockUseSigPreview.mockReturnValue( { url: null, isLoading: false } );
	} );

	afterEach( () => {
		jest.useRealTimers();
	} );

	afterAll( () => {
		clearMockedScriptData();
	} );

	it( 'returns empty items when MESSAGE_TEMPLATES is off', () => {
		mockSiteHasFeature.mockReturnValue( false );
		mockSelect( [] );

		const { result } = renderHook( () => useRenderMessageItems() );

		expect( result.current ).toEqual( [] );
	} );

	it( 'builds one item per connection in global mode, keyed by connection_id', () => {
		mockSelect( [
			conn( { connection_id: 'a', service_name: 'bluesky' } ),
			conn( { connection_id: 'b', service_name: 'facebook' } ),
		] );

		const { result } = renderHook( () => useRenderMessageItems() );

		expect( result.current ).toEqual( [
			{
				connection_id: 'a',
				message: 'Global',
				is_social_post: false,
			},
			{
				connection_id: 'b',
				message: 'Global',
				is_social_post: false,
			},
		] );
	} );

	it( 'in per-network mode, uses the connection message and falls back to the site template', () => {
		mockUsePerNetworkCustomization.mockReturnValue( { isEnabled: true, toggle: jest.fn() } );
		mockSelect(
			[
				conn( { connection_id: 'a', service_name: 'bluesky', message: 'A' } ),
				conn( { connection_id: 'b', service_name: 'facebook' } ),
			],
			'Site template'
		);

		const { result } = renderHook( () => useRenderMessageItems() );

		expect( result.current ).toEqual( [
			{ connection_id: 'a', message: 'A', is_social_post: false },
			{ connection_id: 'b', message: 'Site template', is_social_post: false },
		] );
	} );

	it( 'sets is_social_post=true in global mode when there is global media', () => {
		mockSelect( [ conn() ] );
		mockUseSocialPreviewPostData.mockReturnValue( {
			media: [ { url: 'https://example.com/m.jpg', type: 'image/jpeg' } ],
		} );

		const { result } = renderHook( () => useRenderMessageItems() );

		expect( result.current[ 0 ].is_social_post ).toBe( true );
	} );

	it( 'in per-network mode, respects connection.media_source = featured-image', () => {
		mockUsePerNetworkCustomization.mockReturnValue( { isEnabled: true, toggle: jest.fn() } );
		mockUseFeaturedImage.mockReturnValue( 99 );
		mockUseMediaDetails.mockReturnValue( [
			{ mediaData: { sourceUrl: 'https://example.com/feat.jpg' } },
			false,
		] );
		mockSelect( [ conn( { media_source: 'featured-image' } ) ] );

		const { result } = renderHook( () => useRenderMessageItems() );

		expect( result.current[ 0 ].is_social_post ).toBe( true );
	} );

	it( 'in per-network mode, returns false for media_source = none', () => {
		mockUsePerNetworkCustomization.mockReturnValue( { isEnabled: true, toggle: jest.fn() } );
		mockSelect( [ conn( { media_source: 'none' } ) ] );

		const { result } = renderHook( () => useRenderMessageItems() );

		expect( result.current[ 0 ].is_social_post ).toBe( false );
	} );

	it( 'debounces 1500ms when a message string changes', () => {
		mockSelect( [ conn() ] );
		mockUseSocialMediaMessage.mockReturnValue( {
			message: 'first',
			updateMessage: jest.fn(),
			maxLength: 280,
		} );

		const { result, rerender } = renderHook( () => useRenderMessageItems() );

		// Flush the initial-mount effect.
		act( () => {
			jest.runOnlyPendingTimers();
		} );
		expect( result.current[ 0 ].message ).toBe( 'first' );

		mockUseSocialMediaMessage.mockReturnValue( {
			message: 'second',
			updateMessage: jest.fn(),
			maxLength: 280,
		} );
		rerender();

		// Still showing the previous value — change is in-flight.
		expect( result.current[ 0 ].message ).toBe( 'first' );

		act( () => {
			jest.advanceTimersByTime( 1500 );
		} );

		expect( result.current[ 0 ].message ).toBe( 'second' );
	} );

	it( 'debounces 1500ms when edited post intent changes', () => {
		mockSelect( [ conn() ] );

		const { result, rerender } = renderHook( () => useRenderMessageInputs() );

		act( () => {
			jest.runOnlyPendingTimers();
		} );
		expect( result.current.postIntent ).toEqual( {
			title: 'Edited title',
			excerpt: 'Edited excerpt',
			content: 'Edited content',
		} );

		mockPostIntent = {
			title: 'Updated title',
			excerpt: 'Updated excerpt',
			content: 'Updated content',
		};
		rerender();

		expect( result.current.postIntent ).toEqual( {
			title: 'Edited title',
			excerpt: 'Edited excerpt',
			content: 'Edited content',
		} );

		act( () => {
			jest.advanceTimersByTime( 1500 );
		} );

		expect( result.current.postIntent ).toEqual( {
			title: 'Updated title',
			excerpt: 'Updated excerpt',
			content: 'Updated content',
		} );
	} );

	it( 'does not flush a pending message change on unrelated re-renders', () => {
		mockSelect( [ conn() ] );
		mockUseSocialMediaMessage.mockReturnValue( {
			message: 'first',
			updateMessage: jest.fn(),
			maxLength: 280,
		} );

		const { result, rerender } = renderHook( () => useRenderMessageItems() );

		act( () => {
			jest.runOnlyPendingTimers();
		} );
		expect( result.current[ 0 ].message ).toBe( 'first' );

		mockUseSocialMediaMessage.mockReturnValue( {
			message: 'second',
			updateMessage: jest.fn(),
			maxLength: 280,
		} );
		rerender();
		expect( result.current[ 0 ].message ).toBe( 'first' );

		mockUseSocialPreviewPostData.mockReturnValue( {
			media: [ { url: 'https://example.com/m.jpg', type: 'image/jpeg' } ],
		} );
		rerender();

		expect( result.current[ 0 ].message ).toBe( 'first' );

		act( () => {
			jest.advanceTimersByTime( 1499 );
		} );
		expect( result.current[ 0 ].message ).toBe( 'first' );

		act( () => {
			jest.advanceTimersByTime( 1 );
		} );
		expect( result.current[ 0 ].message ).toBe( 'second' );
	} );

	it( 'updates immediately when only non-message inputs change', () => {
		mockSelect( [ conn() ] );
		mockUseSocialMediaMessage.mockReturnValue( {
			message: 'same',
			updateMessage: jest.fn(),
			maxLength: 280,
		} );

		const { result, rerender } = renderHook( () => useRenderMessageItems() );

		act( () => {
			jest.runOnlyPendingTimers();
		} );

		// Toggle is_social_post without touching message.
		mockUseSocialPreviewPostData.mockReturnValue( {
			media: [ { url: 'https://example.com/m.jpg', type: 'image/jpeg' } ],
		} );
		rerender();

		// Effects run synchronously inside act() with fake timers — no advance needed.
		act( () => {
			jest.runOnlyPendingTimers();
		} );

		expect( result.current[ 0 ].is_social_post ).toBe( true );
		expect( result.current[ 0 ].message ).toBe( 'same' );
	} );
} );
