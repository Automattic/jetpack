/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 *
 * MailPoet Add Edit page JS
 */

/**
 * Export a segment to a mailpoet list
 *
 * @param exportButton
 */
function jpcrm_segment_export_to_mailpoet( exportButton ) {
	// Segment must exist
	if ( ! window.zbsSegment.id ) {
		swal(
			zeroBSCRMJS_segmentLang( 'generalerrortitle' ),
			zeroBSCRMJS_segmentLang( 'nosegmentid' ),
			'error'
		);

		return;
	}

	// name
	var segment_name = jQuery( '#zbs-segment-edit-var-title' ).val();

	// first check if this has already been exported, if so show a warning that this'll overwrite the existing:
	exportButton.addClass( 'loading' );
	jpcrm_mailpoet_retrieve_list_summary(
		segment_name,
		function ( response ) {
			exportButton.removeClass( 'loading' );

			// exists?
			if ( response && response.id ) {
				// show user prompt
				swal
					.fire( {
						title: zeroBSCRMJS_segmentLang( 'mailpoet_list_exists' ),
						html: '<p>' + zeroBSCRMJS_segmentLang( 'mailpoet_list_exists_detail' ) + '</p>',
						showCancelButton: true,
						confirmButtonText: zeroBSCRMJS_segmentLang( 'continue_export' ),
						cancelButtonText: zeroBSCRMJS_segmentLang( 'cancel' ),
					} )
					.then( result => {
						if ( result.value ) {
							// if agreed, proceed
							jpcrm_mailpoet_initiate_export( exportButton );
						} else {
							// skip.
						}
					} );
			} else {
				// doesn't exist already, proceed
				jpcrm_mailpoet_initiate_export( exportButton );
			}
		},
		function () {
			// error retrieving mailPoet list :thinking-face:
			exportButton.removeClass( 'loading' );
		}
	);
}

/**
 * Begin export of segment -> MailPoet
 * (After user has agreed if overriding existing)
 *
 * @param exportButton
 */
function jpcrm_mailpoet_initiate_export( exportButton ) {
	if ( ! window.zbsAJAXSending ) {
		window.zbsAJAXSending = true;

		// id's
		var snameid = 'zbs-segment-edit-var-title';
		var smatchtypeid = 'zbs-segment-edit-var-matchtype';
		//var sconditions = get_sconditions();
		var sconditions = [];
		jQuery( '.zbs-segment-edit-condition' ).each( function ( ind, ele ) {
			// get vars
			var type = jQuery( '.zbs-segment-edit-var-condition-type', jQuery( ele ) ).val();
			var operator = jQuery( '.zbs-segment-edit-var-condition-operator', jQuery( ele ) ).val();
			var value1 = jQuery( '.zbs-segment-edit-var-condition-value', jQuery( ele ) ).val();
			var value2 = jQuery( '.zbs-segment-edit-var-condition-value-2', jQuery( ele ) ).val();

			// operator will be empty for those such as tagged
			if ( typeof operator === 'undefined' || operator == 'undefined' ) {
				operator = -1;
			}

			var condition = {
				type: type,
				operator: operator,
				value: value1,
				value2: value2,
			};

			// push
			sconditions.push( condition );
		} );

		// pull through vars
		var sname = jQuery( '#' + snameid ).val();
		var smatchtype = jQuery( '#' + smatchtypeid ).val();

		var segment = {
			id: window.zbsSegment.id,
			title: sname,
			matchtype: smatchtype,
			conditions: sconditions,
		};

		exportButton.addClass( 'loading' );

		jQuery.ajax( {
			type: 'POST',
			url: ajaxurl,
			data: {
				action: 'jpcrm_mailpoet_export_kick_off',
				segment_id: segment.id,
				sec: window.zbsSegmentSEC,
			},
			timeout: 30000,
			success: function ( response ) {
				exportButton.removeClass( 'loading' );

				if ( response.success == true && response.mailpoet_list_ID ) {
					swal.fire( {
						title: response.lang.export_in_progress,
						html: `<div id="jpcrm_segment_mailpoet_modal" style="clear:both" data-complete-title="${ response.lang.export_finished }">
                            <p class="jpcrm-export-success">${ response.lang.export_in_progress_long }</p>
                            <p class="jpcrm-export-progress"></p>
                            <p style="display:none" class="jpcrm-export-complete">${ response.lang.export_finished_long }</p>
                            <a style="display:none" class="jpcrm-export-goto-mailpoet ui button small basic" href="/wp-admin/admin.php?page=mailpoet-subscribers#/filter[segment=${ response.mailpoet_list_ID }]">${ response.lang.go_to_mailpoet_list }</a>
                            </div>`,
						showConfirmButton: false,
						showCancelButton: true,
						allowOutsideClick: false,
					} );

					window.jpcrm_mailpoet_cancel_exporting = false;
					jQuery( '.swal2-cancel' )
						.off( 'click' )
						.on( 'click', () => {
							window.jpcrm_mailpoet_cancel_exporting = true;
						} );

					// Start recurring AJAX call
					jpcrm_segment_batch_export( {
						mailpoet_id: response.mailpoet_list_ID,
						segment_id: response.jpcrm_segment_ID,
						page: 0,
						total: response.total_contacts,
					} );
				} else {
					swal.fire( {
						title: response.lang.error_title,
						html: `<div style="clear:both"></div>`,
						showConfirmButton: false,
					} );
				}

				// unblock
				window.zbsAJAXSending = false;

				// any callback
				if ( typeof callback === 'function' ) {
					callback( response );
				}

				return true;
			},
			error: function ( response, cbfail ) {
				swal(
					zeroBSCRMJS_segmentLang( 'generalerrortitle' ),
					zeroBSCRMJS_segmentLang( 'nosegmentid' ),
					'error'
				);
				exportButton.removeClass( 'loading' );
				window.zbsAJAXSending = false;
				console.log( 'error', response );
			},
		} );
	}
}

