/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 */

// catch nulls passed here
if ( typeof window.zbsListViewCount === 'undefined' || window.zbsListViewCount === null ) {
	window.zbsListViewCount = 0;
}

jQuery( function () {
	// init if settings there (not on non-listview pages)
	if ( typeof window.zbsListViewSettings !== 'undefined' ) {
		zeroBSCRMJS_initListView();
	}
} );

// Initiliase the list view.
/**
 *
 */
function zeroBSCRMJS_initListView() {


	let filters = document.querySelectorAll('jpcrm-listview-header .filter-dropdown');
	filters.forEach( f => {
		f.addEventListener('change', jpcrm_add_listview_filter);
	} );

	let filter_removes = document.querySelectorAll('jpcrm-listview-header .jpcrm-current-filter button');
	filter_removes.forEach( f => {
		f.addEventListener('click', jpcrm_remove_listview_filter);
	} );

	document.querySelector('jpcrm-listview-header input[type="search"]').addEventListener('keypress', jpcrm_do_search_filter);

	// custom screen options (in column manager ui)
	jQuery( '#zbs-screenoptions-records-per-page' )
		.off( 'change' )
		.on( 'change', function () {
			// save screen opts
			zeroBSCRMJS_saveScreenOptions( function () {
				// update list view

				// mark data needs refresh:
				window.zbsListViewParams.retrieved = false;

				// update per-page count for pagination usage
				zbsListViewParams.count = parseInt(
					document.getElementById( 'zbs-screenoptions-records-per-page' ).value
				);

				// redraw table
				zeroBSCRMJS_drawListView();
			} );
		} );

	// save + close button at bottom of colmanager/screenopts
	jQuery('#zbs-columnmanager-bottomsave').on('click', function() {
		document.getElementById('zbs-list-col-editor').classList.add('hidden');
	});

	// open/shut column manager
	jQuery('#jpcrm_table_options').on('click', function() {
		document.getElementById('zbs-list-col-editor').classList.toggle('hidden');
	});

	// drag drop columns
	jQuery(
		'#zbs-column-manager-available-cols .zbs-column-manager-connected, #zbs-column-manager-current-cols'
	)
		.sortable( {
			connectWith: '.zbs-column-manager-connected',
			items: '.zbs-column-manager-col',
			placeholder: 'ui compact tiny button zbs-column-manager-droptarget',
			// this stops dropping on other 'col type' group lists
			/* actually, just let it happen, no mega loss
              https://stackoverflow.com/questions/11186355/jquery-ui-sortable-exclude-items-from-being-dropped
              receive: function(event, ui) {

                    if ($(ui.item).hasClass("foohulk")) {
                       $(ui.sender).sortable('cancel');

                        return false;

                    }

                }, */
			stop: function ( event, ui ) {
				// save changes to local var
				zeroBSCRMJS_updateListViewColumnsVar(
					function ( d ) {
						// show loading
						jQuery( '#zbs-col-manager-loading' ).show();

						// hide: could not save cols
						jQuery( '#zbsCantSaveCols' ).hide();

						// columns changed, save via ajax then redraw data
						zeroBSCRMJS_updateListViewColumns(
							function ( d2 ) {
								// successfully saved

								// hide loading
								jQuery( '#zbs-col-manager-loading' ).hide();

								// mark data needs refresh:
								window.zbsListViewParams.retrieved = false;

								// redraw table
								zeroBSCRMJS_drawListView();
							},
							function ( d2 ) {
								// hide loading
								jQuery( '#zbs-col-manager-loading' ).hide();

								// could not save cols
								jQuery( '#zbsCantSaveCols' ).css('display', 'flex');
							}
						);
					},
					function ( d ) {
						// no change, do nothing
					}
				);
			},
		} )
		.disableSelection();

	// draw table
	zeroBSCRMJS_drawListView();
}

// takes current filters from local var and generates the url that'd load those...
/**
 * @param withoutSort only show sort params in URL if necessary
 */
function jpcrm_listview_generate_current_filter_url( withoutSort ) {

	let cur_search = (zbsListViewParams.filters.s ? zbsListViewParams.filters.s : false);
	let cur_tag = (zbsListViewParams.filters.tags && zbsListViewParams.filters.tags.length > 0 ? zbsListViewParams.filters.tags[0].id : false);
	let cur_quickfilter = (zbsListViewParams.filters.quickfilters && zbsListViewParams.filters.quickfilters.length > 0  ? zbsListViewParams.filters.quickfilters[0] : false);
	let cur_sort = (zbsListViewParams.sort ? zbsListViewParams.sort : false);
	let cur_sort_dir = (zbsListViewParams.sortorder ? zbsListViewParams.sortorder : false);

	let url = zbsListViewLink;

	if (cur_search) {
		url += '&s=' + encodeURIComponent(cur_search);
	}

	if (cur_tag) {
		url += '&zbs_tag=' + cur_tag;
	}

	if (cur_quickfilter) {
		url += '&quickfilters=' + cur_quickfilter;
	}

	if (cur_sort && !withoutSort) {
		url += '&sort=' + cur_sort;

		if (cur_sort_dir) {
			url += '&sortdirection=' + cur_sort_dir;
		}
	}

	return url;
}

// update data obj to match UI (takes UI and updates obj)
/**
 * @param changecb
 * @param nochangecb
 */
function zeroBSCRMJS_updateListViewColumnsVar( changecb, nochangecb ) {
	// blocked?
	if ( ! window.zbsDrawListViewColUpdateBlocker ) {
		// set blocker
		window.zbsDrawListViewColUpdateBlocker = true;

		// get columns
		var cols = [];
		jQuery( '#zbs-column-manager-current-cols .zbs-column-manager-col' ).each( function (
			ind,
			ele
		) {
			// add data-key from each present
			cols.push( { fieldstr: jQuery( ele ).attr( 'data-key' ), namestr: jQuery( ele ).html() } );
		} );

		// update obj

		// compare via json string comparison, see if has changed
		var changed = false;
		var lastCols = JSON.stringify( window.zbsListViewParams.columns );
		var newCols = JSON.stringify( cols );
		if ( lastCols !== newCols ) {
			changed = true;
		}

		if ( changed ) {
			window.zbsListViewParams.columns = cols;

			// callbacks (this'll reload data or do whatever it needs to)
			if ( typeof changecb === 'function' ) {
				changecb( cols );
			}
		} else {
			// callback (no change)
			if ( typeof nochangecb === 'function' ) {
				nochangecb( cols );
			}
		}

		// unset blocker
		window.zbsDrawListViewColUpdateBlocker = false;
	}
}

// update column sort from data obj
/**
 * @param successcb
 * @param errcb
 */
function zeroBSCRMJS_updateListViewColumns( successcb, errcb ) {
	if ( ! window.zbsDrawListViewColUpdateAJAXBlocker ) {
		// set blocker
		window.zbsDrawListViewColUpdateAJAXBlocker = true;

		// postbag!
		var data = {
			action: 'updateListViewColumns',
			sec: window.zbscrmjs_secToken,
			listtype: window.zbsListViewParams.listtype,
			v: window.zbsListViewParams.columns,
		};

		// Send
		jQuery.ajax( {
			type: 'POST',
			url: ajaxurl, // admin side is just ajaxurl not wptbpAJAX.ajaxurl,
			data: data,
			dataType: 'json',
			timeout: 20000,
			success: function ( response ) {
				// store updated in object
				window.zbsListViewParams.columns = response;

				// any success callback?
				if ( typeof successcb === 'function' ) {
					successcb( response );
				}

				// unset blocker
				window.zbsDrawListViewColUpdateAJAXBlocker = false;
			},
			error: function ( response ) {
				// temp debug
				console.error( 'Column Data update Error: ', response );

				// any error callback?
				if ( typeof errcb === 'function' ) {
					errcb( response );
				}

				// unset blocker
				window.zbsDrawListViewColUpdateAJAXBlocker = false;
			},
		} );
	} // / not blocked
}

// retrieves actual data
/**
 * @param successcb
 * @param errcb
 */
function zeroBSCRMJS_retrieveListViewData( successcb, errcb ) {
	if ( ! window.zbsDrawListViewAJAXBlocker ) {
		// set blocker
		window.zbsDrawListViewAJAXBlocker = true;

		// postbag!
		var data = {
			action: 'retrieveListViewData',
			sec: window.zbscrmjs_secToken,
			v: window.zbsListViewParams,
		};

		// Send
		jQuery.ajax( {
			type: 'POST',
			url: ajaxurl,
			data: data,
			dataType: 'json',
			timeout: 20000,
			success: function ( response ) {
				// store in object
				if (
					typeof response !== 'undefined' &&
					response !== null &&
					typeof response.objects !== 'undefined'
				) {
					// store table data
					window.zbsListViewData = response.objects;

					if ( typeof response.objectcount !== 'undefined' ) {
						// store object count if present
						window.zbsListViewCount = response.objectcount;
					} else {
						window.zbsListViewCount = 0;
					}

					// store totals data
					if ( typeof response.totals !== 'undefined' ) {
						window.jpcrm_totals_table = response.totals;
					} else {
						window.jpcrm_totals_table = false;
					}
				} else {
					// error!
					console.error( 'Failed to retrieve object data!', response );

					// any error callback?
					if ( typeof errcb === 'function' ) {
						errcb( response );
					}
				}

				// any success callback?
				if ( typeof successcb === 'function' ) {
					successcb( response );
				}

				// unset blocker
				window.zbsDrawListViewAJAXBlocker = false;
			},
			error: function ( response ) {
				// temp debug
				console.error( 'List View Data Retrieve Error: ', response );

				// any error callback?
				if ( typeof errcb === 'function' ) {
					errcb( response );
				}

				// unset blocker
				window.zbsDrawListViewAJAXBlocker = false;
			},
		} );
	} // / not blocked
}

// passes language from window.zbsListViewLangLabels (js set in listview php)
/**
 * @param key
 * @param fallback
 */
function zeroBSCRMJS_listViewLang( key, fallback ) {
	if ( typeof fallback === 'undefined' ) {
		var fallback = '';
	}

	if ( typeof window.zbsListViewLangLabels[ key ] !== 'undefined' ) {
		return window.zbsListViewLangLabels[ key ];
	}

	// fallback to globals
	if ( typeof window.zbs_root.lang[ key ] !== 'undefined' ) {
		return window.zbs_root.lang[ key ];
	}

	return fallback;
}

// returns fa icon (used for bulk actions atm.)
/**
 * @param key
 * @param fallback
 */
function zeroBSCRMJS_listViewIco( key, fallback ) {
	if ( typeof fallback === 'undefined' ) {
		var fallback = '';
	}

	if ( typeof window.zbsListViewIcos[ key ] !== 'undefined' ) {
		return window.zbsListViewIcos[ key ];
	}

	return fallback;
}

// https://semantic-ui.com/collections/table.html
/**
 *
 */
function zeroBSCRMJS_drawListView(reset_pagination, update_url) {
	// if blocker, stop
	if ( window.zbsDrawListViewBlocker ) {
		return;
	}

	// reset pagination
	if (reset_pagination) {
		zbsListViewParams.paged = 1;
	}
	// update URL
	if (update_url) {
		history.replaceState( null, null, jpcrm_listview_generate_current_filter_url() );
	}

	// move this, if it's present (if was 0 results it'll be in the table, otherwise, wont be anyhow :)
	jQuery( '#zbsNoResults' ).addClass( 'hidden' ).appendTo( '#zbs-list-warnings-wrap' );

	// put blocker up
	window.zbsDrawListViewBlocker = true;

	// empty table, show loading
	jQuery( '.jpcrm-listview-table-container' ).html( '<div class="empty-container-with-spinner"><div class="ui active centered inline loader"></div></div>' );

	// check data + retrieve if empty
	if ( ! window.zbsListViewParams.retrieved ) {

		// hide extras until listview is loaded
		document.querySelector('.bulk-actions-dropdown').classList.add('hidden');
		jQuery( 'jpcrm-listview-footer' ).hide();
		jQuery( 'jpcrm-dashcount' ).hide();

		// retrieve data
		zeroBSCRMJS_retrieveListViewData(
			function ( d ) {

				// holds event flags to fire post-draw
				var postHTML = {};

				// success callback
				var listViewHTML = '';

				listViewHTML += jpcrm_listview_header();

				// show pagination at top if per page is high
				if (zbsListViewParams.count >= 50) {
					listViewHTML += '<div class="jpcrm-pagination-container"></div>';
				}

				// build table
				listViewHTML += '<table class="jpcrm-listview-table">';

				// header
				listViewHTML += jpcrm_listview_table_header();
				listViewHTML += '<tbody>';

				// per line
				if ( window.zbsListViewData.length > 0 ) {
					jQuery.each( window.zbsListViewData, function ( ind, ele ) {
						// add to html
						listViewHTML += zeroBSCRMJS_listViewLine( ele );
					} );
				} else {
					// no lines, move this ui msg into a blank row col
					if ( jQuery( '#zbsNoResults' ).length ) {
						// extra column due to checkbox
						listViewHTML +='<tr><td colspan="' + (window.zbsListViewParams.columns.length + 1) + '" id="zbs-no-results-wrap">';

						// to be fired after setTimeout jQuery('#zbsNoResults').appendTo('#zbs-no-results-wrap');
						postHTML.nores = true;

						listViewHTML += '</td></tr>';
					}
				}

				listViewHTML += '</tbody>';

				listViewHTML += '</table>';

				// draw
				jQuery( '.jpcrm-listview-table-container' ).html( listViewHTML );

				//update counts in footer
				jpcrm_update_listview_counts();

				// update pagination
				jpcrm_update_listview_pagination();

				// catch any post-html events
				var lPostHTML = postHTML;

				// empty result set.
				if ( typeof lPostHTML.nores ) {
					jQuery( '#zbsNoResults' ).appendTo( '#zbs-no-results-wrap' ).removeClass( 'hidden' );
				}

				// bind any post-render (e.g. bulk action)
				zeroBSCRMJS_listViewBinds();

				// draw totals tables, if data
				zeroBSCRMJS_listView_draw_totals_tables();
				// fini, remove blocker
				window.zbsDrawListViewBlocker = false;

				jQuery( '#zbsCantLoadData' ).hide();
				jQuery( '.jpcrm-listview-table-container' ).show();
				jQuery( 'jpcrm-listview-footer' ).show();
				jQuery( 'jpcrm-dashcount' ).show();
			},
			function ( errd ) {
				// err callback? show msg (prefilled by php)
				jQuery( '#zbsCantLoadData' ).css('display', 'flex');
				jQuery( '.jpcrm-listview-table-container' ).hide();

				//update counts in footer
				jpcrm_update_listview_counts();

				// update pagination
				jpcrm_update_listview_pagination();

				// fini, remove blocker
				window.zbsDrawListViewBlocker = false;
			}
		);
	}
}

function jpcrm_update_listview_counts() {
	let listview_count_els = document.querySelectorAll('.jpcrm-listview-counts-container');

	let first_record = zbsListViewParams.count * (zbsListViewParams.paged - 1) + 1
	let last_record = Math.min(zbsListViewCount, zbsListViewParams.count * zbsListViewParams.paged);
	let current_range = first_record + '-' + last_record;

	// don't show if no results or out of range
	if ( zbsListViewCount === 0 || first_record > zbsListViewCount ) {
		listview_count_els.forEach((element) => element.textContent = '');
		return;
	}

	let html = zeroBSCRMJS_listViewLang( 'listview_counts' );
	html = html.replace('%s',current_range);
	html = html.replace('%s',zbsListViewCount);
	listview_count_els.forEach((element) => element.textContent = html);
}

function jpcrm_update_listview_pagination() {
	let pagination_els = document.querySelectorAll('.jpcrm-pagination-container');

	let cur_page = zbsListViewParams.paged;
	let total_pages = Math.ceil( zbsListViewCount / zbsListViewParams.count );

	// don't show if few results or out of range
	if ( total_pages <= 1 || cur_page > total_pages ) {
		pagination_els.forEach((element) => element.textContent = '');
		return;
	}

	// this takes filters and makes an url that'll prefix our pagination
	let cur_base_URL = jpcrm_listview_generate_current_filter_url();
	let pages_to_add = [];

	// not very many: show all pages
	if ( total_pages < 9 ) {
		pages_to_add = Array.from( Array( total_pages ), ( e, i ) => i + 1 );
	}
	// toward the beginning: show first five, ellipsis, and last
	else if ( cur_page <= 4 ) {
		pages_to_add = [ 1, 2, 3, 4, 5, '...', total_pages ];
	}
	// toward the end: show first, ellipsis, and last five
	else if ( cur_page > total_pages - 4 ) {
		pages_to_add = [
			1,
			'...',
			total_pages - 4,
			total_pages - 3,
			total_pages - 2,
			total_pages - 1,
			total_pages,
		];
	}
	// somewhere in the middle: show first, ellipsis, three, ellipsis, and last
	else {
		pages_to_add = [ 1, '...', cur_page - 1, cur_page, cur_page + 1, '...', total_pages ];
	}

	let html = '<jpcrm-pagination>';

	// link previous if available
	if ( cur_page === 1 ) {
		html += '<span class="disabled dashicons dashicons-arrow-left-alt2"></span>';
	} else {
		html += '<a href="' + cur_base_URL + '&paged=' + ( cur_page - 1 ) + '"><span class="dashicons dashicons-arrow-left-alt2"></span></a>';
	}

	for ( var i = 0; i < pages_to_add.length; i++ ) {
		if ( pages_to_add[ i ] === '...' ) {
			html += '<span class="ellipsis">...</span>';
		} else {
			html +=
				'<a' +
				( pages_to_add[ i ] === cur_page ? ' class="active"' : '' ) +
				' href="' +
				cur_base_URL +
				'&paged=' +
				pages_to_add[ i ] +
				'">' +
				pages_to_add[ i ] +
				'</a>';
		}
	}

	// link next if available
	if ( total_pages === cur_page ) {
		html += '<span class="disabled dashicons dashicons-arrow-right-alt2"></span>';
	} else {
		html += '<a href="' + cur_base_URL + '&paged=' + ( cur_page + 1 ) + '"><span class="dashicons dashicons-arrow-right-alt2"></span></a>'
	}

	html += '</jpcrm-pagination>';

	pagination_els.forEach((element) => element.innerHTML = html);
}

function jpcrm_listview_header() {
	let listview_header_html = `
`;
	return listview_header_html;
}

/**
 *
 */
function jpcrm_listview_table_header() {
	var listViewHeaderHTML = '';

	if ( window.zbsListViewParams.columns.length > 0 ) {
		var listViewHeaderHTML = '';
		listViewHeaderHTML += '      <thead>';
		listViewHeaderHTML += '        <tr>';

		// bulk checkbox
		// only if there's any bulk actions to use!
		if ( typeof window.zbsBulkActions !== 'undefined' && window.zbsBulkActions.length > 0 ) {
			listViewHeaderHTML +=
				'<th><input type="checkbox" id="jpcrm-bulk-select" /></th>';
		}

		jQuery.each( window.zbsListViewParams.columns, function ( lvhInd, lvhEle ) {
			if ( zbsSortables && zbsSortables.includes( lvhEle.fieldstr ) ) {
				sortDirectionUrlParam = 'asc';
				var sortDirection = 'down';
				if (zbsListViewParams.sortorder && window.zbsListViewParams.sortorder === 'asc' && zbsListViewParams.sort && zbsListViewParams.sort === lvhEle.fieldstr) {
					sortDirection = 'up';
					sortDirectionUrlParam = 'desc';
				}
				listViewHeaderHTML += `<th class="jpcrm_sort_column" data-sort="${lvhEle.fieldstr}" data-sortdir="${sortDirectionUrlParam}" title="${zeroBSCRMJS_listViewLang('click_to_sort')}">`;
				listViewHeaderHTML += `${lvhEle.namestr}`;
				if ( zbsListViewParams.sort && zbsListViewParams.sort === lvhEle.fieldstr) {
					listViewHeaderHTML += `<i class="angle ${sortDirection} icon"></i>`;
				}
				listViewHeaderHTML += `</th>`;
			} else {
				listViewHeaderHTML += `<th>${jpcrm.esc_html(lvhEle.namestr)}</th>`;
			}
		} );
		listViewHeaderHTML += '</tr></thead>';
	}

	return listViewHeaderHTML;
}
/**
 * @param data
 */
function zeroBSCRMJS_listViewLine( data ) {
	var lineHTML = '';

	if ( window.zbsListViewParams.columns.length > 0 ) {
		//&& window.zbsListViewParams.columns.length == data.length){

		// if id passed, add to attr
		var trAttr = '';
		if ( typeof data.id !== 'undefined' ) {
			trAttr += ' data-id="' + data.id + '"';
		}

		var lineHTML = '<tr' + trAttr + '>';

		// bulk actions checkbox (note the data['name'] is used for bulk actions etc.
		// only if there's any bulk actions to use!
		if ( typeof window.zbsBulkActions !== 'undefined' && window.zbsBulkActions.length > 0 ) {
			lineHTML +=
				'<td class="zbs-listview-bulk"><input type="checkbox"' +
				'" data-entityid="' +
				data.id +
				'" class="zbsbulkcb" /></td>';
		}

		jQuery.each( window.zbsListViewParams.columns, function ( lvhInd, lvhEle ) {
			// if override func exists, use that, else use default out:
			var fieldFuncName =
				'zeroBSCRMJS_listView_' + window.zbsListViewSettings.objdbname + '_' + lvhEle.fieldstr;

			if ( typeof window[ fieldFuncName ] === 'function' ) {
				// use it
				lineHTML += window[ fieldFuncName ]( data );
			} else {
				// see if generic exists
				// e.g.  zeroBSCRMJS_listView_generic_nameavatar
				var fieldFuncName = 'zeroBSCRMJS_listView_generic_' + lvhEle.fieldstr;
				if ( typeof window[ fieldFuncName ] === 'function' ) {
					// use it
					lineHTML += window[ fieldFuncName ]( data );
				} else {
					// final fallback
					// all custom fields will likely end up here.

					// ... a short workaround for #149, here we check for presence of _cfdate
					// ... which will be set for any customfield date type fields:
					if (
						typeof data[ lvhEle.fieldstr + '_cfdate' ] !== 'undefined' &&
						data[ lvhEle.fieldstr + '_cfdate' ] != null &&
						data[ lvhEle.fieldstr + '_cfdate' ] != 'null'
					) {
						lineHTML +=
							'<td>' +
							jpcrm_abbreviate_str( data[ lvhEle.fieldstr + '_cfdate' ], 80, '...', 'return' ) +
							'</td>';
					} else {
						// Normal field output without any _td builder:
						if (
							typeof data[ lvhEle.fieldstr ] !== 'undefined' &&
							data[ lvhEle.fieldstr ] != null &&
							data[ lvhEle.fieldstr ] != 'null'
						) {
							lineHTML +=
								'<td>' +
								jpcrm_abbreviate_str( data[ lvhEle.fieldstr ], 80, '...', 'return' ) +
								'</td>';
						} else {
							lineHTML += '<td></td>';
						} // empty
					}
				}
			}
		} );
		lineHTML += '</tr>';
	}

	return lineHTML;
}

