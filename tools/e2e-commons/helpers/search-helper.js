import fs from 'fs';
import path from 'path';
import { execWpCommand } from './utils-helper';
import config from 'config';

export async function enableInstantSearch() {
	return execWpCommand( 'option update instant_search_enabled 1' );
}

export async function disableInstantSearch() {
	return execWpCommand( 'option update instant_search_enabled 0' );
}

export async function setResultFormat( format = 'expanded' ) {
	return execWpCommand( `option update jetpack_search_result_format ${ format }` );
}

export async function getSidebarsWidgets() {
	try {
		return await getWpOptionData( 'sidebars_widgets' );
	} catch ( e ) {
		return getSidebarsWidgetsData();
	}
}

export async function getBlockWidgets() {
	try {
		return await getWpOptionData( 'widget_block' );
	} catch ( e ) {
		return getBlockWidgetsData();
	}
}

export async function setupSidebarsWidgets( sidebarsWidgetsValue = getSidebarsWidgetsData() ) {
	const sidebarsWidgetsOption = 'sidebars_widgets';
	const sidebarsWidgetsFilePath = path.resolve( config.get( 'temp.sidebarsWidgetsFile' ) );

	return await setWpOptionData(
		sidebarsWidgetsOption,
		sidebarsWidgetsValue,
		sidebarsWidgetsFilePath
	);
}

export async function setupSearchWidget( searchWidgetValue = getSearchFiltersData() ) {
	const searchWidgetOption = 'widget_jetpack-search-filters';
	const searchWidgetFilePath = path.resolve( config.get( 'temp.searchWidgetFile' ) );

	return await setWpOptionData( searchWidgetOption, searchWidgetValue, searchWidgetFilePath );
}

export async function setupBlockWidgets( blockWidgets = getBlockWidgetsData() ) {
	const blockWidgetsOption = 'widget_block';
	const blockWidgetsFilePath = path.resolve( config.get( 'temp.blockWidgetsFile' ) );

	return await setWpOptionData( blockWidgetsOption, blockWidgets, blockWidgetsFilePath );
}

async function setWpOptionData( optionName, value, tempFilePath ) {
	fs.writeFileSync( tempFilePath, JSON.stringify( value ) );

	return await execWpCommand( `option update ${ optionName } --format=json <	${ tempFilePath }` );
}

async function getWpOptionData( optionName ) {
	const value = await execWpCommand( `option get ${ optionName } --format=json` );
	if ( typeof value === 'object' ) {
		throw value;
	}
	return JSON.parse( value );
}

function getSearchFiltersData() {
	return {
		8: {
			title: '',
			search_box_enabled: '0',
			user_sort_enabled: '0',
			sort: null,
			post_types: [],
			filters: [
				{ name: '', type: 'taxonomy', taxonomy: 'category', count: 5 },
				{ name: '', type: 'taxonomy', taxonomy: 'post_tag', count: 5 },
			],
		},
	};
}

function getBlockWidgetsData() {
	return {
		22: { content: '<!-- wp:search /-->' },
		23: { content: '<!-- wp:search /-->' },
		_multiwidget: 1,
	};
}

function getSidebarsWidgetsData() {
	return {
		wp_inactive_widgets: [],
		'sidebar-1': [ 'block-22' ],
		'sidebar-2': [ 'block-23' ],
		'jetpack-instant-search-sidebar': [ 'jetpack-search-filters-8' ],
		array_version: 3,
	};
}

