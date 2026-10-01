import { act, render } from '@testing-library/react';
import { useDispatch } from '@wordpress/data';
import { usePreview } from '../../../hooks/use-preview';
import Player from '../components/player';
import VideoPressUploader from '../components/videopress-uploader';
import VideoPressEdit from '../edit';
import type { VideoBlockAttributes, VideoPreviewProps } from '../types';

jest.mock( '@automattic/jetpack-connection', () => ( { getUserConnectionUrl: jest.fn() } ) );
jest.mock( '@automattic/jetpack-shared-extension-utils', () => ( {
	useAnalytics: () => ( { tracks: { recordEvent: jest.fn() } } ),
} ) );
jest.mock( '@wordpress/block-editor', () => ( {
	store: 'core/block-editor',
	useBlockProps: props => props,
	BlockIcon: () => null,
	BlockControls: () => null,
	InspectorControls: () => null,
} ) );
jest.mock( '@wordpress/core-data', () => ( { store: 'core' } ) );
jest.mock( '@wordpress/blocks', () => ( { createBlock: jest.fn() } ) );
jest.mock( '@wordpress/data', () => ( { useDispatch: jest.fn() } ) );
jest.mock( '@wordpress/components', () => ( {
	withNotices: component => component,
	ToolbarButton: () => null,
} ) );
jest.mock( '../../../../lib/connection', () => ( {
	isStandaloneActive: () => true,
	isSiteConnected: () => true,
	isVideoPressActive: () => true,
	isVideoPressModuleActive: () => true,
} ) );
jest.mock( '../../../hooks/use-inline-player', () => ( { getInlinePlayerConfig: () => null } ) );
jest.mock( '../../../hooks/use-preview', () => ( { usePreview: jest.fn() } ) );
jest.mock( '../../../hooks/use-sync-media', () => ( {
	useSyncMedia: () => ( { videoData: {} } ),
} ) );
jest.mock( '../index', () => ( { title: 'VideoPress', description: 'VideoPress video' } ) );
jest.mock( '../components/banner/connect-banner', () => () => null );
jest.mock( '../components/chapters-control', () => () => null );
jest.mock( '../components/color-panel', () => () => null );
jest.mock( '../components/details-panel', () => () => null );
jest.mock( '../components/playback-panel', () => () => null );
jest.mock( '../components/player', () => jest.fn( () => null ) );
jest.mock( '../components/poster-image-block-control', () => () => null );
jest.mock( '../components/poster-panel', () => () => null );
jest.mock( '../components/privacy-and-rating-panel', () => () => null );
jest.mock( '../components/replace-control', () => () => null );
jest.mock( '../components/tracks-control', () => () => null );
jest.mock( '../components/videopress-uploader', () => jest.fn( () => null ) );

const preview: VideoPreviewProps = {
	html: '<iframe src="https://videopress.com/embed/abcDEF12"></iframe>',
	width: 640,
	height: 360,
	thumbnail_width: 640,
	thumbnail_height: 360,
	version: '1.0',
	title: 'Video',
	type: 'video',
	provider_name: 'VideoPress',
	provider_url: 'https://videopress.com',
};

const defaultAttributes: VideoBlockAttributes = {
	guid: 'abcDEF12',
	cacheHtml: preview.html,
	videoRatio: 56.25,
	posterData: { type: 'media-library' },
};

const setAttributes = jest.fn();
const markNotPersistent = jest.fn();

/**
 * Report intrinsic dimensions through the player's editor callback.
 *
 * @param ratio - Video height as a percentage of its width.
 */
function reportVideoRatio( ratio: number ) {
	act( () => jest.mocked( Player ).mock.lastCall[ 0 ].onVideoRatioChange( ratio ) );
}

/**
 * Render the editor with saved block attributes.
 *
 * @param attributes - Attributes to override for this render.
 * @return The editor component.
 */
function editor( attributes: VideoBlockAttributes = {} ) {
	return (
		<VideoPressEdit
			attributes={ { ...defaultAttributes, ...attributes } }
			setAttributes={ setAttributes }
			isSelected={ false }
			clientId="video-block"
		/>
	);
}

