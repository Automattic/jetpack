import { siteHasFeature } from '@automattic/jetpack-script-data';
import { render } from '@testing-library/react';
import { useDispatch } from '@wordpress/data';
import { PerNetworkCustomizationForm } from './per-network';
import type { Connection } from '../../../social-store/types';

jest.mock( '@automattic/jetpack-script-data', () => {
	const actual = jest.requireActual( '@automattic/jetpack-script-data' );
	return {
		...actual,
		siteHasFeature: jest.fn(),
	};
} );

jest.mock( '@wordpress/data', () => {
	const actual = jest.requireActual( '@wordpress/data' );
	const mocks = {
		useDispatch: jest.fn(),
	};

	return new Proxy( actual, {
		get( target, property ) {
			return mocks[ property as keyof typeof mocks ] ?? target[ property as keyof typeof target ];
		},
	} );
} );

const mockUsePostMeta = jest.fn();
jest.mock( '../../../hooks/use-post-meta', () => ( {
	usePostMeta: () => mockUsePostMeta(),
} ) );

jest.mock( '../../../hooks/use-featured-image', () => jest.fn( () => null ) );
jest.mock( '../../../hooks/use-media-details', () => jest.fn( () => [ null ] ) );

const mockSharePostForm = jest.fn();
jest.mock( '../../form/share-post-form', () => ( {
	SharePostForm: ( props: unknown ) => {
		mockSharePostForm( props );
		return null;
	},
} ) );

const mockUseDispatch = useDispatch as jest.Mock;
const mockSiteHasFeature = siteHasFeature as jest.Mock;

const baseConnection: Connection = {
	connection_id: 'connection-1',
	display_name: 'Example Connection',
	external_handle: '@example',
	external_id: 'external-1',
	profile_link: 'https://example.com/profile',
	profile_picture: 'https://example.com/profile.jpg',
	service_label: 'Facebook',
	service_name: 'facebook',
	shared: false,
	status: 'ok',
	wpcom_user_id: 123,
	enabled: true,
	attached_media: [ { id: 99, url: 'https://example.com/media.jpg', type: 'image/jpeg' } ],
};

/**
 * Render the form and return the props passed to SharePostForm.
 *
 * @param {Partial< Connection >} connectionOverrides - Partial connection values for the test case.
 * @return {Record< string, unknown >} Props passed to SharePostForm.
 */
function getSharePostFormProps( connectionOverrides: Partial< Connection > = {} ) {
	const connection = { ...baseConnection, ...connectionOverrides };
	render( <PerNetworkCustomizationForm connection={ connection } /> );
	return mockSharePostForm.mock.calls[ 0 ][ 0 ];
}

describe( 'PerNetworkCustomizationForm', () => {
	const mockCustomizeConnectionById = jest.fn();
	let globalMessage = '';
	let templatesEnabled = true;

	beforeEach( () => {
		jest.clearAllMocks();

		globalMessage = '';
		templatesEnabled = true;

		mockUseDispatch.mockReturnValue( {
			customizeConnectionById: mockCustomizeConnectionById,
		} );

		mockUsePostMeta.mockImplementation( () => ( {
			attachedMedia: [],
			shareMessage: globalMessage,
			mediaSource: undefined,
		} ) );

		mockSiteHasFeature.mockImplementation( flag => {
			return flag === 'social-message-templates' ? templatesEnabled : false;
		} );
	} );

	it( 'displays connection.message verbatim when it is set', () => {
		const sharePostFormProps = getSharePostFormProps( {
			message: 'Manual per-post override',
			template: '{title} {url}',
		} );

		expect( sharePostFormProps.message ).toBe( 'Manual per-post override' );
		expect( sharePostFormProps.messageHelp ).toBe( 'A template will be used if this is empty.' );
	} );

	it( 'preserves an explicitly empty connection.message (no template snap-back)', () => {
		const sharePostFormProps = getSharePostFormProps( {
			message: '',
			template: '{title} {url}',
		} );

		expect( sharePostFormProps.message ).toBe( '' );
		expect( sharePostFormProps.messageHelp ).toBe( 'A template will be used if this is empty.' );
	} );

	it( 'shows empty when connection.message is unset (no globalMessage fallback in the form)', () => {
		globalMessage = 'Global custom message';

		const sharePostFormProps = getSharePostFormProps( {
			message: undefined,
			template: '',
		} );

		expect( sharePostFormProps.message ).toBe( '' );
		expect( sharePostFormProps.messageHelp ).toBe( 'A template will be used if this is empty.' );
	} );

	it( 'omits the helper text when message templates feature is off', () => {
		templatesEnabled = false;
		globalMessage = 'Global custom message';

		const sharePostFormProps = getSharePostFormProps( {
			message: undefined,
			template: '{title} {url}',
		} );

		expect( sharePostFormProps.message ).toBe( '' );
		expect( sharePostFormProps.messageHelp ).toBeUndefined();
	} );
} );