export const searchResultForTest1 = {
	total: 3,
	corrected_query: false,
	page_handle: false,
	results: [
		{
			_score: null,
			fields: {
				date: '2021-03-25 05:27:29',
				'meta._wc_average_rating.double': 0,
				blog_id: 190651342,
				'has.image': 1,
				'image.url.raw':
					'woocommerce.com/wp-content/uploads/2021/04/blog-fb-Facebook-Conversion@2x.jpg?resize=1536,803',
				'title.default': 'Test1 Record 1',
				'permalink.url.raw': '/product/test1-record-1/',
				'meta._wc_review_count.long': 0,
				post_id: 52,
				'wc.price': 50,
				'wc.formatted_price':
					'<span class="woocommerce-Price-amount amount"><span class="woocommerce-Price-currencySymbol">&#036;</span>50.00</span>',
				post_type: 'product',
				'excerpt.default': '',
			},
			result_type: 'post',
			railcar: {
				railcar: 'H(pN&lRu#DK5',
				fetch_algo: 'jetpack:search/1-date_desc',
				fetch_position: 0,
				rec_blog_id: 190651342,
				rec_post_id: 52,
				fetch_lang: 'en',
				fetch_query: 'test1',
				session_id: 'wLrI$1',
			},
			highlight: {
				title: [ '<mark>Test1</mark> Record 1' ],
				content: [ '' ],
			},
			tags: [ 'tag-1' ],
			categories: [ 'category-1' ],
		},
		{
			_score: null,
			fields: {
				date: '2021-03-25 02:44:24',
				'meta._wc_average_rating.double': 0,
				blog_id: 190651342,
				'has.image': 1,
				'image.url.raw':
					'woocommerce.com/wp-content/uploads/2021/01/blog-fb-Choosing-Plugins@2x.jpg?resize=1536,803',
				'title.default': 'Test1 Record 2',
				'permalink.url.raw': '/product/test1-record-2/',
				'meta._wc_review_count.long': 0,
				post_id: 44,
				'wc.price': 5,
				'wc.formatted_price':
					'<span class="woocommerce-Price-amount amount"><span class="woocommerce-Price-currencySymbol">&#036;</span>5.00</span>',
				post_type: 'product',
				'excerpt.default': '',
			},
			result_type: 'post',
			railcar: {
				railcar: '@cnGDFSUA&bY',
				fetch_algo: 'jetpack:search/1-date_desc',
				fetch_position: 1,
				rec_blog_id: 190651342,
				rec_post_id: 44,
				fetch_lang: 'en',
				fetch_query: 'test1',
				session_id: 'wLrI$1',
			},
			highlight: {
				title: [ '<mark>Test1</mark> Record 2' ],
				content: [ 'The content of <mark>Test1</mark> Record 2' ],
			},
			tags: [ 'tag-2' ],
			categories: [ 'category-2' ],
		},
		{
			_score: null,
			fields: {
				date: '2021-03-25 02:44:24',
				'meta._wc_average_rating.double': 0,
				blog_id: 190651342,
				'has.image': 1,
				'image.url.raw':
					'woocommerce.com/wp-content/uploads/2021/01/blog-fb-Choosing-Plugins@2x.jpg?resize=1536,803',
				'title.default': 'Test1 Record 3',
				'permalink.url.raw': '/product/test1-record-3/',
				'meta._wc_review_count.long': 0,
				post_id: 44,
				'wc.price': 5,
				'wc.formatted_price':
					'<span class="woocommerce-Price-amount amount"><span class="woocommerce-Price-currencySymbol">&#036;</span>5.00</span>',
				post_type: 'product',
				'excerpt.default': '',
			},
			result_type: 'post',
			railcar: {
				railcar: '@cnGDFSUA&bY',
				fetch_algo: 'jetpack:search/1-date_desc',
				fetch_position: 1,
				rec_blog_id: 190651342,
				rec_post_id: 44,
				fetch_lang: 'en',
				fetch_query: 'test1',
				session_id: 'wLrI$1',
			},
			highlight: {
				title: [ '<mark>Test1</mark> Record 3' ],
				content: [ 'The content of <mark>Test1</mark> Record 3' ],
			},
		},
	],
	suggestions: [],
	aggregations: {
		date_histogram_2: {
			buckets: [
				{
					key_as_string: '2020-01-01 00:00:00',
					key: 1199145600000,
					doc_count: 4,
				},
				{
					key_as_string: '2021-01-01 00:00:00',
					key: 1230768000000,
					doc_count: 4,
				},
			],
		},
		taxonomy_0: {
			doc_count_error_upper_bound: 0,
			sum_other_doc_count: 0,
			buckets: [
				{
					key: 'category-1/Category 1',
					doc_count: 1,
				},
				{
					key: 'category-2/Category 2',
					doc_count: 1,
				},
			],
		},
		taxonomy_1: {
			doc_count_error_upper_bound: 0,
			sum_other_doc_count: 35,
			buckets: [
				{
					key: 'tag-1/Tag 1',
					doc_count: 1,
				},
				{
					key: 'tag-2/Tag 2',
					doc_count: 1,
				},
			],
		},
	},
};

