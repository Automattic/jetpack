/**
 * @jest-environment jsdom
 */

import TweetDivider from '../tweet-divider';

describe( 'TweetDivider', () => {
	it( 'should expose the divider component', () => {
		expect( TweetDivider ).toBeDefined();
	} );
} );
