/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 * V2.52+
 *
 * Copyright 2020 Automattic
 *
 * Date: 02/03/18
 */

jQuery( function () {} );
// draw init tags
/**
 *
 */
function zeroBSCRMJS_buildTags() {
	if ( typeof window.zbsCRMJS_currentTags === 'object' ) {
		jQuery.each( window.zbsCRMJS_currentTags, function ( ind, ele ) {
			/* Simplified for now, just str arr
        // db2 support legacy
        var tagid = -1;
        if (typeof ele.term_id != "undefined") tagid = ele.term_id;
        if (typeof ele.id != "undefined") tagid = ele.id;

        zbsJS_drawTag(ele.name,tagid); */

			// on tag manager, we don't want to draw them :)
			if ( typeof window.zbsDontDrawTags === 'undefined' ) {
				zbsJS_drawTag( ele, -1 );
			}
		} );
	}

	setTimeout( function () {
		if ( typeof window.zbsCustomTagInitFunc === 'undefined' ) {
			// Generic
			zbsJS_bindTagsInit();
		} else {
			window[ zbsCustomTagInitFunc ]( {} );
		}
	}, 0 );
}

// dumps window obj into input :) for post
/**
 *
 */
function zeroBSCRMJS_buildTagsInput() {
	var finalVal = JSON.stringify( window.zbsCRMJS_currentTags );

	jQuery( '#zbs-tag-list' ).val( finalVal );
}

/**
 * @param tagStr
 * @param tagID
 */
function zbsJS_drawTag( tagStr, tagID ) {
	var html =
		'<div class="ui small basic label black" data-id="' +
		tagID +
		'"><i class="window close icon zbs-remove-tag"></i> <span>' +
		tagStr +
		'</span></div>';

	jQuery( '#zbs-tags-wrap' ).append( html );

	setTimeout( function () {
		zbsJS_bindTags();
	}, 0 );
}

/**
 *
 */
function zbsJS_bindTags() {
	// remove tag
	jQuery( '.zbs-remove-tag' )
		.off( 'click' )
		.on( 'click', function () {
			// get val
			var val = jQuery( 'span', jQuery( this ).parent() ).html();

			// remove from array (select everything except it)
			var index = window.zbsCRMJS_currentTags.indexOf( val );
			if ( index > -1 ) {
				window.zbsCRMJS_currentTags.splice( index, 1 );
			}

			// remove from UI
			jQuery( this ).parent().remove();

			// set page as dirtied
			zbscrm_JS_addDirty( 'zbs-tags' );
		} );
}

// This is the GENERIC tags init, if is custom (E.g. Tag manager page), it uses custom init funcs :) see zbsJS_bindTagManagerInit
/**
 *
 */
function zbsJS_bindTagsInit() {
	/* THIS IS independent of 'contacts' - just works for all tag boxes :) */
	// add tags
	jQuery( '#zbs-add-tag-action' )
		.off( 'click' )
		.on( 'click', function () {
			zbsJS_addTagAction( jQuery( '#zbs-add-tag-value' ).val() );
		} );

	// add tag return key
	jQuery( '#zbs-add-tag-value' ).on( 'keypress', function ( event ) {
		if ( event.keyCode == 13 ) {
			// old way
			//jQuery('#zbs-add-tag-action').trigger( 'click' );
			//event.preventDefault();
			zbsJS_addTagAction( jQuery( '#zbs-add-tag-value' ).val() );
		}
	} );

	// show / hide suggestions
	jQuery( '#zbs-tag-suggestions-show-more' )
		.off( 'click' )
		.on( 'click', function () {
			// hide itself + show
			jQuery( '#zbs-tag-suggestions-show-more' ).hide();
			jQuery( '#zbs-tag-suggestions-more-wrap' ).show();
		} );
	jQuery( '#zbs-tag-suggestions-show-less' )
		.off( 'click' )
		.on( 'click', function () {
			// hide itself + show
			jQuery( '#zbs-tag-suggestions-show-more' ).show();
			jQuery( '#zbs-tag-suggestions-more-wrap' ).hide();
		} );
	// use a suggestion
	jQuery( '.zbsTagSuggestion' )
		.off( 'click' )
		.on( 'click', function () {
			zbsJS_addTagAction( jQuery( this ).html() );
		} );
}

