import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UploadDropzone from '../index';
import { selectFilesForPlan } from '../select-files';

const mockCreateErrorNotice = jest.fn();
jest.mock( '@automattic/jetpack-components/global-notices', () => ( {
	useGlobalNotices: () => ( {
		createSuccessNotice: jest.fn(),
		createErrorNotice: ( ...args: unknown[] ) => mockCreateErrorNotice( ...args ),
		createInfoNotice: jest.fn(),
	} ),
} ) );

// The real hook pulls in the connection package's checkout workflow, which
// wants an initial state this component test has no business hydrating.
const mockRunUpgrade = jest.fn();
jest.mock( '../../../hooks/use-videopress-upgrade', () => ( {
	useVideoPressUpgrade: () => mockRunUpgrade,
} ) );

const makeFile = ( name: string, type = 'video/mp4' ) => new File( [ 'x' ], name, { type } );

beforeEach( () => {
	jest.clearAllMocks();
} );

describe( 'UploadDropzone', () => {
	it( 'renders the single-file copy by default', () => {
		render( <UploadDropzone onFiles={ jest.fn() } /> );

		expect( screen.getByText( 'Drag and drop your video here' ) ).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Select a video to upload' } ) ).toBeEnabled();
	} );

	it( 'follows allowMultiple into the plural copy and a multi-file input', () => {
		const { container } = render( <UploadDropzone onFiles={ jest.fn() } allowMultiple /> );

		expect( screen.getByText( 'Drag and drop your videos here' ) ).toBeInTheDocument();
		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- the picker input is visually hidden with no label; no accessible query reaches it.
		const input = container.querySelector( 'input[type="file"]' ) as HTMLInputElement;
		expect( input ).toHaveAttribute( 'multiple' );
	} );

	it( 'keeps the single-file copy when copyVariant overrides a multi-file plan', () => {
		render( <UploadDropzone onFiles={ jest.fn() } allowMultiple copyVariant="single" /> );

		expect( screen.getByText( 'Drag and drop your video here' ) ).toBeInTheDocument();
	} );

	it( 'lets subCopy replace the default sub-copy line', () => {
		render( <UploadDropzone onFiles={ jest.fn() } subCopy="It will show up here." /> );

		expect( screen.getByText( 'It will show up here.' ) ).toBeInTheDocument();
		expect( screen.queryByText( /automatic captions/ ) ).not.toBeInTheDocument();
	} );

	it( 'fires onFiles with the picked files on input change', async () => {
		const onFiles = jest.fn();
		const { container } = render( <UploadDropzone onFiles={ onFiles } /> );

		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- the picker input is visually hidden with no label; no accessible query reaches it.
		const input = container.querySelector( 'input[type="file"]' ) as HTMLInputElement;
		const file = makeFile( 'one.mp4' );
		await userEvent.upload( input, file );

		expect( onFiles ).toHaveBeenCalledWith( [ file ] );
	} );

	it( 'fires onFiles from a drop and never while disabled', () => {
		const onFiles = jest.fn();
		const { container, rerender } = render( <UploadDropzone onFiles={ onFiles } /> );

		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- the dropzone is a styled div with no accessible role; no query reaches it.
		const dropzone = container.querySelector( '.vp-upload-dropzone' ) as HTMLElement;
		fireEvent.drop( dropzone, { dataTransfer: { files: [ makeFile( 'one.mp4' ) ] } } );
		expect( onFiles ).toHaveBeenCalledTimes( 1 );

		rerender( <UploadDropzone onFiles={ onFiles } disabled /> );
		expect( dropzone ).toHaveAttribute( 'aria-disabled', 'true' );
		expect( screen.getByRole( 'button', { name: 'Select a video to upload' } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
		fireEvent.drop( dropzone, { dataTransfer: { files: [ makeFile( 'two.mp4' ) ] } } );
		expect( onFiles ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'answers a drop it cannot accept instead of swallowing the file', () => {
		// The plan-limit bug: the surface still read "Drag and drop your video
		// here", the drop handler was simply unbound, and the file vanished
		// with no error, no toast and no state change.
		const onFiles = jest.fn();
		const { container } = render( <UploadDropzone onFiles={ onFiles } disabled /> );

		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- the dropzone is a styled div with no accessible role; no query reaches it.
		const dropzone = container.querySelector( '.vp-upload-dropzone' ) as HTMLElement;
		fireEvent.drop( dropzone, { dataTransfer: { files: [ makeFile( 'two.mp4' ) ] } } );

		expect( onFiles ).not.toHaveBeenCalled();
		expect( mockCreateErrorNotice ).toHaveBeenCalledWith(
			'You’ve reached the free plan’s 1-video limit. Upgrade to upload more.',
			expect.objectContaining( {
				actions: [ expect.objectContaining( { label: 'Upgrade' } ) ],
			} )
		);
	} );

	it( 'offers the upgrade route from the rejected-drop notice', () => {
		const { container } = render( <UploadDropzone onFiles={ jest.fn() } disabled /> );

		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- the dropzone is a styled div with no accessible role; no query reaches it.
		const dropzone = container.querySelector( '.vp-upload-dropzone' ) as HTMLElement;
		fireEvent.drop( dropzone, { dataTransfer: { files: [ makeFile( 'two.mp4' ) ] } } );

		const [ , options ] = mockCreateErrorNotice.mock.calls[ 0 ] as [
			string,
			{ actions: { onClick: () => void }[] },
		];
		options.actions[ 0 ].onClick();
		expect( mockRunUpgrade ).toHaveBeenCalled();
	} );

	it( 'refuses from the picker button in the same voice as the surface', async () => {
		// The two halves of one control used to disagree: the button was
		// `disabled` (silent, unfocusable) while the surface quietly ate the
		// file. Both now say the same thing.
		render( <UploadDropzone onFiles={ jest.fn() } disabled /> );

		await userEvent.click( screen.getByRole( 'button', { name: 'Select a video to upload' } ) );

		expect( mockCreateErrorNotice ).toHaveBeenCalledWith(
			'You’ve reached the free plan’s 1-video limit. Upgrade to upload more.',
			expect.anything()
		);
	} );

	it( 'rejects a file that only looks like a video', () => {
		// A `.txt` renamed `.mp4` used to upload 0→100%, register, consume the
		// free plan's one slot and settle into a permanently broken video.
		const onFiles = jest.fn();
		const { container } = render( <UploadDropzone onFiles={ onFiles } /> );

		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- the dropzone is a styled div with no accessible role; no query reaches it.
		const dropzone = container.querySelector( '.vp-upload-dropzone' ) as HTMLElement;
		fireEvent.drop( dropzone, {
			dataTransfer: { files: [ makeFile( 'not-a-video.mp4', 'text/plain' ) ] },
		} );

		expect( onFiles ).not.toHaveBeenCalled();
		expect( mockCreateErrorNotice ).toHaveBeenCalledWith( 'Only video files can be uploaded.' );
	} );

	it( 'passes the real videos through and drops the rest of a mixed selection', () => {
		const onFiles = jest.fn();
		const { container } = render( <UploadDropzone onFiles={ onFiles } allowMultiple /> );

		const clip = makeFile( 'clip.mp4' );
		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- the dropzone is a styled div with no accessible role; no query reaches it.
		const dropzone = container.querySelector( '.vp-upload-dropzone' ) as HTMLElement;
		fireEvent.drop( dropzone, {
			dataTransfer: { files: [ clip, makeFile( 'notes.pdf', 'application/pdf' ) ] },
		} );

		expect( onFiles ).toHaveBeenCalledWith( [ clip ] );
		expect( mockCreateErrorNotice ).not.toHaveBeenCalled();
	} );

	it( 'opens the picker from the surface without double-firing on the button', async () => {
		render( <UploadDropzone onFiles={ jest.fn() } /> );

		const clicks: Event[] = [];
		// eslint-disable-next-line testing-library/no-node-access -- the picker input is visually hidden with no label; no accessible query reaches it.
		const input = document.querySelector( 'input[type="file"]' ) as HTMLInputElement;
		input.addEventListener( 'click', event => {
			event.preventDefault();
			clicks.push( event );
		} );

		await userEvent.click( screen.getByText( 'Drag and drop your video here' ) );
		expect( clicks ).toHaveLength( 1 );

		// The button opens the picker itself; its click must not also bubble up
		// to the surface and ask for a second file dialog.
		await userEvent.click( screen.getByRole( 'button', { name: 'Select a video to upload' } ) );
		expect( clicks ).toHaveLength( 2 );
	} );
} );

describe( 'selectFilesForPlan', () => {
	it( 'passes a multi-file plan through untouched', () => {
		const files = [ makeFile( 'a.mp4' ), makeFile( 'b.mp4' ) ];
		expect( selectFilesForPlan( files, true ) ).toEqual( { files } );
	} );

	it( 'slices the free plan to one file and names the dropped count', () => {
		const files = [ makeFile( 'a.mp4' ), makeFile( 'b.mp4' ), makeFile( 'c.mp4' ) ];
		const result = selectFilesForPlan( files, false );

		expect( result.files ).toEqual( [ files[ 0 ] ] );
		expect( result.discardedNotice ).toBe(
			'The free plan includes one video — uploading your first. Upgrade to add the other 2.'
		);
	} );

	it( 'returns an empty selection without a notice', () => {
		expect( selectFilesForPlan( [], false ) ).toEqual( { files: [] } );
	} );
} );
