import {
	getBlockType,
	getSaveContent,
	parse,
	registerBlockType,
	serialize,
	unregisterBlockType,
	validateBlock,
	createBlock,
} from '@wordpress/blocks';
import { createElement } from '@wordpress/element';
import { removeFilter } from '@wordpress/hooks';
import { unregisterNativeVideoHtmlSources } from '../native-video-attributes';
import { getVideoPressUrl } from '../url';

const mockAvailability = {
	available: false,
	unavailableReason: 'missing_module',
};
const mockSite = { wpcom: false };

jest.mock( '@automattic/jetpack-shared-extension-utils', () => {
	const actual = jest.requireActual( '@automattic/jetpack-shared-extension-utils' );
	return {
		...actual,
		getJetpackExtensionAvailability: () => mockAvailability,
	};
} );

jest.mock( '@automattic/jetpack-script-data', () => ( {
	isWpcomPlatformSite: () => mockSite.wpcom,
	isSimpleSite: () => false,
} ) );

jest.mock( '../videopress-block-example-image.jpg', () => 'example.jpg' );

const coreVideoAttributes = {
	autoplay: {
		type: 'boolean',
		source: 'attribute',
		selector: 'video',
		attribute: 'autoplay',
	},
	caption: {
		type: 'string',
		source: 'html',
		selector: 'figcaption',
	},
	controls: {
		type: 'boolean',
		source: 'attribute',
		selector: 'video',
		attribute: 'controls',
		default: true,
	},
	id: { type: 'number' },
	loop: {
		type: 'boolean',
		source: 'attribute',
		selector: 'video',
		attribute: 'loop',
	},
	muted: {
		type: 'boolean',
		source: 'attribute',
		selector: 'video',
		attribute: 'muted',
	},
	poster: {
		type: 'string',
		source: 'attribute',
		selector: 'video',
		attribute: 'poster',
	},
	preload: {
		type: 'string',
		source: 'attribute',
		selector: 'video',
		attribute: 'preload',
		default: 'metadata',
	},
	src: {
		type: 'string',
		source: 'attribute',
		selector: 'video',
		attribute: 'src',
	},
	playsInline: {
		type: 'boolean',
		source: 'attribute',
		selector: 'video',
		attribute: 'playsinline',
	},
};

function coreVideoSave( { attributes } ) {
	const { autoplay, controls, loop, muted, poster, preload, src, playsInline } = attributes;
	return createElement(
		'figure',
		{ className: 'wp-block-video' },
		createElement( 'video', {
			autoPlay: autoplay || undefined,
			controls: controls || undefined,
			loop: loop || undefined,
			muted: muted || undefined,
			playsInline: playsInline || undefined,
			poster: poster || undefined,
			preload: preload && preload !== 'metadata' ? preload : undefined,
			src,
		} )
	);
}

const availabilityCases = [
	[ 'available', { available: true, unavailableReason: undefined, wpcom: false } ],
	[ 'missing_module', { available: false, unavailableReason: 'missing_module', wpcom: false } ],
	[ 'unknown', { available: false, unavailableReason: 'unknown', wpcom: true } ],
];

function isBlockValid( block ) {
	const result = validateBlock( block );
	return Array.isArray( result ) ? result[ 0 ] : result;
}

