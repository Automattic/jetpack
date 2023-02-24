import { render, screen } from '@testing-library/react';
import MediaSection from '..';

jest.mock( '../../../hooks/use-attached-media', () => {
	return jest.fn( () => ( {
		attachedMedia: [],
		updateAttachedMedia: jest.fn(),
	} ) );
} );

jest.mock( '../../../hooks/use-social-media-connections', () => {
	return jest.fn( () => ( {
		enabledConnections: [],
	} ) );
} );

jest.mock( '../../../hooks/use-media-details', () => {
	return jest.fn( () => [ {} ] );
} );

jest.mock( '../../../hooks/use-media-restrictions', () => ( {
	...jest.requireActual( '../../../hooks/use-media-restrictions' ),
	__esModule: true,
	default: () => ( {
		maxImageSize: 3,
		getValidationError: jest.fn(),
		allowedMediaTypes: [],
	} ),
} ) );

describe( 'MediaSection', () => {
	it( 'should define the component', () => {
		expect( 'MediaSection' ).toBeDefined();
	} );

	it( 'should render the media section', async () => {
		render( <MediaSection /> );

		await expect( screen.findByText( 'Media' ) ).resolves.toBeInTheDocument();
		await expect(
			screen.findByText( 'Learn photo and video best practices' )
		).resolves.toBeInTheDocument();
	} );
} );
