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
