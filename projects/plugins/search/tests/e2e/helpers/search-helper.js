import { execWpCommand } from 'jetpack-e2e-commons/helpers/utils-helper.cjs';
import logger from 'jetpack-e2e-commons/logger.cjs';
import { SearchHomepage } from '../pages/index.js';

export async function enableInstantSearch() {
	return execWpCommand( 'option update instant_search_enabled 1' );
}

export async function disableInstantSearch() {
	return execWpCommand( 'option update instant_search_enabled 0' );
}

export async function setResultFormat( format = 'expanded' ) {
	return execWpCommand( `option update jetpack_search_result_format ${ format }` );
}

export async function setTheme( theme = 'light' ) {
	return execWpCommand( `option update jetpack_search_result_format ${ theme }` );
}

export async function setHighlightColor( color = '"#FFFFFF"' ) {
	return execWpCommand( `option update jetpack_search_highlight_color ${ color }` );
}

export async function setDefaultSort( defaultSort = 'relevance' ) {
	return execWpCommand( `option update jetpack_search_default_sort ${ defaultSort }` );
}

export async function searchAutoConfig() {
	// Run auto config to add search widget / block with user ID `1`.
	return await execWpCommand( 'jetpack-search auto_config 1' );
}

export async function clearSearchPlanInfo() {
	// When running locally, sometimes there could be data in the option - better clear it.
	return await execWpCommand( 'option delete jetpack_search_plan_info' );
}

/**
 * The function intercepts requests made to WPCOM Search API and returns mocked
 * results to the frontend. It also simulates sorting and filtering.
 *
 * The route returns `searchResultForTest1` for query `test1`.
 * And returns `searchResultForTest2` for any other queries.
 *
 * NOTE: The route sometimes is not persisted after page reloads so would need to
 * call the function again to make sure.
 *
 * @param { Object } page - instance of a Playwright Page type
 * @see https://playwright.dev/docs/api/class-page#pagerouteurl-handler
 */
export async function searchAPIRoute( page ) {
	await page.route( SearchHomepage.SEARCH_API_PATTERN, ( route, request ) => {
		logger.info( `intercepted search API call: ${ request.url() }` );
		const url = new URL( request.url() );
		const params = url.searchParams;

		// loads response for queries
		let body;
		switch ( params.get( 'query' ) ) {
			case 'test1':
				body = { ...searchResultForTest1 };
				break;
			case 'test2':
			default:
				body = { ...searchResultForTest2 };
				break;
		}

		// deal with sorting
		switch ( params.get( 'sort' ) ) {
			case 'date_asc':
				// put record 2 first
				const tmpResult1 = body.results[ 0 ];
				body.results[ 0 ] = body.results[ 1 ];
				body.results[ 1 ] = tmpResult1;
				break;
			case 'date_desc':
				// put record 3 first
				const tmpResult2 = body.results[ 0 ];
				body.results[ 0 ] = body.results[ 2 ];
				body.results[ 2 ] = tmpResult2;
				break;
			case 'score_default':
			default:
				// the original sorting
				break;
		}

		// deal with filtering: only works with one category and one tag by filtering the results array
		const category = params.get( 'filter[bool][must][0][term][category.slug]' );
		const tag = params.get( 'filter[bool][must][0][term][tag.slug]' );

		if ( category ) {
			body.results = body.results.filter( v => v?.categories?.includes( category ) );
		}

		if ( tag ) {
			body.results = body.results.filter( v => v?.tags?.includes( tag ) );
		}

		route.fulfill( {
			content: 'application/json',
			headers: { 'Access-Control-Allow-Origin': '*' },
			body: JSON.stringify( body ),
		} );
	} );
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