/**
 *
 */
function zeroBSCRMJS_listViewBinds() {

	// bind sort column clicks
	let sort_columns = document.querySelectorAll('.jpcrm_sort_column');
	sort_columns.forEach( el => el.addEventListener('click',jpcrm_change_sort));

	let row_checkboxes = document.querySelectorAll('.jpcrm-listview-table td input[type="checkbox"]');

	// handle bulk select
	jQuery( '#jpcrm-bulk-select' ).on( 'change', function () {
		row_checkboxes.forEach( el => {
			el.checked = this.checked;
			el.parentElement.parentElement.classList.toggle('selected', this.checked);
		} );
		// update any bulk actions strs etc.
		zeroBSCRMJS_listView_bulkActionsUpdate();
	} );

	// handle individual select
	row_checkboxes.forEach( el => {
		el.addEventListener('click', function() {
			el.parentElement.parentElement.classList.toggle('selected', el.checked);
			zeroBSCRMJS_listView_bulkActionsUpdate();
		});
	} );

	// inline editing
	if (
		typeof window.zbsListViewSettings.editinline !== 'undefined' &&
		window.zbsListViewSettings.editinline
	) {
		zeroBSCRMJS_bindInlineEditing();
	}

	// HOOK for list views
	// use func name like zeroBSCRMJS_listView_postRender_mailcampaign to fire stuff here
	var listViewPostRenderHookName = '';
	if (
		typeof window.zbsListViewParams !== 'undefined' &&
		typeof window.zbsListViewParams.listtype !== 'undefined'
	) {
		listViewPostRenderHookName =
			'zeroBSCRMJS_listView_postRender_' + window.zbsListViewParams.listtype;
	}
	if (
		listViewPostRenderHookName != '' &&
		typeof window[ listViewPostRenderHookName ] === 'function'
	) {
		// fire
		window[ listViewPostRenderHookName ]();
	}
}

/**
 *
 */
function zeroBSCRMJS_listView_bulkActionsUpdate() {
	var rows_selected = zeroBSCRMJS_listView_bulkActionsGetChecked();

	var rows_selected_pretty = zeroBSCRMJS_listViewLang( 'rows_selected_x' ).replace('%s', rows_selected.length);
	if ( rows_selected.length == 1 ) {
		rows_selected_pretty = zeroBSCRMJS_listViewLang( 'rows_selected_1' );
	} else if ( rows_selected.length == 0 ) {
		rows_selected_pretty = zeroBSCRMJS_listViewLang( 'rows_selected_0' );
	}

	var opt_html = '<option value disabled selected>' + rows_selected_pretty + '</option>';

	zbsBulkActions.forEach( function ( action_name ) {
		// only show merge as a bulk action if exactly two rows are selected
		if ( action_name == 'merge' && rows_selected.length != 2 ) {
			return;
		}

		var optnamehtml = '';

		// generic bulkAction support, if available:
		// e.g. zeroBSCRMJS_listView_generic_bulkActionTitle_export
		var bulkActionTitleFuncName = 'zeroBSCRMJS_listView_generic_bulkActionTitle_' + action_name;
		if ( typeof window[ bulkActionTitleFuncName ] === 'function' ) {
			// use it
			optnamehtml = window[ bulkActionTitleFuncName ]();
		} else {
			// object-type specific bulkAction support:
			// e.g. zeroBSCRMJS_listView_customer_bulkActionTitle_export
			bulkActionTitleFuncName =
				'zeroBSCRMJS_listView_' +
				window.zbsListViewSettings.objdbname +
				'_bulkActionTitle_' +
				action_name;
			if ( typeof window[ bulkActionTitleFuncName ] === 'function' ) {
				optnamehtml = window[ bulkActionTitleFuncName ]();
			}
			// fallback if no naming function found
			else {
				optnamehtml = action_name;
			}
		}

		opt_html += '<option value="' + action_name + '">' + optnamehtml + '</option>';
	} );

	jQuery( '.bulk-actions-dropdown' ).html( opt_html );

	document.querySelector( '.bulk-actions-dropdown' ).classList.toggle('hidden', rows_selected.length === 0);

	// bind
	setTimeout( function () {
		jQuery( '.bulk-actions-dropdown' )
			.off( 'change' )
			.on( 'change', function () {
				// fire a gatherer func (allows for SWAL between click + fire (e.g. leave orphans, are you sure, choose tag))

				// get action from the clicked button's sibling dropdown...a bit hackish for now
				var cur_action = this.parentElement.querySelector('.bulk-actions-dropdown option:checked').value;

				// no action (e.g. "bulk actions" option)
				if ( cur_action == '' ) {
					return;
				}

				this.parentElement.querySelector('.bulk-actions-dropdown').selectedIndex = 0;

				// generic bulkAction support, if available:
				// e.g. zeroBSCRMJS_listView_generic_bulkActionFire_addtag
				var bulkActionFuncName = 'zeroBSCRMJS_listView_generic_bulkActionFire_' + cur_action;
				if ( typeof window[ bulkActionFuncName ] === 'function' ) {
					// use it
					window[ bulkActionFuncName ]();
				} else {
					// object-type specific bulkAction support:
					// e.g. zeroBSCRMJS_listView_customer_bulkActionFire_delete
					var optFuncName =
						'zeroBSCRMJS_listView_' +
						window.zbsListViewSettings.objdbname +
						'_bulkActionFire_' +
						cur_action;
					window[ optFuncName ]();
				}
			} );
	}, 0 );
}

// update column sort from data obj
/**
 * @param actionstr
 * @param idList
 * @param extraParams
 * @param successcb
 * @param errcb
 */
function zeroBSCRMJS_enactBulkAction( actionstr, idList, extraParams, successcb, errcb ) {
	if ( ! window.zbsDrawListViewAJAXBlocker ) {
		// set blocker
		window.zbsDrawListViewAJAXBlocker = true;

		if ( typeof extraParams === 'undefined' ) {
			extraParams = {};
		}

		// postbag!
		var data = {
			action: 'enactListViewBulkAction',
			sec: window.zbscrmjs_secToken,
			objtype: window.zbsListViewSettings.objdbname,
			actionstr: actionstr,
			ids: idList,
		};

		// merge in any extra params
		data = zeroBSCRMJS_extend( data, extraParams );

		// Send
		jQuery.ajax( {
			type: 'POST',
			url: ajaxurl, // admin side is just ajaxurl not wptbpAJAX.ajaxurl,
			data: data,
			dataType: 'json',
			timeout: 20000,
			success: function ( response ) {
				// any success callback?
				if ( typeof successcb === 'function' ) {
					successcb( response );
				}

				// unset blocker
				window.zbsDrawListViewAJAXBlocker = false;

				// refire draw

				// mark data needs refresh:
				window.zbsListViewParams.retrieved = false;

				// redraw table
				zeroBSCRMJS_drawListView();
			},
			error: function ( response ) {

				if ( response.status === 403 ) {
					// permissions error
					swal(
						zeroBSCRMJS_listViewLang( 'badperms' ),
						zeroBSCRMJS_listViewLang( 'badperms_desc' ),
						'warning'
					);
				} else if ( typeof errcb === 'function' ) {
					errcb( response );
				}

				// unset blocker
				window.zbsDrawListViewAJAXBlocker = false;

				// no refiring of draw :)
			},
		} );
	} // / not blocked
}

/**
 *
 */
function zeroBSCRMJS_listView_bulkActionsGetChecked() {
	// quick - cycles through checkboxes + returns array of id's

	var selected = [];

	jQuery( '.zbs-listview-bulk input:checkbox' ).each( function ( ind, ele ) {
		if ( jQuery( ele ).is( ':checked' ) ) {
			selected.push( jQuery( ele ).attr( 'data-entityid' ) );
		}
	} );

	return selected;
}

/**
 *
 */
function zeroBSCRMJS_listView_bulkActionsGetCheckedIncNames() {
	// quick - cycles through checkboxes + returns array of id's + names

	var selected = [];
	jQuery( '.zbs-listview-bulk input:checkbox' ).each( function ( ind, ele ) {
		if ( jQuery( ele ).is( ':checked' ) ) {
			var contact_id = jQuery( ele ).attr( 'data-entityid' );
			selected.push( { id: contact_id, name: jpcrm_get_contact_meta( contact_id ).name } );
		}
	} );

	return selected;
}

/**
 * @param id
 */
function zeroBSCRMJS_listView_editURL( id ) {

	if ( typeof id !== 'undefined' && id > 0 ) {
		switch ( window.zbsListViewParams.listtype ) {
			case 'customer':
				return window.zbsObjectEditLinkPrefixCustomer + id;
				break;

			case 'company':
				return window.zbsObjectEditLinkPrefixCompany + id;
				break;

			case 'quote':
				return window.zbsObjectEditLinkPrefixQuote + id;
				break;

			case 'invoice':
				return window.zbsObjectEditLinkPrefixInvoice + id;
				break;

			case 'transaction':
				return window.zbsObjectEditLinkPrefixTransaction + id;
				break;

			case 'segment':
				return window.zbsObjectEditLinkPrefixSegment + id;
				break;

			case 'form':
				return window.zbsObjectEditLinkPrefixForm + id;
				break;

			case 'quotetemplate':
				return window.zbsObjectEditLinkPrefixQuoteTemplate + id;
				break;
		}
	}

	return '#notfound';
}

/**
 * @param id
 */
function zeroBSCRMJS_listView_viewURL( id ) {
	if ( typeof id !== 'undefined' && id > 0 ) {
		switch ( window.zbsListViewParams.listtype ) {
			case 'customer':
				return window.zbsObjectViewLinkPrefixCustomer + id;
				break;

			case 'company':
				return window.zbsObjectViewLinkPrefixCompany + id;
				break;

			case 'quote':
				return window.zbsObjectViewLinkPrefixQuote + id;
				break;

			case 'invoice':
				return window.zbsObjectViewLinkPrefixInvoice + id;
				break;

			case 'transaction':
				return window.zbsObjectViewLinkPrefixTransaction + id;
				break;

			case 'segment':
				return window.zbsObjectViewLinkPrefixSegment + id;
				break;

			case 'form':
				return window.zbsObjectViewLinkPrefixForm + id;
				break;

			case 'event':
				return window.zbsObjectViewLinkPrefixTask + id;
				break;
		}
	}

	return '#notfound';
}

// specific to customer
// used when page is non-customer e.g. trans list view lists customers
/**
 * @param id
 */
function zeroBSCRMJS_listView_viewURL_customer( id ) {
	if ( typeof id !== 'undefined' && id > 0 ) {
		return window.zbsObjectViewLinkPrefixCustomer + id;
	}

	return '#notfound';
}

// specific to company
/**
 * @param id
 */
function zeroBSCRMJS_listView_viewURL_company( id ) {
	if ( typeof id !== 'undefined' && id > 0 ) {
		return window.zbsObjectViewLinkPrefixCompany + id;
	}

	return '#notfound';
}

// specific to contact (Currently)
/**
 * @param id
 */
function zeroBSCRMJS_listView_emailURL_contact( id ) {
	if ( typeof id !== 'undefined' && id > 0 ) {
		return window.zbsObjectEmailLinkPrefix + id;
	}

	return '#notfound';
}

// export (segment) to CSV
/**
 * @param id
 */
function zeroBSCRMJS_listView_url_export_segment( id ) {
	if ( typeof id !== 'undefined' && id > 0 ) {
		return window.jpcrm_segment_export_url_prefix + id;
	}

	return '#notfound';
}

/*
 * Draw totals table, if data present
 */
/**
 *
 */
function zeroBSCRMJS_listView_draw_totals_tables() {

	if (!jpcrm_totals_table) {
		return;
	}

	let html = '';

	if (jpcrm_totals_table.quotes_total_formatted) {
			html += `<jpcrm-dashcount-card>
				<h3>${zeroBSCRMJS_listViewLang( 'quotes' )}</h3>
				<div>
					<span class="range_total">${jpcrm.esc_html(jpcrm_totals_table.quotes_total_formatted)}</span>
				</div>
			</jpcrm-dashcount-card>`;
	}

	if (jpcrm_totals_table.invoices_total_formatted) {
			html += `<jpcrm-dashcount-card>
				<h3>${zeroBSCRMJS_listViewLang( 'invoices' )}</h3>
				<div>
					<span class="range_total">${jpcrm.esc_html(jpcrm_totals_table.invoices_total_formatted)}</span>
				</div>
			</jpcrm-dashcount-card>`;
	}

	if (jpcrm_totals_table.transactions_total_formatted) {
			html += `<jpcrm-dashcount-card>
				<h3>${zeroBSCRMJS_listViewLang( 'transactions' )}</h3>
				<div>
					<span class="range_total">${jpcrm.esc_html(jpcrm_totals_table.transactions_total_formatted)}</span>
				</div>
			</jpcrm-dashcount-card>`;
	}
	if (jpcrm_totals_table.total_sum_formatted) {
			html += `<jpcrm-dashcount-card>
				<h3>${zeroBSCRMJS_listViewLang( 'total' )}</h3>
				<div>
					<span class="range_total">${jpcrm.esc_html(jpcrm_totals_table.total_sum_formatted)}</span>
				</div>
			</jpcrm-dashcount-card>`;
	}

	jQuery( 'jpcrm-dashcount' ).html( html );
}

/* ====================================================================================
================== Bulk actions - Generic =============================================
==================================================================================== */

// (tries to) generically add's tags to any objtype
/**
 *
 */
function zeroBSCRMJS_listView_generic_bulkActionFire_addtag() {
	// SWAL which tag(s)?
	var extraParams = { tags: [] };

	// build tag list (toggle'able)
	var tagSelectList = '<div id="zbs-select-tags" class="ui segment">';
	if (
		typeof window.zbsTagsForBulkActions !== 'undefined' &&
		window.zbsTagsForBulkActions.length > 0
	) {
		jQuery.each( window.zbsTagsForBulkActions, function ( ind, tag ) {
			tagSelectList +=
				'<div class="zbs-select-tag ui label"><div class="ui checkbox"><input type="checkbox" data-tagid="' +
				jpcrm.esc_attr(tag.id) +
				'" id="zbs-tag-' +
				jpcrm.esc_attr(tag.id) +
				'" /><label for="zbs-tag-' +
				jpcrm.esc_attr(tag.id) +
				'">' +
				jpcrm.esc_html(tag.name) +
				'</label></div></div>';
		} );
	} else {
		tagSelectList +=
			'<div class="ui message"><p>' + zeroBSCRMJS_listViewLang( 'notags' ) + '</p></div>';
	}
	tagSelectList += '</div>';

	// see ans 3 here https://stackoverflow.com/questions/31463649/sweetalert-prompt-with-two-input-fields
	swal( {
		title: zeroBSCRMJS_listViewLang( 'whichtags' ),
		html:
			'<div>' + zeroBSCRMJS_listViewLang( 'whichtagsadd' ) + '<br />' + tagSelectList + '</div>',
		//text: "Are you sure you want to delete these?",
		type: 'warning',
		showCancelButton: true,
		confirmButtonColor: '#000',
		cancelButtonColor: '#fff',
		cancelButtonText: '<span style="color: #000">Cancel</span>',
		confirmButtonText: zeroBSCRMJS_listViewLang( 'addthesetags' ),
		//allowOutsideClick: false,
		onOpen: function () {
			// bind checkboxes (this just adds nice colour effect, not that important)
			jQuery( '.zbs-select-tag input:checkbox' )
				.off( 'click' )
				.on( 'click', function () {
					jQuery( '.zbs-select-tag input:checkbox' ).each( function ( ind, ele ) {
						if ( jQuery( ele ).is( ':checked' ) ) {
							jQuery( ele ).closest( '.ui.label' ).addClass( 'blue' );
						} else {
							jQuery( ele ).closest( '.ui.label' ).removeClass( 'blue' );
						}
					} );
				} );
		},
	} ).then( function ( result ) {
		// this check required from swal2 6.0+ https://github.com/sweetalert2/sweetalert2/issues/724
		if ( result.value ) {
			// get settings
			extraParams.tags = [];

			// cycle through each tag input and if checked, add id
			jQuery( '.zbs-select-tag input:checkbox' ).each( function ( ind, ele ) {
				if ( jQuery( ele ).is( ':checked' ) ) {
					extraParams.tags.push( jQuery( ele ).attr( 'data-tagid' ) );
				}
			} );

			// any tags?
			if ( extraParams.tags.length > 0 ) {
				// fire + will automatically refresh list view
				zeroBSCRMJS_enactBulkAction(
					'addtag',
					zeroBSCRMJS_listView_bulkActionsGetChecked(),
					extraParams,
					function ( r ) {
						// success ? SWAL?
						swal(
							zeroBSCRMJS_listViewLang( 'tagsadded' ),
							zeroBSCRMJS_listViewLang( 'tagsaddeddesc' ),
							'success'
						);
					},
					function ( r ) {
						// fail ? SWAL?
						swal(
							zeroBSCRMJS_listViewLang( 'tagsnotadded' ),
							zeroBSCRMJS_listViewLang( 'tagsnotaddeddesc' ),
							'warning'
						);
					}
				);
			} else {
				// didn't select tags

				swal(
					zeroBSCRMJS_listViewLang( 'tagsnotselected' ),
					zeroBSCRMJS_listViewLang( 'tagsnotselecteddesc' ),
					'warning'
				);
			}
		}
	} );
}

/**
 *
 */
function zeroBSCRMJS_listView_generic_bulkActionFire_removetag() {
	// SWAL which tag(s)?
	var extraParams = { tags: [] };

	// build tag list (toggle'able)
	var tagSelectList = '<div id="zbs-select-tags" class="ui segment">';
	if (
		typeof window.zbsTagsForBulkActions !== 'undefined' &&
		window.zbsTagsForBulkActions.length > 0
	) {
		jQuery.each( window.zbsTagsForBulkActions, function ( ind, tag ) {
			tagSelectList +=
				'<div class="zbs-select-tag ui label"><div class="ui checkbox"><input type="checkbox" data-tagid="' +
				jpcrm.esc_attr(tag.id) +
				'" id="zbs-tag-' +
				jpcrm.esc_attr(tag.id) +
				'" /><label for="zbs-tag-' +
				jpcrm.esc_attr(tag.id) +
				'">' +
				jpcrm.esc_html(tag.name) +
				'</label></div></div>';
		} );
	} else {
		tagSelectList +=
			'<div class="ui message"><p>' + zeroBSCRMJS_listViewLang( 'notags' ) + '</p></div>';
	}
	tagSelectList += '</div>';

	// see ans 3 here https://stackoverflow.com/questions/31463649/sweetalert-prompt-with-two-input-fields
	swal( {
		title: zeroBSCRMJS_listViewLang( 'whichtags' ),
		html:
			'<div>' + zeroBSCRMJS_listViewLang( 'whichtagsremove' ) + '<br />' + tagSelectList + '</div>',
		//text: "Are you sure you want to delete these?",
		type: 'warning',
		showCancelButton: true,
		confirmButtonColor: '#000',
		cancelButtonColor: '#fff',
		confirmButtonText: zeroBSCRMJS_listViewLang( 'removethesetags' ),
		cancelButtonText: '<span style="color: #000">Cancel</span>',
		//allowOutsideClick: false,
		onOpen: function () {
			// bind checkboxes (this just adds nice colour effect, not that important)
			jQuery( '.zbs-select-tag input:checkbox' )
				.off( 'click' )
				.on( 'click', function () {
					jQuery( '.zbs-select-tag input:checkbox' ).each( function ( ind, ele ) {
						if ( jQuery( ele ).is( ':checked' ) ) {
							jQuery( ele ).closest( '.ui.label' ).addClass( 'blue' );
						} else {
							jQuery( ele ).closest( '.ui.label' ).removeClass( 'blue' );
						}
					} );
				} );
		},
	} ).then( function ( result ) {
		// this check required from swal2 6.0+
		if ( result.value ) {
			// get settings
			extraParams.tags = [];

			// cycle through each tag input and if checked, add id
			jQuery( '.zbs-select-tag input:checkbox' ).each( function ( ind, ele ) {
				if ( jQuery( ele ).is( ':checked' ) ) {
					extraParams.tags.push( jQuery( ele ).attr( 'data-tagid' ) );
				}
			} );

			// any tags?
			if ( extraParams.tags.length > 0 ) {
				// fire + will automatically refresh list view
				zeroBSCRMJS_enactBulkAction(
					'removetag',
					zeroBSCRMJS_listView_bulkActionsGetChecked(),
					extraParams,
					function ( r ) {
						// success ? SWAL?
						swal(
							zeroBSCRMJS_listViewLang( 'tagsremoved' ),
							zeroBSCRMJS_listViewLang( 'tagsremoveddesc' ),
							'success'
						);
					},
					function ( r ) {
						// fail ? SWAL?
						swal(
							zeroBSCRMJS_listViewLang( 'tagsnotremoved' ),
							zeroBSCRMJS_listViewLang( 'tagsnotremoveddesc' ),
							'warning'
						);
					}
				);
			} else {
				// didn't select tags

				swal(
					zeroBSCRMJS_listViewLang( 'tagsnotselected' ),
					zeroBSCRMJS_listViewLang( 'tagsnotselecteddesc' ),
					'warning'
				);
			}
		}
	} );
}

/**
 * @param typestr
 */
function zeroBSCRMJS_listView_generic_bulkActionFire_export( typestr ) {
	// directly post to export page
	var params = {
		sec: window.zbscrmjs_secToken,
		objtype: window.zbsListViewSettings.objdbname,
		ids: zeroBSCRMJS_listView_bulkActionsGetChecked(),
	};

	var typeparam = '';
	if (
		typeof window.zbsListViewSettings.objdbname !== 'undefined' &&
		window.zbsListViewSettings.objdbname !== ''
	) {
		typeparam = '&zbstype=' + window.zbsListViewSettings.objdbname;
	}

	zeroBSCRMJS_genericPostData( window.zbsExportPostURL + typeparam, 'post', params );
}

// bulk action titles
/**
 *
 */
function zeroBSCRMJS_listView_generic_bulkActionTitle_addtag() {
	//return zeroBSCRMJS_listViewIco('addtags') + ' ' + zeroBSCRMJS_listViewLang('addtags');
	return zeroBSCRMJS_listViewLang( 'addtags' );
}
/**
 *
 */
function zeroBSCRMJS_listView_generic_bulkActionTitle_removetag() {
	//return zeroBSCRMJS_listViewIco('removetags') + ' ' + zeroBSCRMJS_listViewLang('removetags');
	return zeroBSCRMJS_listViewLang( 'removetags' );
}
/**
 *
 */
function zeroBSCRMJS_listView_generic_bulkActionTitle_export() {
	//return zeroBSCRMJS_listViewIco('merge') + ' ' + zeroBSCRMJS_listViewLang('merge');
	return zeroBSCRMJS_listViewLang( 'export' );
}

