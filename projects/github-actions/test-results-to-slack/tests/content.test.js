const { mockGitHubContext, mockContextExtras, setInputData } = require( './test-utils' );

const repository = 'foo/bar';

describe( 'Notification content', () => {
	afterEach( () => {
		delete process.env.INPUT_SUITE_NAME;
	} );

	const refName = 'trunk';
	const refType = 'branch';
	const prNumber = '123';
	const sha = '12345abcd';

	test.each`
		eventName           | isFailure  | suiteName         | expected
		${ 'push' }         | ${ false } | ${ undefined }    | ${ { text: `:white_check_mark:	Tests passed on ${ refType } _*${ refName }*_` } }
		${ 'push' }         | ${ true }  | ${ undefined }    | ${ { text: `:x:	Tests failed on ${ refType } _*${ refName }*_` } }
		${ 'push' }         | ${ true }  | ${ 'suite name' } | ${ { text: `:x:	_*suite name*_ tests failed on ${ refType } _*${ refName }*_` } }
		${ 'schedule' }     | ${ false } | ${ undefined }    | ${ { text: `:white_check_mark:	Tests passed for scheduled run on ${ refType } _*${ refName }*_` } }
		${ 'schedule' }     | ${ true }  | ${ undefined }    | ${ { text: `:x:	Tests failed for scheduled run on ${ refType } _*${ refName }*_` } }
		${ 'schedule' }     | ${ true }  | ${ 'test-suite' } | ${ { text: `:x:	_*test-suite*_ tests failed for scheduled run on ${ refType } _*${ refName }*_` } }
		${ 'schedule' }     | ${ true }  | ${ '' }           | ${ { text: `:x:	Tests failed for scheduled run on ${ refType } _*${ refName }*_` } }
		${ 'pull_request' } | ${ false } | ${ undefined }    | ${ { text: `:white_check_mark:	Tests passed for pull request *#${ prNumber }*` } }
		${ 'pull_request' } | ${ true }  | ${ undefined }    | ${ { text: `:x:	Tests failed for pull request *#${ prNumber }*` } }
		${ 'unsupported' }  | ${ true }  | ${ undefined }    | ${ { text: `:x:	Tests failed for ${ sha }` } }
	`(
		`Message text is correct for $eventName and workflow failed=$isFailure and suiteName=$suiteName`,
		async ( { eventName, isFailure, suiteName, expected } ) => {
			setInputData( { suiteName } );

			// Mock GitHub context
			mockGitHubContext( {
				payload: {
					head_commit: { id: '123', message: 'Some commit message' },
					pull_request: { number: prNumber },
				},
				sha,
				eventName,
			} );
			mockContextExtras( { repository, refType, refName } );

			const { getNotificationData } = require( '../src/github' );
			const { text, mainMsgBlocks } = await getNotificationData( isFailure );

			expect( text ).toBe( expected.text );
			expect( mainMsgBlocks[ 0 ].text.text ).toBe( expected.text );
		}
	);

	test.each`
		commitId         | commitMsg                                                  | expected
		${ '123456789' } | ${ 'Short message' }                                       | ${ { text: `Commit: 12345678 Short message` } }
		${ '123456789' } | ${ 'Long message 12345678901234567890123456789012345678' } | ${ { text: `Commit: 12345678 Long message 12345678901234567890123456789012345...` } }
	`(
		`First main message context line is correct for push`,
		async ( { commitId, commitMsg, expected } ) => {
			// Mock GitHub context
			mockGitHubContext( {
				payload: {
					head_commit: { id: commitId, message: commitMsg },
				},
				eventName: 'push',
			} );

			const { getNotificationData } = require( '../src/github' );
			const { mainMsgBlocks } = await getNotificationData( true );

			expect( mainMsgBlocks[ 1 ].elements[ 0 ].text ).toBe( expected.text );
		}
	);

	test( `First main message context line is correct for pull_request`, async () => {
		const title = 'Pull request title';

		// Mock GitHub context
		mockGitHubContext( {
			payload: {
				head_commit: { message: 'Some commit message' },
				pull_request: { title },
			},
			eventName: 'pull_request',
		} );

		const { getNotificationData } = require( '../src/github' );
		const { mainMsgBlocks } = await getNotificationData( true );

		expect( mainMsgBlocks[ 1 ].elements[ 0 ].text ).toBe( `Title: ${ title }` );
	} );

	test( `First main message context line is correct for schedule`, async () => {
		// Mock GitHub context
		mockGitHubContext( {
			payload: {
				head_commit: { message: 'Some commit message' },
			},
			eventName: 'schedule',
			sha: '5dc6ab9d13d9b79317b719a32a60cc682cd6930d',
		} );

		const { getNotificationData } = require( '../src/github' );
		const { mainMsgBlocks } = await getNotificationData( true );

		expect( mainMsgBlocks[ 1 ].elements[ 0 ].text ).toBe( `Last commit: 5dc6ab9d` );
	} );
} );
