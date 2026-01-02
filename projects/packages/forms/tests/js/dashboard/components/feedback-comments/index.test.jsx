/**
 * External dependencies
 */
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock WordPress dependencies
await jest.unstable_mockModule( '@wordpress/components', () => ( {
	Button: props => {
		const { __next40pxDefaultSize, accessibleWhenDisabled, isBusy, showTooltip, ...buttonProps } =
			props;
		return (
			<button
				type="button"
				aria-label={ props.label }
				disabled={ props.disabled }
				{ ...buttonProps }
			>
				{ props.children }
			</button>
		);
	},

	TextareaControl: props => {
		const { hideLabelFromVision, label, enterKeyHint, rows, onChange, value, ...textareaProps } =
			props;
		const handleChange = e => onChange && onChange( e.target.value );
		return (
			<textarea
				aria-label={ label }
				placeholder={ props.placeholder }
				value={ value }
				onChange={ handleChange } // eslint-disable-line react/jsx-no-bind -- Test mock function
				{ ...textareaProps }
			/>
		);
	},
	DropdownMenu: props => {
		const handleControlClick = control => () => control.onClick();
		return (
			<div data-testid="dropdown-menu">
				{ props.controls.map( ( control, index ) => (
					<button
						key={ index }
						onClick={ handleControlClick( control ) }
						disabled={ control.isDisabled }
					>
						{ control.title }
					</button>
				) ) }
			</div>
		);
	},
	Spinner: () => <div data-testid="spinner">Loading...</div>,
} ) );

await jest.unstable_mockModule( '@wordpress/icons', () => ( {
	trash: 'trash-icon-mock',
	moreVertical: 'more-vertical-icon-mock',
} ) );

await jest.unstable_mockModule( '@wordpress/core-data', () => ( {
	store: 'core',
} ) );

await jest.unstable_mockModule( '@wordpress/notices', () => ( {
	store: 'notices',
} ) );

await jest.unstable_mockModule( '@wordpress/i18n', () => ( {
	__: text => text,
	sprintf: ( format, ...args ) => {
		let result = format;
		args.forEach( ( arg, index ) => {
			result = result.replace( `%${ index + 1 }$s`, arg );
		} );
		return result;
	},
} ) );

await jest.unstable_mockModule( '@wordpress/date', () => ( {
	dateI18n: ( format, date ) => date,
	getSettings: () => ( {
		formats: {
			date: 'F j, Y',
			time: 'g:i a',
		},
	} ),
} ) );

// Mock API fetch
const mockApiFetch = jest.fn();
await jest.unstable_mockModule( '@wordpress/api-fetch', () => ( {
	default: mockApiFetch,
} ) );

// Mock WordPress data
const mockDispatch = {
	createSuccessNotice: jest.fn(),
	createErrorNotice: jest.fn(),
};

const mockCurrentUser = {
	id: 1,
	name: 'Test User',
	avatar_urls: {
		48: 'https://example.com/avatar.jpg',
	},
};

await jest.unstable_mockModule( '@wordpress/data', () => ( {
	useDispatch: jest.fn( () => mockDispatch ),
	useSelect: jest.fn( callback =>
		callback( () => ( {
			getCurrentUser: () => mockCurrentUser,
		} ) )
	),
	store: {
		noticesStore: 'notices',
	},
} ) );

// Dynamically import the component after mocks are set up
const FeedbackCommentsModule = await import(
	'../../../../../src/dashboard/components/feedback-comments'
);
const FeedbackComments = FeedbackCommentsModule.default;