/* ====================================================================================
============== Bulk actions - Pre-checks - Customers ==================================
==================================================================================== */

// ICONS playing up on semantic Select, so cut out for init.

// bulk action titles
/**
 *
 */
function zeroBSCRMJS_listView_customer_bulkActionTitle_delete() {
	//return zeroBSCRMJS_listViewIco('deletecontacts') + ' ' + zeroBSCRMJS_listViewLang('deletecontacts');
	return zeroBSCRMJS_listViewLang( 'deletecontacts' );
}
/**
 *
 */
function zeroBSCRMJS_listView_customer_bulkActionTitle_changestatus() {
	return zeroBSCRMJS_listViewLang( 'changestatus' );
}
/**
 *
 */
function zeroBSCRMJS_listView_customer_bulkActionTitle_merge() {
	//return zeroBSCRMJS_listViewIco('merge') + ' ' + zeroBSCRMJS_listViewLang('merge');
	return zeroBSCRMJS_listViewLang( 'merge' );
}

// Draw <td> for id
/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_customer_id( dataLine ) {
	let editURL = zeroBSCRMJS_listView_viewURL( dataLine.id );

	return '<td><a href="' + editURL + '">#' + dataLine.id + '</a></td>';
}

/**
 *
 */
function zeroBSCRMJS_listView_customer_bulkActionFire_changestatus() {
	// SWAL sanity check
	var extraParams = {};
	var status_selector_html = '<div class="ui segment">';
	if (
		typeof window.zbsStatusesForBulkActions !== 'undefined' &&
		window.zbsStatusesForBulkActions.length > 0
	) {
		status_selector_html += '<select id="zbs-select-status">';
		window.zbsStatusesForBulkActions.forEach( function ( s ) {
			status_selector_html += '<option value="' + jpcrm.esc_attr(s) + '">' + jpcrm.esc_html(s) + '</option>';
		} );
		status_selector_html += '</select>';
	} else {
		status_selector_html += '<div class="ui message"><p>Unable to load statuses!</p></div>';
	}
	status_selector_html += '</div>';

	// see ans 3 here https://stackoverflow.com/questions/31463649/sweetalert-prompt-with-two-input-fields
	swal( {
		title: zeroBSCRMJS_listViewLang( 'areyousure' ),
		html:
			'<div>' +
			zeroBSCRMJS_listViewLang( 'statusareyousurethese' ) +
			'</div>' +
			status_selector_html,
		//text: "Are you sure you want to delete these?",
		type: 'warning',
		showCancelButton: true,
		confirmButtonColor: '#000',
		cancelButtonColor: '#fff',
		cancelButtonText: '<span style="color: #000">Cancel</span>',
		confirmButtonText: zeroBSCRMJS_listViewLang( 'yesupdate' ),
		//allowOutsideClick: false,
	} ).then( function ( result ) {
		// this check required from swal2 6.0+ https://github.com/sweetalert2/sweetalert2/issues/724
		if ( result.value ) {
			// get setting
			extraParams.newstatus = jQuery( '#zbs-select-status' ).val();

			// fire status change + will automatically refresh list view
			zeroBSCRMJS_enactBulkAction(
				'changestatus',
				zeroBSCRMJS_listView_bulkActionsGetChecked(),
				extraParams,
				function ( r ) {
					// success ? SWAL?
					swal( zeroBSCRMJS_listViewLang( 'statusupdated' ), '', 'success' );
				},
				function ( r ) {
					// fail ? SWAL?
					swal( zeroBSCRMJS_listViewLang( 'statusnotupdated' ), '', 'warning' );
				}
			);
		}
	} );
}

/**
 *
 */
function zeroBSCRMJS_listView_customer_bulkActionFire_delete() {
	// SWAL sanity check + leave orphans?
	var extraParams = { leaveorphans: true };

	// see ans 3 here https://stackoverflow.com/questions/31463649/sweetalert-prompt-with-two-input-fields
	swal( {
		title: zeroBSCRMJS_listViewLang( 'areyousure' ),
		html:
			'<div>' +
			zeroBSCRMJS_listViewLang( 'areyousurethese' ) +
			'<br /><label>' +
			zeroBSCRMJS_listViewLang( 'andthese' ) +
			'</label></div><select id="zbsbulkactiondeleteleaveorphans"><option value="1" selected="selected">' +
			zeroBSCRMJS_listViewLang( 'noleave' ) +
			'</option><option value="0">' +
			zeroBSCRMJS_listViewLang( 'yesthose' ) +
			'</option></select></div>',
		//text: "Are you sure you want to delete these?",
		type: 'warning',
		showCancelButton: true,
		confirmButtonColor: '#000',
		cancelButtonColor: '#fff',
		confirmButtonText: 'Yes, delete!',
		cancelButtonText: '<span style="color: #000">Cancel</span>'
		//allowOutsideClick: false
	} ).then( function ( result ) {
		// this check required from swal2 6.0+
		if ( result.value ) {
			// get setting
			extraParams.leaveorphans = jQuery( '#zbsbulkactiondeleteleaveorphans' ).val();

			// fire delete + will automatically refresh list view
			zeroBSCRMJS_enactBulkAction(
				'delete',
				zeroBSCRMJS_listView_bulkActionsGetChecked(),
				extraParams,
				function ( r ) {
					// success ? SWAL?
					swal({
						title: zeroBSCRMJS_listViewLang( 'deleted' ),
						text: zeroBSCRMJS_listViewLang( 'contactsdeleted' ),
						confirmButtonColor: '#000',
						type: 'success'
					});
				},
				function ( r ) {
					// fail ? SWAL?
					swal(
						zeroBSCRMJS_listViewLang( 'notdeleted' ),
						zeroBSCRMJS_listViewLang( 'notcontactsdeleted' ),
						'warning'
					);
				}
			);
		}
	} );
}

// bulk action - Merge
/**
 *
 */
function zeroBSCRMJS_listView_customer_bulkActionFire_merge() {
	// SWAL sanity check + which is dominant (main)?
	var extraParams = { dominant: -1 };

	// select (which cust)
	var selectedCusts = zeroBSCRMJS_listView_bulkActionsGetCheckedIncNames();
	var selectHTML = '<select id="zbsbulkactionmergemaster">';
	jQuery.each( selectedCusts, function ( ind, ele ) {
		selectHTML += '<option value="' + ele.id + '">' + ele.name + ' (#' + ele.id + ')</option>';
	} );
	selectHTML += '</select>';

	// see ans 3 here https://stackoverflow.com/questions/31463649/sweetalert-prompt-with-two-input-fields
	swal( {
		title: zeroBSCRMJS_listViewLang( 'areyousure' ),
		html:
			'<div>' +
			zeroBSCRMJS_listViewLang( 'areyousurethesemerge' ) +
			'<br /><label>' +
			zeroBSCRMJS_listViewLang( 'whichdominant' ) +
			'</label></div>' +
			selectHTML +
			'</div>',
		//text: "Are you sure you want to delete these?",
		type: 'warning',
		showCancelButton: true,
		confirmButtonColor: '#000',
		cancelButtonColor: '#fff',
		cancelButtonText: '<span style="color: #000">Cancel</span>',
		confirmButtonText: zeroBSCRMJS_listViewLang( 'yesmerge' ),
		//allowOutsideClick: false,
	} ).then( function ( result ) {
		// this check required from swal2 6.0+ https://github.com/sweetalert2/sweetalert2/issues/724
		if ( result.value ) {
			// get setting
			extraParams.dominant = jQuery( '#zbsbulkactionmergemaster' ).val();

			// fire delete + will automatically refresh list view
			zeroBSCRMJS_enactBulkAction(
				'merge',
				zeroBSCRMJS_listView_bulkActionsGetChecked(),
				extraParams,
				function ( r ) {
					// success ? SWAL?
					swal(
						zeroBSCRMJS_listViewLang( 'merged' ),
						zeroBSCRMJS_listViewLang( 'contactsmerged' ),
						'success'
					);
				},
				function ( r ) {
					// fail ? SWAL?
					swal(
						zeroBSCRMJS_listViewLang( 'notmerged' ),
						zeroBSCRMJS_listViewLang( 'contactsnotmerged' ),
						'warning'
					);
				}
			);
		}
	} );
}

/* ====================================================================================
============== / Bulk actions - Pre-checks - Customers ================================
==================================================================================== */

/* ====================================================================================
============== Field Drawing JS - GENERIC List View ===================================
    These are fallbacks for when there is no zeroBSCRMJS_listView_CUSTOMER_id e.g.
==================================================================================== */

// Draw <td> for id
/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_generic_id( dataLine ) {
	var id = '#' + dataLine.id;
	if ( typeof dataLine.zbsid !== 'undefined' ) {
		id = '<a href="' + zeroBSCRMJS_listView_viewURL( dataLine.id ) + '">' + jpcrm.esc_html(id) + '</a>';
	}

	return '<td' + zeroBSCRMJS_listView_tdAttr( 'id', dataLine, dataLine.id ) + '>' + id + '</td>';
}

// Draw <td> for status
/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_generic_status( dataLine ) {
	var statusStr = '';
	if ( typeof dataLine.status !== 'undefined' ) {
		statusStr = dataLine.status;
	}

	return (
		'<td' +
		zeroBSCRMJS_listView_tdAttr( 'status', dataLine, dataLine.status ) +
		'>' +
		jpcrm.esc_html(statusStr) +
		'</td>'
	);
}

// Draw <td> for added
/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_generic_added( dataLine ) {
	var date = '';

	// DAL3
	if ( date == '' && typeof dataLine.created_date !== 'undefined' ) {
		date = dataLine.created_date;
	}

	// DAL2
	if ( date == '' && typeof dataLine.created !== 'undefined' ) {
		date = dataLine.created;
	}

	// DAL1
	if ( date == '' && typeof dataLine.added !== 'undefined' ) {
		date = dataLine.added;
	}

	return '<td data-zbs-created-uts="' + jpcrm.esc_attr(dataLine.createduts) + '">' + jpcrm.esc_html(date) + '</td>';
}

// Draw <td> for lastupdated
/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_generic_lastupdated( dataLine ) {
	var date = '';

	// DAL3
	if ( date == '' && typeof dataLine.lastupdated_date !== 'undefined' ) {
		date = dataLine.lastupdated_date;
	}

	// DAL2
	if ( date == '' && typeof dataLine.lastupdated !== 'undefined' ) {
		date = dataLine.lastupdated;
	}

	// DAL1
	if ( date == '' && typeof dataLine.added !== 'undefined' ) {
		date = dataLine.added;
	}

	return '<td data-zbs-created-uts="' + jpcrm.esc_attr(dataLine.createduts) + '">' + jpcrm.esc_html(date) + '</td>';
}

// Draw <td> for name
/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_generic_name( dataLine ) {
	//this is the other "view" UI: zeroBSCRMJS_listView_viewURL
	var v = '';
	if ( typeof dataLine.name !== 'undefined' ) {
		v = dataLine.name;
	}
	if ( v == '' && typeof dataLine.title !== 'undefined' ) {
		v = dataLine.title;
	}
	var td = '<td><a href="' + zeroBSCRMJS_listView_viewURL( dataLine.id ) + '">' + jpcrm.esc_html(v) + '</a></td>';

	return td;
}
// Draw <td> for name and avatar
// https://semantic-ui.com/collections/table.html
/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_generic_nameavatar( dataLine ) {
	// var editURL = zeroBSCRMJS_listView_editURL(dataLine['id']);

	var editURL = zeroBSCRMJS_listView_viewURL( dataLine.id );
	var emailURL = zeroBSCRMJS_listView_emailURL_contact( dataLine.id );

	var emailStr = '';
	if ( typeof dataLine.email !== 'undefined' && dataLine.email != '' ) {
		emailStr = '<a href="' + jpcrm.esc_attr(emailURL) + '">' + jpcrm.esc_html(dataLine.email) + '</a>';
	}
	var imgStr = '';
	if ( typeof dataLine.avatar !== 'undefined' && dataLine.avatar != '' ) {
		imgStr = '<img src="' + jpcrm.esc_attr(dataLine.avatar) + '" class="ui mini rounded image">';
	} //imgStr = '<a href="' + editURL + '"><img src="' + dataLine['avatar'] + '" class="ui mini rounded image"></a>';
	var nameStr = '';
	if ( typeof dataLine.name !== 'undefined' && dataLine.name != '' ) {
		nameStr = dataLine.name;
	}
	if ( nameStr == '' && typeof dataLine.email !== 'undefined' && dataLine.email != '' ) {
		nameStr = dataLine.email;
	}

	var td = `
		<td class="jpcrm_name_and_avatar">
			${imgStr}
			<div class="content">
				<a href="${jpcrm.esc_attr(editURL)}">${jpcrm.esc_html(nameStr)}</a>
				${emailStr}
			</div>
		</td>`;

	return td;
}

// Draw <td> for company
/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_generic_company( dataLine ) {
	var td = '<td></td>';

	if ( typeof dataLine.company !== 'undefined' && typeof dataLine.company.id !== 'undefined' ) {
		//this is the other "view" UI: zeroBSCRMJS_listView_viewURL
		var td =
			'<td><a href="' +
			zeroBSCRMJS_listView_viewURL_company( dataLine.company.id ) +
			'">' +
			jpcrm.esc_html(dataLine.company.name) +
			'</a></td>';
	}

	return td;
}

// Generic simplified customer line
// as of v2.92 also allows [company] (e.g. transaction can have either or)
/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_generic_customer( dataLine ) {
	if (
		typeof dataLine.customer !== 'undefined' &&
		dataLine.customer != null &&
		dataLine.customer != false &&
		typeof dataLine.customer.id !== 'undefined'
	) {
		var custLine = dataLine.customer;

		var editURL = zeroBSCRMJS_listView_viewURL_customer( dataLine.customer.id );
		var emailURL = zeroBSCRMJS_listView_emailURL_contact( dataLine.customer.id );

		var emailStr = '';
		var imgStr = '';
		if ( typeof custLine.avatar !== 'undefined' && custLine.avatar != '' ) {
			imgStr = '<img src="' + jpcrm.esc_attr(custLine.avatar) + '">';
		} //imgStr = '<a href="' + editURL + '"><img src="' + dataLine['avatar'] + '" class="ui mini rounded image"></a>';
		var nameStr = '';
		if ( typeof custLine.fullname !== 'undefined' && custLine.fullname != '' ) {
			nameStr = custLine.fullname;
		}
		if ( nameStr == '' && typeof custLine.email !== 'undefined' && custLine.email != '' ) {
			nameStr = custLine.email;
		}

		var td = `
			<td class="jpcrm_name_and_avatar">
				${imgStr}
				<div class="content">
					<a href="${jpcrm.esc_attr(editURL)}">${jpcrm.esc_html(nameStr)}</a>
					${jpcrm.esc_html(emailStr)}
				</div>
			</td>`;
	} else if (
		typeof dataLine.company !== 'undefined' &&
		dataLine.company != null &&
		typeof dataLine.company.id !== 'undefined'
	) {
		var coLine = dataLine.company;

		var editURL = zeroBSCRMJS_listView_viewURL_company( dataLine.company.id );

		var nameStr = '';
		if ( typeof coLine.fullname !== 'undefined' && coLine.fullname != '' ) {
			nameStr = coLine.fullname;
		}

		var td = `
			<td class="jpcrm_name_and_avatar">
			<i class="building icon"></i>
				<div class="content">
					<a href="${jpcrm.esc_attr(editURL)}">${jpcrm.esc_html(nameStr)}</a>
				</div>
			</td>`;
	} else {
		td = '<td>' + zeroBSCRMJS_listViewLang( 'nocustomer' ) + '</td>';
	}

	return td;
}

// Generic simplified customer email
/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_generic_customeremail( dataLine ) {
	if ( typeof dataLine.customer !== 'undefined' && typeof dataLine.customer.id !== 'undefined' ) {
		var custLine = dataLine.customer;

		var editURL = zeroBSCRMJS_listView_viewURL_customer( dataLine.customer.id );
		var emailURL = zeroBSCRMJS_listView_emailURL_contact( dataLine.customer.id );

		var emailStr = '';
		if ( typeof custLine.email !== 'undefined' && custLine.email != '' ) {
			emailStr = '<a href="' + jpcrm.esc_attr(emailURL) + '">' + jpcrm.esc_html(custLine.email) + '</a>';
		}

		var td = '<td>' + emailStr + '</td>';
	} else {
		td = '<td>' + zeroBSCRMJS_listViewLang( 'nocustomer' ) + '</td>';
	}

	return td;
}

// Draw <td> for assigned to
/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_generic_assigned( dataLine ) {
	var assignedToStr = '';

	// v2
	if (
		typeof dataLine.owner !== 'undefined' &&
		typeof dataLine.owner.OBJ !== 'undefined' &&
		typeof dataLine.owner.OBJ.data !== 'undefined' &&
		typeof dataLine.owner.OBJ.data.display_name !== 'undefined'
	) {
		assignedToStr += dataLine.owner.OBJ.data.display_name;
	}

	// v3
	if (
		typeof dataLine.owner !== 'undefined' &&
		typeof dataLine.owner.OBJ !== 'undefined' &&
		typeof dataLine.owner.OBJ.display_name !== 'undefined'
	) {
		assignedToStr += dataLine.owner.OBJ.display_name;
	}

	return '<td>' + jpcrm.esc_html(assignedToStr) + '</td>';
}

// specifies 'assigned to' of customer/company owner of this obj
// e.g. inv/trans against contact 123, this'll show 'owner' to 123
/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_generic_assignedobj( dataLine ) {
	var assignedToStr = '';

	if (
		typeof dataLine.customer !== 'undefined' &&
		dataLine.customer != null &&
		dataLine.customer != false &&
		typeof dataLine.customer.owner !== 'undefined'
	) {
		if (
			typeof dataLine.customer.owner !== 'undefined' &&
			typeof dataLine.customer.owner.OBJ !== 'undefined' &&
			typeof dataLine.customer.owner.OBJ.data !== 'undefined' &&
			typeof dataLine.customer.owner.OBJ.data.display_name !== 'undefined'
		) {
			assignedToStr += dataLine.customer.owner.OBJ.data.display_name;
		}
	} else if (
		typeof dataLine.company !== 'undefined' &&
		dataLine.company != null &&
		typeof dataLine.company.owner !== 'undefined'
	) {
		if (
			typeof dataLine.company.owner !== 'undefined' &&
			typeof dataLine.company.owner.OBJ !== 'undefined' &&
			typeof dataLine.company.owner.OBJ.data !== 'undefined' &&
			typeof dataLine.company.owner.OBJ.data.display_name !== 'undefined'
		) {
			assignedToStr += dataLine.company.owner.OBJ.data.display_name;
		}
	}

	return '<td>' + jpcrm.esc_html(assignedToStr) + '</td>';
}

// Draw <td> for latestlog
/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_generic_latestlog( dataLine ) {
	var lastLogStr = '';
	if (
		typeof dataLine.lastlog !== 'undefined' &&
		typeof dataLine.lastlog.type !== 'undefined' &&
		typeof dataLine.lastlog.shortdesc !== 'undefined'
	) {
		lastLogStr +=
			zeroBSCRMJS_logTypeStr( dataLine.lastlog.type ) + ': ' + dataLine.lastlog.shortdesc;
	}

	return '<td>' + jpcrm.esc_html(lastLogStr) + '</td>';
}
// Draw <td> for lastcontafctec
/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_generic_lastcontacted( dataLine ) {
	var lastLogStr = '';

	// relative format
	// note that this is relative to the local user's browser, not WP timezone
	if ( dataLine.lastcontacteduts && dataLine.lastcontacteduts != -1 ) {
		var lastUTS = dataLine.lastcontacteduts;
		var start = moment.unix( lastUTS );
		var end = moment().endOf( 'day' );

		var daysAgo = end.diff( start, 'days' );
		if ( daysAgo == 0 ) {
			lastLogStr = zeroBSCRMJS_listViewLang( 'today' );
		} else if ( daysAgo > 0 ) {
			if ( daysAgo == 1 ) {
				lastLogStr = zeroBSCRMJS_listViewLang( 'yesterday' );
			} else {
				lastLogStr = daysAgo + ' ' + zeroBSCRMJS_listViewLang( 'daysago' );
			}
		}
	}

	if ( lastLogStr == '' ) {
		lastLogStr = zeroBSCRMJS_listViewLang( 'notcontacted' );
	}

	return '<td>' + jpcrm.esc_html(lastLogStr) + '</td>';
}
// Draw <td> for tagged
/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_generic_tagged( dataLine ) {
	var tagStr = '';
	if ( typeof dataLine.tags !== 'undefined' && dataLine.tags.length > 0 ) {
		jQuery.each( dataLine.tags, function ( ind, ele ) {
			// ui choices: https://semantic-ui.com/elements/label.html
			// ui tag
			// ui basic
			// ui horizontal
			tagStr +=
				'<a href="' +
				window.zbsTagSkipLinkPrefix +
				ele.id +
				'" title="View all with this tag" class="ui small basic label teal">' +
				jpcrm.esc_html(ele.name) +
				'</a>';
		} );
	}

	return '<td>' + tagStr + '</td>';
}

// Draw <td> for has quote
/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_generic_hasquote( dataLine ) {
	var hasQuote = false;

	// check for objects
	if ( typeof dataLine.quotes !== 'undefined' && dataLine.quotes != 0 && dataLine.quotes != '0' ) {
		hasQuote = true;
	}

	// check for total
	if ( typeof dataLine.quotes_total_value !== 'undefined' && dataLine.quotes_total_value > 0 ) {
		hasQuote = true;
	}

	return (
		'<td class="center aligned">' +
		( hasQuote ? '<i class="large green checkmark icon"></i>' : '' ) +
		'</td>'
	);
}
// Draw <td> for has inv
/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_generic_hasinvoice( dataLine ) {
	var hasInvoice = false;

	// check for objects
	if (
		typeof dataLine.invoices !== 'undefined' &&
		dataLine.invoices != 0 &&
		dataLine.invoices != '0'
	) {
		hasInvoice = true;
	}

	// check for total
	if ( typeof dataLine.invoices_total_value !== 'undefined' && dataLine.invoices_total_value > 0 ) {
		hasInvoice = true;
	}

	return (
		'<td class="center aligned">' +
		( hasInvoice ? '<i class="large green checkmark icon"></i>' : '' ) +
		'</td>'
	);
}
// Draw <td> for has inv
/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_generic_hastransaction( dataLine ) {
	var hasTransaction = false;

	// check for objects
	if (
		typeof dataLine.transactions !== 'undefined' &&
		dataLine.transactions != 0 &&
		dataLine.transactions != '0'
	) {
		hasTransaction = true;
	}

	// check for total
	if (
		typeof dataLine.transactions_total_value !== 'undefined' &&
		dataLine.transactions_total_value > 0
	) {
		hasTransaction = true;
	}

	return (
		'<td class="center aligned">' +
		( hasTransaction ? '<i class="large green checkmark icon"></i>' : '' ) +
		'</td>'
	);
}

