const { mockContextExtras, setInputData } = require( './test-utils' );

describe( 'Message content', () => {
	const repository = 'foo/bar';
	const refName = 'trunk';
	const refType = 'branch';
	const prNumber = '123';
	const sha = '12345abcd';

	test.each`
		eventName           | isFailure  | suiteName         | expected
		${ 'push' }         | ${ false } | ${ undefined }    | ${ { text: `:white_check_mark:	Tests passed on ${ refType } _*${ refName }*_` } }
		${ 'push' }         | ${ true }  | ${ undefined }    | ${ { text: `:x:	Tests failed on ${ refType } _*${ refName }*_` } }
		${ 'push' }         | ${ true }  | ${ 'suite name' } | ${ { text: `:x:	_*suite name*_ tests failed on ${ refType } _*${ refName }*_` } }
		${ 'workflow_run' } | ${ false } | ${ undefined }    | ${ { text: `:white_check_mark:	Tests passed on ${ refType } _*${ refName }*_ (workflow_run)` } }
		${ 'workflow_run' } | ${ true }  | ${ undefined }    | ${ { text: `:x:	Tests failed on ${ refType } _*${ refName }*_ (workflow_run)` } }
		${ 'workflow_run' } | ${ true }  | ${ 'suite name' } | ${ { text: `:x:	_*suite name*_ tests failed on ${ refType } _*${ refName }*_ (workflow_run)` } }
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
			const { mockGitHubContext } = require( './test-utils' );

			setInputData( { suiteName } );

			// Mock GitHub context
			mockGitHubContext( {
				payload: {
					head_commit: { id: '123', message: 'Some commit message' },
					pull_request: { number: prNumber },
					workflow_run: { head_commit: { id: '123', message: 'Some commit message' } },
				},
				sha,
				eventName,
			} );
			mockContextExtras( { repository, refType, refName } );

			const { createMessage } = require( '../src/message' );
			const { text, mainMsgBlocks } = await createMessage( isFailure );

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
			const { mockGitHubContext } = require( './test-utils' );

			// Mock GitHub context
			mockGitHubContext( {
				payload: {
					head_commit: { id: commitId, message: commitMsg },
				},
				eventName: 'push',
			} );

			const { createMessage } = require( '../src/message' );
			const { mainMsgBlocks } = await createMessage( true );

			expect( mainMsgBlocks[ 1 ].elements[ 0 ].text ).toBe( expected.text );
		}
	);

	test( `First main message context line is correct for pull_request`, async () => {
		const title = 'Pull request title';
		const { mockGitHubContext } = require( './test-utils' );

		// Mock GitHub context
		mockGitHubContext( {
			payload: {
				head_commit: { message: 'Some commit message' },
				pull_request: { title },
			},
			eventName: 'pull_request',
		} );

		const { createMessage } = require( '../src/message' );
		const { mainMsgBlocks } = await createMessage( true );

		expect( mainMsgBlocks[ 1 ].elements[ 0 ].text ).toBe( `Title: ${ title }` );
	} );

	test( `First main message context line is correct for schedule`, async () => {
		const { mockGitHubContext } = require( './test-utils' );

		// Mock GitHub context
		mockGitHubContext( {
			payload: {
				head_commit: { message: 'Some commit message' },
			},
			eventName: 'schedule',
			sha: '5dc6ab9d13d9b79317b719a32a60cc682cd6930d',
		} );

		const { createMessage } = require( '../src/message' );
		const { mainMsgBlocks } = await createMessage( true );

		expect( mainMsgBlocks[ 1 ].elements[ 0 ].text ).toBe( `Last commit: 5dc6ab9d` );
	} );

	test.each`
		eventName
		${ 'pull_request' }
		${ 'push' }
		${ 'schedule' }
		${ 'workflow_run' }
		${ 'unsupported' }
	`( 'There are no empty blocks elements lists for $eventName event', async ( { eventName } ) => {
		const { mockGitHubContext } = require( './test-utils' );

		// Mock GitHub context
		mockGitHubContext( {
			payload: {
				head_commit: { id: '123', message: 'Some commit message' },
				pull_request: { number: prNumber },
				workflow_run: { head_commit: { id: '123', message: 'Some commit message' } },
			},
			sha,
			eventName,
		} );
		mockContextExtras( { repository, refType, refName } );

		const { createMessage } = require( '../src/message' );
		const { mainMsgBlocks } = await createMessage( true );

		expect( mainMsgBlocks[ 1 ].type ).toBe( 'context' );
		expect( mainMsgBlocks[ 1 ].elements.length ).toBeGreaterThan( 0 );
		expect( mainMsgBlocks[ 2 ].type ).toBe( 'actions' );
		expect( mainMsgBlocks[ 2 ].elements.length ).toBeGreaterThan( 0 );
	} );
} );

describe( 'Send message', () => {
	test.each`
		description                                                    | mainMessageExists | isFailure  | expectedCalls
		${ 'Should update main message and send reply on failure' }    | ${ true }         | ${ true }  | ${ [ { update: true }, { update: false } ] }
		${ 'Should only update main message on success' }              | ${ true }         | ${ false } | ${ [ { update: true } ] }
		${ 'Should create main message and send reply on failure' }    | ${ false }        | ${ true }  | ${ [ { update: false }, { update: false } ] }
		${ 'Should not send anything on success and no main message' } | ${ false }        | ${ false } | ${ [] }
	`( `$description`, async ( { isFailure, mainMessageExists, expectedCalls } ) => {
		const slack = require( '../src/slack' );
		const spy = jest
			.spyOn( slack, 'postOrUpdateMessage' )
			.mockImplementation()
			.mockReturnValue( { ts: '123' } );

		// Mock message existence
		jest.spyOn( slack, 'getMessage' ).mockReturnValue( mainMessageExists );

		// Mock the run conclusion
		const github = require( '../src/github' );
		jest.spyOn( github, 'isWorkflowFailed' ).mockReturnValue( isFailure );

		// Mock message content
		const message = require( '../src/message' );
		jest.spyOn( message, 'createMessage' ).mockReturnValue( {
			text: 'message text',
			id: 'msg-id',
			mainMsgBlocks: [],
			detailsMsgBlocksChunks: [],
		} );

		await message.sendMessage( '', '', '', '' );

		await expect( spy ).toHaveBeenCalledTimes( expectedCalls.length );

		for ( const args of expectedCalls ) {
			await expect( spy ).toHaveBeenCalledWith( expect.anything(), args.update, expect.anything() );
		}
	} );
} );
