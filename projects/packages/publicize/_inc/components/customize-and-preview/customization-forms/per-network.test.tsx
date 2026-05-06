import { siteHasFeature } from '@automattic/jetpack-script-data';
import { render } from '@testing-library/react';
import { useDispatch, useSelect } from '@wordpress/data';
import { DEFAULT_MESSAGE_TEMPLATE } from '../../../social-store/constants';
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
		useSelect: jest.fn(),
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
const mockUseSelect = useSelect as jest.Mock;
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
 *
 * @param connectionOverrides
 */
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
	let globalTemplate = DEFAULT_MESSAGE_TEMPLATE;
	let templatesEnabled = true;

	beforeEach( () => {
		jest.clearAllMocks();

		globalMessage = '';
		globalTemplate = DEFAULT_MESSAGE_TEMPLATE;
		templatesEnabled = true;

		mockUseDispatch.mockReturnValue( {
			customizeConnectionById: mockCustomizeConnectionById,
		} );

		mockUsePostMeta.mockImplementation( () => ( {
			attachedMedia: [],
			shareMessage: globalMessage,
			mediaSource: undefined,
		} ) );

		mockUseSelect.mockImplementation( selector => {
			return selector( () => ( {
				getSocialSettings: () => ( { messageTemplate: globalTemplate } ),
			} ) );
		} );

		mockSiteHasFeature.mockImplementation( flag => {
			return flag === 'social-message-templates' ? templatesEnabled : false;
		} );
	} );

	it( 'uses the per-connection message when it is non-empty', () => {
		const sharePostFormProps = getSharePostFormProps( {
			message: 'Manual per-post override',
			template: '{title} {url}',
		} );

		expect( sharePostFormProps.message ).toBe( 'Manual per-post override' );
		expect( sharePostFormProps.messageHelp ).toBe( 'Connection template will be used if empty.' );
	} );

	it( 'prefills with the connection template when message is empty', () => {
		const sharePostFormProps = getSharePostFormProps( {
			message: '',
			template: '{title} {url}',
		} );

		expect( sharePostFormProps.message ).toBe( '{title} {url}' );
		expect( sharePostFormProps.messageHelp ).toBe( 'Connection template will be used if empty.' );
	} );

	it( 'shows global-template helper text when there is no connection message or template', () => {
		globalTemplate = 'Custom global template: {title}';

		const sharePostFormProps = getSharePostFormProps( {
			message: '',
			template: '',
		} );

		expect( sharePostFormProps.message ).toBe( '' );
		expect( sharePostFormProps.messageHelp ).toBe( 'Global template will be used if empty.' );
	} );

	it( 'shows default-template helper text when global template is still default', () => {
		const sharePostFormProps = getSharePostFormProps( {
			message: '',
			template: '',
		} );

		expect( sharePostFormProps.message ).toBe( '' );
		expect( sharePostFormProps.messageHelp ).toBe(
			'The default network template will be used if empty.'
		);
	} );

	it( 'keeps current behavior when message templates feature is off', () => {
		templatesEnabled = false;
		globalMessage = 'Global custom message';

		const sharePostFormProps = getSharePostFormProps( {
			message: undefined,
			template: '{title} {url}',
		} );

		expect( sharePostFormProps.message ).toBe( 'Global custom message' );
		expect( sharePostFormProps.messageHelp ).toBeUndefined();
	} );
} );
