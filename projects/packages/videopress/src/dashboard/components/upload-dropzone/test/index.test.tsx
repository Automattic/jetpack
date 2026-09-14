import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { makeRenamedTextFile, makeVideoFile } from '../../../test-utils/video-file';
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

const AT_LIMIT_MESSAGE = 'You’ve reached the free plan’s 1-video limit. Upgrade to upload more.';

// Real container bytes, not `[ 'x' ]`: the filter these files pass through
// reads the header and checks it against the extension.
const makeFile = ( name: string, type = 'video/mp4' ) => makeVideoFile( name, type );

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

		await waitFor( () => expect( onFiles ).toHaveBeenCalledWith( [ file ] ) );
	} );

	it( 'fires onFiles from a drop and never while disabled', async () => {
		const onFiles = jest.fn();
		const { container, rerender } = render( <UploadDropzone onFiles={ onFiles } /> );

		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- the dropzone is a styled div with no accessible role; no query reaches it.
		const dropzone = container.querySelector( '.vp-upload-dropzone' ) as HTMLElement;
		fireEvent.drop( dropzone, { dataTransfer: { files: [ makeFile( 'one.mp4' ) ] } } );
		await waitFor( () => expect( onFiles ).toHaveBeenCalledTimes( 1 ) );

		rerender( <UploadDropzone onFiles={ onFiles } disabled /> );
		expect( dropzone ).toHaveAttribute( 'aria-disabled', 'true' );
		expect( screen.getByRole( 'button', { name: 'Select a video to upload' } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
		fireEvent.drop( dropzone, { dataTransfer: { files: [ makeFile( 'two.mp4' ) ] } } );
		await waitFor( () => expect( mockCreateErrorNotice ).toHaveBeenCalled() );
		expect( onFiles ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'answers a drop it cannot accept instead of swallowing the file', async () => {
		// The plan-limit bug: the surface still read "Drag and drop your video
		// here", the drop handler was simply unbound, and the file vanished
		// with no error, no toast and no state change.
		const onFiles = jest.fn();
		const { container } = render( <UploadDropzone onFiles={ onFiles } disabled /> );

		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- the dropzone is a styled div with no accessible role; no query reaches it.
		const dropzone = container.querySelector( '.vp-upload-dropzone' ) as HTMLElement;
		fireEvent.drop( dropzone, { dataTransfer: { files: [ makeFile( 'two.mp4' ) ] } } );

		await waitFor( () =>
			expect( mockCreateErrorNotice ).toHaveBeenCalledWith(
				AT_LIMIT_MESSAGE,
				expect.objectContaining( {
					actions: [ expect.objectContaining( { label: 'Upgrade' } ) ],
				} )
			)
		);
		expect( onFiles ).not.toHaveBeenCalled();
	} );

	it( 'refreshes one at-limit notice rather than stacking a black bar per attempt', async () => {
		// Both testers dropped repeatedly at the limit and got a column of
		// identical notices. A stable id makes the store replace the existing
		// one instead.
		const { container } = render( <UploadDropzone onFiles={ jest.fn() } disabled /> );

		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- the dropzone is a styled div with no accessible role; no query reaches it.
		const dropzone = container.querySelector( '.vp-upload-dropzone' ) as HTMLElement;
		fireEvent.drop( dropzone, { dataTransfer: { files: [ makeFile( 'a.mp4' ) ] } } );
		fireEvent.drop( dropzone, { dataTransfer: { files: [ makeFile( 'b.mp4' ) ] } } );
		fireEvent.drop( dropzone, { dataTransfer: { files: [ makeFile( 'c.mp4' ) ] } } );

		await waitFor( () => expect( mockCreateErrorNotice ).toHaveBeenCalledTimes( 3 ) );
		const ids = mockCreateErrorNotice.mock.calls.map(
			( [ , options ] ) => ( options as { id?: string } )?.id
		);
		expect( ids ).toEqual( [ 'vp-upload-at-limit', 'vp-upload-at-limit', 'vp-upload-at-limit' ] );
	} );

	it( 'offers the upgrade route from the rejected-drop notice', async () => {
		const { container } = render( <UploadDropzone onFiles={ jest.fn() } disabled /> );

		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- the dropzone is a styled div with no accessible role; no query reaches it.
		const dropzone = container.querySelector( '.vp-upload-dropzone' ) as HTMLElement;
		fireEvent.drop( dropzone, { dataTransfer: { files: [ makeFile( 'two.mp4' ) ] } } );

		await waitFor( () => expect( mockCreateErrorNotice ).toHaveBeenCalled() );
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

		expect( mockCreateErrorNotice ).toHaveBeenCalledWith( AT_LIMIT_MESSAGE, expect.anything() );
	} );

	it( 'explains the refusal on hover too, not only on click', async () => {
		// The button was `aria-disabled` (so it could answer a click) but still
		// rendered live and said nothing on hover, while the header "Upload
		// video" button was dimmed with a tooltip carrying this same sentence.
		// Hover is what a mouse user gets BEFORE committing to a click.
		render( <UploadDropzone onFiles={ jest.fn() } disabled /> );

		await userEvent.hover( screen.getByRole( 'button', { name: 'Select a video to upload' } ) );

		await expect(
			screen.findByText( AT_LIMIT_MESSAGE, {}, { timeout: 3000 } )
		).resolves.toBeVisible();
	} );

	it( 'leaves the enabled button untooltipped', async () => {
		render( <UploadDropzone onFiles={ jest.fn() } /> );

		await userEvent.hover( screen.getByRole( 'button', { name: 'Select a video to upload' } ) );

		expect( screen.queryByText( AT_LIMIT_MESSAGE ) ).not.toBeInTheDocument();
	} );

	it( 'rejects a file that only looks like a video', async () => {
		// A `.txt` renamed `.mp4` used to upload 0→100%, register, consume the
		// free plan's one slot and settle into a permanently broken video. It
		// REPORTS `video/mp4` — Chromium derives the type from the extension —
		// so only its bytes give it away.
		const onFiles = jest.fn();
		const { container } = render( <UploadDropzone onFiles={ onFiles } /> );

		const impostor = makeRenamedTextFile( 'not-a-video.mp4' );
		expect( impostor.type ).toBe( 'video/mp4' );
		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- the dropzone is a styled div with no accessible role; no query reaches it.
		const dropzone = container.querySelector( '.vp-upload-dropzone' ) as HTMLElement;
		fireEvent.drop( dropzone, { dataTransfer: { files: [ impostor ] } } );

		await waitFor( () =>
			expect( mockCreateErrorNotice ).toHaveBeenCalledWith( 'Only video files can be uploaded.', {
				id: 'vp-upload-invalid-file',
			} )
		);
		expect( onFiles ).not.toHaveBeenCalled();
	} );

	it( 'tells the owner of a real WebM what to do instead of denying it is a video', async () => {
		// Both testers hit this: `.webm` is not on the server allow-list, so the
		// refusal is right, but "Only video files can be uploaded." about a
		// genuine video is false and leaves nowhere to go.
		const onFiles = jest.fn();
		const { container } = render( <UploadDropzone onFiles={ onFiles } /> );

		// Real EBML bytes — the refusal has to be about the CONTAINER, not about
		// the file being an impostor.
		const webm = new File(
			[ new Uint8Array( [ 0x1a, 0x45, 0xdf, 0xa3, 0x01, 0x00, 0x00, 0x00 ] ) ],
			'holiday.webm',
			{ type: 'video/webm' }
		);
		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- the dropzone is a styled div with no accessible role; no query reaches it.
		const dropzone = container.querySelector( '.vp-upload-dropzone' ) as HTMLElement;
		fireEvent.drop( dropzone, { dataTransfer: { files: [ webm ] } } );

		await waitFor( () =>
			expect( mockCreateErrorNotice ).toHaveBeenCalledWith(
				'WEBM files can’t be uploaded. Convert your video to MP4 or MOV, then try again.',
				{ id: 'vp-upload-invalid-file' }
			)
		);
		expect( mockCreateErrorNotice ).not.toHaveBeenCalledWith(
			'Only video files can be uploaded.',
			expect.anything()
		);
		expect( onFiles ).not.toHaveBeenCalled();
	} );

	it( 'stops the picker offering formats the drop handler would refuse', async () => {
		// `accept="video/*"` is what put `.webm` and `.mkv` in the OS dialog in
		// the first place. The picker must offer only the allow-list.
		const { container } = render( <UploadDropzone onFiles={ jest.fn() } /> );

		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- the picker input is visually hidden with no label; no accessible query reaches it.
		const input = container.querySelector( 'input[type="file"]' ) as HTMLInputElement;
		const accept = input.getAttribute( 'accept' ) ?? '';
		expect( accept ).not.toBe( 'video/*' );
		expect( accept.split( ',' ) ).toContain( '.mp4' );
		expect( accept.split( ',' ) ).not.toContain( '.webm' );
	} );

	it( 'rejects an impostor picked through the file dialog, not just dropped', async () => {
		// The picker is a separate entry point into the same guard; testers
		// reproduced the upload through both.
		const onFiles = jest.fn();
		const { container } = render( <UploadDropzone onFiles={ onFiles } /> );

		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- the picker input is visually hidden with no label; no accessible query reaches it.
		const input = container.querySelector( 'input[type="file"]' ) as HTMLInputElement;
		await userEvent.upload( input, makeRenamedTextFile( 'not-a-video.mp4' ) );

		await waitFor( () =>
			expect( mockCreateErrorNotice ).toHaveBeenCalledWith(
				'Only video files can be uploaded.',
				expect.objectContaining( { id: 'vp-upload-invalid-file' } )
			)
		);
		expect( onFiles ).not.toHaveBeenCalled();
	} );

	it( 'names the real reason at the plan limit instead of blaming the plan', async () => {
		// Ordering: the limit gate used to fire first, so a renamed `.txt`
		// dropped at the cap was told "You've reached the free plan's 1-video
		// limit" — a fact about the plan answering a question about the file.
		const onFiles = jest.fn();
		const { container } = render( <UploadDropzone onFiles={ onFiles } disabled /> );

		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- the dropzone is a styled div with no accessible role; no query reaches it.
		const dropzone = container.querySelector( '.vp-upload-dropzone' ) as HTMLElement;
		fireEvent.drop( dropzone, {
			dataTransfer: { files: [ makeRenamedTextFile( 'not-a-video.mp4' ) ] },
		} );

		await waitFor( () => expect( mockCreateErrorNotice ).toHaveBeenCalled() );
		expect( mockCreateErrorNotice ).toHaveBeenCalledWith(
			'Only video files can be uploaded.',
			expect.anything()
		);
		expect( mockCreateErrorNotice ).not.toHaveBeenCalledWith( AT_LIMIT_MESSAGE, expect.anything() );
		expect( onFiles ).not.toHaveBeenCalled();
	} );

	it( 'still reports the plan when a real video arrives at the limit', async () => {
		// The other half of that ordering: a genuine video at the cap is a plan
		// problem, and must still say so.
		const { container } = render( <UploadDropzone onFiles={ jest.fn() } disabled /> );

		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- the dropzone is a styled div with no accessible role; no query reaches it.
		const dropzone = container.querySelector( '.vp-upload-dropzone' ) as HTMLElement;
		fireEvent.drop( dropzone, { dataTransfer: { files: [ makeFile( 'real.mp4' ) ] } } );

		await waitFor( () =>
			expect( mockCreateErrorNotice ).toHaveBeenCalledWith( AT_LIMIT_MESSAGE, expect.anything() )
		);
	} );

	it( 'passes the real videos through and drops the rest of a mixed selection', async () => {
		const onFiles = jest.fn();
		const { container } = render( <UploadDropzone onFiles={ onFiles } allowMultiple /> );

		const clip = makeFile( 'clip.mp4' );
		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- the dropzone is a styled div with no accessible role; no query reaches it.
		const dropzone = container.querySelector( '.vp-upload-dropzone' ) as HTMLElement;
		fireEvent.drop( dropzone, {
			dataTransfer: { files: [ clip, makeFile( 'notes.pdf', 'application/pdf' ) ] },
		} );

		await waitFor( () => expect( onFiles ).toHaveBeenCalledWith( [ clip ] ) );
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