/**
 * @param newTag
 */
function zbsJS_addTagAction( newTag ) {
	// debug console.log('adding tag',[newTag,window.zbsCRMJS_currentTags,jQuery.inArray(newTag,window.zbsCRMJS_currentTags)]);

	if ( newTag != '' && jQuery.inArray( newTag, window.zbsCRMJS_currentTags ) == -1 ) {
		// not already loaded, add
		zbsJS_drawTag( newTag, -1 );
		window.zbsCRMJS_currentTags.push( newTag );

		// remove from input
		jQuery( '#zbs-add-tag-value' ).val( '' );

		// set page as dirtied
		zbscrm_JS_addDirty( 'zbs-tags' );
	}
}

// This fires for tag management pages only ( e.g. wp-admin/admin.php?page=tag-manager&tagtype=contact )
/**
 *
 */
function zbsJS_bindTagManagerInit() {
	// edit
	zeroBSCRMJS_tagManager_bindTagEditButtons();

	/* THIS IS independent of 'contacts' - just works for all tag boxes :) */
	// add tags
	jQuery( '#zbs-add-tag-action' )
		.off( 'click' )
		.on( 'click', function () {
			var newTag = jQuery( '#zbs-add-tag-value' ).val();

			// debug console.log('adding tag',[newTag,window.zbsCRMJS_currentTags,jQuery.inArray(newTag,window.zbsCRMJS_currentTags)]);

			if ( newTag != '' && jQuery.inArray( newTag, window.zbsCRMJS_currentTags ) == -1 ) {
				// not already loaded, add
				zbsJS_addEmptyTag(
					newTag,
					function ( r ) {
						// added

						// local
						var ltag = newTag;
						var newTagID = -1;
						if ( typeof r.id !== 'undefined' ) {
							newTagID = r.id;
						}
						var newTagSlug = ltag;
						if ( typeof r.slug !== 'undefined' ) {
							newTagSlug = r.slug;
						}

						// add to local var
						window.zbsCRMJS_currentTags.push( ltag );

						// remove 'no tags' msg if present
						jQuery( '#zbsNoTagResults' ).hide();

						// remove from input
						jQuery( '#zbs-add-tag-value' ).val( '' );

						// add to table
						var tagTR =
							'<tr><td><span class="ui large label">' +
							ltag +
							'</span></td><td>' +
							newTagSlug +
							'</td><td class="center aligned">0</td><td class="center aligned"><button type="button" class="ui mini button black zbs-delete-tag" data-tagid="' +
							newTagID +
							'"><i class="trash alternate icon"></i> ' +
							window.zbsTagListLang.delete +
							'</button></td></tr>';
						jQuery( '#zbs-tag-manager tbody' ).append( tagTR );

						// rebind
						setTimeout( function () {
							zeroBSCRMJS_tagManager_bindTagEditButtons();
						}, 0 );
					},
					function ( r ) {
						// failed
					}
				);
			} else {
				// polite messages
				if ( newTag == '' ) {
					// empty
					jQuery( '#zbsTagEmpty' ).show().css( 'margin-bottom', '1em' );
					setTimeout( function () {
						jQuery( '#zbsTagEmpty' ).hide();
					}, 4000 );
				} else {
					// already exists
					jQuery( '#zbsTagAlreadyExists' ).show().css( 'margin-bottom', '1em' );
					setTimeout( function () {
						jQuery( '#zbsTagAlreadyExists' ).hide();
					}, 4000 );
				}
			}
		} );

	// add tag return key
	jQuery( '#zbs-add-tag-value' ).on( 'keypress', function ( event ) {
		if ( event.keyCode == 13 ) {
			jQuery( '#zbs-add-tag-action' ).trigger( 'click' );
			event.preventDefault();
		}
	} );
}