// Draw <td> for quote count
/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_generic_quotecount( dataLine ) {
	return (
		'<td>' + ( typeof dataLine.quotes !== 'undefined' ? dataLine.quotes.length : '' ) + '</td>'
	);
}

// Draw <td> for invoice count
/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_generic_invoicecount( dataLine ) {
	return (
		'<td>' + ( typeof dataLine.invoices_count !== 'undefined' ? dataLine.invoices_count : '' ) + '</td>'
	);
}

// Draw <td> for transaction count
/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_generic_transactioncount( dataLine ) {
	return (
		'<td>' +
		( typeof dataLine.transactions !== 'undefined' ? dataLine.transactions.length : '' ) +
		'</td>'
	);
}

// Draw <td> for quote total
/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_generic_quotetotal( dataLine ) {
	return (
		'<td>' + ( typeof dataLine.quotestotal !== 'undefined' ? dataLine.quotestotal : '' ) + '</td>'
	);
}

// Draw <td> for invoice total
/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_generic_invoicetotal( dataLine ) {
	return (
		'<td>' +
		( typeof dataLine.invoicestotal !== 'undefined' ? dataLine.invoicestotal : '' ) +
		'</td>'
	);
}

// Draw <td> for transaction total
/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_generic_transactiontotal( dataLine ) {
	var transStr = '';

	// ~v3
	if ( typeof dataLine.transactionstotal !== 'undefined' ) {
		transStr = dataLine.transactionstotal;
	}

	// v3.0
	if ( typeof dataLine.transactions_total !== 'undefined' ) {
		transStr = dataLine.transactions_total;
	}

	return '<td>' + jpcrm.esc_html(transStr) + '</td>';
}

// Draw <td> for  edit link
/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_generic_editlink( dataLine ) {
	// return '<td class="center aligned"><a href="' + zeroBSCRMJS_listView_editURL(dataLine['id']) + '" class="ui basic button"><i class="icon edit"></i>' + window.zbs_lang.zbs_edit + '</a></td>';

	return (
		'<td class="center aligned"><a href="' +
		zeroBSCRMJS_listView_editURL( dataLine.id ) +
		'" class="ui basic button"><i class="icon pencil"></i>' +
		zeroBSCRMJS_listViewLang( 'zbs_edit' ) +
		'</a></td>'
	);
}
// Draw <td> for  edit link
/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_generic_editdirectlink( dataLine ) {
	// return '<td class="center aligned"><a href="' + zeroBSCRMJS_listView_editURL(dataLine['id']) + '" class="ui basic button"><i class="icon edit"></i>' + window.zbs_lang.zbs_edit + '</a></td>';

	return (
		'<td class="center aligned"><a href="' +
		zeroBSCRMJS_listView_editURL( dataLine.id ) +
		'" class="ui basic button"><i class="icon pencil"></i>' +
		zeroBSCRMJS_listViewLang( 'zbs_edit' ) +
		'</a></td>'
	);
}

// Draw <td> for  edit link
/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_generic_viewlink( dataLine ) {
	// return '<td class="center aligned"><a href="' + zeroBSCRMJS_listView_editURL(dataLine['id']) + '" class="ui basic button"><i class="icon edit"></i>' + window.zbs_lang.zbs_edit + '</a></td>';

	return (
		'<td class="center aligned"><a href="' +
		zeroBSCRMJS_listView_viewURL( dataLine.id ) +
		'" class="ui basic button"><i class="icon eye"></i>' +
		window.zbs_lang.zbs_view +
		'</a></td>'
	);
}
// Draw <td> for telephone <ahref
/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_generic_phonelink( dataLine ) {
	// worktel hometel mobtel

	var phoneLinkStr = '';
	if ( typeof dataLine.hometel !== 'undefined' && dataLine.hometel != '' ) {
		phoneLinkStr +=
			'<a href="' +
			zeroBSCRMJS_telURLFromNo( dataLine.hometel ) +
			'" class="ui tiny basic button"><i class="icon call"></i> ' +
			jpcrm.esc_html(dataLine.hometel) +
			' (' +
			zeroBSCRMJS_listViewLang( 'telhome' ) +
			')</a>';
	}
	if ( typeof dataLine.worktel !== 'undefined' && dataLine.worktel != '' ) {
		phoneLinkStr +=
			'<a href="' +
			zeroBSCRMJS_telURLFromNo( dataLine.worktel ) +
			'" class="ui tiny basic button"><i class="icon call"></i> ' +
			jpcrm.esc_html(dataLine.worktel) +
			' (' +
			zeroBSCRMJS_listViewLang( 'telwork' ) +
			')</a>';
	}
	if ( typeof dataLine.mobtel !== 'undefined' && dataLine.mobtel != '' ) {
		phoneLinkStr +=
			'<a href="' +
			zeroBSCRMJS_telURLFromNo( dataLine.mobtel ) +
			'" class="ui tiny basic button"><i class="icon call"></i> ' +
			jpcrm.esc_html(dataLine.mobtel) +
			' (' +
			zeroBSCRMJS_listViewLang( 'telmob' ) +
			')</a>';
	}

	return '<td class="center aligned">' + phoneLinkStr + '</td>';
}

/* ====================================================================================
============== / Field Drawing JS - GENERIC List View ================================
==================================================================================== */

/* ====================================================================================
============== Field Drawing JS - Customer List View ==================================
==================================================================================== */

// Second Address Fields
/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_customer_secaddr1( dataLine ) {
	// catch various version endpoints
	var v = '';
	if ( typeof dataLine.secaddr_addr1 !== 'undefined' ) {
		v = dataLine.secaddr_addr1;
	}
	if ( v == '' && typeof dataLine.secaddr1 !== 'undefined' ) {
		v = dataLine.secaddr1;
	}

	return '<td>' + jpcrm.esc_html(v) + '</td>';
}

/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_customer_secaddr2( dataLine ) {
	// catch various version endpoints
	var v = '';
	if ( typeof dataLine.secaddr_addr2 !== 'undefined' ) {
		v = dataLine.secaddr_addr2;
	}
	if ( v == '' && typeof dataLine.secaddr2 !== 'undefined' ) {
		v = dataLine.secaddr2;
	}

	return '<td>' + jpcrm.esc_html(v) + '</td>';
}

/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_customer_seccity( dataLine ) {
	// catch various version endpoints
	var v = '';
	if ( typeof dataLine.secaddr_city !== 'undefined' ) {
		v = dataLine.secaddr_city;
	}
	if ( v == '' && typeof dataLine.seccity !== 'undefined' ) {
		v = dataLine.seccity;
	}

	return '<td>' + jpcrm.esc_html(v) + '</td>';
}

/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_customer_seccounty( dataLine ) {
	// catch various version endpoints
	var v = '';
	if ( typeof dataLine.secaddr_county !== 'undefined' ) {
		v = dataLine.secaddr_county;
	}
	if ( v == '' && typeof dataLine.seccounty !== 'undefined' ) {
		v = dataLine.seccounty;
	}

	return '<td>' + jpcrm.esc_html(v) + '</td>';
}

/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_customer_secpostcode( dataLine ) {
	// catch various version endpoints
	var v = '';
	if ( typeof dataLine.secaddr_postcode !== 'undefined' ) {
		v = dataLine.secaddr_postcode;
	}
	if ( v == '' && typeof dataLine.secpostcode !== 'undefined' ) {
		v = dataLine.secpostcode;
	}

	return '<td>' + jpcrm.esc_html(v) + '</td>';
}

/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_customer_seccountry( dataLine ) {
	// catch various version endpoints
	var v = '';
	if ( typeof dataLine.secaddr_country !== 'undefined' ) {
		v = dataLine.secaddr_country;
	}
	if ( v == '' && typeof dataLine.seccountry !== 'undefined' ) {
		v = dataLine.seccountry;
	}

	return '<td>' + jpcrm.esc_html(v) + '</td>';
}

// Draw <td> for added
/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_customer_added( dataLine ) {
	var date = '';

	// DAL3
	if ( date == '' && typeof dataLine.created_date !== 'undefined' ) {
		date = dataLine.created_date;
	}

	// DAL2
	if ( date == '' && typeof dataLine.created !== 'undefined' ) {
		date = dataLine.created;
	}

	// DAL1
	if ( date == '' && typeof dataLine.added !== 'undefined' ) {
		date = dataLine.added;
	}

	return '<td data-zbs-created-uts="' + jpcrm.esc_attr(dataLine.createduts) + '">' + jpcrm.esc_html(date) + '</td>';
}
// Draw <td> for total value ... just format these in PHP and draw normally...
/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_customer_totalvalue( dataLine ) {
	var v = '';
	if ( typeof dataLine.totalvalue !== 'undefined' ) {
		v = dataLine.totalvalue;
	}
	return '<td>' + jpcrm.esc_html(v) + '</td>';
}
// Draw <td> for name
/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_customer_name( dataLine ) {
	//this is the other "view" UI: zeroBSCRMJS_listView_viewURL
	var v = '';
	if ( typeof dataLine.name !== 'undefined' ) {
		v = dataLine.name;
	}
	var td = '<td><a href="' + zeroBSCRMJS_listView_viewURL( dataLine.id ) + '">' + jpcrm.esc_html(v) + '</a></td>';

	return td;
}
// Draw <td> for name
/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_customer_fname( dataLine ) {
	var td = '<td>' + jpcrm.esc_html(dataLine.fname) + '</td>';

	return td;
}
// Draw <td> for name
/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_customer_lname( dataLine ) {
	var td = '<td>' + jpcrm.esc_html(dataLine.lname) + '</td>';

	return td;
}
// Draw <td> for name and avatar
// https://semantic-ui.com/collections/table.html
/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_customer_nameavatar( dataLine ) {
	// var editURL = zeroBSCRMJS_listView_editURL(dataLine['id']);

	var editURL = zeroBSCRMJS_listView_viewURL( dataLine.id );
	var emailURL = zeroBSCRMJS_listView_emailURL_contact( dataLine.id );

	var emailStr = '';
	if ( typeof dataLine.email !== 'undefined' && dataLine.email != '' ) {
		emailStr = '<a href="' + jpcrm.esc_attr(emailURL) + '">' + jpcrm.esc_html(dataLine.email) + '</a>';
	}
	var imgStr = '';
	if ( typeof dataLine.avatar !== 'undefined' && dataLine.avatar != '' ) {
		imgStr = '<img src="' + jpcrm.esc_attr(dataLine.avatar) + '" class="ui mini rounded image">';
	} //imgStr = '<a href="' + editURL + '"><img src="' + dataLine['avatar'] + '" class="ui mini rounded image"></a>';
	var nameStr = '';
	if ( typeof dataLine.name !== 'undefined' && dataLine.name != '' ) {
		nameStr = dataLine.name;
	}
	if ( nameStr == '' && typeof dataLine.email !== 'undefined' && dataLine.email != '' ) {
		nameStr = dataLine.email;
	}

	var td = `
		<td class="jpcrm_name_and_avatar">
			${imgStr}
			<div class="content">
				<a href="${jpcrm.esc_attr(editURL)}">${jpcrm.esc_html(nameStr)}</a>
				${emailStr}
			</div>
		</td>`;

	return td;
}

// Draw <td> for assigned to
/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_customer_assigned( dataLine ) {
	var assignedToStr = '';
	var val = -1;
	if ( typeof dataLine.owner !== 'undefined' && typeof dataLine.owner.ID !== 'undefined' ) {
		val = dataLine.owner.ID;
	}

	// v2
	if (
		typeof dataLine.owner !== 'undefined' &&
		typeof dataLine.owner.OBJ !== 'undefined' &&
		typeof dataLine.owner.OBJ.data !== 'undefined' &&
		typeof dataLine.owner.OBJ.data.display_name !== 'undefined'
	) {
		assignedToStr += dataLine.owner.OBJ.data.display_name;
	}

	// v3
	if (
		typeof dataLine.owner !== 'undefined' &&
		typeof dataLine.owner.OBJ !== 'undefined' &&
		typeof dataLine.owner.OBJ.display_name !== 'undefined'
	) {
		assignedToStr += dataLine.owner.OBJ.display_name;
	}

	return (
		'<td' + zeroBSCRMJS_listView_tdAttr( 'assigned', dataLine, val ) + '>' + jpcrm.esc_html(assignedToStr) + '</td>'
	);
}
// Draw <td> for latestlog
/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_customer_latestlog( dataLine ) {
	var lastLogStr = '';

	if (
		typeof dataLine.lastlog !== 'undefined' &&
		typeof dataLine.lastlog.type !== 'undefined' &&
		typeof dataLine.lastlog.shortdesc !== 'undefined'
	) {
		lastLogStr +=
			zeroBSCRMJS_logTypeStr( dataLine.lastlog.type ) + ': ' + dataLine.lastlog.shortdesc;
	}

	return '<td>' + jpcrm.esc_html(lastLogStr) + '</td>';
}
// Draw <td> for tagged
/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_customer_tagged( dataLine ) {
	var tagStr = '';
	if ( typeof dataLine.tags !== 'undefined' && dataLine.tags.length > 0 ) {
		jQuery.each( dataLine.tags, function ( ind, ele ) {
			// ui choices: https://semantic-ui.com/elements/label.html
			// ui tag
			// ui basic
			// ui horizontal
			tagStr +=
				'<a href="' +
				window.zbsTagSkipLinkPrefix +
				ele.id +
				'" title="View all with this tag" class="ui small basic label teal">' +
				jpcrm.esc_html(ele.name) +
				'</a>';
		} );
	}

	return '<td>' + tagStr + '</td>';
}
// Draw <td> for  edit link (For some reason VIEW is called editlink #techdebt)
/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_customer_editlink( dataLine ) {
	return (
		'<td class="center aligned"><a href="' +
		zeroBSCRMJS_listView_viewURL( dataLine.id ) +
		'" class="ui basic button"><i class="icon pencil"></i>' +
		window.zbs_lang.zbs_view +
		'</a></td>'
	);
}
// Draw <td> for  edit link
/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_customer_editdirectlink( dataLine ) {
	return (
		'<td class="center aligned"><a href="' +
		zeroBSCRMJS_listView_editURL( dataLine.id ) +
		'" class="ui basic button"><i class="icon pencil"></i>' +
		window.zbs_lang.zbs_edit +
		'</a></td>'
	);
}

// Draw <td> for telephone <ahref
/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_customer_phonelink( dataLine ) {
	// worktel hometel mobtel

	var phoneLinkStr = '';
	if ( typeof dataLine.hometel !== 'undefined' && dataLine.hometel != '' ) {
		phoneLinkStr +=
			'<a href="' +
			zeroBSCRMJS_telURLFromNo( dataLine.hometel ) +
			'" class="ui tiny basic button"><i class="icon call"></i> ' +
			jpcrm.esc_html(dataLine.hometel) +
			' (' +
			zeroBSCRMJS_listViewLang( 'telhome' ) +
			')</a>';
	}
	if ( typeof dataLine.worktel !== 'undefined' && dataLine.worktel != '' ) {
		phoneLinkStr +=
			'<a href="' +
			zeroBSCRMJS_telURLFromNo( dataLine.worktel ) +
			'" class="ui tiny basic button"><i class="icon call"></i> ' +
			jpcrm.esc_html(dataLine.worktel) +
			' (' +
			zeroBSCRMJS_listViewLang( 'telwork' ) +
			')</a>';
	}
	if ( typeof dataLine.mobtel !== 'undefined' && dataLine.mobtel != '' ) {
		phoneLinkStr +=
			'<a href="' +
			zeroBSCRMJS_telURLFromNo( dataLine.mobtel ) +
			'" class="ui tiny basic button"><i class="icon call"></i> ' +
			jpcrm.esc_html(dataLine.mobtel) +
			' (' +
			zeroBSCRMJS_listViewLang( 'telmob' ) +
			')</a>';
	}

	return '<td class="center aligned">' + phoneLinkStr + '</td>';
}

/* ====================================================================================
============== / Field Drawing JS - Customer List View ================================
==================================================================================== */

/**
 *
 */
function zbsIdentify() {
	return '#####zbshash#####';
}

/* ====================================================================================
============================ Bulk actions - Segments ==================================
==================================================================================== */

// bulk action titles
/**
 *
 */
function zeroBSCRMJS_listView_segment_bulkActionTitle_delete() {
	//return zeroBSCRMJS_listViewIco('deletecontacts') + ' ' + zeroBSCRMJS_listViewLang('deletecontacts');
	return zeroBSCRMJS_listViewLang( 'deletesegments' );
}

/**
 *
 */
function zeroBSCRMJS_listView_segment_bulkActionFire_delete() {
	// SWAL sanity check + leave orphans?
	var extraParams = {};

	// see ans 3 here https://stackoverflow.com/questions/31463649/sweetalert-prompt-with-two-input-fields
	swal( {
		title: zeroBSCRMJS_listViewLang( 'areyousure' ),
		html: '<div>' + zeroBSCRMJS_listViewLang( 'areyousurethese' ) + '</div>',
		//text: "Are you sure you want to delete these?",
		type: 'warning',
		showCancelButton: true,
		confirmButtonColor: '#000',
		cancelButtonColor: '#fff',
		confirmButtonText: 'Yes, delete!',
		cancelButtonText: '<span style="color: #000">Cancel</span>'
		//allowOutsideClick: false,
	} ).then( function ( result ) {
		// this check required from swal2 6.0+ https://github.com/sweetalert2/sweetalert2/issues/724
		if ( result.value ) {
			// fire delete + will automatically refresh list view
			zeroBSCRMJS_enactBulkAction(
				'delete',
				zeroBSCRMJS_listView_bulkActionsGetChecked(),
				extraParams,
				function ( r ) {
					// success ? SWAL?
					swal(
						zeroBSCRMJS_listViewLang( 'deleted' ),
						zeroBSCRMJS_listViewLang( 'segmentsdeleted' ),
						'success'
					);
				},
				function ( r ) {
					// fail ? SWAL?
					swal(
						zeroBSCRMJS_listViewLang( 'notdeleted' ),
						zeroBSCRMJS_listViewLang( 'notsegmentsdeleted' ),
						'warning'
					);
				}
			);
		}
	} );
}

/*  ===================================================================================
========================== / Bulk actions - Segments ==================================
==================================================================================== */

/* ====================================================================================
=============== Field Drawing JS - Segment List View ==================================
==================================================================================== */

// Draw <td> for id
/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_segment_id( dataLine ) {
	return '<td>#' + jpcrm.esc_html(dataLine.id) + '</td>';
}
// Draw <td> for added
/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_segment_added( dataLine ) {
	var date = '';

	// DAL3
	if ( date == '' && typeof dataLine.created_date !== 'undefined' ) {
		date = dataLine.created_date;
	}

	// DAL2
	if ( date == '' && typeof dataLine.createddate !== 'undefined' ) {
		date = dataLine.createddate;
	}

	return '<td>' + jpcrm.esc_html(date) + '</td>';
}
// Draw <td> for name
/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_segment_name( dataLine ) {
	var name_str = jpcrm.esc_html(dataLine.name);

	// if any errors, attach an exclaimation mark
	if ( typeof dataLine.error !== 'undefined' ) {
		name_str += ' <i class="red exclamation triangle icon" title="' + jpcrm.esc_attr(dataLine.error) + '"></i>';
	}

	var td =
		'<td><a href="' + zeroBSCRMJS_listView_editURL( dataLine.id ) + '">' + name_str + '</a></td>';

	return td;
}
// Draw <td> for audience count
/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_segment_audiencecount( dataLine ) {
	var compStr = window.zbsListViewLangLabels.notCompiled;
	if ( typeof dataLine.compilecount !== 'undefined' ) {
		var compile_count = dataLine.compilecount;

		// if any errors, hide (probably wrong) count
		if ( typeof dataLine.error !== 'undefined' ) {
			compile_count = '-';
		}

		compStr =
			'<span class="ui label teal" title="' +
			window.zbsListViewLangLabels.lastCompiled +
			' ' +
			dataLine.lastcompileddate +
			'">' +
			jpcrm.esc_html(compile_count) +
			'</span>';

		// if using segment quickfilters, can view them!
		if (
			typeof window.zbsSegmentViewStemURL !== 'undefined' &&
			typeof dataLine.slug !== 'undefined'
		) {
			compStr =
				'<div class="ui left labeled button" title="' +
				window.zbsListViewLangLabels.lastCompiled +
				' ' +
				dataLine.lastcompileddate +
				'"><a class="ui basic right pointing label">' +
				compile_count +
				'</a><a href="' +
				window.zbsSegmentViewStemURL +
				dataLine.slug +
				'" class="ui button"><i class="list icon"></i> ' +
				window.zbsListViewLangLabels.view +
				'</a></div>';
		}
	}

	var td = '<td class="center aligned">' + compStr + '</td>';

	return td;
}
// Draw <td> for  edit link etc.
/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_segment_action( dataLine ) {
	var buttons =
		'<a href="' +
		zeroBSCRMJS_listView_editURL( dataLine.id ) +
		'" class="ui basic tiny button"><i class="icon edit"></i> ' +
		zeroBSCRMJS_listViewLang( 'edit', 'Edit' ) +
		'</a>';

	// export to csv?
	buttons +=
		'<a class="ui basic tiny button" href="' +
		zeroBSCRMJS_listView_url_export_segment( dataLine.id ) +
		'"><i class="icon cloud download"></i> ' +
		zeroBSCRMJS_listViewLang( 'exportcsv', 'Export .CSV' ) +
		'</a>';

	// extensibility, for now hard-typed
	if ( typeof jpcrm_list_view_segment_action_export_button === 'function' ) {
		buttons += jpcrm_list_view_segment_action_export_button( dataLine );
	}

	return '<td class="center aligned">' + buttons + '</td>';
}

/* ====================================================================================
=============== / Field Drawing JS - Segment List View ================================
==================================================================================== */

/* ====================================================================================
================  Field Drawing JS - Quotetemplate List View ==========================
==================================================================================== */

// Draw <td> for id
/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_quotetemplate_id( dataLine ) {
	var id = '#' + dataLine.id;
	if ( typeof dataLine.zbsid !== 'undefined' ) {
		id =
			'<a href="' + zeroBSCRMJS_listView_editURL( dataLine.id ) + '">#' + jpcrm.esc_html(dataLine.zbsid) + '</a>';
	}

	return '<td' + zeroBSCRMJS_listView_tdAttr( 'id', dataLine, dataLine.id ) + '>' + id + '</td>';
}

// Draw <td> for title
/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_quotetemplate_title( dataLine ) {
	var defStr = '';
	if ( typeof dataLine.default !== 'undefined' ) {
		var d = parseInt( dataLine.default );
		if ( d > 0 ) {
			defStr =
				'<br />(<i>' + zeroBSCRMJS_listViewLang( 'defaulttemplate', 'Default Template' ) + '</i>)';
		}
	}
	return (
		'<td' +
		zeroBSCRMJS_listView_tdAttr( 'title', dataLine, dataLine.title ) +
		'><a href="' +
		zeroBSCRMJS_listView_editURL( dataLine.id ) +
		'">' +
		jpcrm.esc_html(dataLine.title) +
		'</a>' +
		defStr +
		'</td>'
	);
}

