import { renderHook } from '@testing-library/react-hooks';
import useMediaRestrictions, { FILE_SIZE_ERROR, FILE_TYPE_ERROR } from '../index';

const DUMMY_CONNECTIONS = [
	{
		service_name: 'twitter',
	},
	{
		service_name: 'facebook',
	},
	{
		service_name: 'tumblr',
	},
	{
		service_name: 'linkedin',
	},
];

const INVALID_TYPES = [ 'imagejpg', 'image/tgif', '', null ];
const VALID_MEDIA = [
	{ size: 20, type: 'image/jpg' },
	{ size: 3000000, type: 'image/png' },
];

const setup = connections => renderHook( () => useMediaRestrictions( connections ) );

describe( 'useMediaRestrictions hook', () => {
	test( 'maxImageSize returns the best image size available', () => {
		const { result } = setup( DUMMY_CONNECTIONS );

		expect( result.current.maxImageSize ).toBe( 4 );
	} );

	test( 'Too big JPG results in file size error', () => {
		const { result } = setup( DUMMY_CONNECTIONS );

		const validationError = result.current.getValidationError( 10000000, 'image/jpg' );

		expect( validationError ).toBe( FILE_SIZE_ERROR );
	} );

	test( 'Invalid file type results in file type error', () => {
		const { result } = setup( DUMMY_CONNECTIONS );

		const validationErrors = INVALID_TYPES.map( type =>
			result.current.getValidationError( 200, type )
		);

		expect( validationErrors.every( error => error === FILE_TYPE_ERROR ) ).toBe( true );
	} );

	test( 'Valid media results in no error', () => {
		const { result } = setup( DUMMY_CONNECTIONS );

		const validationErrors = VALID_MEDIA.map( media =>
			result.current.getValidationError( media.size, media.type )
		);

		expect( validationErrors.every( error => error === null ) ).toBe( true );
	} );

	test.todo( 'Returns allowed media types' ); // Do this after we have videos and different restrictions.
} );