describe( 'VideoPress editor aspect ratio', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		jest.mocked( useDispatch ).mockReturnValue( {
			__unstableMarkNextChangeAsNotPersistent: markNotPersistent,
			invalidateResolution: jest.fn(),
		} );
		jest.mocked( usePreview ).mockReturnValue( { preview, isRequestingEmbedPreview: false } );
	} );

	it.each( [ undefined, null, '' ] )( 'renders the uploader before a GUID exists: %p', guid => {
		jest.mocked( usePreview ).mockReturnValue( {
			preview: { ...preview, html: null, width: null, height: null },
			isRequestingEmbedPreview: false,
		} );

		render( editor( { guid, cacheHtml: '' } ) );

		expect( VideoPressUploader ).toHaveBeenCalled();
		expect( Player ).not.toHaveBeenCalled();
		expect( setAttributes ).not.toHaveBeenCalled();
	} );

	it( 'accepts player dimensions after a video is added to an empty block', () => {
		jest.mocked( usePreview ).mockReturnValue( {
			preview: { ...preview, html: null, width: null, height: null },
			isRequestingEmbedPreview: false,
		} );
		const { rerender } = render( editor( { guid: undefined, cacheHtml: '' } ) );

		act( () => {
			jest.mocked( VideoPressUploader ).mock.lastCall[ 0 ].handleDoneUpload( defaultAttributes );
		} );
		jest.mocked( usePreview ).mockReturnValue( { preview, isRequestingEmbedPreview: false } );
		rerender( editor() );
		setAttributes.mockClear();

		const portraitRatio = ( 1024 / 576 ) * 100;
		reportVideoRatio( portraitRatio );

		expect( setAttributes ).toHaveBeenCalledTimes( 1 );
		expect( setAttributes ).toHaveBeenCalledWith( { videoRatio: portraitRatio } );
	} );

	it( 'uses preview dimensions until the player reports its ratio', () => {
		render( editor( { videoRatio: 100 } ) );

		expect( setAttributes ).toHaveBeenCalledTimes( 1 );
		expect( setAttributes ).toHaveBeenCalledWith( { videoRatio: 56.25 } );
		expect( markNotPersistent ).toHaveBeenCalledTimes( 1 );
	} );

	it.each( [ { width: 0 }, { height: 0 } ] )(
		'keeps the saved ratio when preview dimensions are incomplete: %p',
		missingDimension => {
			jest.mocked( usePreview ).mockReturnValue( {
				preview: { ...preview, ...missingDimension },
				isRequestingEmbedPreview: false,
			} );
			render( editor() );

			expect( setAttributes ).not.toHaveBeenCalled();
			reportVideoRatio( 100 );
			expect( setAttributes ).toHaveBeenCalledTimes( 1 );
			expect( setAttributes ).toHaveBeenCalledWith( { videoRatio: 100 } );
		}
	);

	it( 'keeps the reported portrait ratio when a stale landscape preview arrives', () => {
		const portraitRatio = ( 1024 / 576 ) * 100;
		const { rerender } = render( editor() );
		expect( setAttributes ).not.toHaveBeenCalled();

		reportVideoRatio( portraitRatio );
		expect( setAttributes ).toHaveBeenCalledTimes( 1 );
		expect( setAttributes ).toHaveBeenCalledWith( { videoRatio: portraitRatio } );
		expect( markNotPersistent ).toHaveBeenCalledTimes( 1 );

		jest.mocked( usePreview ).mockReturnValue( {
			preview: { ...preview, width: 800, height: 600 },
			isRequestingEmbedPreview: false,
		} );
		rerender( editor( { videoRatio: portraitRatio } ) );

		expect( setAttributes ).toHaveBeenCalledTimes( 1 );
		expect( markNotPersistent ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'ignores duplicate reports and stores a subsequent change', () => {
		render( editor() );

		reportVideoRatio( 100 );
		reportVideoRatio( 100 );
		expect( setAttributes ).toHaveBeenCalledTimes( 1 );
		expect( setAttributes ).toHaveBeenCalledWith( { videoRatio: 100 } );

		reportVideoRatio( 75 );
		expect( setAttributes ).toHaveBeenCalledTimes( 2 );
		expect( setAttributes ).toHaveBeenLastCalledWith( { videoRatio: 75 } );
		expect( markNotPersistent ).toHaveBeenCalledTimes( 2 );
	} );

	it( 'uses the new video preview instead of retaining the previous video report', () => {
		const { rerender } = render( editor() );
		reportVideoRatio( 100 );
		setAttributes.mockClear();
		markNotPersistent.mockClear();

		rerender( editor( { guid: 'newGUID1', videoRatio: 100 } ) );
		expect( setAttributes ).toHaveBeenCalledTimes( 1 );
		expect( setAttributes ).toHaveBeenCalledWith( { videoRatio: 56.25 } );

		rerender( editor( { guid: 'newGUID1' } ) );
		reportVideoRatio( 100 );
		expect( setAttributes ).toHaveBeenCalledTimes( 2 );
		expect( setAttributes ).toHaveBeenLastCalledWith( { videoRatio: 100 } );
		expect( markNotPersistent ).toHaveBeenCalledTimes( 2 );
	} );
} );