describe( 'FeedbackComments', () => {
	/**
	 * Helper function to extract page number from API path
	 *
	 * @param {string} path - API path string
	 * @return {number} Page number (defaults to 1 if not found)
	 */
	const extractPageNumber = path => {
		const pathStr = String( path || '' );
		const pageMatch = pathStr.match( /[?&]page=(\d+)/ );
		return pageMatch ? parseInt( pageMatch[ 1 ], 10 ) : 1;
	};

	const mockComments = [
		{
			id: 1,
			post: 123,
			parent: 0,
			author_name: 'John Doe',
			author_url: '',
			date: '2024-01-01T10:00:00',
			date_gmt: '2024-01-01T10:00:00',
			content: {
				rendered: '<p>Test comment 1</p>',
			},
			status: 'approved',
			type: 'comment',
		},
		{
			id: 2,
			post: 123,
			parent: 0,
			author_name: 'Jane Smith',
			author_url: '',
			date: '2024-01-02T10:00:00',
			date_gmt: '2024-01-02T10:00:00',
			content: {
				rendered: '<p>Test comment 2</p>',
			},
			status: 'approved',
			type: 'comment',
		},
	];

	beforeEach( () => {
		// Reset all mocks before each test
		jest.clearAllMocks();
		mockApiFetch.mockReset();

		// Mock scrollIntoView (not available in jsdom)
		// eslint-disable-next-line jest/prefer-spy-on -- Element.prototype.scrollIntoView doesn't exist in jsdom
		Element.prototype.scrollIntoView = jest.fn();
	} );

	describe( 'Loading comments', () => {
		it( 'shows loading spinner while fetching comments', async () => {
			// Mock API to delay response
			mockApiFetch.mockImplementation(
				() =>
					new Promise( resolve => {
						setTimeout( () => resolve( mockComments ), 100 );
					} )
			);

			render( <FeedbackComments postId={ 123 } /> );

			// Should show loading spinner
			expect( screen.getByTestId( 'spinner' ) ).toBeInTheDocument();
		} );

		it( 'loads and displays comments successfully', async () => {
			mockApiFetch.mockResolvedValue( mockComments );

			render( <FeedbackComments postId={ 123 } /> );

			// Wait for comments to load
			await waitFor( () => {
				expect( screen.getByText( 'John Doe' ) ).toBeInTheDocument();
			} );

			expect( screen.getByText( 'Jane Smith' ) ).toBeInTheDocument();
			expect( screen.getByText( 'Test comment 1' ) ).toBeInTheDocument();
			expect( screen.getByText( 'Test comment 2' ) ).toBeInTheDocument();
		} );

		it( 'loads paginated comments (more than 100)', async () => {
			// Create mock data: first page has 100 items, second page has 1 item
			// This tests the pagination logic stops correctly when receiving < 100 items
			const firstPage = Array.from( { length: 100 }, ( _, i ) => ( {
				id: i + 1,
				post: 123,
				parent: 0,
				author_name: `Author ${ i + 1 }`,
				author_url: '',
				date: '2024-01-01T10:00:00',
				date_gmt: '2024-01-01T10:00:00',
				content: {
					rendered: `<p>Comment ${ i + 1 }</p>`,
				},
				status: 'approved',
				type: 'comment',
			} ) );

			const secondPage = [
				{
					id: 101,
					post: 123,
					parent: 0,
					author_name: 'Author 101',
					author_url: '',
					date: '2024-01-01T10:00:00',
					date_gmt: '2024-01-01T10:00:00',
					content: {
						rendered: '<p>Comment 101</p>',
					},
					status: 'approved',
					type: 'comment',
				},
			];

			mockApiFetch.mockImplementation( options => {
				const pageNum = extractPageNumber( options?.path );

				if ( pageNum === 1 ) {
					return Promise.resolve( firstPage );
				} else if ( pageNum === 2 ) {
					return Promise.resolve( secondPage );
				}
				// Any other page returns empty
				return Promise.resolve( [] );
			} );

			render( <FeedbackComments postId={ 123 } /> );

			// Wait for all comments to load
			await waitFor(
				() => {
					// Should have called the API twice
					expect( mockApiFetch ).toHaveBeenCalledTimes( 2 );
				},
				{ timeout: 3000 }
			);

			// Verify the correct paths were called
			expect( mockApiFetch ).toHaveBeenNthCalledWith(
				1,
				expect.objectContaining( { path: expect.stringMatching( /page=1/ ) } )
			);
			expect( mockApiFetch ).toHaveBeenNthCalledWith(
				2,
				expect.objectContaining( { path: expect.stringMatching( /page=2/ ) } )
			);
		} );

		it( 'shows error message when loading comments fails', async () => {
			mockApiFetch.mockRejectedValue( new Error( 'API Error' ) );

			render( <FeedbackComments postId={ 123 } /> );

			await waitFor( () => {
				expect( mockDispatch.createErrorNotice ).toHaveBeenCalledWith( 'Failed to load comments.' );
			} );
		} );
	} );

	describe( 'Adding comments', () => {
		beforeEach( () => {
			mockApiFetch.mockResolvedValue( [] );
		} );

		it( 'renders the add comment form', async () => {
			render( <FeedbackComments postId={ 123 } /> );

			await waitFor( () => {
				expect( screen.getByPlaceholderText( 'Write a quick note…' ) ).toBeInTheDocument();
			} );

			expect( screen.getByText( 'Add note' ) ).toBeInTheDocument();
			expect( screen.getByText( 'Test User' ) ).toBeInTheDocument();
		} );

		it( 'disables submit button when textarea is empty', async () => {
			render( <FeedbackComments postId={ 123 } /> );

			await waitFor( () => {
				expect( screen.getByText( 'Add note' ) ).toBeInTheDocument();
			} );

			const submitButton = screen.getByText( 'Add note' );
			expect( submitButton ).toBeDisabled();
		} );

		it( 'enables submit button when textarea has content', async () => {
			render( <FeedbackComments postId={ 123 } /> );

			await waitFor( () => {
				expect( screen.getByPlaceholderText( 'Write a quick note…' ) ).toBeInTheDocument();
			} );

			const textarea = screen.getByPlaceholderText( 'Write a quick note…' );
			await userEvent.type( textarea, 'New comment' );

			const submitButton = screen.getByText( 'Add note' );
			expect( submitButton ).toBeEnabled();
		} );

		it( 'submits a new comment successfully', async () => {
			const newComment = {
				id: 3,
				post: 123,
				parent: 0,
				author_name: 'Test User',
				author_url: '',
				date: '2024-01-03T10:00:00',
				date_gmt: '2024-01-03T10:00:00',
				content: {
					rendered: '<p>New comment</p>',
				},
				status: 'approved',
				type: 'comment',
			};

			mockApiFetch.mockImplementation( ( { method } ) => {
				if ( method === 'POST' ) {
					return Promise.resolve( newComment );
				}
				return Promise.resolve( [] );
			} );

			render( <FeedbackComments postId={ 123 } /> );

			await waitFor( () => {
				expect( screen.getByPlaceholderText( 'Write a quick note…' ) ).toBeInTheDocument();
			} );

			const textarea = screen.getByPlaceholderText( 'Write a quick note…' );
			await userEvent.type( textarea, 'New comment' );

			const submitButton = screen.getByText( 'Add note' );
			await userEvent.click( submitButton );

			await waitFor( () => {
				expect( mockApiFetch ).toHaveBeenCalledWith( {
					path: '/wp/v2/comments',
					method: 'POST',
					data: {
						post: 123,
						content: 'New comment',
					},
				} );
			} );

			expect( mockDispatch.createSuccessNotice ).toHaveBeenCalledWith( 'Note added successfully.' );
		} );

		it( 'clears textarea after successful submission', async () => {
			const newComment = {
				id: 3,
				post: 123,
				parent: 0,
				author_name: 'Test User',
				author_url: '',
				date: '2024-01-03T10:00:00',
				date_gmt: '2024-01-03T10:00:00',
				content: {
					rendered: '<p>New comment</p>',
				},
				status: 'approved',
				type: 'comment',
			};

			mockApiFetch.mockImplementation( ( { method } ) => {
				if ( method === 'POST' ) {
					return Promise.resolve( newComment );
				}
				return Promise.resolve( [] );
			} );

			render( <FeedbackComments postId={ 123 } /> );

			await waitFor( () => {
				expect( screen.getByPlaceholderText( 'Write a quick note…' ) ).toBeInTheDocument();
			} );

			const textarea = screen.getByPlaceholderText( 'Write a quick note…' );
			await userEvent.type( textarea, 'New comment' );

			const submitButton = screen.getByText( 'Add note' );
			await userEvent.click( submitButton );

			await waitFor( () => {
				expect( textarea ).toHaveValue( '' );
			} );
		} );

		it( 'shows error message when adding comment fails', async () => {
			mockApiFetch.mockImplementation( ( { method } ) => {
				if ( method === 'POST' ) {
					return Promise.reject( new Error( 'API Error' ) );
				}
				return Promise.resolve( [] );
			} );

			render( <FeedbackComments postId={ 123 } /> );

			await waitFor( () => {
				expect( screen.getByPlaceholderText( 'Write a quick note…' ) ).toBeInTheDocument();
			} );

			const textarea = screen.getByPlaceholderText( 'Write a quick note…' );
			await userEvent.type( textarea, 'New comment' );

			const submitButton = screen.getByText( 'Add note' );
			await userEvent.click( submitButton );

			await waitFor( () => {
				expect( mockDispatch.createErrorNotice ).toHaveBeenCalledWith( 'Failed to save the note.' );
			} );

			expect(
				screen.getByText( 'Failed to save the note. Please try again.' )
			).toBeInTheDocument();
		} );

		it( 'does not submit empty comments', async () => {
			mockApiFetch.mockResolvedValue( [] );

			render( <FeedbackComments postId={ 123 } /> );

			await waitFor( () => {
				expect( screen.getByPlaceholderText( 'Write a quick note…' ) ).toBeInTheDocument();
			} );

			const textarea = screen.getByPlaceholderText( 'Write a quick note…' );
			await userEvent.type( textarea, '   ' );

			const submitButton = screen.getByText( 'Add note' );
			await userEvent.click( submitButton );

			// API should not be called for POST
			await waitFor( () => {
				expect( mockApiFetch ).not.toHaveBeenCalledWith(
					expect.objectContaining( { method: 'POST' } )
				);
			} );
		} );

		it( 'submits comment on Enter key (without Shift)', async () => {
			const newComment = {
				id: 3,
				post: 123,
				parent: 0,
				author_name: 'Test User',
				author_url: '',
				date: '2024-01-03T10:00:00',
				date_gmt: '2024-01-03T10:00:00',
				content: {
					rendered: '<p>New comment</p>',
				},
				status: 'approved',
				type: 'comment',
			};

			mockApiFetch.mockImplementation( ( { method } ) => {
				if ( method === 'POST' ) {
					return Promise.resolve( newComment );
				}
				return Promise.resolve( [] );
			} );

			render( <FeedbackComments postId={ 123 } /> );

			await waitFor( () => {
				expect( screen.getByPlaceholderText( 'Write a quick note…' ) ).toBeInTheDocument();
			} );

			const textarea = screen.getByPlaceholderText( 'Write a quick note…' );
			await userEvent.type( textarea, 'New comment{Enter}' );

			await waitFor( () => {
				expect( mockApiFetch ).toHaveBeenCalledWith( {
					path: '/wp/v2/comments',
					method: 'POST',
					data: {
						post: 123,
						content: 'New comment',
					},
				} );
			} );
		} );
	} );

	describe( 'Deleting comments', () => {
		it( 'deletes a comment successfully', async () => {
			mockApiFetch.mockImplementation( ( { method } ) => {
				if ( method === 'DELETE' ) {
					return Promise.resolve( { deleted: true } );
				}
				return Promise.resolve( mockComments );
			} );

			render( <FeedbackComments postId={ 123 } /> );

			await waitFor( () => {
				expect( screen.getByText( 'John Doe' ) ).toBeInTheDocument();
			} );

			// Find and click the delete button - it's labeled "Delete"
			const deleteButtons = screen.getAllByRole( 'button', { name: 'Delete' } );
			await userEvent.click( deleteButtons[ 0 ] );

			await waitFor( () => {
				expect( mockApiFetch ).toHaveBeenCalledWith( {
					path: '/wp/v2/comments/1',
					method: 'DELETE',
				} );
			} );

			expect( mockDispatch.createSuccessNotice ).toHaveBeenCalledWith( 'Note deleted.' );
		} );

		it( 'shows error message when deleting comment fails', async () => {
			mockApiFetch.mockImplementation( ( { method } ) => {
				if ( method === 'DELETE' ) {
					return Promise.reject( new Error( 'API Error' ) );
				}
				return Promise.resolve( mockComments );
			} );

			render( <FeedbackComments postId={ 123 } /> );

			await waitFor( () => {
				expect( screen.getByText( 'John Doe' ) ).toBeInTheDocument();
			} );

			// Find and click the delete button - it's labeled "Delete"
			const deleteButtons = screen.getAllByRole( 'button', { name: 'Delete' } );
			await userEvent.click( deleteButtons[ 0 ] );

			await waitFor( () => {
				expect( mockDispatch.createErrorNotice ).toHaveBeenCalledWith(
					'Failed to delete the note.'
				);
			} );

			expect(
				screen.getByText( 'Failed to delete the note. Please try again.' )
			).toBeInTheDocument();
		} );

		it( 'removes comment from list after successful deletion', async () => {
			mockApiFetch.mockImplementation( ( { method } ) => {
				if ( method === 'DELETE' ) {
					return Promise.resolve( { deleted: true } );
				}
				return Promise.resolve( mockComments );
			} );

			render( <FeedbackComments postId={ 123 } /> );

			await waitFor( () => {
				expect( screen.getByText( 'John Doe' ) ).toBeInTheDocument();
			} );

			// Find and click the delete button - it's labeled "Delete"
			const deleteButtons = screen.getAllByRole( 'button', { name: 'Delete' } );
			await userEvent.click( deleteButtons[ 0 ] );

			await waitFor( () => {
				expect( screen.queryByText( 'Test comment 1' ) ).not.toBeInTheDocument();
			} );

			// Second comment should still be visible
			expect( screen.getByText( 'Jane Smith' ) ).toBeInTheDocument();
		} );
	} );

	describe( 'User information display', () => {
		it( 'displays current user information in the form', async () => {
			mockApiFetch.mockResolvedValue( [] );

			render( <FeedbackComments postId={ 123 } /> );

			await waitFor( () => {
				expect( screen.getByText( 'Test User' ) ).toBeInTheDocument();
			} );

			const avatar = screen.getByAltText( '' );
			expect( avatar ).toHaveAttribute( 'src', 'https://example.com/avatar.jpg' );
		} );

		it( 'renders correctly when no user is logged in', async () => {
			// Mock useSelect to return null user
			const { useSelect } = await import( '@wordpress/data' );
			useSelect.mockImplementation( callback =>
				callback( () => ( {
					getCurrentUser: () => null,
				} ) )
			);

			mockApiFetch.mockResolvedValue( [] );

			render( <FeedbackComments postId={ 123 } /> );

			await waitFor( () => {
				expect( screen.getByPlaceholderText( 'Write a quick note…' ) ).toBeInTheDocument();
			} );

			// User info should not be displayed
			expect( screen.queryByText( 'Test User' ) ).not.toBeInTheDocument();
		} );
	} );

	describe( 'Component rendering', () => {
		it( 'renders the Notes heading', async () => {
			mockApiFetch.mockResolvedValue( [] );

			render( <FeedbackComments postId={ 123 } /> );

			await waitFor( () => {
				expect( screen.getByText( 'Notes' ) ).toBeInTheDocument();
			} );
		} );

		it( 'displays formatted comment dates', async () => {
			mockApiFetch.mockResolvedValue( mockComments );

			render( <FeedbackComments postId={ 123 } /> );

			await waitFor( () => {
				expect( screen.getByText( 'John Doe' ) ).toBeInTheDocument();
			} );

			// Check that date formatting is applied
			const dateElements = screen.getAllByText( /2024-01-0[12]T10:00:00/ );
			expect( dateElements.length ).toBeGreaterThan( 0 );
		} );
	} );
} );