// Draw <td> for  edit link etc.
/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_quotetemplate_action( dataLine ) {
	var buttons =
		'<a href="' +
		zeroBSCRMJS_listView_editURL( dataLine.id ) +
		'" class="ui basic button"><i class="icon edit"></i> ' +
		zeroBSCRMJS_listViewLang( 'edit', 'Edit' ) +
		'</a>';

	return '<td class="center aligned">' + buttons + '</td>';
}

/* ====================================================================================
=============== / Field Drawing JS - Quotetemplate List View ==========================
==================================================================================== */

/* ====================================================================================
=============== Field Drawing JS - Company List View ==================================
==================================================================================== */

// Draw <td> for name
/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_company_coname( dataLine ) {
	return zeroBSCRMJS_listView_company_name( dataLine );
}
/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_company_name( dataLine ) {
	//this is the other "view" UI: zeroBSCRMJS_listView_viewURL
	var v = '';
	if ( typeof dataLine.name !== 'undefined' ) {
		v = dataLine.name;
	}
	var td = '<td><a href="' + zeroBSCRMJS_listView_viewURL( dataLine.id ) + '">' + jpcrm.esc_html(v) + '</a></td>';

	return td;
}

/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_company_nameavatar( dataLine ) {
	var editURL = zeroBSCRMJS_listView_editURL( dataLine.id );
	var emailURL = zeroBSCRMJS_listView_emailURL_contact( dataLine.id );

	var emailStr = '';
	if ( typeof dataLine.email !== 'undefined' && dataLine.email != '' ) {
		emailStr = '<a href="' + jpcrm.esc_attr(emailURL) + '">' + jpcrm.esc_html(dataLine.email) + '</a>';
	}
	var imgStr = '';
	if ( typeof dataLine.avatar !== 'undefined' && dataLine.avatar != '' ) {
		imgStr = '<img src="' + jpcrm.esc_attr(dataLine.avatar) + '" class="ui mini rounded image">';
	} //imgStr = '<a href="' + editURL + '"><img src="' + dataLine['avatar'] + '" class="ui mini rounded image"></a>';
	var nameStr = '';
	if ( typeof dataLine.coname !== 'undefined' && dataLine.coname != '' ) {
		nameStr = dataLine.coname;
	}
	if ( nameStr == '' && typeof dataLine.name !== 'undefined' ) {
		nameStr = dataLine.name;
	} // DAL3
	if ( nameStr == '' && typeof dataLine.email !== 'undefined' && dataLine.email != '' ) {
		nameStr = dataLine.email;
	}

	var td = `
		<td class="jpcrm_name_and_avatar">
			${imgStr}
			<div class="content">
				<a href="${jpcrm.esc_attr(editURL)}">${jpcrm.esc_html(nameStr)}</a>
				${emailStr}
			</div>
		</td>`;

	return td;
}

// Second Address Fields
/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_company_secaddr1( dataLine ) {
	// catch various version endpoints
	var v = '';
	if ( typeof dataLine.secaddr_addr1 !== 'undefined' ) {
		v = dataLine.secaddr_addr1;
	}
	if ( v == '' && typeof dataLine.secaddr1 !== 'undefined' ) {
		v = dataLine.secaddr1;
	}

	return '<td>' + jpcrm.esc_html(v) + '</td>';
}

/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_company_secaddr2( dataLine ) {
	// catch various version endpoints
	var v = '';
	if ( typeof dataLine.secaddr_addr2 !== 'undefined' ) {
		v = dataLine.secaddr_addr2;
	}
	if ( v == '' && typeof dataLine.secaddr2 !== 'undefined' ) {
		v = dataLine.secaddr2;
	}

	return '<td>' + jpcrm.esc_html(v) + '</td>';
}

/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_company_seccity( dataLine ) {
	// catch various version endpoints
	var v = '';
	if ( typeof dataLine.secaddr_city !== 'undefined' ) {
		v = dataLine.secaddr_city;
	}
	if ( v == '' && typeof dataLine.seccity !== 'undefined' ) {
		v = dataLine.seccity;
	}

	return '<td>' + jpcrm.esc_html(v) + '</td>';
}

/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_company_seccounty( dataLine ) {
	// catch various version endpoints
	var v = '';
	if ( typeof dataLine.secaddr_county !== 'undefined' ) {
		v = dataLine.secaddr_county;
	}
	if ( v == '' && typeof dataLine.seccounty !== 'undefined' ) {
		v = dataLine.seccounty;
	}

	return '<td>' + jpcrm.esc_html(v) + '</td>';
}

/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_company_secpostcode( dataLine ) {
	// catch various version endpoints
	var v = '';
	if ( typeof dataLine.secaddr_postcode !== 'undefined' ) {
		v = dataLine.secaddr_postcode;
	}
	if ( v == '' && typeof dataLine.secpostcode !== 'undefined' ) {
		v = dataLine.secpostcode;
	}

	return '<td>' + jpcrm.esc_html(v) + '</td>';
}

/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_company_seccountry( dataLine ) {
	// catch various version endpoints
	var v = '';
	if ( typeof dataLine.secaddr_country !== 'undefined' ) {
		v = dataLine.secaddr_country;
	}
	if ( v == '' && typeof dataLine.seccountry !== 'undefined' ) {
		v = dataLine.seccountry;
	}

	return '<td>' + jpcrm.esc_html(v) + '</td>';
}

// Draw <td> for transactions
/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_company_transactioncount( dataLine ) {
	// temp, show count
	var transStr = '';
	if ( typeof dataLine.transactions !== 'undefined' ) {
		transStr = dataLine.transactions.length;
	}

	return '<td>' + jpcrm.esc_html(transStr) + '</td>';
}
// Draw <td> for transactions
/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_company_transactiontotal( dataLine ) {
	// temp, show count
	var transStr = '';

	if ( typeof dataLine.transactionstotal !== 'undefined' ) {
		transStr = dataLine.transactionstotal;
	}

	// v3.0
	if ( typeof dataLine.transactions_total !== 'undefined' ) {
		transStr = dataLine.transactions_total;
	}

	return '<td>' + jpcrm.esc_html(transStr) + '</td>';
}

// Draw <td> for telephone <ahref
/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_company_phonelink( dataLine ) {
	// worktel hometel mobtel

	var phoneLinkStr = '';
	if ( typeof dataLine.maintel !== 'undefined' && dataLine.maintel != '' ) {
		phoneLinkStr +=
			'<a href="' +
			zeroBSCRMJS_telURLFromNo( dataLine.maintel ) +
			'" class="ui tiny basic button"><i class="icon call"></i> ' +
			jpcrm.esc_html(dataLine.maintel) +
			'</a>';
	}
	if ( typeof dataLine.sectel !== 'undefined' && dataLine.sectel != '' ) {
		phoneLinkStr +=
			'<a href="' +
			zeroBSCRMJS_telURLFromNo( dataLine.sectel ) +
			'" class="ui tiny basic button"><i class="icon call"></i> ' +
			jpcrm.esc_html(dataLine.sectel) +
			'</a>';
	}

	return '<td class="center aligned">' + phoneLinkStr + '</td>';
}
/* ====================================================================================
=============== / Field Drawing JS - Company List View ================================
==================================================================================== */

/* ====================================================================================
==============   Bulk actions - Titles - Company ======================================
==================================================================================== */
// ICONS playing up on semantic Select, so cut out for init.

// bulk action titles
/**
 *
 */
function zeroBSCRMJS_listView_company_bulkActionTitle_delete() {
	return zeroBSCRMJS_listViewLang( 'deletecompanys' );
}
/**
 *
 */
function zeroBSCRMJS_listView_company_bulkActionTitle_addtag() {
	return zeroBSCRMJS_listViewLang( 'addtags' );
}
/**
 *
 */
function zeroBSCRMJS_listView_company_bulkActionTitle_removetag() {
	return zeroBSCRMJS_listViewLang( 'removetags' );
}
/**
 *
 */
function zeroBSCRMJS_listView_company_bulkActionTitle_export() {
	//return zeroBSCRMJS_listViewIco('merge') + ' ' + zeroBSCRMJS_listViewLang('merge');
	return zeroBSCRMJS_listViewLang( 'export' );
}
/* ====================================================================================
============== / Bulk actions - Titles - Company ======================================
==================================================================================== */

/* ====================================================================================
============== Bulk actions - Pre-checks - Company ====================================
==================================================================================== */

/**
 *
 */
function zeroBSCRMJS_listView_company_bulkActionFire_delete() {
	// SWAL sanity check + leave orphans?
	var extraParams = { leaveorphans: true };

	// see ans 3 here https://stackoverflow.com/questions/31463649/sweetalert-prompt-with-two-input-fields
	swal( {
		title: zeroBSCRMJS_listViewLang( 'areyousure' ),
		html:
			'<div>' +
			zeroBSCRMJS_listViewLang( 'areyousurethese' ) +
			'<br /><label>' +
			zeroBSCRMJS_listViewLang( 'andthese' ) +
			'</label></div><select id="zbsbulkactiondeleteleaveorphans"><option value="1" selected="selected">' +
			zeroBSCRMJS_listViewLang( 'noleave' ) +
			'</option><option value="0">' +
			zeroBSCRMJS_listViewLang( 'yesthose' ) +
			'</option></select></div>',
		//text: "Are you sure you want to delete these?",
		type: 'warning',
		showCancelButton: true,
		confirmButtonColor: '#000',
		cancelButtonColor: '#fff',
		confirmButtonText: zeroBSCRMJS_listViewLang( 'yesdelete' ),
		cancelButtonText: '<span style="color: #000">Cancel</span>',
		//allowOutsideClick: false,
	} ).then( function ( result ) {
		// this check required from swal2 6.0+ https://github.com/sweetalert2/sweetalert2/issues/724
		if ( result.value ) {
			// get setting
			extraParams.leaveorphans = jQuery( '#zbsbulkactiondeleteleaveorphans' ).val();

			// fire delete + will automatically refresh list view
			zeroBSCRMJS_enactBulkAction(
				'delete',
				zeroBSCRMJS_listView_bulkActionsGetChecked(),
				extraParams,
				function ( r ) {
					// success ? SWAL?
					swal(
						zeroBSCRMJS_listViewLang( 'deleted' ),
						zeroBSCRMJS_listViewLang( 'companysdeleted' ),
						'success'
					);
				},
				function ( r ) {
					// fail ? SWAL?
					swal(
						zeroBSCRMJS_listViewLang( 'notdeleted' ),
						zeroBSCRMJS_listViewLang( 'notcompanysdeleted' ),
						'warning'
					);
				}
			);
		}
	} );
}
/**
 *
 */
function zeroBSCRMJS_listView_company_bulkActionFire_addtag() {
	// SWAL which tag(s)?
	var extraParams = { tags: [] };

	// avail tags will be here: zbsTagsForBulkActions

	// build typeahead html
	/* actually, a straight list makes more sense, until too many
            var tagTypeaheadHTML = '<div id="zbs-tag-typeahead-wrap" class="zbstypeaheadwrap zbsbtypeaheadfullwidth">';
                tagTypeaheadHTML += '<input class="typeahead" type="text" placeholder="Tag...">';
                tagTypeaheadHTML += '</div>';
            */

	// build tag list (toggle'able)
	var tagSelectList = '<div id="zbs-select-tags" class="ui segment">';
	if (
		typeof window.zbsTagsForBulkActions !== 'undefined' &&
		window.zbsTagsForBulkActions.length > 0
	) {
		jQuery.each( window.zbsTagsForBulkActions, function ( ind, tag ) {
			tagSelectList +=
				'<div class="zbs-select-tag ui label"><div class="ui checkbox"><input type="checkbox" data-tagid="' +
				jpcrm.esc_attr(tag.id) +
				'" id="zbs-tag-' +
				jpcrm.esc_attr(tag.id) +
				'" /><label for="zbs-tag-' +
				jpcrm.esc_attr(tag.id) +
				'">' +
				jpcrm.esc_html(tag.name) +
				'</label></div></div>';
		} );
	} else {
		tagSelectList +=
			'<div class="ui message"><p>' + zeroBSCRMJS_listViewLang( 'notags' ) + '</p></div>';
	}
	tagSelectList += '</div>';

	// see ans 3 here https://stackoverflow.com/questions/31463649/sweetalert-prompt-with-two-input-fields
	swal( {
		title: zeroBSCRMJS_listViewLang( 'whichtags' ),
		html:
			'<div>' + zeroBSCRMJS_listViewLang( 'whichtagsadd' ) + '<br />' + tagSelectList + '</div>',
		//text: "Are you sure you want to delete these?",
		type: 'warning',
		showCancelButton: true,
		confirmButtonColor: '#000',
		cancelButtonColor: '#fff',
		cancelButtonText: '<span style="color: #000">Cancel</span>',
		confirmButtonText: zeroBSCRMJS_listViewLang( 'addthesetags' ),
		//allowOutsideClick: false,
		onOpen: function () {
			// bind checkboxes (this just adds nice colour effect, not that important)
			jQuery( '.zbs-select-tag input:checkbox' )
				.off( 'click' )
				.on( 'click', function () {
					jQuery( '.zbs-select-tag input:checkbox' ).each( function ( ind, ele ) {
						if ( jQuery( ele ).is( ':checked' ) ) {
							jQuery( ele ).closest( '.ui.label' ).addClass( 'blue' );
						} else {
							jQuery( ele ).closest( '.ui.label' ).removeClass( 'blue' );
						}
					} );
				} );
		},
	} ).then( function ( result ) {
		// this check required from swal2 6.0+ https://github.com/sweetalert2/sweetalert2/issues/724
		if ( result.value ) {
			// get settings
			extraParams.tags = [];

			// cycle through each tag input and if checked, add id
			jQuery( '.zbs-select-tag input:checkbox' ).each( function ( ind, ele ) {
				if ( jQuery( ele ).is( ':checked' ) ) {
					extraParams.tags.push( jQuery( ele ).attr( 'data-tagid' ) );
				}
			} );

			// any tags?
			if ( extraParams.tags.length > 0 ) {
				// fire + will automatically refresh list view
				zeroBSCRMJS_enactBulkAction(
					'addtag',
					zeroBSCRMJS_listView_bulkActionsGetChecked(),
					extraParams,
					function ( r ) {
						// success ? SWAL?
						swal(
							zeroBSCRMJS_listViewLang( 'tagsadded' ),
							zeroBSCRMJS_listViewLang( 'tagsaddeddesc' ),
							'success'
						);
					},
					function ( r ) {
						// fail ? SWAL?
						swal(
							zeroBSCRMJS_listViewLang( 'tagsnotadded' ),
							zeroBSCRMJS_listViewLang( 'tagsnotaddeddesc' ),
							'warning'
						);
					}
				);
			} else {
				// didn't select tags

				swal(
					zeroBSCRMJS_listViewLang( 'tagsnotselected' ),
					zeroBSCRMJS_listViewLang( 'tagsnotselecteddesc' ),
					'warning'
				);
			}
		}
	} );
}
/**
 *
 */
function zeroBSCRMJS_listView_company_bulkActionFire_removetag() {
	// SWAL which tag(s)?
	var extraParams = { tags: [] };

	// avail tags will be here: zbsTagsForBulkActions

	// build typeahead html
	/* actually, a straight list makes more sense, until too many
            var tagTypeaheadHTML = '<div id="zbs-tag-typeahead-wrap" class="zbstypeaheadwrap zbsbtypeaheadfullwidth">';
                tagTypeaheadHTML += '<input class="typeahead" type="text" placeholder="Tag...">';
                tagTypeaheadHTML += '</div>';
            */

	// build tag list (toggle'able)
	var tagSelectList = '<div id="zbs-select-tags" class="ui segment">';
	if (
		typeof window.zbsTagsForBulkActions !== 'undefined' &&
		window.zbsTagsForBulkActions.length > 0
	) {
		jQuery.each( window.zbsTagsForBulkActions, function ( ind, tag ) {
			tagSelectList +=
				'<div class="zbs-select-tag ui label"><div class="ui checkbox"><input type="checkbox" data-tagid="' +
				jpcrm.esc_attr(tag.id) +
				'" id="zbs-tag-' +
				jpcrm.esc_attr(tag.id) +
				'" /><label for="zbs-tag-' +
				jpcrm.esc_attr(tag.id) +
				'">' +
				jpcrm.esc_html(tag.name) +
				'</label></div></div>';
		} );
	} else {
		tagSelectList +=
			'<div class="ui message"><p>' + zeroBSCRMJS_listViewLang( 'notags' ) + '</p></div>';
	}
	tagSelectList += '</div>';

	// see ans 3 here https://stackoverflow.com/questions/31463649/sweetalert-prompt-with-two-input-fields
	swal( {
		title: zeroBSCRMJS_listViewLang( 'whichtags' ),
		html:
			'<div>' + zeroBSCRMJS_listViewLang( 'whichtagsremove' ) + '<br />' + tagSelectList + '</div>',
		//text: "Are you sure you want to delete these?",
		type: 'warning',
		showCancelButton: true,
		confirmButtonColor: '#000',
		cancelButtonColor: '#fff',
		confirmButtonText: zeroBSCRMJS_listViewLang( 'removethesetags' ),
		cancelButtonText: '<span style="color: #000">Cancel</span>',
		//allowOutsideClick: false,
		onOpen: function () {
			// bind checkboxes (this just adds nice colour effect, not that important)
			jQuery( '.zbs-select-tag input:checkbox' )
				.off( 'click' )
				.on( 'click', function () {
					jQuery( '.zbs-select-tag input:checkbox' ).each( function ( ind, ele ) {
						if ( jQuery( ele ).is( ':checked' ) ) {
							jQuery( ele ).closest( '.ui.label' ).addClass( 'blue' );
						} else {
							jQuery( ele ).closest( '.ui.label' ).removeClass( 'blue' );
						}
					} );
				} );
		},
	} ).then( function ( result ) {
		// this check required from swal2 6.0+ https://github.com/sweetalert2/sweetalert2/issues/724
		if ( result.value ) {
			// get settings
			extraParams.tags = [];

			// cycle through each tag input and if checked, add id
			jQuery( '.zbs-select-tag input:checkbox' ).each( function ( ind, ele ) {
				if ( jQuery( ele ).is( ':checked' ) ) {
					extraParams.tags.push( jQuery( ele ).attr( 'data-tagid' ) );
				}
			} );

			// any tags?
			if ( extraParams.tags.length > 0 ) {
				// fire + will automatically refresh list view
				zeroBSCRMJS_enactBulkAction(
					'removetag',
					zeroBSCRMJS_listView_bulkActionsGetChecked(),
					extraParams,
					function ( r ) {
						// success ? SWAL?
						swal(
							zeroBSCRMJS_listViewLang( 'tagsremoved' ),
							zeroBSCRMJS_listViewLang( 'tagsremoveddesc' ),
							'success'
						);
					},
					function ( r ) {
						// fail ? SWAL?
						swal(
							zeroBSCRMJS_listViewLang( 'tagsnotremoved' ),
							zeroBSCRMJS_listViewLang( 'tagsnotremoveddesc' ),
							'warning'
						);
					}
				);
			} else {
				// didn't select tags

				swal(
					zeroBSCRMJS_listViewLang( 'tagsnotselected' ),
					zeroBSCRMJS_listViewLang( 'tagsnotselecteddesc' ),
					'warning'
				);
			}
		}
	} );
}
/* ====================================================================================
============== / Bulk actions - Pre-checks - Company ==================================
==================================================================================== */

/* ====================================================================================
=============== Field Drawing JS - Quote List View ==================================
==================================================================================== */

/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_quote_title( dataLine ) {
	//this is the other "view" UI: zeroBSCRMJS_listView_viewURL
	var v = '';
	if ( typeof dataLine.name !== 'undefined' ) {
		v = dataLine.name;
	}
	if ( v == '' && typeof dataLine.title !== 'undefined' ) {
		v = dataLine.title;
	} // DAL3
	if ( v == '' && typeof dataLine.id_override !== 'undefined' && dataLine.id_override !== '' ) {
		v = '#' + dataLine.id_override;
	} // DAL3 fallback
	var td =
		'<td><strong><a href="' +
		zeroBSCRMJS_listView_viewURL( dataLine.id ) +
		'">' +
		jpcrm.esc_html(v) +
		'</a></strong></td>';

	return td;
}
// Draw <td> for value
/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_quote_value( dataLine ) {
	var value = '';

	// DAL3
	if ( value == '' && typeof dataLine.value !== 'undefined' ) {
		value = dataLine.value;
	}

	// <DAL3
	if ( value == '' && typeof dataLine.val !== 'undefined' ) {
		value = dataLine.val;
	}

	return '<td>' + jpcrm.esc_html(value) + '</td>';
}
// Draw <td> for status
/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_quote_status( dataLine ) {
	var stat = '';
	if ( typeof dataLine.status !== 'undefined' ) {
		stat = dataLine.status;
	}
	return '<td>' + stat + '</td>'; // this line has HTML in it
}
// Draw <td> for quote date
/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_quote_date( dataLine ) {
	var v = '';
	if ( typeof dataLine.meta !== 'undefined' && typeof dataLine.meta.date !== 'undefined' ) {
		v = dataLine.meta.date;
	}
	if ( v == '' && typeof dataLine.date_date !== 'undefined' ) {
		v = dataLine.date_date;
	} // DAL3

	var td = '<td>' + jpcrm.esc_html(v) + '</td>';

	return td;
}
/* ====================================================================================
=============== / Field Drawing JS - Quote List View ================================
==================================================================================== */

/* ====================================================================================
==============   Bulk actions - Titles - Quote ======================================
==================================================================================== */
// ICONS playing up on semantic Select, so cut out for init.

// bulk action titles
/**
 *
 */
function zeroBSCRMJS_listView_quote_bulkActionTitle_markaccepted() {
	return zeroBSCRMJS_listViewLang( 'markaccepted' );
}
/**
 *
 */
function zeroBSCRMJS_listView_quote_bulkActionTitle_markunaccepted() {
	return zeroBSCRMJS_listViewLang( 'markunaccepted' );
}
/**
 *
 */
function zeroBSCRMJS_listView_quote_bulkActionTitle_delete() {
	return zeroBSCRMJS_listViewLang( 'delete' );
}
/**
 *
 */
function zeroBSCRMJS_listView_quote_bulkActionTitle_export() {
	return zeroBSCRMJS_listViewLang( 'export' );
}
/* ====================================================================================
============== / Bulk actions - Titles - Quote ======================================
==================================================================================== */

/* ====================================================================================
============== Bulk actions - Pre-checks - Quote ====================================
==================================================================================== */

/**
 *
 */
