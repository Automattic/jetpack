import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { makeLibraryItem as item } from '../../../test-utils/library-item';
import { libraryFields } from '../fields';
import ThumbnailField from '../thumbnail-field';
import { UploadActionsProvider, type UploadActions } from '../upload-actions-context';
import type { LibraryItem } from '../../../types/library';
import type { Field } from '@wordpress/dataviews';

// Avoid the react-query/apiFetch poster request; the poster URL is irrelevant here.
jest.mock( '../../../hooks/use-poster-url', () => ( {
	usePosterUrl: jest.fn( () => null ),
} ) );

const makeActions = ( overrides: Partial< UploadActions > = {} ): UploadActions => ( {
	promoteLocal: jest.fn(),
	retryUpload: jest.fn(),
	openVideoDetails: jest.fn(),
	...overrides,
} );

const renderField = ( ui: React.ReactNode, actions: UploadActions ) =>
	render( <UploadActionsProvider value={ actions }>{ ui }</UploadActionsProvider> );

// The title cell render is whatever the exported `title` field declares.
const TitleCellRender = ( libraryFields.find( f => f.id === 'title' ) as Field< LibraryItem > )
	.render as ( args: { item: LibraryItem } ) => React.ReactNode;

describe( 'ThumbnailField — grid Details access', () => {
	it( 'renders an "Edit details" button that opens details for an idle VideoPress video', async () => {
		const actions = makeActions();
		renderField( <ThumbnailField item={ item( { id: '7', title: 'Holiday' } ) } />, actions );

		const button = screen.getByRole( 'button', { name: 'Edit details for Holiday' } );
		await userEvent.click( button );

		expect( actions.openVideoDetails ).toHaveBeenCalledWith( '7' );
		expect( actions.openVideoDetails ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'shows a duration badge when the idle VideoPress video has a duration', () => {
		renderField( <ThumbnailField item={ item( { durationSeconds: 75 } ) } />, makeActions() );
		expect( screen.getByText( '01:15' ) ).toBeInTheDocument();
	} );

	it( 'does not render the open-details button for a local video, and offers Upload instead', async () => {
		const actions = makeActions();
		renderField( <ThumbnailField item={ item( { id: '9', type: 'local' } ) } />, actions );

		expect( screen.queryByRole( 'button', { name: /Edit details/ } ) ).not.toBeInTheDocument();

		await userEvent.click( screen.getByRole( 'button', { name: 'Upload to VideoPress' } ) );
		expect( actions.promoteLocal ).toHaveBeenCalledWith( '9' );
	} );

	it( 'offers Retry for a failed upload', async () => {
		const actions = makeActions();
		renderField(
			<ThumbnailField
				item={ item( { id: '5', type: 'local', upload: { status: 'failed', progress: 0 } } ) }
			/>,
			actions
		);

		await userEvent.click( screen.getByRole( 'button', { name: 'Retry' } ) );
		expect( actions.retryUpload ).toHaveBeenCalledWith( '5' );
	} );

	it( 'does not render the open-details button while uploading', () => {
		renderField(
			<ThumbnailField item={ item( { upload: { status: 'uploading', progress: 40 } } ) } />,
			makeActions()
		);
		expect( screen.queryByRole( 'button', { name: /Edit details/ } ) ).not.toBeInTheDocument();
		expect( screen.getByText( '40%' ) ).toBeInTheDocument();
	} );

	it( 'shows a Deleting… overlay and removes the open-details button while deleting', () => {
		renderField(
			<ThumbnailField item={ item( { upload: { status: 'deleting', progress: 0 } } ) } />,
			makeActions()
		);
		expect( screen.getByText( 'Deleting…' ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: /Edit details/ } ) ).not.toBeInTheDocument();
	} );
} );

describe( 'TitleCell — grid Details access', () => {
	it( 'renders the title as a button that opens details for an idle VideoPress video', async () => {
		const actions = makeActions();
		renderField( <TitleCellRender item={ item( { id: '3', title: 'Launch' } ) } />, actions );

		await userEvent.click( screen.getByRole( 'button', { name: 'Launch' } ) );
		expect( actions.openVideoDetails ).toHaveBeenCalledWith( '3' );
	} );

	it( 'renders the title as plain text (no button) for a local video', () => {
		renderField(
			<TitleCellRender item={ item( { type: 'local', title: 'Raw Footage' } ) } />,
			makeActions()
		);
		expect( screen.getByText( 'Raw Footage' ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: 'Raw Footage' } ) ).not.toBeInTheDocument();
	} );

	it( 'renders a Deleting… pill and a non-interactive title while deleting', () => {
		renderField(
			<TitleCellRender
				item={ item( { title: 'Doomed', upload: { status: 'deleting', progress: 0 } } ) }
			/>,
			makeActions()
		);
		expect( screen.getByText( 'Deleting…' ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: 'Doomed' } ) ).not.toBeInTheDocument();
	} );
} );
