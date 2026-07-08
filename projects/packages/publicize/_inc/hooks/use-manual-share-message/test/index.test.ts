/* eslint-disable import/order */
// Setup mock script data BEFORE any other imports that might use it
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
	const mocks = {
		useSelect: jest.fn(),
		useRegistry: jest.fn(),
	};
	return new Proxy( actual, {
		get( target, property ) {
			return mocks[ property as keyof typeof mocks ] ?? target[ property as keyof typeof target ];
		},
	} );
} );

jest.mock( '../../use-render-message-items', () => ( {
	usePostIntent: jest.fn(),
	// Pass-through: the real hook returns its inputs unchanged on first render,
	// which is all these single-render tests exercise.
	useDebouncedRenderInputs: jest.fn( inputs => inputs ),
} ) );

jest.mock( '../../use-social-media-message', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );

import { renderHook } from '@testing-library/react';
import { useRegistry, useSelect } from '@wordpress/data';
import { useManualShareMessage } from '../';
import { usePostIntent } from '../../use-render-message-items';
import useSocialMediaMessage from '../../use-social-media-message';

const mockSiteHasFeature = jest.requireMock( '@automattic/jetpack-script-data' )
	.siteHasFeature as jest.Mock;
const mockUseSelect = useSelect as jest.Mock;
const mockUseRegistry = useRegistry as jest.Mock;
const mockUsePostIntent = usePostIntent as jest.MockedFunction< typeof usePostIntent >;
const mockUseSocialMediaMessage = useSocialMediaMessage as jest.MockedFunction<
	typeof useSocialMediaMessage
>;

let mockGetRenderedMessages: jest.Mock;

/**
 * Mock the two useSelect calls inside the hook: first `{ siteMessageTemplate, postId }`,
 * then the rendered slice `{ rendered, isLoadingRendered }`.
 *
 * @param opts                     - Per-test overrides.
 * @param opts.postId              - Current post id.
 * @param opts.siteMessageTemplate - Saved site message template.
 * @param opts.rendered            - Rendered message string, or null when not cached.
 * @param opts.isLoadingRendered   - Whether the rendered-messages cache slot is in-flight.
 */
function mockSelectCalls(
	opts: {
		postId?: number;
		siteMessageTemplate?: string;
		rendered?: string | null;
		isLoadingRendered?: boolean;
	} = {}
) {
	const {
		postId = 42,
		siteMessageTemplate = '',
		rendered = null,
		isLoadingRendered = false,
	} = opts;
	mockUseSelect
		.mockReturnValueOnce( { siteMessageTemplate, postId } )
		.mockReturnValueOnce( { rendered, isLoadingRendered } );
}

describe( 'useManualShareMessage', () => {
	beforeEach( () => {
		jest.clearAllMocks();

		mockSiteHasFeature.mockReturnValue( true );
		mockUsePostIntent.mockReturnValue( {} );
		mockUseSocialMediaMessage.mockReturnValue( {
			message: 'Sharing {title}',
			updateMessage: jest.fn(),
			maxLength: 280,
		} );

		mockGetRenderedMessages = jest.fn().mockResolvedValue( undefined );
		mockUseRegistry.mockReturnValue( {
			resolveSelect: () => ( { getRenderedMessages: mockGetRenderedMessages } ),
		} );
	} );

	afterAll( () => {
		clearMockedScriptData();
	} );

	it( 'returns the rendered message when templates are on and it is cached', () => {
		mockSelectCalls( { rendered: 'Sharing My Post' } );

		const { result } = renderHook( () => useManualShareMessage() );

		expect( result.current ).toEqual( { message: 'Sharing My Post', isLoading: false } );
	} );

	it( 'reports loading and drives the fetch when not yet cached', () => {
		mockSelectCalls( { rendered: null, isLoadingRendered: true } );

		const { result } = renderHook( () => useManualShareMessage() );

		expect( result.current ).toEqual( { message: null, isLoading: true } );
		expect( mockGetRenderedMessages ).toHaveBeenCalledTimes( 1 );
		expect( mockGetRenderedMessages ).toHaveBeenCalledWith(
			42,
			[ { connection_id: '__manual_share__', message: 'Sharing {title}', is_social_post: false } ],
			{}
		);
	} );

	it( 'falls back to the site template when there is no per-post message', () => {
		mockSelectCalls( {
			siteMessageTemplate: 'Read {title}',
			rendered: null,
			isLoadingRendered: true,
		} );
		mockUseSocialMediaMessage.mockReturnValue( {
			message: '',
			updateMessage: jest.fn(),
			maxLength: 280,
		} );

		renderHook( () => useManualShareMessage() );

		expect( mockGetRenderedMessages ).toHaveBeenCalledWith(
			42,
			[ { connection_id: '__manual_share__', message: 'Read {title}', is_social_post: false } ],
			{}
		);
	} );

	it( 'returns null with no fetch when the templates feature is off', () => {
		mockSiteHasFeature.mockReturnValue( false );
		mockSelectCalls( { rendered: 'Should be ignored', isLoadingRendered: true } );

		const { result } = renderHook( () => useManualShareMessage() );

		expect( result.current ).toEqual( { message: null, isLoading: false } );
		expect( mockGetRenderedMessages ).not.toHaveBeenCalled();
	} );

	it( 'returns null with no fetch when there is no template', () => {
		mockUseSocialMediaMessage.mockReturnValue( {
			message: '',
			updateMessage: jest.fn(),
			maxLength: 280,
		} );
		mockSelectCalls( { siteMessageTemplate: '' } );

		const { result } = renderHook( () => useManualShareMessage() );

		expect( result.current ).toEqual( { message: null, isLoading: false } );
		expect( mockGetRenderedMessages ).not.toHaveBeenCalled();
	} );

	it( 'returns null (never the raw template) on the error/finish path', () => {
		// finish-on-error keeps the slot with no rendered_message and isLoading:false.
		mockSelectCalls( { rendered: null, isLoadingRendered: false } );

		const { result } = renderHook( () => useManualShareMessage() );

		expect( result.current ).toEqual( { message: null, isLoading: false } );
	} );
} );
