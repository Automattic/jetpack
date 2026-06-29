import { render, screen } from '@testing-library/react';
import { PreviewSection } from '../';
import { useConnectionPreviewData } from '../../../../hooks/use-connection-preview-data';
import type { ConnectionPreviewData } from '../../../../hooks/use-connection-preview-data';
import type { Connection } from '../../../../social-store/types';

jest.mock( '../../../../hooks/use-connection-preview-data', () => ( {
	useConnectionPreviewData: jest.fn(),
} ) );

jest.mock( '../post-preview', () => ( {
	PostPreview: ( { previewData }: { previewData: ConnectionPreviewData } ) => (
		<div data-testid="post-preview">{ previewData.message }</div>
	),
} ) );

jest.mock( '../styles.module.scss', () => ( {
	'inactive-preview': 'inactive-preview',
	'preview-section': 'preview-section',
	'preview-skeleton': 'preview-skeleton',
	'preview-skeleton-avatar': 'preview-skeleton-avatar',
	'preview-skeleton-copy': 'preview-skeleton-copy',
	'preview-skeleton-header': 'preview-skeleton-header',
	'preview-skeleton-line': 'preview-skeleton-line',
	'preview-skeleton-line-medium': 'preview-skeleton-line-medium',
	'preview-skeleton-line-short': 'preview-skeleton-line-short',
	'preview-skeleton-lines': 'preview-skeleton-lines',
	'preview-skeleton-media': 'preview-skeleton-media',
	'preview-wrapper': 'preview-wrapper',
} ) );

const mockUseConnectionPreviewData = useConnectionPreviewData as jest.MockedFunction<
	typeof useConnectionPreviewData
>;

const connection: Connection = {
	connection_id: '123',
	display_name: 'Example Account',
	enabled: true,
	external_handle: '@example',
	external_id: 'external-id',
	profile_link: 'https://example.com',
	profile_picture: 'https://example.com/avatar.jpg',
	service_label: 'Facebook',
	service_name: 'facebook',
	shared: false,
	status: 'ok',
	wpcom_user_id: 1,
};

const previewData: ConnectionPreviewData = {
	description: 'Description',
	excerpt: 'Excerpt',
	image: 'https://example.com/image.jpg',
	isLoading: false,
	media: [],
	message: 'Rendered message',
	siteTitle: 'Example Site',
	title: 'Title',
	url: 'https://example.com/post',
};

describe( 'PreviewSection', () => {
	beforeEach( () => {
		mockUseConnectionPreviewData.mockReturnValue( previewData );
	} );

	afterEach( () => {
		jest.clearAllMocks();
	} );

	it( 'renders the post preview for enabled connections when preview data is ready', () => {
		render( <PreviewSection connection={ connection } /> );

		expect( screen.getByTestId( 'post-preview' ) ).toHaveTextContent( previewData.message );
		expect( screen.queryByRole( 'status' ) ).not.toBeInTheDocument();
	} );

	it( 'renders one preview skeleton while preview data is loading', () => {
		mockUseConnectionPreviewData.mockReturnValue( { ...previewData, isLoading: true } );

		render( <PreviewSection connection={ connection } /> );

		expect( screen.getByRole( 'status' ) ).toHaveTextContent( 'Loading post preview.' );
		expect( screen.queryByTestId( 'post-preview' ) ).not.toBeInTheDocument();
	} );

	it( 'does not read preview data for inactive connections', () => {
		render( <PreviewSection connection={ { ...connection, enabled: false } } /> );

		expect( screen.getByText( "The post won't be shared to this account." ) ).toBeInTheDocument();
		expect( mockUseConnectionPreviewData ).not.toHaveBeenCalled();
	} );
} );
