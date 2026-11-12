import { fireEvent, render, screen } from '@testing-library/react';
import MediaBrowser from '../index';

jest.mock( '@automattic/jetpack-shared-extension-utils', () => ( {
	useAnalytics: () => ( { tracks: { recordEvent: jest.fn() } } ),
} ) );
jest.mock( '../use-page-source', () => () => 'editor' );

const LIMIT_MESSAGE = 'You can select up to 50 items at a time.';

const media = Array.from( { length: 51 }, ( _, i ) => ( {
	ID: `id-${ i }`,
	type: 'image',
	title: `Photo ${ i }`,
	thumbnails: {},
} ) );

const renderBrowser = ( props = {} ) =>
	render(
		<MediaBrowser
			media={ media }
			mediaSource="google_photos"
			multiple
			setPath={ jest.fn() }
			nextPage={ jest.fn() }
			onCopy={ jest.fn() }
			{ ...props }
		/>
	);

const selectFirst = count => {
	for ( let i = 0; i < count; i++ ) {
		fireEvent.click( screen.getByRole( 'option', { name: `Select item: Photo ${ i }` } ) );
	}
};

describe( 'MediaBrowser selection limit', () => {
	it( 'blocks new selections at the limit but still allows deselecting', () => {
		renderBrowser();
		selectFirst( 50 );

		fireEvent.click( screen.getByRole( 'option', { name: 'Select item: Photo 50' } ) );
		expect( screen.getByRole( 'option', { name: 'Select item: Photo 50' } ) ).toHaveAttribute(
			'aria-checked',
			'false'
		);
		expect( screen.getByRole( 'option', { name: 'Deselect item: Photo 0' } ) ).toHaveAttribute(
			'aria-checked',
			'true'
		);

		fireEvent.click( screen.getByRole( 'option', { name: 'Deselect item: Photo 0' } ) );
		expect( screen.getByRole( 'option', { name: 'Select item: Photo 0' } ) ).toHaveAttribute(
			'aria-checked',
			'false'
		);
		expect( screen.queryByText( LIMIT_MESSAGE ) ).not.toBeInTheDocument();
	} );

	it.each( [
		[ 'below the limit', 49, false ],
		[ 'at the limit', 50, true ],
	] )( 'shows the limit message only at the limit (%s)', ( _, count, shown ) => {
		renderBrowser();
		selectFirst( count );

		expect( screen.getByRole( 'status' ).textContent ).toBe( shown ? LIMIT_MESSAGE : '' );
	} );
} );