var zbsTagManagerUpdateAJAXBlocker = false;
/**
 * @param tagStr
 * @param successcb
 * @param errcb
 */
function zbsJS_addEmptyTag( tagStr, successcb, errcb ) {
	if ( ! window.zbsTagManagerUpdateAJAXBlocker ) {
		// set blocker
		window.zbsTagManagerUpdateAJAXBlocker = true;

		// postbag!
		var data = {
			action: 'zbs_add_tag',
			sec: window.zbscrmjs_secToken,
			objtype: window.zbsEditSettings.objdbname,
			tag: tagStr,
		};

		// Send
		jQuery.ajax( {
			type: 'POST',
			url: ajaxurl, // admin side is just ajaxurl not wptbpAJAX.ajaxurl,
			data: data,
			dataType: 'json',
			timeout: 20000,
			success: function ( response ) {
				// temp debug
				// debug  console.log("Data update: ",response);

				// any success callback?
				if ( typeof successcb === 'function' ) {
					successcb( response );
				}

				// unset blocker
				window.zbsTagManagerUpdateAJAXBlocker = false;
			},
			error: function ( response ) {
				// temp debug console.error("Error: ",response);

				// any error callback?
				if ( typeof errcb === 'function' ) {
					errcb( response );
				}

				// unset blocker
				window.zbsTagManagerUpdateAJAXBlocker = false;
			},
		} );
	} // / not blocked
}

// delete
/**
 *
 */
function zeroBSCRMJS_tagManager_bindTagEditButtons() {
	jQuery( '.zbs-delete-tag' )
		.off( 'click' )
		.on( 'click', function () {
			var tagID = parseInt( jQuery( this ).attr( 'data-tagid' ) );

			if ( tagID > 0 ) {
				swal( {
					title: window.zbsTagListLang.deleteswaltitle,
					text: window.zbsTagListLang.deleteswaltext,
					type: 'warning',
					showCancelButton: true,
					confirmButtonColor: '#000',
					cancelButtonColor: '#fff',
					cancelButtonText: '<span style="color: #000">Cancel</span>',
					confirmButtonText: window.zbsTagListLang.deleteswalconfirm,
					allowOutsideClick: false,
				} ).then( function ( result ) {
					if ( result.value ) {
						// ajax remove
						var lTagID = tagID;

						var data = {
							action: 'zbs_delete_tag',
							// don't need, is unique id 'objtype': <?php echo $this->typeInt; ?>,
							tagid: lTagID,
							sec: window.zbscrmjs_secToken,
						};

						// Send it Pat :D
						jQuery.ajax( {
							type: 'POST',
							url: ajaxurl,
							data: data,
							dataType: 'json',
							timeout: 20000,
							success: function ( response ) {
								swal(
									window.zbsTagListLang.tagdeleted,
									window.zbsTagListLang.tagremoved,
									'success'
								);

								// reload page
								location.reload();
							},
							error: function ( response ) {
								swal(
									window.zbsTagListLang.tagnotdeleted,
									window.zbsTagListLang.tagnotremoved,
									'warning'
								);
							},
						} );
					}
				} );
			}
		} );
}

if ( typeof module !== 'undefined' ) {
    module.exports = { zbsTagManagerUpdateAJAXBlocker, zeroBSCRMJS_buildTags,
		zeroBSCRMJS_buildTagsInput, zbsJS_drawTag, zbsJS_bindTags, zbsJS_bindTagsInit,
		zbsJS_addTagAction, zbsJS_bindTagManagerInit, zbsJS_addEmptyTag,
		zeroBSCRMJS_tagManager_bindTagEditButtons };
}