function zeroBSCRMJS_listView_quote_bulkActionFire_markaccepted() {
	// SWAL sanity check
	var extraParams = {};

	// see ans 3 here https://stackoverflow.com/questions/31463649/sweetalert-prompt-with-two-input-fields
	swal( {
		title: zeroBSCRMJS_listViewLang( 'areyousure' ),
		html: '<div>' + zeroBSCRMJS_listViewLang( 'acceptareyousurequotes' ) + '</div>',
		//text: "Are you sure you want to delete these?",
		type: 'warning',
		showCancelButton: true,
		confirmButtonColor: '#000',
		cancelButtonColor: '#fff',
		cancelButtonText: '<span style="color: #000">Cancel</span>',
		confirmButtonText: zeroBSCRMJS_listViewLang( 'acceptyesdoit' ),
		//allowOutsideClick: false,
	} ).then( function ( result ) {
		// this check required from swal2 6.0+ https://github.com/sweetalert2/sweetalert2/issues/724
		if ( result.value ) {
			// get setting
			extraParams.leaveorphans = jQuery( '#zbsbulkactiondeleteleaveorphans' ).val();

			// fire delete + will automatically refresh list view
			zeroBSCRMJS_enactBulkAction(
				'markaccepted',
				zeroBSCRMJS_listView_bulkActionsGetChecked(),
				extraParams,
				function ( r ) {
					// success ? SWAL?
					swal(
						zeroBSCRMJS_listViewLang( 'acceptdeleted' ),
						zeroBSCRMJS_listViewLang( 'acceptcompanysdeleted' ),
						'success'
					);
				},
				function ( r ) {
					// fail ? SWAL?
					swal(
						zeroBSCRMJS_listViewLang( 'acceptnotdeleted' ),
						zeroBSCRMJS_listViewLang( 'acceptnotcompanysdeleted' ),
						'warning'
					);
				}
			);
		}
	} );
}
/**
 *
 */
function zeroBSCRMJS_listView_quote_bulkActionFire_markunaccepted() {
	// SWAL sanity check
	var extraParams = {};

	// see ans 3 here https://stackoverflow.com/questions/31463649/sweetalert-prompt-with-two-input-fields
	swal( {
		title: zeroBSCRMJS_listViewLang( 'areyousure' ),
		html: '<div>' + zeroBSCRMJS_listViewLang( 'unacceptareyousurethese' ) + '</div>',
		//text: "Are you sure you want to delete these?",
		type: 'warning',
		showCancelButton: true,
		confirmButtonColor: '#000',
		cancelButtonColor: '#fff',
		cancelButtonText: '<span style="color: #000">Cancel</span>',
		confirmButtonText: zeroBSCRMJS_listViewLang( 'yesproceed' ),
		//allowOutsideClick: false,
	} ).then( function ( result ) {
		// this check required from swal2 6.0+ https://github.com/sweetalert2/sweetalert2/issues/724
		if ( result.value ) {
			// get setting
			extraParams.leaveorphans = jQuery( '#zbsbulkactiondeleteleaveorphans' ).val();

			// fire delete + will automatically refresh list view
			zeroBSCRMJS_enactBulkAction(
				'markunaccepted',
				zeroBSCRMJS_listView_bulkActionsGetChecked(),
				extraParams,
				function ( r ) {
					// success ? SWAL?
					swal(
						zeroBSCRMJS_listViewLang( 'unacceptdeleted' ),
						zeroBSCRMJS_listViewLang( 'unacceptcompanysdeleted' ),
						'success'
					);
				},
				function ( r ) {
					// fail ? SWAL?
					swal(
						zeroBSCRMJS_listViewLang( 'unacceptnotdeleted' ),
						zeroBSCRMJS_listViewLang( 'unacceptnotcompanysdeleted' ),
						'warning'
					);
				}
			);
		}
	} );
}
/**
 *
 */
function zeroBSCRMJS_listView_quote_bulkActionFire_delete() {
	// SWAL sanity check
	var extraParams = {};

	// see ans 3 here https://stackoverflow.com/questions/31463649/sweetalert-prompt-with-two-input-fields
	swal( {
		title: zeroBSCRMJS_listViewLang( 'areyousure' ),
		html: '<div>' + zeroBSCRMJS_listViewLang( 'areyousurethese' ) + '</div>',
		//text: "Are you sure you want to delete these?",
		type: 'warning',
		showCancelButton: true,
		confirmButtonColor: '#000',
		cancelButtonColor: '#fff',
		confirmButtonText: zeroBSCRMJS_listViewLang( 'yesdelete' ),
		cancelButtonText: '<span style="color: #000">Cancel</span>',
		//allowOutsideClick: false,
	} ).then( function ( result ) {
		// this check required from swal2 6.0+ https://github.com/sweetalert2/sweetalert2/issues/724
		if ( result.value ) {
			// fire delete + will automatically refresh list view
			zeroBSCRMJS_enactBulkAction(
				'delete',
				zeroBSCRMJS_listView_bulkActionsGetChecked(),
				extraParams,
				function ( r ) {
					// success ? SWAL?
					swal(
						zeroBSCRMJS_listViewLang( 'deleted' ),
						zeroBSCRMJS_listViewLang( 'quotesdeleted' ),
						'success'
					);
				},
				function ( r ) {
					// fail ? SWAL?
					swal(
						zeroBSCRMJS_listViewLang( 'notdeleted' ),
						zeroBSCRMJS_listViewLang( 'notquotesdeleted' ),
						'warning'
					);
				}
			);
		}
	} );
}
/* ====================================================================================
============== / Bulk actions - Pre-checks - Quote ==================================
==================================================================================== */

/* ====================================================================================
============ Bulk actions - Pre-checks - Quote Templates  =============================
==================================================================================== */

// bulk action title
/**
 *
 */
function zeroBSCRMJS_listView_quotetemplate_bulkActionTitle_delete() {
	return zeroBSCRMJS_listViewLang( 'deletetemplate' );
}

// bulk action - delete
/**
 *
 */
function zeroBSCRMJS_listView_quotetemplate_bulkActionFire_delete() {
	// SWAL sanity check
	var extraParams = {};

	// see ans 3 here https://stackoverflow.com/questions/31463649/sweetalert-prompt-with-two-input-fields
	swal( {
		title: zeroBSCRMJS_listViewLang( 'areyousure' ),
		html: '<div>' + zeroBSCRMJS_listViewLang( 'areyousurethese' ) + '</div>',
		//text: "Are you sure you want to delete these?",
		type: 'warning',
		showCancelButton: true,
		confirmButtonColor: '#000',
		cancelButtonColor: '#fff',
		confirmButtonText: zeroBSCRMJS_listViewLang( 'yesdelete' ),
		cancelButtonText: '<span style="color: #000">Cancel</span>',
		//allowOutsideClick: false,
	} ).then( function ( result ) {
		// this check required from swal2 6.0+ https://github.com/sweetalert2/sweetalert2/issues/724
		if ( result.value ) {
			// fire delete + will automatically refresh list view
			zeroBSCRMJS_enactBulkAction(
				'delete',
				zeroBSCRMJS_listView_bulkActionsGetChecked(),
				extraParams,
				function ( r ) {
					// success ? SWAL?
					swal(
						zeroBSCRMJS_listViewLang( 'deleted' ),
						zeroBSCRMJS_listViewLang( 'quotetemplatesdeleted' ),
						'success'
					);
				},
				function ( r ) {
					// fail ? SWAL?
					swal(
						zeroBSCRMJS_listViewLang( 'notdeleted' ),
						zeroBSCRMJS_listViewLang( 'notquotetemplatesdeleted' ),
						'warning'
					);
				}
			);
		}
	} );
}
/* ====================================================================================
========== / Bulk actions - Pre-checks - Quote Templates  =============================
==================================================================================== */

/* ====================================================================================
==============   Bulk actions - Titles - Invoice ======================================
==================================================================================== */
// ICONS playing up on semantic Select, so cut out for init.
/**
 *
 */
function zeroBSCRMJS_listView_invoice_bulkActionTitle_delete() {
	return zeroBSCRMJS_listViewLang( 'delete' );
}
/**
 *
 */
function zeroBSCRMJS_listView_invoice_bulkActionTitle_export() {
	return zeroBSCRMJS_listViewLang( 'export' );
}
/* ====================================================================================
============== / Bulk actions - Titles - Invoice ======================================
==================================================================================== */

/* ====================================================================================
=============== Field Drawing JS - Invoice List View ==================================
==================================================================================== */

// Draw <td> for inv no
/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_invoice_no( dataLine ) {
	var id = '';
	if ( typeof dataLine.zbsid !== 'undefined' ) {
		id = dataLine.zbsid;
	}

	var td = '<td>' + jpcrm.esc_html(id) + '</td>';

	return td;
}
// Draw <td> for inv date
/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_invoice_date( dataLine ) {
	var v = '';
	if ( dataLine.date_date ) {
		v = dataLine.date_date;
	}

	var td = '<td>' + jpcrm.esc_html(v) + '</td>';

	return td;
}
// Draw <td> for inv due (WH added to ajax 2.95+)
/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_invoice_due( dataLine ) {
	var v = '';
	if ( dataLine.due_date_date ) {
		v = dataLine.due_date_date;
	}

	var td = '<td>' + jpcrm.esc_html(v) + '</td>';

	return td;
}

// Draw <td> for ref
/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_invoice_ref( dataLine ) {
	var v = '';
	if ( typeof dataLine.title !== 'undefined' ) {
		v = dataLine.title;
	}
	if ( v == '' && typeof dataLine.id_override !== 'undefined' ) {
		v = dataLine.id_override;
	} // DAL3
	if ( v == '' && typeof dataLine.id !== 'undefined' ) {
		v = '#' + dataLine.id;
	} // DAL3 fallback

	var td =
		'<td><strong><a href="' +
		zeroBSCRMJS_listView_viewURL( dataLine.id ) +
		'">' +
		jpcrm.esc_html(v) +
		'</a></strong></td>';

	return td;
}
// Draw <td> for value
/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_invoice_val( dataLine ) {
	// not req. as php formats return '<td>' + zeroBSCRMJS_formatCurrency(dataLine['value']) + '</td>';

	var value = '';

	// DAL3
	if ( value == '' && typeof dataLine.total !== 'undefined' ) {
		value = dataLine.total;
	}

	// DAL2
	if ( value == '' && typeof dataLine.value !== 'undefined' ) {
		value = dataLine.value;
	}

	return '<td>' + jpcrm.esc_html(value) + '</td>';
}
// Draw <td> for value
/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_invoice_value( dataLine ) {
	// not req. as php formats return '<td>' + zeroBSCRMJS_formatCurrency(dataLine['value']) + '</td>';

	var value = '';

	// DAL3
	if ( value == '' && typeof dataLine.total !== 'undefined' ) {
		value = dataLine.total;
	}

	// DAL2
	if ( value == '' && typeof dataLine.value !== 'undefined' ) {
		value = dataLine.value;
	}

	return '<td>' + jpcrm.esc_html(value) + '</td>';
}
// Draw <td> for status
/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_invoice_status( dataLine ) {
	var stat = '';
	if ( typeof dataLine.status_label !== 'undefined' ) {
		stat = dataLine.status_label;
	}
	var color = '';
	switch ( stat ) {
		case zeroBSCRMJS_listViewLang( 'statusdraft', 'Draft' ):
			color = 'grey';
			break;

		case zeroBSCRMJS_listViewLang( 'statusunpaid', 'Unpaid' ):
			color = 'orange';
			break;

		case zeroBSCRMJS_listViewLang( 'statuspaid', 'Paid' ):
			color = 'green';
			break;

		case zeroBSCRMJS_listViewLang( 'statusoverdue', 'Overdue' ):
			color = 'red';
			break;
	}
	stat = '<span class="ui label ' + jpcrm.esc_attr(color) + '">' + jpcrm.esc_html(stat) + '</span>';

	return '<td>' + stat + '</td>';
}

/* ====================================================================================
=============== / Field Drawing JS - Invoice List View ================================
==================================================================================== */

/* ====================================================================================
==============   Bulk actions - Titles - Invoice ======================================
==================================================================================== */
/**
 *
 */
function zeroBSCRMJS_listView_invoice_bulkActionTitle_changestatus() {
	return zeroBSCRMJS_listViewLang( 'changestatus' );
}

/* ====================================================================================
============== / Bulk actions - Titles - Invoice ======================================
==================================================================================== */

/* ====================================================================================
============== Bulk actions - Pre-checks - Invoice ====================================
==================================================================================== */

/**
 *
 */
function zeroBSCRMJS_listView_invoice_bulkActionFire_changestatus() {
	// SWAL sanity check
	var extraParams = {};

	// see ans 3 here https://stackoverflow.com/questions/31463649/sweetalert-prompt-with-two-input-fields
	swal( {
		title: zeroBSCRMJS_listViewLang( 'areyousure' ),
		html:
			'<div>' +
			zeroBSCRMJS_listViewLang( 'statusareyousurethese' ) +
			'</div><select id="zbsbulkactionnewstatus"><option value="Draft" selected="selected">' +
			zeroBSCRMJS_listViewLang( 'statusdraft' ) +
			'</option><option value="Unpaid">' +
			zeroBSCRMJS_listViewLang( 'statusunpaid' ) +
			'</option><option value="Paid">' +
			zeroBSCRMJS_listViewLang( 'statuspaid' ) +
			'</option><option value="Overdue">' +
			zeroBSCRMJS_listViewLang( 'statusoverdue' ) +
			'</option></select></div>',
		//text: "Are you sure you want to delete these?",
		type: 'warning',
		showCancelButton: true,
		confirmButtonColor: '#000',
		cancelButtonColor: '#fff',
		cancelButtonText: '<span style="color: #000">Cancel</span>',
		confirmButtonText: zeroBSCRMJS_listViewLang( 'yesupdate' ),
		//allowOutsideClick: false,
	} ).then( function ( result ) {
		// this check required from swal2 6.0+ https://github.com/sweetalert2/sweetalert2/issues/724
		if ( result.value ) {
			// get setting
			extraParams.newstatus = jQuery( '#zbsbulkactionnewstatus' ).val();

			// fire delete + will automatically refresh list view
			zeroBSCRMJS_enactBulkAction(
				'changestatus',
				zeroBSCRMJS_listView_bulkActionsGetChecked(),
				extraParams,
				function ( r ) {
					// success ? SWAL?
					swal(
						zeroBSCRMJS_listViewLang( 'statusupdated' ),
						zeroBSCRMJS_listViewLang( 'statuscompanysupdated' ),
						'success'
					);
				},
				function ( r ) {
					// fail ? SWAL?
					swal(
						zeroBSCRMJS_listViewLang( 'statusnotupdated' ),
						zeroBSCRMJS_listViewLang( 'statusnotcompanysupdated' ),
						'warning'
					);
				}
			);
		}
	} );
}
/**
 *
 */
function zeroBSCRMJS_listView_invoice_bulkActionFire_delete() {
	// SWAL sanity check
	var extraParams = {};

	// see ans 3 here https://stackoverflow.com/questions/31463649/sweetalert-prompt-with-two-input-fields
	swal( {
		title: zeroBSCRMJS_listViewLang( 'areyousure' ),
		html: '<div>' + zeroBSCRMJS_listViewLang( 'areyousurethese' ) + '</div>',
		//text: "Are you sure you want to delete these?",
		type: 'warning',
		showCancelButton: true,
		confirmButtonColor: '#000',
		cancelButtonColor: '#fff',
		confirmButtonText: zeroBSCRMJS_listViewLang( 'yesdelete' ),
		cancelButtonText: '<span style="color: #000">Cancel</span>',
		//allowOutsideClick: false,
	} ).then( function ( result ) {
		// this check required from swal2 6.0+ https://github.com/sweetalert2/sweetalert2/issues/724
		if ( result.value ) {
			// fire delete + will automatically refresh list view
			zeroBSCRMJS_enactBulkAction(
				'delete',
				zeroBSCRMJS_listView_bulkActionsGetChecked(),
				extraParams,
				function ( r ) {
					// success ? SWAL?
					swal(
						zeroBSCRMJS_listViewLang( 'deleted' ),
						zeroBSCRMJS_listViewLang( 'invoicesdeleted' ),
						'success'
					);
				},
				function ( r ) {
					// fail ? SWAL?
					swal(
						zeroBSCRMJS_listViewLang( 'notdeleted' ),
						zeroBSCRMJS_listViewLang( 'notinvoicesdeleted' ),
						'warning'
					);
				}
			);
		}
	} );
}
/* ====================================================================================
============== / Bulk actions - Pre-checks - Invoice ==================================
==================================================================================== */

/* ====================================================================================
=============== Field Drawing JS - Transacts List View ================================
==================================================================================== */

/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_transaction_id( dataLine ) {
	var v = '';
	if ( v == '' && typeof dataLine.id_override !== 'undefined' ) {
		v = dataLine.id_override;
	} // DAL3
	if ( v == '' && typeof dataLine.id !== 'undefined' ) {
		v = dataLine.id;
	} // fallback
	if ( typeof dataLine.id !== 'undefined' ) {
		v = '<a href="' + zeroBSCRMJS_listView_viewURL( dataLine.id ) + '">#' + jpcrm.esc_html(v) + '</a>';
	}

	return '<td><strong>' + v + '</strong></td>';
}

/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_transaction_item( dataLine ) {
	return zeroBSCRMJS_listView_transaction_title( dataLine );
}

/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_transaction_title( dataLine ) {
	var v = '';
	if ( v == '' && typeof dataLine.title !== 'undefined' ) {
		v = dataLine.title;
	} // DAL3
	if ( v == '' && typeof dataLine.item !== 'undefined' ) {
		v = dataLine.item;
	} // <DAL3

	return '<td><strong>' + jpcrm.esc_html(v) + '</strong></td>';
}

/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_transaction_orderid( dataLine ) {
	var v = '';
	if ( v == '' && typeof dataLine.ref !== 'undefined' ) {
		v = dataLine.ref;
	} // DAL3
	if ( v == '' && typeof dataLine.orderid !== 'undefined' ) {
		v = dataLine.orderid;
	} // <DAL3
	return '<td><strong>' + jpcrm.esc_html(v) + '</strong></td>';
}

// Draw <td> for value
/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_transaction_total( dataLine ) {
	// not req. as php formats return '<td>' + zeroBSCRMJS_formatCurrency(dataLine['total']) + '</td>';
	return '<td>' + jpcrm.esc_html(dataLine.total) + '</td>';
}

// Draw <td> for status
/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_transaction_status( dataLine ) {
	var stat = '';
	if ( typeof dataLine.status !== 'undefined' ) {
		stat = dataLine.status;
	}
	var color = '';
	switch ( stat ) {
		case zeroBSCRMJS_listViewLang( 'trans_status_cancelled', 'Cancelled' ):
			color = 'pink';
			break;

		case zeroBSCRMJS_listViewLang( 'trans_status_hold', 'Hold' ):
			color = 'orange';
			break;

		case zeroBSCRMJS_listViewLang( 'trans_status_pending', 'Pending' ):
			color = 'teal';
			break;

		case zeroBSCRMJS_listViewLang( 'trans_status_processing', 'Processing' ):
			color = 'teal';
			break;

		case zeroBSCRMJS_listViewLang( 'trans_status_refunded', 'Refunded' ):
			color = 'orange';
			break;

		case zeroBSCRMJS_listViewLang( 'trans_status_failed', 'Failed' ):
			color = 'red';
			break;

		case zeroBSCRMJS_listViewLang( 'trans_status_completed', 'Completed' ):
			color = 'positive';
			break;

		case zeroBSCRMJS_listViewLang( 'trans_status_succeeded', 'Succeeded' ):
			color = 'positive';
			break;
	}
	stat = '<span class="ui label ' + jpcrm.esc_attr(color) + '">' + jpcrm.esc_html(stat) + '</span>';

	return '<td>' + stat + '</td>';
}

/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_transaction_date( dataLine ) {
	var v = '';
	if ( v == '' && typeof dataLine.date_date !== 'undefined' && dataLine.date_date !== false ) {
		v = dataLine.date_date;
	} // DAL3

	return '<td>' + jpcrm.esc_html(v) + '</td>';
}

/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_transaction_date_paid( dataLine ) {
	var v = '';
	if (
		v == '' &&
		typeof dataLine.date_paid_date !== 'undefined' &&
		dataLine.date_paid_date !== false
	) {
		v = dataLine.date_paid_date;
	} // DAL3

	return '<td>' + jpcrm.esc_html(v) + '</td>';
}

/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_transaction_date_completed( dataLine ) {
	var v = '';
	if (
		v == '' &&
		typeof dataLine.date_completed_date !== 'undefined' &&
		dataLine.date_completed_date !== false
	) {
		v = dataLine.date_completed_date;
	} // DAL3

	return '<td>' + jpcrm.esc_html(v) + '</td>';
}

/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_transaction_external_source( dataLine ) {
	var v = '';
	if (
		typeof dataLine.external_source_uid !== 'undefined' &&
		dataLine.external_source_uid !== false
	) {
		v = dataLine.external_source_uid;
	}

	return '<td>' + v + '</td>';
}

/* ====================================================================================
=============== / Field Drawing JS - Transacts List View ==============================
==================================================================================== */

/* ====================================================================================
==============   Bulk actions - Titles - Transactions =================================
==================================================================================== */
// ICONS playing up on semantic Select, so cut out for init.

// bulk action titles
/**
 *
 */
function zeroBSCRMJS_listView_transaction_bulkActionTitle_delete() {
	return zeroBSCRMJS_listViewLang( 'delete' );
}
/**
 *
 */
function zeroBSCRMJS_listView_transaction_bulkActionTitle_addtag() {
	return zeroBSCRMJS_listViewLang( 'addtags' );
}
/**
 *
 */
function zeroBSCRMJS_listView_transaction_bulkActionTitle_removetag() {
	return zeroBSCRMJS_listViewLang( 'removetags' );
}
/**
 *
 */
function zeroBSCRMJS_listView_transaction_bulkActionTitle_export() {
	return zeroBSCRMJS_listViewLang( 'export' );
}
/* ====================================================================================
============== / Bulk actions - Titles - Transactions =================================
==================================================================================== */

/* ====================================================================================
============== Bulk actions - Pre-checks - Transactions =============================
==================================================================================== */

/**
 *
 */