export const searchResultForTest2 = {
	total: 3,
	corrected_query: false,
	page_handle: false,
	results: [
		{
			_score: null,
			fields: {
				date: '2021-03-25 05:27:29',
				'meta._wc_average_rating.double': 0,
				blog_id: 190651342,
				'has.image': 1,
				'image.url.raw':
					'woocommerce.com/wp-content/uploads/2021/04/blog-fb-Facebook-Conversion@2x.jpg?resize=1536,803',
				'title.default': 'Test2 Record 1',
				'permalink.url.raw': '/product/test2-record-1/',
				'meta._wc_review_count.long': 0,
				post_id: 52,
				'wc.price': 50,
				'wc.formatted_price':
					'<span class="woocommerce-Price-amount amount"><span class="woocommerce-Price-currencySymbol">&#036;</span>50.00</span>',
				post_type: 'product',
				'excerpt.default': '',
			},
			result_type: 'post',
			railcar: {
				railcar: 'H(pN&lRu#DK5',
				fetch_algo: 'jetpack:search/1-date_desc',
				fetch_position: 0,
				rec_blog_id: 190651342,
				rec_post_id: 52,
				fetch_lang: 'en',
				fetch_query: 'test2',
				session_id: 'wLrI$1',
			},
			highlight: {
				title: [ '<mark>Test2</mark> Record 1' ],
				content: [ '' ],
			},
		},
		{
			_score: null,
			fields: {
				date: '2021-03-25 02:44:24',
				'meta._wc_average_rating.double': 0,
				blog_id: 190651342,
				'has.image': 1,
				'image.url.raw':
					'woocommerce.com/wp-content/uploads/2021/01/blog-fb-Choosing-Plugins@2x.jpg?resize=1536,803',
				'title.default': 'Test2 Record 2',
				'permalink.url.raw': '/product/test2-record-2/',
				'meta._wc_review_count.long': 0,
				post_id: 44,
				'wc.price': 5,
				'wc.formatted_price':
					'<span class="woocommerce-Price-amount amount"><span class="woocommerce-Price-currencySymbol">&#036;</span>5.00</span>',
				post_type: 'product',
				'excerpt.default': '',
			},
			result_type: 'post',
			railcar: {
				railcar: '@cnGDFSUA&bY',
				fetch_algo: 'jetpack:search/1-date_desc',
				fetch_position: 1,
				rec_blog_id: 190651342,
				rec_post_id: 44,
				fetch_lang: 'en',
				fetch_query: 'test2',
				session_id: 'wLrI$1',
			},
			highlight: {
				title: [ '<mark>Test2</mark> Record 2' ],
				content: [ 'The content of <mark>Test2</mark> Record 2' ],
			},
			tags: [ 'tag-2' ],
			categories: [ 'category-2' ],
		},
		{
			_score: null,
			fields: {
				date: '2021-03-25 02:44:24',
				'meta._wc_average_rating.double': 0,
				blog_id: 190651342,
				'has.image': 1,
				'image.url.raw':
					'woocommerce.com/wp-content/uploads/2021/01/blog-fb-Choosing-Plugins@2x.jpg?resize=1536,803',
				'title.default': 'Test2 Record 3',
				'permalink.url.raw': '/product/test2-record-3/',
				'meta._wc_review_count.long': 0,
				post_id: 44,
				'wc.price': 5,
				'wc.formatted_price':
					'<span class="woocommerce-Price-amount amount"><span class="woocommerce-Price-currencySymbol">&#036;</span>5.00</span>',
				post_type: 'product',
				'excerpt.default': '',
			},
			result_type: 'post',
			railcar: {
				railcar: '@cnGDFSUA&bY',
				fetch_algo: 'jetpack:search/1-date_desc',
				fetch_position: 1,
				rec_blog_id: 190651342,
				rec_post_id: 44,
				fetch_lang: 'en',
				fetch_query: 'test2',
				session_id: 'wLrI$1',
			},
			highlight: {
				title: [ '<mark>Test2</mark> Record 3' ],
				content: [ 'The content of <mark>Test2</mark> Record 3' ],
			},
			tags: [ 'tag-3' ],
			categories: [ 'category-3' ],
		},
	],
	suggestions: [],
	aggregations: {
		date_histogram_2: {
			buckets: [
				{
					key_as_string: '2020-01-01 00:00:00',
					key: 1199145600000,
					doc_count: 4,
				},
				{
					key_as_string: '2021-01-01 00:00:00',
					key: 1230768000000,
					doc_count: 4,
				},
			],
		},
		taxonomy_0: {
			doc_count_error_upper_bound: 0,
			sum_other_doc_count: 0,
			buckets: [
				{
					key: 'category-3/Category 3',
					doc_count: 1,
				},
				{
					key: 'category-2/Category 2',
					doc_count: 1,
				},
			],
		},
		taxonomy_1: {
			doc_count_error_upper_bound: 0,
			sum_other_doc_count: 35,
			buckets: [
				{
					key: 'tag-3/Tag 3',
					doc_count: 1,
				},
				{
					key: 'tag-2/Tag 2',
					doc_count: 1,
				},
			],
		},
	},
};