describe( 'VideoPress native core/video schema', () => {
	beforeAll( () => {
		require( '../editor' );
		// eslint-disable-next-line no-console -- clear import-time store registration noise
		console.error.mockClear();
		// eslint-disable-next-line no-console -- clear import-time store registration noise
		console.warn.mockClear();
	} );

	afterEach( () => {
		if ( getBlockType( 'core/video' ) ) {
			unregisterBlockType( 'core/video' );
		}
		unregisterNativeVideoHtmlSources();
	} );

	afterAll( () => {
		removeFilter( 'blocks.registerBlockType', 'jetpack/videopress' );
		unregisterNativeVideoHtmlSources();
	} );

	describe.each( availabilityCases )( '%s', ( _label, availability ) => {
		beforeEach( () => {
			Object.assign( mockAvailability, availability );
			mockSite.wpcom = availability.wpcom;
			registerBlockType( 'core/video', {
				apiVersion: 3,
				title: 'Video',
				category: 'media',
				attributes: coreVideoAttributes,
				example: { attributes: {} },
				edit: () => null,
				save: coreVideoSave,
			} );
		} );

		it( 'parses and validates HTML-sourced native video attributes', () => {
			const content =
				'<!-- wp:video -->' +
				'<figure class="wp-block-video"><video autoplay loop muted playsinline poster="https://example.com/poster.jpg" src="https://example.com/clip.mp4"></video></figure>' +
				'<!-- /wp:video -->';
			const [ block ] = parse( content );

			expect( getBlockType( 'core/video' ).attributes.autoplay.source ).toBeUndefined();
			expect( block.attributes ).toMatchObject( {
				autoplay: true,
				controls: false,
				loop: true,
				muted: true,
				playsInline: true,
				poster: 'https://example.com/poster.jpg',
				src: 'https://example.com/clip.mp4',
			} );
			expect( block.isValid ).toBe( true );
			expect( isBlockValid( block ) ).toBe( true );
			expect( getSaveContent( 'core/video', block.attributes ) ).toContain(
				'poster="https://example.com/poster.jpg"'
			);
		} );

		it( 'keeps comment-backed VideoPress guid and playback values', () => {
			const attributes = {
				guid: 'abcdefgh',
				autoplay: true,
				controls: false,
				loop: true,
				muted: true,
				playsinline: true,
				poster: 'https://example.com/poster.jpg',
			};
			const [ block ] = parse( serialize( createBlock( 'core/video', attributes ) ) );
			const saved = getSaveContent( 'core/video', block.attributes );

			expect( block.attributes ).toMatchObject( attributes );
			expect( block.attributes.controls ).toBe( false );
			expect( block.isValid ).toBe( true );
			expect( isBlockValid( block ) ).toBe( true );
			expect( saved ).toContain( 'autoPlay=true' );
			expect( saved ).toContain( 'posterUrl=' );
			expect( saved ).toContain( 'controls=false' );
			expect( saved ).not.toContain( '<video' );
		} );

		it( 'parses historical comment-backed VideoPress url and iframe markup', () => {
			const poster = 'https://example.com/poster.jpg';
			const url = getVideoPressUrl( 'abcdefgh', {
				autoplay: true,
				controls: false,
				playsinline: true,
				poster,
				preload: 'metadata',
				useAverageColor: true,
			} );
			const savedFigure =
				'<figure class="wp-block-video"><div class="wp-block-embed__wrapper">\n' +
				`${ url }\n` +
				'</div></figure>';
			const comment =
				'<!-- wp:video {"guid":"abcdefgh","autoplay":true,"controls":false,"playsinline":true,"poster":"https://example.com/poster.jpg"} -->';
			const [ savedBlock ] = parse( `${ comment }${ savedFigure }<!-- /wp:video -->` );
			const [ iframeBlock ] = parse(
				`${ comment }<figure class="wp-block-video"><div class="wp-block-embed__wrapper"><iframe src="${ url }"></iframe></div></figure><!-- /wp:video -->`
			);

			expect( console ).toHaveErrored();
			expect( console ).toHaveWarned();
			expect( savedBlock.attributes ).toMatchObject( {
				guid: 'abcdefgh',
				autoplay: true,
				controls: false,
				playsinline: true,
				poster,
			} );
			expect( savedBlock.isValid ).toBe( true );
			expect( isBlockValid( savedBlock ) ).toBe( true );
			expect( iframeBlock.attributes ).toMatchObject( {
				guid: 'abcdefgh',
				autoplay: true,
				controls: false,
				playsinline: true,
				poster,
			} );
			expect( getSaveContent( 'core/video', iframeBlock.attributes ) ).toContain( 'autoPlay=true' );
			expect( getSaveContent( 'core/video', iframeBlock.attributes ) ).toContain( 'posterUrl=' );
			expect( getSaveContent( 'core/video', iframeBlock.attributes ) ).toContain(
				'controls=false'
			);
		} );

		it( 'does not read HTML sources over comment-backed VideoPress markup', () => {
			const content =
				'<!-- wp:video {"guid":"abcdefgh","autoplay":true,"controls":false,"poster":"https://example.com/poster.jpg"} -->' +
				'<figure class="wp-block-video"><video src="https://example.com/clip.mp4"></video></figure>' +
				'<!-- /wp:video -->';
			const [ block ] = parse( content );
			const saved = getSaveContent( 'core/video', block.attributes );

			expect( console ).toHaveErrored();
			expect( console ).toHaveWarned();
			expect( block.attributes ).toMatchObject( {
				guid: 'abcdefgh',
				autoplay: true,
				controls: false,
				poster: 'https://example.com/poster.jpg',
			} );
			expect( saved ).toContain( 'autoPlay=true' );
			expect( saved ).toContain( 'controls=false' );
			expect( saved ).not.toContain( '<video' );
		} );

		it( 'follows core HTML sources and leaves unsourced legacy attributes alone', () => {
			unregisterBlockType( 'core/video' );
			registerBlockType( 'core/video', {
				apiVersion: 3,
				title: 'Video',
				category: 'media',
				attributes: {
					autoplay: {
						type: 'boolean',
						source: 'attribute',
						selector: 'video',
						attribute: 'autoplay',
					},
					controls: { type: 'boolean', default: true },
					poster: { type: 'string' },
					preload: {
						type: 'string',
						source: 'attribute',
						selector: 'video',
						attribute: 'preload',
						default: 'none',
					},
					src: {
						type: 'string',
						source: 'attribute',
						selector: 'video',
						attribute: 'src',
					},
				},
				example: { attributes: {} },
				edit: () => null,
				save: coreVideoSave,
			} );
			const content =
				'<!-- wp:video -->' +
				'<figure class="wp-block-video"><video autoplay poster="https://example.com/poster.jpg" src="https://example.com/clip.mp4"></video></figure>' +
				'<!-- /wp:video -->';
			const [ block ] = parse( content );

			expect( console ).toHaveErrored();
			expect( console ).toHaveWarned();
			expect( block.attributes.autoplay ).toBe( true );
			expect( block.attributes.controls ).toBe( true );
			expect( block.attributes.poster ).toBeUndefined();
			expect( block.attributes.preload ).toBe( 'none' );
			expect( block.attributes.src ).toBe( 'https://example.com/clip.mp4' );
		} );
	} );
} );
