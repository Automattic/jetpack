import { render } from '@testing-library/react';
import AudioPlayer from '../index';

/**
 * Minimal MediaElementPlayer stand-in. The real one is a global provided by
 * WordPress' wp-mediaelement script and isn't available in the test environment.
 */
class MockMediaElementPlayer {
	constructor( node ) {
		this.domNode = node;
		this.media = node;
		this.options = { classPrefix: 'mejs-' };
	}
	setResponsiveMode() {}
	addControlElement() {}
	remove() {}
}

describe( 'shared AudioPlayer', () => {
	beforeEach( () => {
		global.MediaElementPlayer = MockMediaElementPlayer;
	} );

	afterEach( () => {
		delete global.MediaElementPlayer;
	} );

	test( 'propagates the preload prop to the audio element', () => {
		const { container } = render(
			<AudioPlayer trackSource="https://example.com/episode.mp3" preload="none" />
		);

		expect( container.querySelector( 'audio' ).preload ).toBe( 'none' );
	} );

	test( 'defaults preload to metadata when the prop is omitted', () => {
		const { container } = render(
			<AudioPlayer trackSource="https://example.com/episode.mp3" />
		);

		expect( container.querySelector( 'audio' ).preload ).toBe( 'metadata' );
	} );
} );