function zeroBSCRMJS_listView_transaction_bulkActionFire_delete() {
	// SWAL sanity check + leave orphans?
	var extraParams = { leaveorphans: true };

	// see ans 3 here https://stackoverflow.com/questions/31463649/sweetalert-prompt-with-two-input-fields
	swal( {
		title: zeroBSCRMJS_listViewLang( 'areyousure' ),
		html: '<div>' + zeroBSCRMJS_listViewLang( 'areyousurethese' ) + '</div>',
		//text: "Are you sure you want to delete these?",
		type: 'warning',
		showCancelButton: true,
		confirmButtonColor: '#000',
		cancelButtonColor: '#fff',
		confirmButtonText: zeroBSCRMJS_listViewLang( 'yesdelete' ),
		cancelButtonText: '<span style="color: #000">Cancel</span>',
		//allowOutsideClick: false,
	} ).then( function ( result ) {
		// this check required from swal2 6.0+ https://github.com/sweetalert2/sweetalert2/issues/724
		if ( result.value ) {
			// fire delete + will automatically refresh list view
			zeroBSCRMJS_enactBulkAction(
				'delete',
				zeroBSCRMJS_listView_bulkActionsGetChecked(),
				extraParams,
				function ( r ) {
					// success ? SWAL?
					swal(
						zeroBSCRMJS_listViewLang( 'deleted' ),
						zeroBSCRMJS_listViewLang( 'transactionsdeleted' ),
						'success'
					);
				},
				function ( r ) {
					// fail ? SWAL?
					swal(
						zeroBSCRMJS_listViewLang( 'notdeleted' ),
						zeroBSCRMJS_listViewLang( 'nottransactionsdeleted' ),
						'warning'
					);
				}
			);
		}
	} );
}
/**
 *
 */
function zeroBSCRMJS_listView_transaction_bulkActionFire_addtag() {
	// SWAL which tag(s)?
	var extraParams = { tags: [] };

	// avail tags will be here: zbsTagsForBulkActions

	// build typeahead html
	/* actually, a straight list makes more sense, until too many
            var tagTypeaheadHTML = '<div id="zbs-tag-typeahead-wrap" class="zbstypeaheadwrap zbsbtypeaheadfullwidth">';
                tagTypeaheadHTML += '<input class="typeahead" type="text" placeholder="Tag...">';
                tagTypeaheadHTML += '</div>';
            */

	// build tag list (toggle'able)
	var tagSelectList = '<div id="zbs-select-tags" class="ui segment">';
	if (
		typeof window.zbsTagsForBulkActions !== 'undefined' &&
		window.zbsTagsForBulkActions.length > 0
	) {
		jQuery.each( window.zbsTagsForBulkActions, function ( ind, tag ) {
			tagSelectList +=
				'<div class="zbs-select-tag ui label"><div class="ui checkbox"><input type="checkbox" data-tagid="' +
				tag.id +
				'" id="zbs-tag-' +
				tag.id +
				'" /><label for="zbs-tag-' +
				tag.id +
				'">' +
				tag.name +
				'</label></div></div>';
		} );
	} else {
		tagSelectList +=
			'<div class="ui message"><p>' + zeroBSCRMJS_listViewLang( 'notags' ) + '</p></div>';
	}
	tagSelectList += '</div>';

	// see ans 3 here https://stackoverflow.com/questions/31463649/sweetalert-prompt-with-two-input-fields
	swal( {
		title: zeroBSCRMJS_listViewLang( 'whichtags' ),
		html:
			'<div>' + zeroBSCRMJS_listViewLang( 'whichtagsadd' ) + '<br />' + tagSelectList + '</div>',
		//text: "Are you sure you want to delete these?",
		type: 'warning',
		showCancelButton: true,
		confirmButtonColor: '#000',
		cancelButtonColor: '#fff',
		cancelButtonText: '<span style="color: #000">Cancel</span>',
		confirmButtonText: zeroBSCRMJS_listViewLang( 'addthesetags' ),
		//allowOutsideClick: false,
		onOpen: function () {
			// bind checkboxes (this just adds nice colour effect, not that important)
			jQuery( '.zbs-select-tag input:checkbox' )
				.off( 'click' )
				.on( 'click', function () {
					jQuery( '.zbs-select-tag input:checkbox' ).each( function ( ind, ele ) {
						if ( jQuery( ele ).is( ':checked' ) ) {
							jQuery( ele ).closest( '.ui.label' ).addClass( 'blue' );
						} else {
							jQuery( ele ).closest( '.ui.label' ).removeClass( 'blue' );
						}
					} );
				} );
		},
	} ).then( function ( result ) {
		// this check required from swal2 6.0+ https://github.com/sweetalert2/sweetalert2/issues/724
		if ( result.value ) {
			// get settings
			extraParams.tags = [];

			// cycle through each tag input and if checked, add id
			jQuery( '.zbs-select-tag input:checkbox' ).each( function ( ind, ele ) {
				if ( jQuery( ele ).is( ':checked' ) ) {
					extraParams.tags.push( jQuery( ele ).attr( 'data-tagid' ) );
				}
			} );

			// any tags?
			if ( extraParams.tags.length > 0 ) {
				// fire + will automatically refresh list view
				zeroBSCRMJS_enactBulkAction(
					'addtag',
					zeroBSCRMJS_listView_bulkActionsGetChecked(),
					extraParams,
					function ( r ) {
						// success ? SWAL?
						swal(
							zeroBSCRMJS_listViewLang( 'tagsadded' ),
							zeroBSCRMJS_listViewLang( 'tagsaddeddesc' ),
							'success'
						);
					},
					function ( r ) {
						// fail ? SWAL?
						swal(
							zeroBSCRMJS_listViewLang( 'tagsnotadded' ),
							zeroBSCRMJS_listViewLang( 'tagsnotaddeddesc' ),
							'warning'
						);
					}
				);
			} else {
				// didn't select tags

				swal(
					zeroBSCRMJS_listViewLang( 'tagsnotselected' ),
					zeroBSCRMJS_listViewLang( 'tagsnotselecteddesc' ),
					'warning'
				);
			}
		}
	} );
}
/**
 *
 */
function zeroBSCRMJS_listView_transaction_bulkActionFire_removetag() {
	// SWAL which tag(s)?
	var extraParams = { tags: [] };

	// avail tags will be here: zbsTagsForBulkActions

	// build typeahead html
	/* actually, a straight list makes more sense, until too many
            var tagTypeaheadHTML = '<div id="zbs-tag-typeahead-wrap" class="zbstypeaheadwrap zbsbtypeaheadfullwidth">';
                tagTypeaheadHTML += '<input class="typeahead" type="text" placeholder="Tag...">';
                tagTypeaheadHTML += '</div>';
            */

	// build tag list (toggle'able)
	var tagSelectList = '<div id="zbs-select-tags" class="ui segment">';
	if (
		typeof window.zbsTagsForBulkActions !== 'undefined' &&
		window.zbsTagsForBulkActions.length > 0
	) {
		jQuery.each( window.zbsTagsForBulkActions, function ( ind, tag ) {
			tagSelectList +=
				'<div class="zbs-select-tag ui label"><div class="ui checkbox"><input type="checkbox" data-tagid="' +
				jpcrm.esc_attr(tag.id) +
				'" id="zbs-tag-' +
				jpcrm.esc_attr(tag.id) +
				'" /><label for="zbs-tag-' +
				jpcrm.esc_attr(tag.id) +
				'">' +
				jpcrm.esc_html(tag.name) +
				'</label></div></div>';
		} );
	} else {
		tagSelectList +=
			'<div class="ui message"><p>' + zeroBSCRMJS_listViewLang( 'notags' ) + '</p></div>';
	}
	tagSelectList += '</div>';

	// see ans 3 here https://stackoverflow.com/questions/31463649/sweetalert-prompt-with-two-input-fields
	swal( {
		title: zeroBSCRMJS_listViewLang( 'whichtags' ),
		html:
			'<div>' + zeroBSCRMJS_listViewLang( 'whichtagsremove' ) + '<br />' + tagSelectList + '</div>',
		//text: "Are you sure you want to delete these?",
		type: 'warning',
		showCancelButton: true,
		confirmButtonColor: '#000',
		cancelButtonColor: '#fff',
		confirmButtonText: zeroBSCRMJS_listViewLang( 'removethesetags' ),
		cancelButtonText: '<span style="color: #000">Cancel</span>',
		//allowOutsideClick: false,
		onOpen: function () {
			// bind checkboxes (this just adds nice colour effect, not that important)
			jQuery( '.zbs-select-tag input:checkbox' )
				.off( 'click' )
				.on( 'click', function () {
					jQuery( '.zbs-select-tag input:checkbox' ).each( function ( ind, ele ) {
						if ( jQuery( ele ).is( ':checked' ) ) {
							jQuery( ele ).closest( '.ui.label' ).addClass( 'blue' );
						} else {
							jQuery( ele ).closest( '.ui.label' ).removeClass( 'blue' );
						}
					} );
				} );
		},
	} ).then( function ( result ) {
		// this check required from swal2 6.0+ https://github.com/sweetalert2/sweetalert2/issues/724
		if ( result.value ) {
			// get settings
			extraParams.tags = [];

			// cycle through each tag input and if checked, add id
			jQuery( '.zbs-select-tag input:checkbox' ).each( function ( ind, ele ) {
				if ( jQuery( ele ).is( ':checked' ) ) {
					extraParams.tags.push( jQuery( ele ).attr( 'data-tagid' ) );
				}
			} );

			// any tags?
			if ( extraParams.tags.length > 0 ) {
				// fire + will automatically refresh list view
				zeroBSCRMJS_enactBulkAction(
					'removetag',
					zeroBSCRMJS_listView_bulkActionsGetChecked(),
					extraParams,
					function ( r ) {
						// success ? SWAL?
						swal(
							zeroBSCRMJS_listViewLang( 'tagsremoved' ),
							zeroBSCRMJS_listViewLang( 'tagsremoveddesc' ),
							'success'
						);
					},
					function ( r ) {
						// fail ? SWAL?
						swal(
							zeroBSCRMJS_listViewLang( 'tagsnotremoved' ),
							zeroBSCRMJS_listViewLang( 'tagsnotremoveddesc' ),
							'warning'
						);
					}
				);
			} else {
				// didn't select tags

				swal(
					zeroBSCRMJS_listViewLang( 'tagsnotselected' ),
					zeroBSCRMJS_listViewLang( 'tagsnotselecteddesc' ),
					'warning'
				);
			}
		}
	} );
}
/* ====================================================================================
============== / Bulk actions - Pre-checks - Transactions =============================
==================================================================================== */

/* ====================================================================================
=============== Field Drawing JS - Form List View =====================================
==================================================================================== */

// Draw <td> for form id
/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_form_id( dataLine ) {
	var td =
		'<td><a href="' +
		zeroBSCRMJS_listView_viewURL( dataLine.id ) +
		'">#' +
		jpcrm.esc_html(dataLine.id) +
		'</a></td>';

	return td;
}

// Draw <td> for title
/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_form_title( dataLine ) {
	var td =
		'<td><strong><a href="' +
		zeroBSCRMJS_listView_viewURL( dataLine.id ) +
		'">' +
		jpcrm.esc_html(dataLine.title) +
		'</a></strong></td>';

	return td;
}
/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_form_style( dataLine ) {
	if ( typeof dataLine.style !== 'undefined' ) {
		switch ( dataLine.style ) {
			case 'naked':
				return (
					'<td class="center aligned"><span class="ui label grey">' +
					zeroBSCRMJS_listViewLang( 'naked' ) +
					'</span></td>'
				);

				break;

			case 'cgrab':
				return (
					'<td class="center aligned"><span class="ui label orange">' +
					zeroBSCRMJS_listViewLang( 'cgrab' ) +
					'</span></td>'
				);

				break;

			case 'simple':
				return (
					'<td class="center aligned"><span class="ui label teal">' +
					zeroBSCRMJS_listViewLang( 'simple' ) +
					'</span></td>'
				);

				break;
		}
	}

	return '<td class="center aligned"></td>';
}

/* ====================================================================================
=============== / Field Drawing JS - Form List View ===================================
==================================================================================== */

/* ====================================================================================
==============   Bulk actions - Titles - Form =========================================
==================================================================================== */
/**
 *
 */
function zeroBSCRMJS_listView_form_bulkActionTitle_delete() {
	return zeroBSCRMJS_listViewLang( 'delete' );
}
/* ====================================================================================
============== / Bulk actions - Titles - Form =========================================
==================================================================================== */

/* ====================================================================================
============== Bulk actions - Pre-checks - Form =======================================
==================================================================================== */

/**
 *
 */
function zeroBSCRMJS_listView_form_bulkActionFire_delete() {
	// SWAL sanity check
	var extraParams = {};

	// see ans 3 here https://stackoverflow.com/questions/31463649/sweetalert-prompt-with-two-input-fields
	swal( {
		title: zeroBSCRMJS_listViewLang( 'areyousure' ),
		html: '<div>' + zeroBSCRMJS_listViewLang( 'areyousurethese' ) + '</div>',
		//text: "Are you sure you want to delete these?",
		type: 'warning',
		showCancelButton: true,
		confirmButtonColor: '#000',
		cancelButtonColor: '#fff',
		confirmButtonText: zeroBSCRMJS_listViewLang( 'yesdelete' ),
		cancelButtonText: '<span style="color: #000">Cancel</span>',
		//allowOutsideClick: false,
	} ).then( function ( result ) {
		// this check required from swal2 6.0+ https://github.com/sweetalert2/sweetalert2/issues/724
		if ( result.value ) {
			// fire delete + will automatically refresh list view
			zeroBSCRMJS_enactBulkAction(
				'delete',
				zeroBSCRMJS_listView_bulkActionsGetChecked(),
				extraParams,
				function ( r ) {
					// success ? SWAL?
					swal(
						zeroBSCRMJS_listViewLang( 'deleted' ),
						zeroBSCRMJS_listViewLang( 'formsdeleted' ),
						'success'
					);
				},
				function ( r ) {
					// fail ? SWAL?
					swal(
						zeroBSCRMJS_listViewLang( 'notdeleted' ),
						zeroBSCRMJS_listViewLang( 'notformsdeleted' ),
						'warning'
					);
				}
			);
		}
	} );
}
/* ====================================================================================
============== / Bulk actions - Pre-checks - Form =====================================
==================================================================================== */

/* ====================================================================================
=============== Field Drawing JS - Task List View ====================================
==================================================================================== */

// Draw <td> for form id
/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_event_id( dataLine ) {
	var td =
		'<td><a href="' +
		zeroBSCRMJS_listView_viewURL( dataLine.id ) +
		'">#' +
		jpcrm.esc_html(dataLine.id) +
		'</a></td>';

	return td;
}

// Draw <td> for title
/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_event_title( dataLine ) {
	var td =
		'<td><strong><a href="' +
		zeroBSCRMJS_listView_viewURL( dataLine.id ) +
		'">' +
		jpcrm.esc_html(dataLine.title) +
		'</a></strong></td>';

	return td;
}

// Draw <td> for desc
/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_event_desc( dataLine ) {
	var td = '<td>' + jpcrm.esc_html(dataLine.desc) + '</td>';

	return td;
}

// Draw <td> for starts
/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_event_start( dataLine ) {
	var td = '<td>' + jpcrm.esc_html(dataLine.start_date) + '</td>';

	return td;
}

// Draw <td> for ends
/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_event_end( dataLine ) {
	var td = '<td>' + jpcrm.esc_html(dataLine.end_date) + '</td>';

	return td;
}

// Draw <td> for remind
/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_event_remind( dataLine ) {
	var remind = false;

	if ( dataLine.reminders.length > 0 ) {
		remind = true;
	}

	var td = '<td>' + ( remind ? '<i class="large green checkmark icon"></i>' : '' ) + '</td>';

	return td;
}

// Draw <td> for show
/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_event_showcal( dataLine ) {
	var show = false;

	if ( dataLine.show_on_cal == 1 ) {
		show = true;
	}

	var td = '<td>' + ( show ? '<i class="large green checkmark icon"></i>' : '' ) + '</td>';

	return td;
}

// Draw <td> for show on portal
/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_event_showportal( dataLine ) {
	var show = false;

	if ( dataLine.show_on_portal == 1 ) {
		show = true;
	}

	var td = '<td>' + ( show ? '<i class="large green checkmark icon"></i>' : '' ) + '</td>';

	return td;
}

// Draw <td> for contact
/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_event_contact( dataLine ) {
	var contact = '';
	if ( typeof dataLine.contact.fullname !== 'undefined' ) {
		contact = dataLine.contact.fullname;
	}

	var td = '<td>' + jpcrm.esc_html(contact) + '</td>';

	return td;
}

// Draw <td> for company
/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_event_company( dataLine ) {
	var company = '';
	if ( typeof dataLine.company.fullname !== 'undefined' ) {
		company = dataLine.company.fullname;
	}

	var td = '<td>' + jpcrm.esc_html(company) + '</td>';

	return td;
}

// Draw <td> for action
/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_event_action( dataLine ) {
	var td =
		'<td><strong><a href="' +
		zeroBSCRMJS_listView_viewURL( dataLine.id ) +
		'" class="ui basic button"><i class="icon pencil"></i> ' +
		zeroBSCRMJS_listViewLang( 'edit' ) +
		'</a></strong></td>';

	return td;
}

// Draw <td> for status
/**
 * @param dataLine
 */
function zeroBSCRMJS_listView_event_status( dataLine ) {
	var status =
		'<span class="ui grey label">' + zeroBSCRMJS_listViewLang( 'incomplete' ) + '</span>';

	if ( dataLine.complete == 1 ) {
		status = '<span class="ui green label">' + zeroBSCRMJS_listViewLang( 'complete' ) + '</span>';
	}

	return '<td>' + status + '</td>';
}

/* ====================================================================================
=============== / Field Drawing JS - Event List View ==================================
==================================================================================== */

/* ====================================================================================
==============   Bulk actions - Titles - Event ========================================
==================================================================================== */

/**
 *
 */
function zeroBSCRMJS_listView_event_bulkActionTitle_delete() {
	return zeroBSCRMJS_listViewLang( 'delete' );
}

/**
 *
 */
function zeroBSCRMJS_listView_event_bulkActionTitle_markcomplete() {
	return zeroBSCRMJS_listViewLang( 'markcomplete' );
}

/**
 *
 */
function zeroBSCRMJS_listView_event_bulkActionTitle_markincomplete() {
	return zeroBSCRMJS_listViewLang( 'markincomplete' );
}

/* ====================================================================================
============== / Bulk actions - Titles - Event ========================================
==================================================================================== */

/* ====================================================================================
============== Bulk actions - Pre-checks - Event ======================================
==================================================================================== */

/**
 *
 */
function zeroBSCRMJS_listView_event_bulkActionFire_delete() {
	// SWAL sanity check
	var extraParams = {};

	// see ans 3 here https://stackoverflow.com/questions/31463649/sweetalert-prompt-with-two-input-fields
	swal( {
		title: zeroBSCRMJS_listViewLang( 'areyousure' ),
		html: '<div>' + zeroBSCRMJS_listViewLang( 'areyousurethese' ) + '</div>',
		//text: "Are you sure you want to delete these?",
		type: 'warning',
		showCancelButton: true,
		confirmButtonColor: '#000',
		cancelButtonColor: '#fff',
		confirmButtonText: zeroBSCRMJS_listViewLang( 'yesdelete' ),
		cancelButtonText: '<span style="color: #000">Cancel</span>',
		//allowOutsideClick: false,
	} ).then( function ( result ) {
		// this check required from swal2 6.0+ https://github.com/sweetalert2/sweetalert2/issues/724
		if ( result.value ) {
			// fire delete + will automatically refresh list view
			zeroBSCRMJS_enactBulkAction(
				'delete',
				zeroBSCRMJS_listView_bulkActionsGetChecked(),
				extraParams,
				function ( r ) {
					// success ? SWAL?
					swal(
						zeroBSCRMJS_listViewLang( 'deleted' ),
						zeroBSCRMJS_listViewLang( 'tasks_deleted' ),
						'success'
					);
				},
				function ( r ) {
					// fail ? SWAL?
					swal(
						zeroBSCRMJS_listViewLang( 'notdeleted' ),
						zeroBSCRMJS_listViewLang( 'tasks_not_deleted' ),
						'warning'
					);
				}
			);
		}
	} );
}

/**
 *
 */
function zeroBSCRMJS_listView_event_bulkActionFire_markcomplete() {
	// SWAL sanity check
	var extraParams = {};

	swal( {
		title: zeroBSCRMJS_listViewLang( 'areyousure' ),
		html: '<div>' + zeroBSCRMJS_listViewLang( 'areyousure_tasks_completed' ) + '</div>',
		//text: "Are you sure you want to delete these?",
		type: 'warning',
		showCancelButton: true,
		confirmButtonColor: '#000',
		cancelButtonColor: '#fff',
		cancelButtonText: '<span style="color: #000">Cancel</span>',
		confirmButtonText: zeroBSCRMJS_listViewLang( 'acceptyesdoit' ),
		//allowOutsideClick: false,
	} ).then( function ( result ) {
		// this check required from swal2 6.0+ https://github.com/sweetalert2/sweetalert2/issues/724
		if ( result.value ) {
			// get setting
			extraParams.leaveorphans = false; // not currently any event orphans

			// fire delete + will automatically refresh list view
			zeroBSCRMJS_enactBulkAction(
				'markcomplete',
				zeroBSCRMJS_listView_bulkActionsGetChecked(),
				extraParams,
				function ( r ) {
					// success ? SWAL?
					swal(
						zeroBSCRMJS_listViewLang( 'tasks_marked' ),
						zeroBSCRMJS_listViewLang( 'tasks_marked' ),
						'success'
					);
				},
				function ( r ) {
					// fail ? SWAL?
					swal(
						zeroBSCRMJS_listViewLang( 'tasks_not_marked' ),
						zeroBSCRMJS_listViewLang( 'tasks_not_marked' ),
						'warning'
					);
				}
			);
		}
	} );
}

/**
 *
 */
function zeroBSCRMJS_listView_event_bulkActionFire_markincomplete() {
	// SWAL sanity check
	var extraParams = {};

	swal( {
		title: zeroBSCRMJS_listViewLang( 'areyousure' ),
		html: '<div>' + zeroBSCRMJS_listViewLang( 'areyousure_tasks_incomplete' ) + '</div>',
		//text: "Are you sure you want to delete these?",
		type: 'warning',
		showCancelButton: true,
		confirmButtonColor: '#000',
		cancelButtonColor: '#fff',
		cancelButtonText: '<span style="color: #000">Cancel</span>',
		confirmButtonText: zeroBSCRMJS_listViewLang( 'acceptyesdoit' ),
		//allowOutsideClick: false,
	} ).then( function ( result ) {
		// this check required from swal2 6.0+ https://github.com/sweetalert2/sweetalert2/issues/724
		if ( result.value ) {
			// get setting
			extraParams.leaveorphans = false; // no orphans as of yet

			// fire delete + will automatically refresh list view
			zeroBSCRMJS_enactBulkAction(
				'markincomplete',
				zeroBSCRMJS_listView_bulkActionsGetChecked(),
				extraParams,
				function ( r ) {
					// success ? SWAL?
					swal(
						zeroBSCRMJS_listViewLang( 'eventsmarked' ),
						zeroBSCRMJS_listViewLang( 'eventsmarked' ),
						'success'
					);
				},
				function ( r ) {
					// fail ? SWAL?
					swal(
						zeroBSCRMJS_listViewLang( 'noteventsmarked' ),
						zeroBSCRMJS_listViewLang( 'noteventsmarked' ),
						'warning'
					);
				}
			);
		}
	} );
}

