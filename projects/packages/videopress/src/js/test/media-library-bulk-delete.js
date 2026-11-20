const $ = require( 'jquery' );

const IDS = [ 1, 2, 3, 4, 5 ];

/**
 * Render a Media Library list table, load the script and wait for its ready handler.
 *
 * @param {number[]} videoPressIds - Attachment IDs the page reports as VideoPress videos.
 * @param {Function} apiFetch      - Mock for wp.apiFetch.
 */
async function load( videoPressIds, apiFetch ) {
	document.body.innerHTML = `
		<hr class="wp-header-end">
		<form id="posts-filter">
			<select name="action"><option value="-1">Bulk actions</option><option value="delete" selected>Delete</option></select>
			<input type="submit" id="doaction" name="bulk_action" value="Apply">
			<table><tbody id="the-list">${ IDS.map(
				id => `<tr id="post-${ id }">
					<td><input type="checkbox" id="cb-select-${ id }" name="media[]" value="${ id }" checked></td>
					<td class="column-title"><strong><a href="#">Video ${ id }</a></strong></td>
				</tr>`
			).join( '' ) }</tbody></table>
		</form>`;
	$.fx.off = true;
	window.jQuery = $;
	window.wp = { apiFetch };
	window.videopressMediaBulkDelete = {
		videoPressIds,
		strings: {
			progress: '%1$s of %2$s',
			done: 'Deleted %1$s of %2$s.',
			partial: 'Deleted %1$s of %2$s. %3$s failed:',
			failure: '%1$s: %2$s',
			unknownError: 'Unknown error',
		},
	};
	jest.isolateModules( () => require( '../media-library-bulk-delete' ) );
	await new Promise( resolve => $( resolve ) );
}

/**
 * Submit the bulk-actions form through its Apply button.
 *
 * @return {Event} The submit event.
 */
function apply() {
	const event = new Event( 'submit', { bubbles: true, cancelable: true } );
	Object.defineProperty( event, 'submitter', { value: document.getElementById( 'doaction' ) } );
	document.getElementById( 'posts-filter' ).dispatchEvent( event );
	return event;
}

describe( 'media-library-bulk-delete', () => {
	it( 'deletes items a few at a time, retries a failure once and reports what is left', async () => {
		let inFlight = 0;
		let peak = 0;
		const apiFetch = jest.fn( async ( { path } ) => {
			const id = Number( path.match( /media\/(\d+)/ )[ 1 ] );
			peak = Math.max( peak, ++inFlight );
			await new Promise( resolve => setTimeout( resolve, 5 ) );
			inFlight--;
			if ( id === 2 ) {
				throw { code: 'videopress_delete_failed', message: 'WordPress.com said no.' };
			}
			if ( id === 3 ) {
				throw { code: 'rest_post_invalid_id', message: 'Invalid post ID.' };
			}
			return { deleted: true };
		} );
		await load( [ 1 ], apiFetch );

		expect( apply().defaultPrevented ).toBe( true );
		await new Promise( resolve => setTimeout( resolve, 100 ) );

		expect( apiFetch ).toHaveBeenCalledTimes( IDS.length + 1 );
		expect( peak ).toBe( 3 );
		expect(
			$( '#the-list tr' )
				.map( ( i, row ) => row.id )
				.get()
		).toEqual( [ 'post-2' ] );
		expect( $( '#cb-select-2' ).prop( 'checked' ) ).toBe( true );
		const $notice = $( '#videopress-bulk-delete-notice' );
		expect( $notice.hasClass( 'notice-warning' ) ).toBe( true );
		expect( $notice.text() ).toContain( 'Deleted 4 of 5. 1 failed:' );
		expect( $notice.find( 'li' ).text() ).toBe( 'Video 2: WordPress.com said no.' );
	} );

	it( 'leaves core to handle a selection without VideoPress videos', async () => {
		const apiFetch = jest.fn();
		await load( [ 99 ], apiFetch );

		expect( apply().defaultPrevented ).toBe( false );
		expect( apiFetch ).not.toHaveBeenCalled();
	} );
} );
