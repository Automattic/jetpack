import { render } from '@testing-library/react';
import AudioPlayer from '../index';

// The component hands its <audio> node to MediaElementPlayer right after setting
// preload on it. Capture that node from the mock so we can assert on preload
// without reaching into the DOM directly.
let audioNode;

class MockMediaElementPlayer {
	constructor( node ) {
		audioNode = node;
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
		audioNode = undefined;
		global.MediaElementPlayer = MockMediaElementPlayer;
	} );

	afterEach( () => {
		delete global.MediaElementPlayer;
	} );

	test( 'propagates the preload prop to the audio element', () => {
		render( <AudioPlayer trackSource="https://example.com/episode.mp3" preload="none" /> );

		expect( audioNode.preload ).toBe( 'none' );
	} );

	test( 'defaults preload to metadata when the prop is omitted', () => {
		render( <AudioPlayer trackSource="https://example.com/episode.mp3" /> );

		expect( audioNode.preload ).toBe( 'metadata' );
	} );
} );
