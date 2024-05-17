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

jest.mock( '../../media-picker', () => {
	return () => <div>Media Picker</div>;
} );

describe( 'MediaSection', () => {
	it( 'should define the component', () => {
		expect( 'MediaSection' ).toBeDefined();
	} );

	it( 'should render the media section', async () => {
		render( <MediaSection /> );

		expect( screen.queryByTestId( 'notice' ) ).not.toBeInTheDocument();
		await expect( screen.findByText( 'Media' ) ).resolves.toBeInTheDocument();
		await expect(
			screen.findByText( 'Learn photo and video best practices' )
		).resolves.toBeInTheDocument();
	} );

	it( 'should be disabled if disabled prop is true', async () => {
		render( <MediaSection disabled={ true } /> );

		await expect( screen.findByTestId( 'disabled' ) ).resolves.toBeInTheDocument();
	} );

	it( 'should not be disabled if disabled prop is false', async () => {
		render( <MediaSection disabled={ false } /> );

		await expect( screen.queryByTestId( 'disabled' ) ).not.toBeInTheDocument();
	} );

	it( 'should render the notice if notice prop is set', async () => {
		render( <MediaSection disabledNoticeMessage="This is a notice" /> );

		await expect( screen.findByTestId( 'notice' ) ).resolves.toBeInTheDocument();
	} );
} );