/**
 * Export a batch of contacts from a segment
 *
 * @param params
 */
function jpcrm_segment_batch_export( params ) {
	const { mailpoet_id, segment_id, page, total } = params;
	const page_size = 100;
	const total_pages = Math.ceil( total / page_size );
	const max_fail_count = 10;

	// tally fails
	if ( ! window.jpcrm_mailpoet_export_fail_count ) {
		window.jpcrm_mailpoet_export_fail_count = 0;
	}

	let processing_in_current_batch = total;
	if ( total > page_size ) {
		processing_in_current_batch = page < total_pages ? page_size * ( page || 1 ) : total;
	}

	jQuery( '.jpcrm-export-progress' ).html( `
        <div class="jpcrm-export-progress-counter"><span>${ processing_in_current_batch }</span> / ${ total }</div>
        <div class="jpcrm-export-progress-bar" style="width:${ Math.floor(
					( processing_in_current_batch * 100 ) / total
				) }%"></div>
    ` );

	jQuery.ajax( {
		type: 'POST',
		url: ajaxurl,
		data: {
			action: 'jpcrm_mailpoet_export_segment',
			mailpoet_id: mailpoet_id,
			segment_id: segment_id,
			page: page,
			per_page: page_size,
		},
		timeout: 30000,
		success: function ( response ) {
			if ( window.jpcrm_mailpoet_cancel_exporting === true ) {
				return;
			}
			if ( response.is_last_batch ) {
				jQuery( '.jpcrm-export-progress' ).hide();
				jQuery( '.swal2-cancel' ).hide();
				jQuery( '.jpcrm-export-success' ).hide();

				var completeTitle = jQuery( '#jpcrm_segment_mailpoet_modal' ).attr(
					'data-complete-title'
				);
				jQuery( '.swal2-title' ).text( completeTitle );

				jQuery( '.jpcrm-export-complete' ).show();
				jQuery( '.jpcrm-export-goto-mailpoet' ).show();
			} else {
				jpcrm_segment_batch_export( {
					mailpoet_id: mailpoet_id,
					segment_id: segment_id,
					page: response.current_page + 1,
					total: total,
				} );
			}
		},
		error: function ( response ) {
			// hit a wall
			window.jpcrm_mailpoet_export_fail_count++;

			if ( window.jpcrm_mailpoet_export_fail_count < max_fail_count ) {
				// retry
				jpcrm_segment_batch_export( {
					mailpoet_id: mailpoet_id,
					segment_id: segment_id,
					page: page, // restart this page
					total: total,
				} );
			} else {
				// hard fail
				console.log( 'Export to MailPoet Error', response );
				swal(
					zeroBSCRMJS_segmentLang( 'generalerrortitle' ),
					zeroBSCRMJS_segmentLang( 'nosegmentid' ),
					'error'
				);
				window.zbsAJAXSending = false;
				return false;
			}
		},
	} );
}

/**
 * Retrieve existing list summary for MailPoet List
 *
 * @param list_name
 * @param callback
 * @param error_callback
 */
function jpcrm_mailpoet_retrieve_list_summary( list_name, callback, error_callback ) {
	jQuery.ajax( {
		type: 'POST',
		url: ajaxurl,
		data: {
			action: 'jpcrm_mailpoet_retrieve_list_summary',
			list_name: list_name,
			add_suffix: 1,
		},
		timeout: 30000,
		success: function ( response ) {
			if ( typeof callback === 'function' ) {
				callback( response );
			}
			return response;
		},
		error: function ( response ) {
			// hard fail
			console.log( 'MailPoet summary retrieve error', response );
			swal(
				zeroBSCRMJS_segmentLang( 'generalerrortitle' ),
				zeroBSCRMJS_segmentLang( 'generalerror' ),
				'error'
			);

			if ( typeof error_callback === 'function' ) {
				error_callback();
			}
			return false;
		},
	} );
}

if ( typeof module !== 'undefined' ) {
    module.exports = { jpcrm_segment_export_to_mailpoet, jpcrm_mailpoet_initiate_export,
		jpcrm_segment_batch_export, jpcrm_mailpoet_retrieve_list_summary };
}