/* ====================================================================================
============== / Bulk actions - Pre-checks - Event ====================================
==================================================================================== */

/**
 * @param typeKey
 */
function zeroBSCRMJS_logTypeStr( typeKey ) {
	if ( typeof window.zbsLogTypes.zerobs_customer[ typeKey ] !== 'undefined' ) {
		return window.zbsLogTypes.zerobs_customer[ typeKey ].label;
	}
	if ( typeof window.zbsLogTypes.zerobs_company[ typeKey ] !== 'undefined' ) {
		return window.zbsLogTypes.zerobs_company[ typeKey ].label;
	}
	return typeKey;
}

/* ====================================================================================
===============  Inline Editing  ======================================================
==================================================================================== */

// binds inline-editing for all fields available
/**
 *
 */
function zeroBSCRMJS_bindInlineEditing() {
	jQuery( '.jpcrm-listview-table td.zbs-inline-edit' )
		.off( 'click' )
		.on( 'click', function () {
			// clicked on an edit
			if ( jQuery( this ).hasClass( 'zbs-editing' ) ) {
				// already editing
			} else {
				// not editing, build editor

				// get col type + val
				var col = jQuery( this ).attr( 'data-col' );
				var val = jQuery( this ).attr( 'data-val' );

				if ( typeof col !== 'undefined' && col != '' ) {
					// build editor str
					var editorStr = '';

					// if override func exists, use that, else use default out:
					// e.g.  zeroBSCRMJS_listView_customer_edit_nameavatar
					var fieldFuncName =
						'zeroBSCRMJS_listView_' + window.zbsListViewSettings.objdbname + '_edit_' + col;
					if ( typeof window[ fieldFuncName ] === 'function' ) {
						// use it
						editorStr = window[ fieldFuncName ]( val );
					} else {
						// see if generic exists
						// e.g.  zeroBSCRMJS_listView_generic_edit_nameavatar
						var fieldFuncName = 'zeroBSCRMJS_listView_generic_edit_' + col;
						if ( typeof window[ fieldFuncName ] === 'function' ) {
							// use it
							editorStr = window[ fieldFuncName ]( val );
						}
					}

					// got editor str?
					if ( editorStr != '' ) {
						var that = this;

						// replace td contents
						jQuery( this ).html( editorStr );

						// change class + unbind click for this td
						jQuery( this ).removeClass( 'zbs-inline-edit' ).addClass( 'zbs-inline-editing' );
						jQuery( this ).off( 'click' );

						// bind
						zeroBSCRMJS_listView_bindInlineEditSave();

						// bind + force focus (helps blur work later)
						setTimeout( function () {
							var that2 = that;

							// force focus (helps blur work later)
							jQuery( 'select', that2 ).focus();
						}, 100 );
					}
				}
			}
		} );
}

// returns any classes needed for this td (col) - currently only classes req are inline editing
/**
 * @param colKey
 * @param dataLine
 * @param val
 */
function zeroBSCRMJS_listView_tdAttr( colKey, dataLine, val ) {
	var classStr = '',
		attrStr = '';

	// inline editing?
	if (
		typeof window.zbsListViewSettings.editinline !== 'undefined' &&
		window.zbsListViewSettings.editinline &&
		typeof window.zbsListViewParams !== 'undefined' &&
		typeof window.zbsListViewParams.editinline !== 'undefined' &&
		typeof window.zbsListViewParams.editinline[ colKey ] !== 'undefined' &&
		window.zbsListViewParams.editinline[ colKey ] == 1
	) {
		classStr += 'zbs-inline-edit';
		attrStr += ' data-col="' + jpcrm.esc_attr(colKey) + '"';
		attrStr += ' data-val="' + jpcrm.esc_attr(val) + '"';
	}

	if ( classStr != '' ) {
		classStr = ' class="' + jpcrm.esc_attr(classStr) + '"';
	}
	return classStr + attrStr;
}

// binds the 'click out to save' func
/**
 *
 */
function zeroBSCRMJS_listView_bindInlineEditSave() {
	jQuery( '.zbs-listview-inline-edit-field' )
		.off( 'blur' )
		.blur( function () {
			// retrieve deets
			var that = this;

			// get id of obj (from nearest tr)
			var id = parseInt( jQuery( this ).closest( 'tr' ).attr( 'data-id' ) );

			// col
			var col = jQuery( this ).closest( '.zbs-inline-editing' ).attr( 'data-col' );

			// val
			var value = jQuery( this ).val();
			var thisLabel = jQuery( ':selected', this ).text(); // for select's with value != label
			var prevVal = jQuery( this ).closest( '.zbs-inline-editing' ).attr( 'data-val' );

			// any change?
			if ( value != prevVal ) {
				if ( id > 0 && col != '' ) {
					// probs legit, save
					zeroBSCRMJS_listView_saveInlineEdit(
						id,
						col,
						value,
						function () {
							var lThis = that,
								lValue = value,
								lLabel = thisLabel;

							// worked, update td
							// for now, just dump the str
							// ... this'll need adjusting when we get to more complex cols
							// ... probably using the "zeroBSCRMJS_listView_customer_id" and generic draw html model

							// replace html  + do classes
							jQuery( lThis )
								.closest( '.zbs-inline-editing' )
								.html( lLabel )
								.removeClass( 'zbs-inline-editing' )
								.addClass( 'zbs-inline-edit' );

							// rebind
							zeroBSCRMJS_bindInlineEditing();
						},
						function () {
							// err
							swal(
								zeroBSCRMJS_listViewLang( 'couldntupdate' ),
								zeroBSCRMJS_listViewLang( 'couldntupdatedeets' ),
								'warning'
							);
						}
					);
				}
			} else {
				// no change but clicked out :)
				var lThis = that,
					lValue = value,
					lLabel = thisLabel;

				// worked, update td
				// for now, just dump the str
				// ... this'll need adjusting when we get to more complex cols
				// ... probably using the "zeroBSCRMJS_listView_customer_id" and generic draw html model

				// replace html  + do classes
				jQuery( lThis )
					.closest( '.zbs-inline-editing' )
					.html( lLabel )
					.removeClass( 'zbs-inline-editing' )
					.addClass( 'zbs-inline-edit' );

				// rebind
				zeroBSCRMJS_bindInlineEditing();
			}
		} );
}

// save (ALL)
var zbListViewInlineEditorAJAXBlocker = false;
/**
 * @param id
 * @param col
 * @param val
 * @param successcb
 * @param errcb
 */
function zeroBSCRMJS_listView_saveInlineEdit( id, col, val, successcb, errcb ) {
	if ( ! window.zbListViewInlineEditorAJAXBlocker ) {
		// set blocker
		window.zbListViewInlineEditorAJAXBlocker = true;

		// postbag!
		var data = {
			action: 'zbs_list_save_inline_edit',
			sec: window.zbscrmjs_secToken,
			listtype: window.zbsListViewParams.listtype,
			id: id,
			field: col,
			v: val,
		};

		// Send
		jQuery.ajax( {
			type: 'POST',
			url: ajaxurl, // admin side is just ajaxurl not wptbpAJAX.ajaxurl,
			data: data,
			dataType: 'json',
			timeout: 20000,
			success: function ( response ) {
				// any success callback?
				if ( typeof successcb === 'function' ) {
					successcb( response );
				}

				// unset blocker
				window.zbListViewInlineEditorAJAXBlocker = false;
			},
			error: function ( response ) {
				// temp debug console.error("Column Data update Error: ",response);

				// any error callback?
				if ( typeof errcb === 'function' ) {
					errcb( response );
				}

				// unset blocker
				window.zbListViewInlineEditorAJAXBlocker = false;
			},
		} );
	}
}

/* ====================================================================================
============== / Inline Editing  ======================================================
==================================================================================== */

/* ====================================================================================
====================== Field Drawing - Inline Edits ===================================
==================================================================================== */

/* e.g.
        function zeroBSCRMJS_listView_customer_edit_id(dataLine){
        */

// contact status
/**
 * @param existingVal
 */
function zeroBSCRMJS_listView_customer_edit_status( existingVal ) {
	var editorHTML = '';

	// brutal assume set?
	if ( window.zbsListViewInlineEdit.customer.statuses.length > 0 ) {
		// got some
		editorHTML = '<select class="zbs-listview-inline-edit-field">';
		jQuery.each( window.zbsListViewInlineEdit.customer.statuses, function ( ind, ele ) {
			editorHTML += '<option value="' + jpcrm.esc_attr(ele) + '"';
			if ( ele == existingVal ) {
				editorHTML += ' selected="selected"';
			}
			editorHTML += '>' + jpcrm.esc_html(ele) + '</option>';
		} );
		editorHTML += '</select>';
	}

	return editorHTML;
}

// contact assigned
/**
 * @param existingVal
 */
function zeroBSCRMJS_listView_generic_edit_assigned( existingVal ) {
	var editorHTML = '';

	// brutal assume set?
	if ( window.zbsListViewInlineEdit.owners.length > 0 ) {
		// got some
		editorHTML = '<select class="zbs-listview-inline-edit-field">';
		jQuery.each( window.zbsListViewInlineEdit.owners, function ( ind, ele ) {
			editorHTML += '<option value="' + jpcrm.esc_attr(ele.id) + '"';
			if ( ele.id == existingVal ) {
				editorHTML += ' selected="selected"';
			}
			editorHTML += '>' + jpcrm.esc_html(ele.name) + '</option>';
		} );
		editorHTML += '</select>';
	}

	return editorHTML;
}

/* ====================================================================================
=================== /  Field Drawing - Inline Edits ===================================
==================================================================================== */

/**
 * @param contact_id
 */
function jpcrm_get_contact_meta( contact_id ) {
	// no data is available
	if ( ! window.zbsListViewData ) {
		return false;
	}
	// loop through contacts to find the correct one
	for ( var i = 0; i < window.zbsListViewData.length; i++ ) {
		if ( window.zbsListViewData[ i ].id == contact_id ) {
			return window.zbsListViewData[ i ];
		}
	}
	// no match
	return false;
}


function jpcrm_add_listview_filter() {
	// hide dropdown
	this.classList.add('hidden');

	// update and show current filter info
	let current_filter_span = this.nextElementSibling.lastElementChild;
	current_filter_span.textContent = this.options[this.selectedIndex].textContent;
	this.nextElementSibling.classList.remove('hidden');

	// update listview filter settings
	if (this.dataset.filtertype === 'quickfilters') {
		zbsListViewParams.filters.quickfilters = [this.value];
	} else if (this.dataset.filtertype === 'tags') {
		zbsListViewParams.filters.tags = [{id:this.value}];
	}

	// draw new listview
	zeroBSCRMJS_drawListView(true, true);
}

function jpcrm_remove_listview_filter() {
	// hide current filter info
	this.parentElement.classList.add('hidden');

	let dropdown = this.parentElement.previousElementSibling;

	// reset dropdown and show it
	dropdown.selectedIndex = 0;
	dropdown.classList.remove('hidden');

	// update listview filter settings
	if (dropdown.dataset.filtertype === 'quickfilters') {
		zbsListViewParams.filters.quickfilters = [];
	} else if (dropdown.dataset.filtertype === 'tags') {
		zbsListViewParams.filters.tags = [];
	}

	// draw new listview
	zeroBSCRMJS_drawListView(true, true);
}

function jpcrm_do_search_filter( event ) {
	// only trigger if Enter is pressed
	if (event.keyCode !== 13 ) {
		return;
	}

	// update listview filter settings
	zbsListViewParams.filters.s = this.value;

	// draw new listview
	zeroBSCRMJS_drawListView(true, true);
}

function jpcrm_change_sort() {
	// update sort params
	zbsListViewParams.sort = this.dataset.sort;
	zbsListViewParams.sortorder = this.dataset.sortdir;
	// draw new listview
	zeroBSCRMJS_drawListView(true, true);
}

if ( typeof module !== 'undefined' ) {
	module.exports = {
		zbListViewInlineEditorAJAXBlocker, zeroBSCRMJS_initListView,
		jpcrm_listview_generate_current_filter_url,
		zeroBSCRMJS_updateListViewColumnsVar, zeroBSCRMJS_updateListViewColumns,
		zeroBSCRMJS_retrieveListViewData, zeroBSCRMJS_listViewLang,
		zeroBSCRMJS_listViewIco, zeroBSCRMJS_drawListView,
		jpcrm_update_listview_counts, jpcrm_update_listview_pagination,
		jpcrm_listview_header,
		jpcrm_listview_table_header, zeroBSCRMJS_listViewLine,
		zeroBSCRMJS_listViewBinds,
		zeroBSCRMJS_listView_bulkActionsUpdate, zeroBSCRMJS_enactBulkAction,
		zeroBSCRMJS_listView_bulkActionsGetChecked,
		zeroBSCRMJS_listView_bulkActionsGetCheckedIncNames,
		zeroBSCRMJS_listView_editURL, zeroBSCRMJS_listView_viewURL,
		zeroBSCRMJS_listView_viewURL_customer, zeroBSCRMJS_listView_viewURL_company,
		zeroBSCRMJS_listView_emailURL_contact, zeroBSCRMJS_listView_url_export_segment,
		zeroBSCRMJS_listView_draw_totals_tables,
		zeroBSCRMJS_listView_generic_bulkActionFire_addtag,
		zeroBSCRMJS_listView_generic_bulkActionFire_removetag,
		zeroBSCRMJS_listView_generic_bulkActionFire_export,
		zeroBSCRMJS_listView_generic_bulkActionTitle_addtag,
		zeroBSCRMJS_listView_generic_bulkActionTitle_removetag,
		zeroBSCRMJS_listView_generic_bulkActionTitle_export,
		zeroBSCRMJS_listView_customer_bulkActionTitle_delete,
		zeroBSCRMJS_listView_customer_bulkActionTitle_changestatus,
		zeroBSCRMJS_listView_customer_bulkActionTitle_merge,
		zeroBSCRMJS_listView_customer_id,
		zeroBSCRMJS_listView_customer_bulkActionFire_changestatus,
		zeroBSCRMJS_listView_customer_bulkActionFire_delete,
		zeroBSCRMJS_listView_customer_bulkActionFire_merge,
		zeroBSCRMJS_listView_generic_id, zeroBSCRMJS_listView_generic_status,
		zeroBSCRMJS_listView_generic_added, zeroBSCRMJS_listView_generic_lastupdated,
		zeroBSCRMJS_listView_generic_name, zeroBSCRMJS_listView_generic_nameavatar,
		zeroBSCRMJS_listView_generic_company, zeroBSCRMJS_listView_generic_customer,
		zeroBSCRMJS_listView_generic_customeremail,
		zeroBSCRMJS_listView_generic_assigned, zeroBSCRMJS_listView_generic_assignedobj,
		zeroBSCRMJS_listView_generic_latestlog,
		zeroBSCRMJS_listView_generic_lastcontacted, zeroBSCRMJS_listView_generic_tagged,
		zeroBSCRMJS_listView_generic_hasquote, zeroBSCRMJS_listView_generic_hasinvoice,
		zeroBSCRMJS_listView_generic_hastransaction,
		zeroBSCRMJS_listView_generic_quotecount,
		zeroBSCRMJS_listView_generic_invoicecount,
		zeroBSCRMJS_listView_generic_transactioncount,
		zeroBSCRMJS_listView_generic_quotetotal,
		zeroBSCRMJS_listView_generic_invoicetotal,
		zeroBSCRMJS_listView_generic_transactiontotal,
		zeroBSCRMJS_listView_generic_editlink,
		zeroBSCRMJS_listView_generic_editdirectlink,
		zeroBSCRMJS_listView_generic_viewlink, zeroBSCRMJS_listView_generic_phonelink,
		zeroBSCRMJS_listView_customer_secaddr1, zeroBSCRMJS_listView_customer_secaddr2,
		zeroBSCRMJS_listView_customer_seccity, zeroBSCRMJS_listView_customer_seccounty,
		zeroBSCRMJS_listView_customer_secpostcode,
		zeroBSCRMJS_listView_customer_seccountry, zeroBSCRMJS_listView_customer_added,
		zeroBSCRMJS_listView_customer_totalvalue, zeroBSCRMJS_listView_customer_name,
		zeroBSCRMJS_listView_customer_fname, zeroBSCRMJS_listView_customer_lname,
		zeroBSCRMJS_listView_customer_nameavatar,
		zeroBSCRMJS_listView_customer_assigned, zeroBSCRMJS_listView_customer_latestlog,
		zeroBSCRMJS_listView_customer_tagged, zeroBSCRMJS_listView_customer_editlink,
		zeroBSCRMJS_listView_customer_editdirectlink,
		zeroBSCRMJS_listView_customer_phonelink, zbsIdentify,
		zeroBSCRMJS_listView_segment_bulkActionTitle_delete,
		zeroBSCRMJS_listView_segment_bulkActionFire_delete,
		zeroBSCRMJS_listView_segment_id, zeroBSCRMJS_listView_segment_added,
		zeroBSCRMJS_listView_segment_name, zeroBSCRMJS_listView_segment_audiencecount,
		zeroBSCRMJS_listView_segment_action, zeroBSCRMJS_listView_quotetemplate_id,
		zeroBSCRMJS_listView_quotetemplate_title,
		zeroBSCRMJS_listView_quotetemplate_action, zeroBSCRMJS_listView_company_coname,
		zeroBSCRMJS_listView_company_name, zeroBSCRMJS_listView_company_nameavatar,
		zeroBSCRMJS_listView_company_secaddr1, zeroBSCRMJS_listView_company_secaddr2,
		zeroBSCRMJS_listView_company_seccity, zeroBSCRMJS_listView_company_seccounty,
		zeroBSCRMJS_listView_company_secpostcode,
		zeroBSCRMJS_listView_company_seccountry,
		zeroBSCRMJS_listView_company_transactioncount,
		zeroBSCRMJS_listView_company_transactiontotal,
		zeroBSCRMJS_listView_company_phonelink,
		zeroBSCRMJS_listView_company_bulkActionTitle_delete,
		zeroBSCRMJS_listView_company_bulkActionTitle_addtag,
		zeroBSCRMJS_listView_company_bulkActionTitle_removetag,
		zeroBSCRMJS_listView_company_bulkActionTitle_export,
		zeroBSCRMJS_listView_company_bulkActionFire_delete,
		zeroBSCRMJS_listView_company_bulkActionFire_addtag,
		zeroBSCRMJS_listView_company_bulkActionFire_removetag,
		zeroBSCRMJS_listView_quote_title,
		zeroBSCRMJS_listView_quote_value, zeroBSCRMJS_listView_quote_status,
		zeroBSCRMJS_listView_quote_date,
		zeroBSCRMJS_listView_quote_bulkActionTitle_markaccepted,
		zeroBSCRMJS_listView_quote_bulkActionTitle_markunaccepted,
		zeroBSCRMJS_listView_quote_bulkActionTitle_delete,
		zeroBSCRMJS_listView_quote_bulkActionTitle_export,
		zeroBSCRMJS_listView_quote_bulkActionFire_markaccepted,
		zeroBSCRMJS_listView_quote_bulkActionFire_markunaccepted,
		zeroBSCRMJS_listView_quote_bulkActionFire_delete,
		zeroBSCRMJS_listView_quotetemplate_bulkActionTitle_delete,
		zeroBSCRMJS_listView_quotetemplate_bulkActionFire_delete,
		zeroBSCRMJS_listView_invoice_bulkActionTitle_delete,
		zeroBSCRMJS_listView_invoice_bulkActionTitle_export,
		zeroBSCRMJS_listView_invoice_no, zeroBSCRMJS_listView_invoice_date,
		zeroBSCRMJS_listView_invoice_due, zeroBSCRMJS_listView_invoice_ref,
		zeroBSCRMJS_listView_invoice_val, zeroBSCRMJS_listView_invoice_value,
		zeroBSCRMJS_listView_invoice_status,
		zeroBSCRMJS_listView_invoice_bulkActionTitle_changestatus,
		zeroBSCRMJS_listView_invoice_bulkActionFire_changestatus,
		zeroBSCRMJS_listView_invoice_bulkActionFire_delete,
		zeroBSCRMJS_listView_transaction_id, zeroBSCRMJS_listView_transaction_item,
		zeroBSCRMJS_listView_transaction_title,
		zeroBSCRMJS_listView_transaction_orderid,
		zeroBSCRMJS_listView_transaction_total, zeroBSCRMJS_listView_transaction_status,
		zeroBSCRMJS_listView_transaction_date,
		zeroBSCRMJS_listView_transaction_date_paid,
		zeroBSCRMJS_listView_transaction_date_completed,
		zeroBSCRMJS_listView_transaction_external_source,
		zeroBSCRMJS_listView_transaction_bulkActionTitle_delete,
		zeroBSCRMJS_listView_transaction_bulkActionTitle_addtag,
		zeroBSCRMJS_listView_transaction_bulkActionTitle_removetag,
		zeroBSCRMJS_listView_transaction_bulkActionTitle_export,
		zeroBSCRMJS_listView_transaction_bulkActionFire_delete,
		zeroBSCRMJS_listView_transaction_bulkActionFire_addtag,
		zeroBSCRMJS_listView_transaction_bulkActionFire_removetag,
		zeroBSCRMJS_listView_form_id, zeroBSCRMJS_listView_form_title,
		zeroBSCRMJS_listView_form_style,
		zeroBSCRMJS_listView_form_bulkActionTitle_delete,
		zeroBSCRMJS_listView_form_bulkActionFire_delete, zeroBSCRMJS_listView_event_id,
		zeroBSCRMJS_listView_event_title, zeroBSCRMJS_listView_event_desc,
		zeroBSCRMJS_listView_event_start, zeroBSCRMJS_listView_event_end,
		zeroBSCRMJS_listView_event_remind, zeroBSCRMJS_listView_event_showcal,
		zeroBSCRMJS_listView_event_showportal, zeroBSCRMJS_listView_event_contact,
		zeroBSCRMJS_listView_event_company, zeroBSCRMJS_listView_event_action,
		zeroBSCRMJS_listView_event_status,
		zeroBSCRMJS_listView_event_bulkActionTitle_delete,
		zeroBSCRMJS_listView_event_bulkActionTitle_markcomplete,
		zeroBSCRMJS_listView_event_bulkActionTitle_markincomplete,
		zeroBSCRMJS_listView_event_bulkActionFire_delete,
		zeroBSCRMJS_listView_event_bulkActionFire_markcomplete,
		zeroBSCRMJS_listView_event_bulkActionFire_markincomplete,
		zeroBSCRMJS_logTypeStr, zeroBSCRMJS_bindInlineEditing,
		zeroBSCRMJS_listView_tdAttr, zeroBSCRMJS_listView_bindInlineEditSave,
		zeroBSCRMJS_listView_saveInlineEdit,
		zeroBSCRMJS_listView_customer_edit_status,
		zeroBSCRMJS_listView_generic_edit_assigned, jpcrm_get_contact_meta,
		jpcrm_add_listview_filter, jpcrm_remove_listview_filter, jpcrm_do_search_filter, jpcrm_change_sort
	};
}
