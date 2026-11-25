/**
 * Tests for how infinity.js keeps loading pages until a tall viewport is full.
 */

let sentRequests = [];
let contentBottom = 100;

class FakeXHR {
	open() {}
	setRequestHeader() {}
	send() {
		sentRequests.push( this );
	}
}

const respondToLastRequest = ( extra = {} ) => {
	const xhr = sentRequests[ sentRequests.length - 1 ];
	xhr.status = 200;
	xhr.responseText = JSON.stringify( {
		type: 'success',
		html: '<article>Short post</article>',
		...extra,
	} );
	xhr.onload();
};

const loadScroller = () => {
	sentRequests = [];
	contentBottom = 100;
	document.body.innerHTML = '<div id="content"><article>First post</article></div>';
	window.infiniteScroll = {
		settings: {
			id: 'content',
			ajaxurl: 'https://example.org/?infinity=scrolling',
			type: 'scroll',
			body_class: 'infinite-scroll',
			text: 'Older posts',
			totop: 'Scroll back to top',
			loading_text: 'Loading new page',
			footer: false,
			offset: 0,
			click_handle: false,
			scripts: [],
			styles: [],
			query_args: {},
			wrapper: false,
		},
	};
	jest.isolateModules( () => require( '../infinity' ) );
};

beforeAll( () => {
	window.XMLHttpRequest = FakeXHR;
	jest
		.spyOn( HTMLElement.prototype, 'getBoundingClientRect' )
		.mockImplementation( () => ( { top: 0, bottom: contentBottom } ) );
} );

describe( 'Infinite Scroll in a viewport the first pages do not fill', () => {
	test( 'loads pages until the last batch, then stops', () => {
		loadScroller();
		expect( sentRequests ).toHaveLength( 1 );

		respondToLastRequest();
		respondToLastRequest();
		expect( sentRequests ).toHaveLength( 3 );

		respondToLastRequest( { lastbatch: true } );
		expect( sentRequests ).toHaveLength( 3 );
	} );

	test( 'stops checking once the viewport is full', () => {
		loadScroller();
		contentBottom = window.innerHeight + 1;
		respondToLastRequest();

		// A later page, fetched by scrolling, must not restart the fill.
		contentBottom = 100;
		window.infiniteScroll.scroller.refresh();
		respondToLastRequest();
		expect( sentRequests ).toHaveLength( 2 );
	} );
} );
