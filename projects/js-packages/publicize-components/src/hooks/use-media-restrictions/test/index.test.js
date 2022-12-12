import { renderHook } from '@testing-library/react-hooks';
import useMediaRestrictions, {
	FILE_SIZE_ERROR,
	FILE_TYPE_ERROR,
	VIDEO_LENGTH_ERROR,
} from '../index';

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

const INVALID_TYPES = [ 'imagejpg', 'image/tgif', 'video/mp5', '', null ];
const INVALID_LENGTH_VIDEOS = [
	{ mime: 'video/mp4', fileSize: 1000000, length: 2 }, // Too short video
	{ mime: 'video/mp4', fileSize: 1000000, length: 20000 }, // Too long video
];
const INVALID_SIZED_MEDIA = [
	{ mime: 'image/jpg', fileSize: 10000000 }, // Too big image
	{ mime: 'video/mp4', fileSize: 100000000000, length: 20 }, // Too big video
	{ mime: 'video/mp4', fileSize: 10, length: 20 }, // Too small video
];
const VALID_MEDIA = [
	{ mime: 'image/jpg', fileSize: 20 },
	{ mime: 'image/png', fileSize: 3000000 },
	{ mime: 'video/mp4', fileSize: 1000000, length: 20 },
];
const ALLOWED_MEDIA_TYPES_ALL = [ 'image/jpeg', 'image/jpg', 'image/png', 'video/mp4' ];

describe( 'useMediaRestrictions hook', () => {
	const { result, rerender } = renderHook( connections => useMediaRestrictions( connections ), {
		initialProps: DUMMY_CONNECTIONS,
	} );

	test( 'maxImageSize returns the best image size available', () => {
		expect( result.current.maxImageSize ).toBe( 4 );
	} );

	test( 'Returns allowed media types', () => {
		const allAllowedMediaTypes = result.current.getAllowedMediaTypes();

		rerender( [ { service_name: 'tumblr' } ] );
		const allAllowedMediaTypesTumblr = result.current.getAllowedMediaTypes();
		rerender( DUMMY_CONNECTIONS );

		expect( allAllowedMediaTypes ).toStrictEqual( ALLOWED_MEDIA_TYPES_ALL );
		expect( allAllowedMediaTypesTumblr ).toStrictEqual(
			ALLOWED_MEDIA_TYPES_ALL.concat( [ 'video/mov' ] )
		);
	} );

	describe( 'Validation tests', () => {
		test( 'Too big/small media results in file size error', () => {
			const validationErrors = INVALID_SIZED_MEDIA.map( media =>
				result.current.getValidationError( media )
			);

			expect( validationErrors.every( error => error === FILE_SIZE_ERROR ) ).toBe( true );
		} );

		test( 'Invalid file type results in file type error', () => {
			const validationErrors = INVALID_TYPES.map( type =>
				result.current.getValidationError( 200, type )
			);

			expect( validationErrors.every( error => error === FILE_TYPE_ERROR ) ).toBe( true );
		} );

		test( 'Too short/long videos result in video length error', () => {
			const validationErrors = INVALID_LENGTH_VIDEOS.map( video =>
				result.current.getValidationError( video )
			);

			expect( validationErrors.every( error => error === VIDEO_LENGTH_ERROR ) ).toBe( true );
		} );

		test( 'Valid media results in no error', () => {
			const validationErrors = VALID_MEDIA.map( media =>
				result.current.getValidationError( media )
			);

			expect( validationErrors.every( error => error === null ) ).toBe( true );
		} );
	} );
} );
