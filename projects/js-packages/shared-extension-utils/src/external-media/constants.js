import { dateI18n } from '@wordpress/date';
import { __ } from '@wordpress/i18n';
import { map, range } from 'lodash';

export const SOURCE_WORDPRESS = 'wordpress';
export const SOURCE_GOOGLE_PHOTOS = 'google_photos';
export const SOURCE_OPENVERSE = 'openverse';
export const SOURCE_PEXELS = 'pexels';
export const SOURCE_JETPACK_APP_MEDIA = 'jetpack_app_media';
export const SOURCE_JETPACK_AI_FEATURED_IMAGE = 'jetpack_ai_featured_image';
export const SOURCE_JETPACK_AI_GENERAL_PURPOSE_IMAGE_FOR_MEDIA_SOURCE =
	'jetpack_ai_general_purpose_image_for_media_source';
export const SOURCE_JETPACK_AI_GENERAL_PURPOSE_IMAGE_FOR_BLOCK =
	'jetpack_ai_general_purpose_image_for_block';

export const PATH_RECENT = 'recent';
export const PATH_ROOT = '/';
export const PATH_OPTIONS = [
	{
		value: PATH_RECENT,
		label: __( 'Photos', 'jetpack-shared-extension-utils' ),
	},
	{
		value: PATH_ROOT,
		label: __( 'Albums', 'jetpack-shared-extension-utils' ),
	},
];
export const GOOGLE_PHOTOS_PICKER_SESSION = 'google_photos_picker_session';
export const GOOGLE_PHOTOS_CATEGORIES = [
	{
		value: '',
		/* translators: category of images */
		label: __( 'All categories', 'jetpack-shared-extension-utils' ),
	},
	{
		value: 'animals',
		/* translators: category of images */
		label: __( 'Animals', 'jetpack-shared-extension-utils' ),
	},
	{
		value: 'arts',
		/* translators: category of images */
		label: __( 'Arts', 'jetpack-shared-extension-utils' ),
	},
	{
		value: 'birthdays',
		/* translators: category of images */
		label: __( 'Birthdays', 'jetpack-shared-extension-utils' ),
	},
	{
		value: 'cityscapes',
		/* translators: category of images */
		label: __( 'Cityscapes', 'jetpack-shared-extension-utils' ),
	},
	{
		value: 'crafts',
		/* translators: category of images */
		label: __( 'Crafts', 'jetpack-shared-extension-utils' ),
	},
	{
		value: 'fashion',
		/* translators: category of images */
		label: __( 'Fashion', 'jetpack-shared-extension-utils' ),
	},
	{
		value: 'food',
		/* translators: category of images */
		label: __( 'Food', 'jetpack-shared-extension-utils' ),
	},
	{
		value: 'flowers',
		/* translators: category of images */
		label: __( 'Flowers', 'jetpack-shared-extension-utils' ),
	},
	{
		value: 'gardens',
		/* translators: category of images */
		label: __( 'Gardens', 'jetpack-shared-extension-utils' ),
	},
	{
		value: 'holidays',
		/* translators: category of images */
		label: __( 'Holidays', 'jetpack-shared-extension-utils' ),
	},
	{
		value: 'houses',
		/* translators: category of images */
		label: __( 'Houses', 'jetpack-shared-extension-utils' ),
	},
	{
		value: 'landmarks',
		/* translators: category of images */
		label: __( 'Landmarks', 'jetpack-shared-extension-utils' ),
	},
	{
		value: 'landscapes',
		/* translators: category of images */
		label: __( 'Landscapes', 'jetpack-shared-extension-utils' ),
	},
	{
		value: 'night',
		/* translators: category of images */
		label: __( 'Night', 'jetpack-shared-extension-utils' ),
	},
	{
		value: 'people',
		/* translators: category of images */
		label: __( 'People', 'jetpack-shared-extension-utils' ),
	},
	{
		value: 'pets',
		/* translators: category of images */
		label: __( 'Pets', 'jetpack-shared-extension-utils' ),
	},
	{
		value: 'selfies',
		/* translators: category of images */
		label: __( 'Selfies', 'jetpack-shared-extension-utils' ),
	},
	{
		value: 'sport',
		/* translators: category of images */
		label: __( 'Sport', 'jetpack-shared-extension-utils' ),
	},
	{
		value: 'travel',
		/* translators: category of images */
		label: __( 'Travel', 'jetpack-shared-extension-utils' ),
	},
	{
		value: 'weddings',
		/* translators: category of images */
		label: __( 'Weddings', 'jetpack-shared-extension-utils' ),
	},
];
export const PEXELS_EXAMPLE_QUERIES = [
	'mountain',
	'ocean',
	'river',
	'clouds',
	'pattern',
	'abstract',
	'sky',
];
export const DATE_RANGE_ANY = 'ANY';
export const DATE_RANGE_LAST_7_DAYS = 'LAST_7_DAYS';
export const DATE_RANGE_LAST_30_DAYS = 'LAST_30_DAYS';
export const DATE_RANGE_LAST_6_MONTHS = 'LAST_6_MONTHS';
export const DATE_RANGE_LAST_12_MONTHS = 'LAST_12_MONTHS';
export const DATE_RANGE_CUSTOM = 'CUSTOM';
export const GOOGLE_PHOTOS_DATE_PRESETS = [
	{
		value: DATE_RANGE_ANY,
		label: __( 'Any time', 'jetpack-shared-extension-utils' ),
	},
	{
		value: DATE_RANGE_LAST_7_DAYS,
		label: __( 'Last 7 days', 'jetpack-shared-extension-utils' ),
	},
	{
		value: DATE_RANGE_LAST_30_DAYS,
		label: __( 'Last 30 days', 'jetpack-shared-extension-utils' ),
	},
	{
		value: DATE_RANGE_LAST_6_MONTHS,
		label: __( 'Last 6 months', 'jetpack-shared-extension-utils' ),
	},
	{
		value: DATE_RANGE_LAST_12_MONTHS,
		label: __( 'Last 12 months', 'jetpack-shared-extension-utils' ),
	},
	{
		value: DATE_RANGE_CUSTOM,
		label: __( 'Specific Month/Year', 'jetpack-shared-extension-utils' ),
	},
];

export const CURRENT_YEAR = new Date().getFullYear();

export const MONTH_SELECT_OPTIONS = [
	{ label: __( 'Any Month', 'jetpack-shared-extension-utils' ), value: -1 },
	...map( range( 0, 12 ), value => ( {
		// Following call generates a new date object for the particular month and gets its name.
		label: dateI18n( 'F', new Date( 0, value ) ),
		value,
	} ) ),
];
