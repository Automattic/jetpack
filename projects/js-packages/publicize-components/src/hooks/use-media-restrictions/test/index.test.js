import { renderHook } from '@testing-library/react-hooks';
import useMediaRestrictions, {
	FILE_SIZE_ERROR,
	FILE_TYPE_ERROR,
	getAllowedMediaTypes,
	VIDEO_LENGTH_TOO_LONG_ERROR,
	VIDEO_LENGTH_TOO_SHORT_ERROR,
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
const ALLOWED_MEDIA_TYPES_ALL = [
	'image/jpeg',
	'image/jpg',
	'image/png',
	'video/mp4',
	'video/videopress',
];

describe( 'useMediaRestrictions hook', () => {
	const { result, rerender } = renderHook( connections => useMediaRestrictions( connections ), {
		initialProps: DUMMY_CONNECTIONS,
	} );

	test( 'maxImageSize returns the best image size available', () => {
		const defaultMaxImageSize = result.current.maxImageSize;
		rerender( [ { service_name: 'linkedin' } ] );
		const linkedinMaxImageSize = result.current.maxImageSize;
		rerender( DUMMY_CONNECTIONS );

		expect( defaultMaxImageSize ).toBe( 4 );
		expect( linkedinMaxImageSize ).toBe( 20 );
	} );

	test( 'Video limits are calculated correctly', () => {
		const defaultVideoLimits = result.current.videoLimits;
		rerender( [ { service_name: 'twitter' }, { service_name: 'facebook' } ] );
		const modifiedVideoLimits = result.current.videoLimits;
		rerender( DUMMY_CONNECTIONS );

		expect( defaultVideoLimits ).toStrictEqual( {
			maxLength: 140,
			maxSize: 200,
			minLength: 3,
			minSize: 0.075,
		} );
		expect( modifiedVideoLimits ).toStrictEqual( {
			maxLength: 140,
			maxSize: 512,
			minLength: 0,
			minSize: 0,
		} );
	} );

	test( 'Returns allowed media types', () => {
		const allAllowedMediaTypes = getAllowedMediaTypes( DUMMY_CONNECTIONS );
		const allAllowedMediaTypesTumblr = getAllowedMediaTypes( [ { service_name: 'tumblr' } ] );

		expect( allAllowedMediaTypes.sort() ).toStrictEqual( ALLOWED_MEDIA_TYPES_ALL.sort() );
		expect( allAllowedMediaTypesTumblr.sort() ).toStrictEqual(
			ALLOWED_MEDIA_TYPES_ALL.concat( [ 'video/mov' ] ).sort()
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

			expect( validationErrors ).toContain( VIDEO_LENGTH_TOO_SHORT_ERROR );
			expect( validationErrors ).toContain( VIDEO_LENGTH_TOO_LONG_ERROR );
			expect( validationErrors ).toHaveLength( 2 );
		} );

		test( 'Valid media results in no error', () => {
			const validationErrors = VALID_MEDIA.map( media =>
				result.current.getValidationError( media )
			);

			expect( validationErrors.every( error => error === null ) ).toBe( true );
		} );
	} );
} );
