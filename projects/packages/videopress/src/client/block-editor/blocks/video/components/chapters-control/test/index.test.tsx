import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChaptersControl from '..';

const mockInvalidateResolution = jest.fn();

jest.mock( '@wordpress/components', () => ( {
	ToolbarButton: ( { label, onClick, disabled } ) => (
		<button onClick={ onClick } disabled={ disabled }>
			{ label }
		</button>
	),
} ) );

jest.mock( '@wordpress/core-data', () => ( {
	store: 'core',
} ) );

jest.mock( '@wordpress/data', () => ( {
	useDispatch: () => ( { invalidateResolution: mockInvalidateResolution } ),
} ) );

jest.mock( '@wordpress/i18n', () => ( {
	__: ( text: string ) => text,
} ) );

jest.mock( '@wordpress/icons', () => ( {
	formatListNumbered: 'format-list-numbered',
} ) );

jest.mock( '../../../../../../components/chapter-manager-modal/lazy', () => ( {
	__esModule: true,
	default: ( { isOpen, isPrivate, attachmentId, description, onSaved } ) =>
		isOpen ? (
			<div
				role="dialog"
				aria-label="Manage chapters"
				data-is-private={ String( isPrivate ) }
				data-attachment-id={ String( attachmentId ) }
				data-description={ description }
			>
				<button onClick={ () => onSaved( '0:00 Intro\n0:30 Middle\n1:00 End' ) }>
					Save chapters
				</button>
			</div>
		) : null,
} ) );

jest.mock( '../../../../../../lib/url', () => ( {
	getVideoPressUrl: () => 'https://videopress.example/video',
} ) );

type Win = { videoPressEditorState?: Record< string, unknown > };

const win = window as unknown as Win;

/**
 * Set the chapters-editor gate the way `wp_localize_script()` would: PHP
 * booleans arrive as '' | '1'.
 *
 * @param enabled - Whether the chapters editor is enabled.
 */
function setChaptersEditorEnabled( enabled: boolean ): void {
	win.videoPressEditorState = {
		...win.videoPressEditorState,
		chaptersEditorEnabled: enabled ? '1' : '',
	};
}

describe( 'ChaptersControl', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		// The control is gated off by default; the cases below that exercise it
		// need the gate on, and the gate's own cases flip it back.
		setChaptersEditorEnabled( true );
	} );

	afterEach( () => {
		delete win.videoPressEditorState;
	} );

	it( 'opens the shared chapter manager modal from the block toolbar', async () => {
		const user = userEvent.setup();
		const setAttributes = jest.fn();

		render(
			<ChaptersControl
				attributes={ {
					guid: 'abc123',
					id: 42,
					title: 'Test video',
					description: 'Intro prose.',
				} }
				setAttributes={ setAttributes }
			/>
		);

		await user.click( screen.getByText( 'Manage chapters' ) );
		expect( screen.getByRole( 'dialog', { name: 'Manage chapters' } ) ).toBeInTheDocument();

		await user.click( screen.getByText( 'Save chapters' ) );

		/*
		 * Only the (serializable) description enters the block attributes; the
		 * chapters VTT itself lives server-side.
		 */
		expect( setAttributes ).toHaveBeenCalledWith( {
			description: '0:00 Intro\n0:30 Middle\n1:00 End',
		} );
		expect( mockInvalidateResolution ).toHaveBeenCalledWith( 'getEmbedPreview', [
			'https://videopress.example/video',
		] );
	} );

	it( 'stays disabled until the video has both a guid and an attachment id', async () => {
		const user = userEvent.setup();

		render(
			<ChaptersControl
				attributes={ { guid: 'abc123', title: 'Test video' } }
				setAttributes={ jest.fn() }
			/>
		);

		const button = screen.getByText( 'Manage chapters' );
		expect( button ).toBeDisabled();
		await user.click( button );
		expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument();
	} );

	it( 'passes the attachment id and privacy through so the modal can save and authenticate', async () => {
		const user = userEvent.setup();

		render(
			<ChaptersControl
				attributes={ { guid: 'abc123', id: 42, isPrivate: true } }
				setAttributes={ jest.fn() }
			/>
		);

		await user.click( screen.getByText( 'Manage chapters' ) );

		const dialog = screen.getByRole( 'dialog', { name: 'Manage chapters' } );
		expect( dialog ).toHaveAttribute( 'data-is-private', 'true' );
		expect( dialog ).toHaveAttribute( 'data-attachment-id', '42' );
		// An unset description reaches the modal as an empty string.
		expect( dialog ).toHaveAttribute( 'data-description', '' );
	} );

	describe( 'chapters editor gate', () => {
		it( 'renders nothing when the chapters editor is off', () => {
			setChaptersEditorEnabled( false );

			const { container } = render(
				<ChaptersControl
					attributes={ { guid: 'abc123', id: 42, title: 'Test video' } }
					setAttributes={ jest.fn() }
				/>
			);

			expect( screen.queryByText( 'Manage chapters' ) ).not.toBeInTheDocument();
			expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument();
			expect( container ).toBeEmptyDOMElement();
		} );

		it( 'renders nothing when the localized state is missing entirely', () => {
			delete win.videoPressEditorState;

			const { container } = render(
				<ChaptersControl
					attributes={ { guid: 'abc123', id: 42, title: 'Test video' } }
					setAttributes={ jest.fn() }
				/>
			);

			expect( container ).toBeEmptyDOMElement();
		} );

		it( 'renders the toolbar button when the chapters editor is on', () => {
			setChaptersEditorEnabled( true );

			render(
				<ChaptersControl
					attributes={ { guid: 'abc123', id: 42, title: 'Test video' } }
					setAttributes={ jest.fn() }
				/>
			);

			expect( screen.getByText( 'Manage chapters' ) ).toBeInTheDocument();
		} );
	} );
} );
