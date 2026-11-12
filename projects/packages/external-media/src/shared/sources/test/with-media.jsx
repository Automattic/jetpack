import apiFetch from '@wordpress/api-fetch';
import { act, render, screen } from '@testing-library/react';
import withMedia from '../with-media';

jest.mock( '@wordpress/api-fetch' );
jest.mock( '@wordpress/data', () => ( {
	...jest.requireActual( '@wordpress/data' ),
	withSelect: () => Component => props => (
		<Component { ...props } postId={ 1 } existingMedia={ [] } />
	),
} ) );
jest.mock( '../../media-service', () => ( { authenticateMediaSource: jest.fn() } ) );

const items = Array.from( { length: 25 }, ( _, i ) => ( { guid: `guid-${ i }` } ) );
const copyBatch = ( { data } ) =>
	Promise.resolve( data.media.map( ( { guid } ) => ( { id: guid } ) ) );

let props;
const Inner = innerProps => {
	props = innerProps;
	return <div data-testid="copying">{ String( innerProps.isCopying ) }</div>;
};
const Source = withMedia( 'google_photos' )( Inner );

const renderAndCopy = async ( onSelect, onClose ) => {
	render( <Source multiple onSelect={ onSelect } onClose={ onClose } /> );
	await act( () => props.copyMedia( items, '/copy', 'google_photos' ) );
};

describe( 'withMedia copyMedia', () => {
	beforeEach( () => apiFetch.mockReset() );

	it( 'copies items in batches and inserts all of them', async () => {
		apiFetch.mockImplementation( copyBatch );
		const onSelect = jest.fn();
		const onClose = jest.fn();

		await renderAndCopy( onSelect, onClose );

		const batchSizes = apiFetch.mock.calls.map( ( [ { data } ] ) => data.media.length );
		expect( batchSizes ).toEqual( [ 10, 10, 5 ] );
		expect( onClose ).toHaveBeenCalled();
		expect( onSelect ).toHaveBeenCalledWith( items.map( ( { guid } ) => ( { id: guid } ) ) );
	} );

	it( 'reports already imported items when a later batch fails', async () => {
		apiFetch
			.mockImplementationOnce( copyBatch )
			.mockRejectedValueOnce( { code: 'upload_error', message: 'Upload failed.' } );
		const onSelect = jest.fn();
		const onClose = jest.fn();

		await renderAndCopy( onSelect, onClose );

		expect( apiFetch ).toHaveBeenCalledTimes( 2 );
		expect( onSelect ).not.toHaveBeenCalled();
		expect( onClose ).not.toHaveBeenCalled();
		expect( screen.getByText( 'Upload failed.' ) ).toBeInTheDocument();
		expect(
			screen.getByText(
				'10 of 25 items were added to your media library before the import stopped.'
			)
		).toBeInTheDocument();
		expect( screen.getByTestId( 'copying' ) ).toHaveTextContent( 'false' );
	} );
} );
