import { pickPlaybackUrl } from '..';

// The dvd → std → hd ladder preference is covered through the dashboard's
// toLibraryItem tests (use-library.test.ts); these direct cases pin the
// degenerate inputs the helper must absorb (it is also called with raw v1.1
// items by routes/video-editor/stage.tsx and the chapter manager modal).
describe( 'pickPlaybackUrl', () => {
	const BASE = 'https://videos.files.wordpress.com/guid11/';

	it( 'returns undefined without a videopress block at all', () => {
		expect( pickPlaybackUrl( undefined ) ).toBeUndefined();
	} );

	it( 'returns undefined without an https file URL base', () => {
		expect( pickPlaybackUrl( { files: { hd: { mp4: 'clip_hd.mp4' } } } ) ).toBeUndefined();
		expect(
			pickPlaybackUrl( { file_url_base: {}, files: { hd: { mp4: 'clip_hd.mp4' } } } )
		).toBeUndefined();
	} );

	it( 'returns undefined with a base but no files', () => {
		expect( pickPlaybackUrl( { file_url_base: { https: BASE } } ) ).toBeUndefined();
	} );

	it( 'returns undefined when no ladder rendition carries an mp4', () => {
		// Renditions may exist before their mp4 is ready, and non-ladder keys
		// (e.g. the original upload) must not be picked up as playback sources.
		expect(
			pickPlaybackUrl( {
				file_url_base: { https: BASE },
				files: { hd: {}, dvd: {}, std: {}, original: { mp4: 'original.mp4' } },
			} )
		).toBeUndefined();
	} );

	it( 'prefers a rendition that carries its audio track', () => {
		// Streaming renditions' `mp4` is video-only; `mp4_muxed` also has the audio.
		expect(
			pickPlaybackUrl( {
				file_url_base: { https: BASE },
				files: {
					dvd: { mp4: 'clip_dvd.mp4' },
					hd: { mp4: 'clip_hd.mp4', mp4_muxed: 'clip_hd.muxed.mp4' },
					std: { mp4: 'clip_std.mp4', mp4_muxed: 'clip_std.mp4' },
				},
			} )
		).toBe( `${ BASE }clip_hd.muxed.mp4` );
	} );

	it( 'falls back to std over a silent ladder rendition', () => {
		expect(
			pickPlaybackUrl( {
				file_url_base: { https: BASE },
				files: {
					dvd: { mp4: 'clip_dvd.mp4' },
					hd: { mp4: 'clip_hd.mp4' },
					hd_1080p: { mp4: 'clip_hd_1080p.mp4', mp4_muxed: 'clip_hd_1080p.muxed.mp4' },
					std: { mp4: 'clip_std.mp4', mp4_muxed: 'clip_std.mp4' },
				},
			} )
		).toBe( `${ BASE }clip_std.mp4` );
	} );

	it( 'joins the base and the best available rendition', () => {
		expect(
			pickPlaybackUrl( {
				file_url_base: { https: BASE },
				files: { std: { mp4: 'clip_std.mp4' } },
			} )
		).toBe( `${ BASE }clip_std.mp4` );
	} );
} );
