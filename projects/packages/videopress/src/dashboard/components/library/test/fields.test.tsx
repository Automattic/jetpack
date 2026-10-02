import { render, screen } from '@testing-library/react';
import { makeLibraryItem } from '../../../test-utils/library-item';
import { libraryFields } from '../fields';
import { UploadActionsProvider } from '../upload-actions-context';
import type { LibraryItem } from '../../../types/library';
import type { Field } from '@wordpress/dataviews';

const getField = ( id: string ): Field< LibraryItem > => {
	const field = libraryFields.find( candidate => candidate.id === id );
	if ( ! field ) {
		throw new Error( `Field ${ id } is not registered` );
	}
	return field;
};

describe( 'title field upload pill', () => {
	const uploadActions = {
		promoteLocal: jest.fn(),
		retryUpload: jest.fn(),
		openVideoDetails: jest.fn(),
	};

	const renderTitle = ( item: LibraryItem ) => {
		const TitleRender = getField( 'title' ).render as React.ComponentType< {
			item: LibraryItem;
		} >;
		return render(
			<UploadActionsProvider value={ uploadActions }>
				<TitleRender item={ item } />
			</UploadActionsProvider>
		);
	};

	it( 'points a connection-caused failure at the connection notice', () => {
		renderTitle(
			makeLibraryItem( {
				type: 'local',
				upload: { status: 'failed', progress: 0, failureReason: 'connection' },
			} )
		);

		expect( screen.getByText( 'Upload failed: Jetpack connection issue' ) ).toBeInTheDocument();
	} );

	it.each( [ [ 'other' as const ], [ undefined ] ] )(
		'leaves the plain label on a failure attributed to %s',
		failureReason => {
			renderTitle(
				makeLibraryItem( {
					type: 'local',
					upload: { status: 'failed', progress: 0, failureReason },
				} )
			);

			expect( screen.getByText( 'Upload failed' ) ).toBeInTheDocument();
		}
	);
} );

describe( 'orientation field', () => {
	const renderOrientation = ( item: LibraryItem ) => {
		const OrientationRender = getField( 'orientation' ).render as React.ComponentType< {
			item: LibraryItem;
		} >;
		return render( <OrientationRender item={ item } /> );
	};

	it( 'shows a labelled portrait indicator for portrait videos', () => {
		renderOrientation( makeLibraryItem( { orientation: 'portrait' } ) );

		const indicator = screen.getByRole( 'img', { name: 'Portrait' } );
		expect( indicator ).toHaveClass( 'vp-library__orientation--portrait' );
	} );

	it( 'shows a labelled landscape indicator for landscape videos', () => {
		renderOrientation( makeLibraryItem( { orientation: 'landscape' } ) );

		const indicator = screen.getByRole( 'img', { name: 'Landscape' } );
		expect( indicator ).toHaveClass( 'vp-library__orientation--landscape' );
	} );

	it( 'renders nothing when the orientation is unknown', () => {
		const { container } = renderOrientation( makeLibraryItem( { orientation: null } ) );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'exposes the orientation as the field value', () => {
		const field = getField( 'orientation' );

		expect( field.getValue?.( { item: makeLibraryItem( { orientation: 'landscape' } ) } ) ).toBe(
			'landscape'
		);
		expect( field.getValue?.( { item: makeLibraryItem( { orientation: null } ) } ) ).toBe( '' );
	} );
} );
