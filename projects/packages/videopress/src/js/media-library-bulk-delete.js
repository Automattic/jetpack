/* global jQuery */
( function ( $, wp, config ) {
	const CONCURRENCY = 3;

	if ( ! config || ! wp.apiFetch ) {
		return;
	}

	const videoPressIds = new Set( config.videoPressIds.map( String ) );
	const strings = config.strings;
	let running = false;

	/**
	 * Replace %1$s, %2$s… placeholders in a localized string.
	 *
	 * @param {string} template - Localized string.
	 * @param {...*}   values   - Replacement values.
	 * @return {string} Formatted string.
	 */
	function format( template, ...values ) {
		return template.replace( /%(\d+)\$s/g, ( match, index ) => values[ index - 1 ] );
	}

	/**
	 * Show (or update) the progress notice above the list table.
	 *
	 * @param {string} type - Notice type: info, success, warning or error.
	 * @return {jQuery} Notice element.
	 */
	function getNotice( type ) {
		let $notice = $( '#videopress-bulk-delete-notice' );
		if ( ! $notice.length ) {
			$notice = $(
				'<div id="videopress-bulk-delete-notice" class="notice" role="status" aria-live="polite"><p></p></div>'
			);
			$( '.wp-header-end' ).first().after( $notice );
		}
		return $notice.attr( 'class', 'notice notice-' + type );
	}

	/**
	 * Delete one attachment through the REST API.
	 *
	 * @param {string} id - Attachment ID.
	 * @return {Promise<null|string>} Null on success, otherwise the error message.
	 */
	function deleteAttachment( id ) {
		return wp
			.apiFetch( { path: '/wp/v2/media/' + id + '?force=true', method: 'DELETE' } )
			.then( response => ( response && response.deleted ? null : strings.unknownError ) )
			.catch( error => {
				// A request that timed out may still have deleted the item.
				if ( error && error.code === 'rest_post_invalid_id' ) {
					return null;
				}
				return ( error && error.message ) || strings.unknownError;
			} );
	}

	/**
	 * Delete the given attachments a few at a time, updating the rows and the notice as each finishes.
	 *
	 * @param {string[]} ids - Attachment IDs.
	 * @return {Promise<Object[]>} The failures, as { id, message }.
	 */
	function deleteAll( ids ) {
		const queue = ids.slice();
		const failures = [];
		let done = 0;

		const $progress = getNotice( 'info' ).find( 'p' );
		$progress.text( format( strings.progress, 0, ids.length ) );

		const worker = () => {
			const id = queue.shift();
			if ( undefined === id ) {
				return Promise.resolve();
			}
			const $row = $( '#post-' + id );
			$row.addClass( 'videopress-bulk-delete--deleting' ).css( 'opacity', 0.5 );

			return deleteAttachment( id ).then( message => {
				done++;
				$progress.text( format( strings.progress, done, ids.length ) );
				if ( message ) {
					failures.push( { id, message } );
					$row.removeClass( 'videopress-bulk-delete--deleting' ).css( 'opacity', '' );
				} else {
					$row.fadeOut( 200, () => $row.remove() );
				}
				return worker();
			} );
		};

		const workers = [];
		for ( let i = 0; i < Math.min( CONCURRENCY, ids.length ); i++ ) {
			workers.push( worker() );
		}
		return Promise.all( workers ).then( () => failures );
	}

	/**
	 * Report the outcome, keeping the rows that failed selected so the user can retry.
	 *
	 * @param {number}   total    - Number of attachments that were requested.
	 * @param {Object[]} failures - Failures from deleteAll().
	 */
	function report( total, failures ) {
		const deleted = total - failures.length;
		if ( ! failures.length ) {
			getNotice( 'success' )
				.find( 'p' )
				.text( format( strings.done, deleted, total ) );
			return;
		}

		const $notice = getNotice( deleted ? 'warning' : 'error' );
		$notice.find( 'p' ).text( format( strings.partial, deleted, total, failures.length ) );
		const $list = $( '<ul class="ul-disc"></ul>' );
		failures.forEach( ( { id, message } ) => {
			const title =
				$( '#post-' + id + ' .column-title strong a' )
					.first()
					.text()
					.trim() || '#' + id;
			$list.append( $( '<li></li>' ).text( format( strings.failure, title, message ) ) );
			$( '#cb-select-' + id ).prop( 'checked', true );
		} );
		$notice.append( $list );
	}

	$( '#posts-filter' ).on( 'submit', function ( event ) {
		const submitter = event.originalEvent && event.originalEvent.submitter;
		if (
			event.isDefaultPrevented() ||
			! submitter ||
			submitter.name !== 'bulk_action' ||
			$( this ).find( 'select[name="action"]' ).val() !== 'delete'
		) {
			return;
		}

		const ids = $( '#the-list input[name="media[]"]:checked' )
			.map( ( index, input ) => input.value )
			.get();
		// Without VideoPress items core's single-request delete is quick enough, so leave it alone.
		if ( ! ids.some( id => videoPressIds.has( id ) ) ) {
			return;
		}

		event.preventDefault();
		if ( running ) {
			return;
		}
		running = true;

		const $buttons = $( '#doaction, #doaction2' ).prop( 'disabled', true );
		$( '#cb-select-all-1, #cb-select-all-2' ).prop( 'checked', false );
		$( '#the-list input[name="media[]"]' ).prop( 'checked', false );

		deleteAll( ids )
			.then( failures => report( ids.length, failures ) )
			.finally( () => {
				running = false;
				$buttons.prop( 'disabled', false );
			} );
	} );
} )( jQuery, window.wp, window.videopressMediaBulkDelete );
