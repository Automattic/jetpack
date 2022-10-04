const crypto = require( 'crypto' );
const fs = require( 'fs' );
const path = require( 'path' );
const { mockContextExtras, setInputData } = require( './test-utils' );

describe( 'Notification rules', () => {
	const defaultChannel = 'DEFAULT_CHANNEL_ID';

	test.each`
		description                                                           | refType       | refName                   | suiteName         | rules                                                                                                                                                                                                                            | expectedChannels
		${ 'No rules' }                                                       | ${ 'branch' } | ${ 'trunk' }              | ${ undefined }    | ${ undefined }                                                                                                                                                                                                                   | ${ [ defaultChannel ] }
		${ 'Missing rules in config' }                                        | ${ 'branch' } | ${ 'trunk' }              | ${ undefined }    | ${ {} }                                                                                                                                                                                                                          | ${ [ defaultChannel ] }
		${ 'Invalid rules' }                                                  | ${ 'branch' } | ${ 'trunk' }              | ${ undefined }    | ${ { someEntry: [] } }                                                                                                                                                                                                           | ${ [ defaultChannel ] }
		${ 'Refs rule match with glob pattern' }                              | ${ 'branch' } | ${ 'slug/branch-11.1.1' } | ${ undefined }    | ${ { refs: [ { type: 'branch', name: '*/branch-*', channels: [ 'MATCH_CHANNEL' ] } ] } }                                                                                                                                         | ${ [ defaultChannel, 'MATCH_CHANNEL' ] }
		${ 'Refs rule match, one channel, with default channel' }             | ${ 'branch' } | ${ 'trunk' }              | ${ undefined }    | ${ { refs: [ { type: 'branch', name: 'trunk', channels: [ 'MATCH_CHANNEL' ] } ] } }                                                                                                                                              | ${ [ defaultChannel, 'MATCH_CHANNEL' ] }
		${ 'Refs rule match, more channels, with default channel' }           | ${ 'branch' } | ${ 'trunk' }              | ${ undefined }    | ${ { refs: [ { type: 'branch', name: 'trunk', channels: [ 'MATCH_CHANNEL_1', 'MATCH_CHANNEL_2' ] } ] } }                                                                                                                         | ${ [ defaultChannel, 'MATCH_CHANNEL_1', 'MATCH_CHANNEL_2' ] }
		${ 'Refs rule match without default channel' }                        | ${ 'branch' } | ${ 'trunk' }              | ${ undefined }    | ${ { refs: [ { type: 'branch', name: 'trunk', channels: [ 'MATCH_CHANNEL' ], excludeDefaultChannel: true } ] } }                                                                                                                 | ${ [ 'MATCH_CHANNEL' ] }
		${ 'Two refs rules one match' }                                       | ${ 'branch' } | ${ 'trunk' }              | ${ undefined }    | ${ { refs: [ { type: 'branch', name: 'main', channels: [ 'NO_MATCH_CHANNEL' ] }, { type: 'branch', name: 'trunk', channels: [ 'MATCH_CHANNEL' ] } ] } }                                                                          | ${ [ defaultChannel, 'MATCH_CHANNEL' ] }
		${ 'Refs rule, no match without default channel' }                    | ${ 'branch' } | ${ 'trunk' }              | ${ undefined }    | ${ { refs: [ { type: 'branch', name: 'main', channels: [ 'NO_MATCH_CHANNEL' ], excludeDefaultChannel: true } ] } }                                                                                                               | ${ [] }
		${ 'More ref rules, no match, one without default channel' }          | ${ 'branch' } | ${ 'trunk' }              | ${ undefined }    | ${ { refs: [ { type: 'branch', name: 'main', channels: [ 'NO_MATCH_CHANNEL' ], excludeDefaultChannel: true }, { type: 'tag', name: 'tag-name', channels: [ 'NO_MATCH_CHANNEL' ], excludeDefaultChannel: false } ] } }            | ${ [ defaultChannel ] }
		${ "Refs rule doesn't match refName" }                                | ${ 'branch' } | ${ 'trunk' }              | ${ undefined }    | ${ { refs: [ { type: 'branch', name: 'main', channels: [ 'NO_MATCH_CHANNEL' ] } ] } }                                                                                                                                            | ${ [ defaultChannel ] }
		${ "Refs rule doesn't match refType" }                                | ${ 'tag' }    | ${ 'tag-name' }           | ${ undefined }    | ${ { refs: [ { type: 'branch', name: 'tag-name', channels: [ 'NO_MATCH_CHANNEL' ] } ] } }                                                                                                                                        | ${ [ defaultChannel ] }
		${ 'Suite rule no match, with default channel' }                      | ${ 'branch' } | ${ 'trunk' }              | ${ undefined }    | ${ { suites: [ { name: 'suite-1', channels: [ 'NO_MATCH_CHANNEL' ] } ] } }                                                                                                                                                       | ${ [ defaultChannel ] }
		${ 'Suite rule no match, without default channel' }                   | ${ 'branch' } | ${ 'trunk' }              | ${ 'suite-name' } | ${ { suites: [ { name: 'suite-1', channels: [ 'NO_MATCH_CHANNEL' ], excludeDefaultChannel: true } ] } }                                                                                                                          | ${ [] }
		${ 'Suite rule match, without default channel' }                      | ${ 'branch' } | ${ 'trunk' }              | ${ 'suite-1' }    | ${ { suites: [ { name: 'suite-1', channels: [ 'SUITE_CHANNEL' ], excludeDefaultChannel: true } ] } }                                                                                                                             | ${ [ 'SUITE_CHANNEL' ] }
		${ 'Suite rule match, refs rule match, all with default channel' }    | ${ 'branch' } | ${ 'trunk' }              | ${ 'suite-1' }    | ${ { refs: [ { type: 'branch', name: 'trunk', channels: [ 'REFS_CHANNEL_1', 'REFS_CHANNEL_2' ] } ], suites: [ { name: 'suite-1', channels: [ 'SUITE_CHANNEL' ] } ] } }                                                           | ${ [ defaultChannel, 'REFS_CHANNEL_1', 'REFS_CHANNEL_2', 'SUITE_CHANNEL' ] }
		${ 'Suite rule match, refs rule match, all without default channel' } | ${ 'branch' } | ${ 'trunk' }              | ${ 'suite-1' }    | ${ { refs: [ { type: 'branch', name: 'trunk', channels: [ 'REFS_CHANNEL_1', 'REFS_CHANNEL_2' ], excludeDefaultChannel: true } ], suites: [ { name: 'suite-1', channels: [ 'SUITE_CHANNEL' ], excludeDefaultChannel: true } ] } } | ${ [ 'REFS_CHANNEL_1', 'REFS_CHANNEL_2', 'SUITE_CHANNEL' ] }
	`( `$description`, async ( { refType, refName, suiteName, rules, expectedChannels } ) => {
		// Mock input data
		const rulesConfigurationPath = writeRules( rules );
		setInputData( { slackChannel: defaultChannel, suiteName, rulesConfigurationPath } );
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
		const rulePath = path.join( rulesPath, `rules-${ crypto.randomUUID() }.json` );
		fs.writeFileSync( rulePath, JSON.stringify( rules ) );
		return path.resolve( rulePath );
	}
}
