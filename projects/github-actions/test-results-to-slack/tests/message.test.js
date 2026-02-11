import { jest } from '@jest/globals';
import { mockContextExtras, mockGitHubContext, setInputData } from './test-utils.js';

describe( 'Message content', () => {
	const repository = 'foo/bar';
	const refName = 'trunk';
	const refType = 'branch';
	const prNumber = '123';
	const sha = '12345abcd';
	const action = 'some action';

	test.each`
		eventName                  | isFailure  | suiteName         | expected
		${ 'push' }                | ${ false } | ${ undefined }    | ${ { text: `:white_check_mark:	Tests passed on ${ refType } _*${ refName }*_` } }
		${ 'push' }                | ${ true }  | ${ undefined }    | ${ { text: `:x:	Tests failed on ${ refType } _*${ refName }*_` } }
		${ 'push' }                | ${ true }  | ${ 'suite name' } | ${ { text: `:x:	_*suite name*_ tests failed on ${ refType } _*${ refName }*_` } }
		${ 'workflow_run' }        | ${ false } | ${ undefined }    | ${ { text: `:white_check_mark:	Tests passed on ${ refType } _*${ refName }*_ (workflow_run)` } }
		${ 'workflow_run' }        | ${ true }  | ${ undefined }    | ${ { text: `:x:	Tests failed on ${ refType } _*${ refName }*_ (workflow_run)` } }
		${ 'workflow_run' }        | ${ true }  | ${ 'suite name' } | ${ { text: `:x:	_*suite name*_ tests failed on ${ refType } _*${ refName }*_ (workflow_run)` } }
		${ 'schedule' }            | ${ false } | ${ undefined }    | ${ { text: `:white_check_mark:	Tests passed for scheduled run on ${ refType } _*${ refName }*_` } }
		${ 'schedule' }            | ${ true }  | ${ undefined }    | ${ { text: `:x:	Tests failed for scheduled run on ${ refType } _*${ refName }*_` } }
		${ 'schedule' }            | ${ true }  | ${ 'test-suite' } | ${ { text: `:x:	_*test-suite*_ tests failed for scheduled run on ${ refType } _*${ refName }*_` } }
		${ 'schedule' }            | ${ true }  | ${ '' }           | ${ { text: `:x:	Tests failed for scheduled run on ${ refType } _*${ refName }*_` } }
		${ 'pull_request' }        | ${ false } | ${ undefined }    | ${ { text: `:white_check_mark:	Tests passed for pull request *#${ prNumber }*` } }
		${ 'pull_request' }        | ${ true }  | ${ undefined }    | ${ { text: `:x:	Tests failed for pull request *#${ prNumber }*` } }
		${ 'repository_dispatch' } | ${ true }  | ${ undefined }    | ${ { text: `:x:	Tests failed for event _*${ action }*_` } }
		${ 'repository_dispatch' } | ${ false } | ${ 'test-suite' } | ${ { text: `:white_check_mark:	_*test-suite*_ tests passed for event _*${ action }*_` } }
		${ 'unsupported' }         | ${ true }  | ${ undefined }    | ${ { text: `:x:	Tests failed for ${ sha }` } }
	`(
		`Message text is correct for $eventName and workflow failed=$isFailure and suiteName=$suiteName`,
		async ( { eventName, isFailure, suiteName, expected } ) => {
			setInputData( { suiteName } );

			// Mock GitHub context
			await mockGitHubContext( {
				payload: {
					head_commit: { id: '123', message: 'Some commit message' },
					pull_request: { number: prNumber },
					workflow_run: { head_commit: { id: '123', message: 'Some commit message' } },
					action,
				},
				sha,
				eventName,
			} );
			mockContextExtras( { repository, refType, refName } );

			const { createMessage } = await import( '../src/message.js' );
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
			// Mock GitHub context
			await mockGitHubContext( {
				payload: {
					head_commit: { id: commitId, message: commitMsg },
				},
				eventName: 'push',
			} );

			const { createMessage } = await import( '../src/message.js' );
			const { mainMsgBlocks } = await createMessage( true );

			expect( mainMsgBlocks[ 1 ].elements[ 0 ].text ).toBe( expected.text );
		}
	);

	test( `First main message context line is correct for pull_request`, async () => {
		const title = 'Pull request title';

		// Mock GitHub context
		await mockGitHubContext( {
			payload: {
				head_commit: { message: 'Some commit message' },
				pull_request: { title },
			},
			eventName: 'pull_request',
		} );

		const { createMessage } = await import( '../src/message.js' );
		const { mainMsgBlocks } = await createMessage( true );

		expect( mainMsgBlocks[ 1 ].elements[ 0 ].text ).toBe( `Title: ${ title }` );
	} );

	test( `First main message context line is correct for schedule`, async () => {
		// Mock GitHub context
		await mockGitHubContext( {
			payload: {
				head_commit: { message: 'Some commit message' },
			},
			eventName: 'schedule',
			sha: '5dc6ab9d13d9b79317b719a32a60cc682cd6930d',
		} );

		const { createMessage } = await import( '../src/message.js' );
		const { mainMsgBlocks } = await createMessage( true );

		expect( mainMsgBlocks[ 1 ].elements[ 0 ].text ).toBe( `Last commit: 5dc6ab9d` );
	} );

	test.each`
		eventName
		${ 'pull_request' }
		${ 'push' }
		${ 'schedule' }
		${ 'workflow_run' }
		${ 'repository_dispatch' }
		${ 'unsupported' }
	`( 'There are no empty blocks elements lists for $eventName event', async ( { eventName } ) => {
		// Mock GitHub context
		await mockGitHubContext( {
			payload: {
				head_commit: { id: '123', message: 'Some commit message' },
				pull_request: { number: prNumber },
				workflow_run: { head_commit: { id: '123', message: 'Some commit message' } },
				action,
			},
			sha,
			eventName,
		} );
		mockContextExtras( { repository, refType, refName } );

		const { createMessage } = await import( '../src/message.js' );
		const { mainMsgBlocks } = await createMessage( true );

		expect( mainMsgBlocks[ 1 ].type ).toBe( 'context' );
		expect( mainMsgBlocks[ 1 ].elements.length ).toBeGreaterThan( 0 );
		expect( mainMsgBlocks[ 2 ].type ).toBe( 'actions' );
		expect( mainMsgBlocks[ 2 ].elements.length ).toBeGreaterThan( 0 );
	} );

	test.each`
		description                                      | clientPayload                                          | expectedContextLength | expectedButtonsLength
		${ 'upstream sha, upstream repository' }         | ${ { sha: '123456789', repository: 'upstream/repo' } } | ${ 2 }                | ${ 2 }
		${ 'upstream sha, missing upstream repository' } | ${ { sha: '123456789' } }                              | ${ 2 }                | ${ 1 }
		${ 'missing upstream sha, upstream repository' } | ${ { repository: 'upstream/repo' } }                   | ${ 1 }                | ${ 1 }
	`(
		`Repository dispatch blocks for #description`,
		async ( { clientPayload, expectedContextLength, expectedButtonsLength } ) => {
			// Mock GitHub context
			await mockGitHubContext( {
				payload: {
					action: 'some action',
					client_payload: clientPayload,
				},
				eventName: 'repository_dispatch',
			} );

			const { createMessage } = await import( '../src/message.js' );
			const { mainMsgBlocks } = await createMessage( true );

			expect( mainMsgBlocks[ 1 ].elements ).toHaveLength( expectedContextLength );
			expect( mainMsgBlocks[ 2 ].elements ).toHaveLength( expectedButtonsLength );
		}
	);
} );

