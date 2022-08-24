const fs = require( 'fs' );
const path = require( 'path' );
const { mockContextExtras, setInputData } = require( './test-utils' );

describe( 'Notification rules', () => {
	afterEach( () => {
		delete process.env.INPUT_SUITE_NAME;
		delete process.env.INPUT_SLACK_CHANNEL;
	} );

	const slackChannel = 'DEFAULT_CHANNEL_ID';

	test.each`
		description                    | refType       | refName      | suiteName      | rules                                                                               | expectedChannels
		'
		${ 'No rules' }                | ${ 'branch' } | ${ 'trunk' } | ${ undefined } | ${ undefined }                                                                      | ${ [ slackChannel ] }
		${ 'Missing rules in config' } | ${ 'branch' } | ${ 'trunk' } | ${ undefined } | ${ {} }                                                                             | ${ [ slackChannel ] }
		${ 'Invalid rules' }           | ${ 'branch' } | ${ 'trunk' } | ${ undefined } | ${ { someEntry: [] } }                                                              | ${ [ slackChannel ] }
		${ 'Rule match ref' }          | ${ 'branch' } | ${ 'trunk' } | ${ undefined } | ${ { refs: [ { type: 'branch', name: 'trunk', channels: [ 'MATCH_CHANNEL' ] } ] } } | ${ [ slackChannel, 'MATCH_CHANNEL' ] }
	`( `$description`, async ( { refType, refName, suiteName, rules, expectedChannels } ) => {
		// Mock input data
		const rulesConfigurationPath = writeRules( rules );
		setInputData( { slackChannel, suiteName, rulesConfigurationPath } );
		mockContextExtras( { refType, refName } );

		const { getChannels } = require( '../src/rules' );

		expect( getChannels().sort() ).toEqual( expectedChannels.sort() );
	} );
} );

/**
 * Writes the rules object to a temp file and returns the path to that file.
 *
 * @param {object} rules - the rules object
 * @returns {string} the path to the temp file
 */
function writeRules( rules ) {
	const rulesPath = './tests/ignore';

	if ( ! fs.existsSync( rulesPath ) ) {
		fs.mkdirSync( rulesPath );
	}

	if ( rules ) {
		const rulePath = path.join( rulesPath, `rules-${ Date.now() }.json` );
		fs.writeFileSync( rulePath, JSON.stringify( rules ) );
		return path.resolve( rulePath );
	}
}
