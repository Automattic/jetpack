import save from '../save';

const exampleSettings = {
	attributes: {
		url: 'http://example.com/podcast/feed.rss',
	},
};

describe( 'save', () => {
	test( 'Save generates a simple link to the RSS url', () => {
		// Verify the output of the save block, given the example settings.
		//
		// This is close to a snapshot test; done because actual snapshots don't work for testing
		// block save() functions.  See ../../../README.md and https://github.com/Automattic/wp-calypso/pull/30727
		const want = (
			<a className="jetpack-podcast-player__direct-link" href="http://example.com/podcast/feed.rss">
				http://example.com/podcast/feed.rss
			</a>
		);
		const got = save( exampleSettings );
		expect( got ).toEqual( want );
	} );
} );
