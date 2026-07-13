/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';
import { dispatch } from '@wordpress/data';
/**
 * Internal dependencies
 */
import { VIDEO_PRIVACY } from '../../../blocks/videopress/constants';
import { getVideoPressUrl } from '../../../blocks/videopress/url';
import { pickGUIDFromUrl } from '../../../blocks/videopress/utils';
import { withVideoPressSettings } from '../videopress';

// Mock dependencies before imports
jest.mock( '@wordpress/block-editor', () => ( {
	InspectorControls: jest.fn( ( { children } ) => children ),
} ) );

jest.mock( '@wordpress/blocks', () => ( {
	createBlock: jest.fn( ( name, attrs ) => ( { name, attributes: attrs } ) ),
} ) );

jest.mock( '@wordpress/compose', () => ( {
	createHigherOrderComponent: jest.fn( fn => fn ),
} ) );

jest.mock( '@wordpress/data', () => ( {
	dispatch: jest.fn( () => ( {
		replaceBlock: jest.fn(),
	} ) ),
} ) );

jest.mock( '@wordpress/hooks', () => ( {
	addFilter: jest.fn(),
} ) );

jest.mock( '@wordpress/i18n', () => ( {
	__: text => text,
} ) );

jest.mock( '../../../blocks/videopress/utils', () => ( {
	pickGUIDFromUrl: jest.fn(),
} ) );

jest.mock( '../../../blocks/videopress/url', () => ( {
	getVideoPressUrl: jest.fn(),
} ) );

describe( 'VideoPress Embed Settings', () => {
	const mockReplaceBlock = jest.fn();
	const mockBlockEdit = jest.fn( () => <div>Mock Block Edit</div> );
	const EnhancedBlockEdit = withVideoPressSettings( mockBlockEdit );

	beforeEach( () => {
		jest.clearAllMocks();
		dispatch.mockReturnValue( { replaceBlock: mockReplaceBlock } );
		getVideoPressUrl.mockReturnValue( 'https://video.wordpress.com/v/mockguid123' );
	} );

	it( 'should not render transform UI for non-embed blocks', () => {
		render( <EnhancedBlockEdit name="core/paragraph" attributes={ {} } isSelected={ true } /> );

		expect( screen.queryByText( 'Transform to VideoPress block' ) ).not.toBeInTheDocument();
	} );

	it( 'should not render transform UI for non-VideoPress embed blocks', () => {
		render(
			<EnhancedBlockEdit
				name="core/embed"
				attributes={ {
					url: 'https://youtube.com/watch?v=123',
					providerNameSlug: 'youtube',
				} }
				isSelected={ true }
			/>
		);

		expect( screen.queryByText( 'Transform to VideoPress block' ) ).not.toBeInTheDocument();
	} );

	it( 'should render transform UI for VideoPress embed blocks with video.wordpress.com URL', () => {
		render(
			<EnhancedBlockEdit
				name="core/embed"
				attributes={ {
					url: 'https://video.wordpress.com/v/abc12345',
				} }
				isSelected={ true }
			/>
		);

		expect( screen.getByText( 'Transform to VideoPress block' ) ).toBeInTheDocument();
	} );

	it( 'should render transform UI for VideoPress embed blocks with videopress.com URL', () => {
		render(
			<EnhancedBlockEdit
				name="core/embed"
				attributes={ {
					url: 'https://videopress.com/v/abc12345',
				} }
				isSelected={ true }
			/>
		);

		expect( screen.getByText( 'Transform to VideoPress block' ) ).toBeInTheDocument();
	} );

	it( 'should render transform UI for VideoPress embed blocks with providerNameSlug', () => {
		render(
			<EnhancedBlockEdit
				name="core/embed"
				attributes={ {
					url: 'https://example.com/video',
					providerNameSlug: 'videopress',
				} }
				isSelected={ true }
			/>
		);

		expect( screen.getByText( 'Transform to VideoPress block' ) ).toBeInTheDocument();
	} );

	it( 'should transform block when clicking the transform button', async () => {
		const mockGuid = 'abc12345';
		const mockUrl = 'https://video.wordpress.com/v/abc12345';
		pickGUIDFromUrl.mockReturnValue( mockGuid );

		render(
			<EnhancedBlockEdit
				name="core/embed"
				attributes={ {
					url: mockUrl,
					id: 123,
					title: 'Test Video',
					caption: 'Test Caption',
					poster: 'test-poster.jpg',
					className: 'test-class',
					align: 'wide',
				} }
				isSelected={ true }
				clientId="test-client-id"
			/>
		);

		await userEvent.click( screen.getByText( 'Transform to VideoPress block' ) );

		// Verify block creation with correct attributes
		expect( createBlock ).toHaveBeenCalledWith( 'videopress/video', {
			src: mockUrl,
			id: 123,
			guid: mockGuid,
			title: 'Test Video',
			caption: 'Test Caption',
			isVideoPressExample: false,
			autoplay: false,
			controls: true,
			muted: false,
			playsinline: true,
			preload: 'metadata',
			useAverageColor: true,
			poster: 'test-poster.jpg',
			loop: false,
			videoPressTracks: [],
			className: 'test-class',
			align: 'wide',
			rating: '',
			allowDownload: false,
			privacySetting: VIDEO_PRIVACY.SITE_DEFAULT,
			url: expect.any( String ),
		} );

		// Verify block replacement
		expect( mockReplaceBlock ).toHaveBeenCalledWith( 'test-client-id', expect.any( Object ) );
	} );

	it( 'should handle missing optional attributes during transform', async () => {
		const mockGuid = 'abc12345';
		const mockUrl = 'https://video.wordpress.com/v/abc12345';
		pickGUIDFromUrl.mockReturnValue( mockGuid );

		render(
			<EnhancedBlockEdit
				name="core/embed"
				attributes={ {
					url: mockUrl,
				} }
				isSelected={ true }
				clientId="test-client-id"
			/>
		);

		await userEvent.click( screen.getByText( 'Transform to VideoPress block' ) );

		// Verify block creation with default values for missing attributes
		expect( createBlock ).toHaveBeenCalledWith( 'videopress/video', {
			src: mockUrl,
			id: null,
			guid: mockGuid,
			title: '',
			caption: '',
			isVideoPressExample: false,
			autoplay: false,
			controls: true,
			muted: false,
			playsinline: true,
			preload: 'metadata',
			useAverageColor: true,
			poster: '',
			loop: false,
			videoPressTracks: [],
			className: '',
			align: '',
			rating: '',
			allowDownload: false,
			privacySetting: VIDEO_PRIVACY.SITE_DEFAULT,
			url: expect.any( String ),
		} );

		// Verify block replacement
		expect( mockReplaceBlock ).toHaveBeenCalledWith( 'test-client-id', expect.any( Object ) );
	} );
} );
