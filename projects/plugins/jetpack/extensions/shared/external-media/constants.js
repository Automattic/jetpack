import { dateI18n } from '@wordpress/date';
import { __ } from '@wordpress/i18n';
import { map, range } from 'lodash';

export const SOURCE_WORDPRESS = 'wordpress';
export const SOURCE_GOOGLE_PHOTOS = 'google_photos';
export const SOURCE_OPENVERSE = 'openverse';
export const SOURCE_PEXELS = 'pexels';
export const SOURCE_JETPACK_APP_MEDIA = 'jetpack_app_media';
export const SOURCE_JETPACK_AI_FEATURED_IMAGE = 'jetpack_ai_featured_image';
export const SOURCE_JETPACK_AI_GENERAL_PURPOSE_IMAGE = 'jetpack_ai_general_purpose_image';

export const PATH_RECENT = 'recent';
export const PATH_ROOT = '/';
export const PATH_OPTIONS = [
	{
		value: PATH_RECENT,
		label: __( 'Photos', 'jetpack' ),
	},
	{
		value: PATH_ROOT,
		label: __( 'Albums', 'jetpack' ),
	},
];
export const GOOGLE_PHOTOS_CATEGORIES = [
	{
		value: '',
		/* translators: category of images */
		label: __( 'All categories', 'jetpack' ),
	},
	{
		value: 'animals',
		/* translators: category of images */
		label: __( 'Animals', 'jetpack' ),
	},
	{
		value: 'arts',
		/* translators: category of images */
		label: __( 'Arts', 'jetpack' ),
	},
	{
		value: 'birthdays',
		/* translators: category of images */
		label: __( 'Birthdays', 'jetpack' ),
	},
	{
		value: 'cityscapes',
		/* translators: category of images */
		label: __( 'Cityscapes', 'jetpack' ),
	},
	{
		value: 'crafts',
		/* translators: category of images */
		label: __( 'Crafts', 'jetpack' ),
	},
	{
		value: 'fashion',
		/* translators: category of images */
		label: __( 'Fashion', 'jetpack' ),
	},
	{
		value: 'food',
		/* translators: category of images */
		label: __( 'Food', 'jetpack' ),
	},
	{
		value: 'flowers',
		/* translators: category of images */
		label: __( 'Flowers', 'jetpack' ),
	},
	{
		value: 'gardens',
		/* translators: category of images */
		label: __( 'Gardens', 'jetpack' ),
	},
	{
		value: 'holidays',
		/* translators: category of images */
		label: __( 'Holidays', 'jetpack' ),
	},
	{
		value: 'houses',
		/* translators: category of images */
		label: __( 'Houses', 'jetpack' ),
	},
	{
		value: 'landmarks',
		/* translators: category of images */
		label: __( 'Landmarks', 'jetpack' ),
	},
	{
		value: 'landscapes',
		/* translators: category of images */
		label: __( 'Landscapes', 'jetpack' ),
	},
	{
		value: 'night',
		/* translators: category of images */
		label: __( 'Night', 'jetpack' ),
	},
	{
		value: 'people',
		/* translators: category of images */
		label: __( 'People', 'jetpack' ),
	},
	{
		value: 'pets',
		/* translators: category of images */
		label: __( 'Pets', 'jetpack' ),
	},
	{
		value: 'selfies',
		/* translators: category of images */
		label: __( 'Selfies', 'jetpack' ),
	},
	{
		value: 'sport',
		/* translators: category of images */
		label: __( 'Sport', 'jetpack' ),
	},
	{
		value: 'travel',
		/* translators: category of images */
		label: __( 'Travel', 'jetpack' ),
	},
	{
		value: 'weddings',
		/* translators: category of images */
		label: __( 'Weddings', 'jetpack' ),
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
		label: __( 'Any time', 'jetpack' ),
	},
	{
		value: DATE_RANGE_LAST_7_DAYS,
		label: __( 'Last 7 days', 'jetpack' ),
	},
	{
		value: DATE_RANGE_LAST_30_DAYS,
		label: __( 'Last 30 days', 'jetpack' ),
	},
	{
		value: DATE_RANGE_LAST_6_MONTHS,
		label: __( 'Last 6 months', 'jetpack' ),
	},
	{
		value: DATE_RANGE_LAST_12_MONTHS,
		label: __( 'Last 12 months', 'jetpack' ),
	},
	{
		value: DATE_RANGE_CUSTOM,
		label: __( 'Specific Month/Year', 'jetpack' ),
	},
];

export const CURRENT_YEAR = new Date().getFullYear();

export const MONTH_SELECT_OPTIONS = [
	{ label: __( 'Any Month', 'jetpack' ), value: -1 },
	...map( range( 0, 12 ), value => ( {
		// Following call generates a new date object for the particular month and gets its name.
		label: dateI18n( 'F', new Date( 0, value ) ),
		value,
	} ) ),
];
