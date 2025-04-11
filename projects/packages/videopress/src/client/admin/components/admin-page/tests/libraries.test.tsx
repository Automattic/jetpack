import { render, screen } from '@testing-library/react';
import { VideoLibraryWrapper } from '../libraries';

jest.mock( '../../../hooks/use-videos', () => {
	return jest.fn().mockImplementation( () => ( {
		search: '',
		isFetching: false,
	} ) );
} );

jest.mock( '../../../hooks/use-search-params', () => ( {
	useSearchParams: jest.fn().mockImplementation( () => ( {
		deleteParam: jest.fn(),
		setParam: jest.fn(),
		getParam: jest.fn(),
		update: jest.fn(),
	} ) ),
} ) );

jest.mock( '@automattic/jetpack-connection', () => ( {
	useConnection: jest.fn(),
	useConnectionErrorNotice: jest.fn( () => ( { hasConnectionError: false } ) ),
} ) );

describe( 'VideoLibraryWrapper', () => {
	it( 'renders', () => {
		render( <VideoLibraryWrapper children={ <div>Content</div> } /> );

		expect( screen.getByText( 'Content' ) ).toBeInTheDocument();
	} );
} );