describe( 'Send message', () => {
	test.each`
		description                                                    | mainMessageExists | isFailure  | expectedCalls
		${ 'Should update main message and send reply on failure' }    | ${ true }         | ${ true }  | ${ [ { update: true }, { update: false } ] }
		${ 'Should only update main message on success' }              | ${ true }         | ${ false } | ${ [ { update: true } ] }
		${ 'Should create main message and send reply on failure' }    | ${ false }        | ${ true }  | ${ [ { update: false }, { update: false } ] }
		${ 'Should not send anything on success and no main message' } | ${ false }        | ${ false } | ${ [] }
	`( `$description`, async ( { isFailure, mainMessageExists, expectedCalls } ) => {
		// Mock Slack message existence
		const slack = { ...( await import( '../src/slack.js' ) ) };
		const spy = jest
			.spyOn( slack, 'postOrUpdateMessage' )
			.mockImplementation()
			.mockReturnValue( { ts: '123' } );
		jest.spyOn( slack, 'getMessage' ).mockReturnValue( mainMessageExists );
		jest.unstable_mockModule( '../src/slack.js', () => slack );

		// Mock the run conclusion
		const github = { ...( await import( '../src/github.js' ) ) };
		jest.spyOn( github, 'isWorkflowFailed' ).mockReturnValue( isFailure );
		jest.unstable_mockModule( '../src/github.js', () => github );

		// Mock message content
		const message = { ...( await import( '../src/message.js' ) ) };
		jest.spyOn( message, 'createMessage' ).mockReturnValue( {
			text: 'message text',
			id: 'msg-id',
			mainMsgBlocks: [],
			detailsMsgBlocksChunks: [],
		} );
		jest.unstable_mockModule( '../src/message.js', () => message );

		await message.sendMessage( '', '', '', '' );

		await expect( spy ).toHaveBeenCalledTimes( expectedCalls.length );

		for ( const args of expectedCalls ) {
			await expect( spy ).toHaveBeenCalledWith( expect.anything(), args.update, expect.anything() );
		}
	} );
} );
