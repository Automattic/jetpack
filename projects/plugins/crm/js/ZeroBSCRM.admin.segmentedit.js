/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 */

jQuery( function () {
	// build out initial
	zeroBSCRMJS_segment_buildConditions();

	// bind post-render
	setTimeout( function () {
		zeroBSCRMJS_segment_bindPostRender();
	}, 0 );
} );

/**
 *
 */
function zeroBSCRMJS_segment_bindPostRender() {
	// on change of type, rebuild line
	jQuery( '.zbs-segment-edit-var-condition-type' )
		.off( 'change' )
		.on( 'change', function () {
			// which to update? (this stops this updating all the other lines)
			jQuery( this ).closest( '.zbs-segment-edit-condition' ).addClass( 'dirty' );

			// set cascading options
			zeroBSCRMJS_segment_buildConditionCascades();
		} );

	// on change of type, rebuild line
	jQuery( '.zbs-segment-edit-var-condition-operator' )
		.off( 'change' )
		.on( 'change', function () {
			// which to update? (this stops this updating all the other lines)
			jQuery( this ).closest( '.zbs-segment-edit-condition' ).addClass( 'dirty' );

			// set cascading options
			zeroBSCRMJS_segment_buildConditionCascades2();
		} );

	jQuery( '#zbs-segment-edit-act-add-condition' )
		.off( 'click' )
		.on( 'click', function () {
			// add an empty
			var html = zeroBSCRMJS_segment_buildConditionLine( false );

			// set it
			jQuery( '#zbs-segment-edit-conditions' ).append( html );

			// build cascading options (post render)
			setTimeout( function () {
				// which to update? (this stops this updating all the other lines) - it'll be the last, as was just added
				jQuery( '.zbs-segment-edit-condition' ).last().addClass( 'dirty' );

				// .. which in turn builds its own cascading value...
				zeroBSCRMJS_segment_buildConditionCascades();

				// bind post-render
				setTimeout( function () {
					zeroBSCRMJS_segment_bindPostRender();
				}, 0 );
			}, 0 );
		} );

	// remove conditions
	jQuery( '.zbs-segment-edit-condition-remove' )
		.off( 'click' )
		.on( 'click', function () {
			// if more than 1 left...
			if ( jQuery( '.zbs-segment-edit-condition' ).length > 1 ) {
				jQuery( this ).closest( '.zbs-segment-edit-condition' ).remove();
			} else {
				// show notice
				jQuery( '#zbs-segment-edit-conditions-err' ).show();

				// hide in 2 s
				setTimeout( function () {
					jQuery( '#zbs-segment-edit-conditions-err' ).hide();
				}, 1800 );
			}
		} );

	// hover over remove
	jQuery( '.zbs-segment-edit-condition-remove' )
		.off( 'hover' )
		.on( 'mouseenter', function () {
			jQuery( this ).addClass( 'orange' );
		} )
		.on( 'mouseleave', function () {
			jQuery( this ).removeClass( 'orange' );
		} );

	// preview audience / continue
	jQuery( '#zbs-segment-edit-act-p2preview' )
		.off( 'click' )
		.on( 'click', function () {
			zeroBSCRMJS_segment_previewAudience();
		} );

	// save segment
	jQuery( '#zbs-segment-edit-act-p2submit, #zbs-segment-edit-act-save' )
		.off( 'click' )
		.on( 'click', function () {
			zeroBSCRMJS_segment_saveSegmentAct();
		} );

	// back to segment list
	jQuery( '#zbs-segment-edit-act-back' )
		.off( 'click' )
		.on( 'click', function () {
			// what if not saved? :o
			window.location = window.zbsSegmentListURL;
		} );

	// build descriptions: show
	jQuery( '.jpcrm-expand-info' )
		.off( 'click' )
		.on( 'click', function () {
			jpcrm_js_show_condition_info( this );
		} );

	// build descriptions: hide
	jQuery( '.jpcrm-hide-info' )
		.off( 'click' )
		.on( 'click', function () {
			jpcrm_js_hide_condition_info( this );
		} );

	// (re)build descriptions: select change (fires after all cascade rebuilds)
	jQuery( '.zbs-segment-edit-condition' ).each( function ( ind, ele ) {
		if ( jQuery( ele ).hasClass( 'description-hidden' ) ) {
			jpcrm_js_hide_condition_info( jQuery( '.jpcrm-condition-info', jQuery( ele ) ) );
		} else {
			jpcrm_js_show_condition_info( jQuery( '.jpcrm-condition-info', jQuery( ele ) ) );
		}
	} );
}

/*
 * Builds the segment editor condition lines
 * (based on window.zbsSegment obj)
 */
/**
 *
 */
function zeroBSCRMJS_segment_buildConditions() {
	// build html
	var html = '';

	// build any existing (rules)
	if (
		typeof window.zbsSegment !== 'undefined' &&
		typeof window.zbsSegment.conditions !== 'undefined'
	) {
		jQuery.each( window.zbsSegment.conditions, function ( ind, ele ) {
			html += zeroBSCRMJS_segment_buildConditionLine( ele );
		} );
	} else {
		// add an empty
		html += zeroBSCRMJS_segment_buildConditionLine( false );
	}

	// set it
	jQuery( '#zbs-segment-edit-conditions' ).append( html );

	// build cascading options (post render)
	setTimeout( function () {
		// this'll build ALL :)
		jQuery( '.zbs-segment-edit-condition' ).addClass( 'dirty' );

		// .. which in turn builds its own cascading value...
		zeroBSCRMJS_segment_buildConditionCascades( jQuery( '#zbs-segment-edit-conditions' ) );
	}, 0 );
}

// builds out a condition/rule line
/**
 * @param rule
 */
function zeroBSCRMJS_segment_buildConditionLine( rule ) {
	var html = '<div class="zbs-segment-edit-condition ui corner labeled segment description-hidden"';
	// for existing
	if ( typeof rule !== 'undefined' && rule !== false ) {
		if ( typeof rule.id !== 'undefined' ) {
			html += ' id="zbs-segment-edit-condition-' + rule.id + '"';
		}
		if ( typeof rule.operator !== 'undefined' ) {
			html += ' data-orig-operator="' + rule.operator + '"';
		}

		// these are 'parsed' (e.g. dates)
		//if (typeof rule.value != "undefined") html += ' data-orig-value="' + rule.value + '"';
		//if (typeof rule.value2 != "undefined") html += ' data-orig-value2="' + rule.value2 + '"';
		if ( typeof rule.valueconv !== 'undefined' ) {
			html += ' data-orig-value="' + jpcrm.esc_attr( rule.valueconv ) + '"';
		}
		if ( typeof rule.value2conv !== 'undefined' ) {
			html += ' data-orig-value2="' + jpcrm.esc_attr( rule.value2conv ) + '"';
		}
	}
	html += '>';

	// add remove label
	html +=
		'<div class="ui corner label zbs-segment-edit-condition-remove"><i class="remove icon"></i></div>';

	// add info expand icons
	html +=
		'<i class="caret up icon jpcrm-hide-info hidden"></i><i class="info circle icon jpcrm-expand-info"></i>';

	// if rule == false it's an empty new one

	// condition selector
	if ( typeof window.jpcrm_available_conditions !== 'undefined' ) {
		// shim for backward compatibility with Advanced segments < v1.8
		var rule_type = '';
		if ( rule.type ) {
			rule_type = rule.type;
			if ( rule_type.startsWith( 'zbsc_' ) ) {
				rule_type = rule_type.substr( 5 );
			}
		}

		// check type of condition is available
		// (e.g. catch adv segments condition type in existing segment, but no adv segments)
		if (
			rule !== false &&
			typeof window.jpcrm_available_conditions !== 'undefined' &&
			typeof window.jpcrm_available_conditions[ rule.type ] === 'undefined' &&
			typeof window.jpcrm_available_conditions[ rule_type ] === 'undefined'
		) {
			// has condition not currently supported.
			// add in as a 'disabled' option (so saving doesn't remove it, but user can remove it/not edit it)
			html +=
				'<i class="red exclamation triangle icon"></i> <input type="text" disabled="disabled" class="zbs-segment-edit-var-condition-type" value="' +
				rule.type +
				'" />';
		} else {
			// rule is of acceptable type (or a new line)

			// type e.g. STATUS
			html += '<select class="zbs-segment-edit-var-condition-type">';

			var current_category = '';

			// each category
			jQuery.each( window.jpcrm_available_conditions_by_category, function ( index, category ) {
				var category_key = category.key;

				if (
					typeof category.conditions !== 'undefined' &&
					Object.keys( category.conditions ).length > 0
				) {
					if ( category_key != current_category ) {
						html += '<optgroup label="' + jpcrm.esc_attr( category.name ) + '">';

						current_category = category_key;
					}

					// first reorganise category conditions
					var ordered_conditions = category.conditions.sort( jpcrm_js_compare_conditions );

					// cycle through conditions in category
					jQuery.each( ordered_conditions, function ( condition_key, condition ) {
						html += '<option value="' + jpcrm.esc_attr( condition.fieldname ) + '"';
						if (
							rule_type == condition.fieldname ||
							( rule.type && rule.type == condition.fieldname ) ||
							'zbsc_' + rule_type == condition.fieldname
						) {
							html += ' selected="selected"';
						}
						html += '>' + jpcrm.esc_html( condition.name ) + '</option>';
					} );

					// close it out
					html += '</optgroup>';
				}
			} );

			/* dropping 'generic' in favour of opt groups
				// in end do this in 2 - generics/non generics (easier to seperate)
				var isGeneric = false;

					// non generic
					jQuery.each(window.jpcrm_available_conditions,function(ind,ele){

						if (typeof ele.generic == "undefined"){
							html += '<option value="' + ind + '"';
							if (typeof rule != "undefined" && rule !== false && typeof rule.type != "undefined" && rule.type == ind) html += ' selected="selected"';
							html += '>' + ele.name + '</option>';
						} else isGeneric = true;

					});

					// generic
					if (isGeneric){

						html += '<optgroup label="' + window.zbsSegmentLang.contactfields + '">';

						jQuery.each(window.jpcrm_available_conditions,function(ind,ele){

							if (typeof ele.generic != "undefined"){
								html += '<option value="' + ind + '"';
								if (typeof rule != "undefined" && rule !== false && typeof rule.type != "undefined" && rule.type == ind) html += ' selected="selected"';
								html += '>' + ele.name + '</option>';
							}

						});

						// close it out
						html += '</optgroup>';

					}

*/

			html += '</select>';

			// Operator e.g. = (this'll be built based on first, post render :)

			// Value e.g. 123 (this'll be built based on first, post render :)
		}
	}

	// condition info holder
	html += '<div class="jpcrm-condition-info hidden"></div>';

	html += '</div>';

	return html;
}

// cycle through each condition + build out their "casacde" options
/**
 *
 */
function zeroBSCRMJS_segment_buildConditionCascades() {
	jQuery( '.zbs-segment-edit-condition.dirty' ).each( function ( ind, ele ) {
		zeroBSCRMJS_segment_buildConditionCascadesForEle( ele );
	} );

	// build cascading options (post render)
	setTimeout( function () {
		// .. which in turn builds its own cascading value...
		zeroBSCRMJS_segment_buildConditionCascades2();
	}, 0 );
}

// for each condition + build out their "casacde" options
/**
 * @param ele
 */
function zeroBSCRMJS_segment_buildConditionCascadesForEle( ele ) {
	// what's selected?
	var selected = jQuery( '.zbs-segment-edit-var-condition-type', jQuery( ele ) ).val();

	if ( typeof selected !== 'undefined' ) {
		// clear existing + start html
		jQuery( '.zbs-segment-edit-var-condition-operator', jQuery( ele ) ).remove();
		jQuery( '.jpcrm-condition-info', jQuery( ele ) ).remove();
		var html = '';

		// shim for backward compatibility with Advanced segments < v1.8
		if ( selected.startsWith( 'zbsc_' ) ) {
			selected = selected.substr( 5 );
		}

		// appropriate operator
		if ( typeof window.jpcrm_available_conditions[ selected ] !== 'undefined' ) {
			if (
				typeof window.jpcrm_available_conditions[ selected ].operators !== 'undefined' &&
				window.jpcrm_available_conditions[ selected ].operators.length > 0 &&
				window.jpcrm_available_conditions[ selected ].operators[ 0 ] != 'tag' &&
				window.jpcrm_available_conditions[ selected ].operators[ 0 ] != 'tag_transaction' &&
				window.jpcrm_available_conditions[ selected ].operators[ 0 ] != 'extsource' &&
				window.jpcrm_available_conditions[ selected ].operators[ 0 ] != 'mailpoet_status'
			) {
				// get orig if building from scratch
				var origVal = '';
				if ( typeof jQuery( ele ).attr( 'data-orig-operator' ) !== 'undefined' ) {
					origVal = jQuery( ele ).attr( 'data-orig-operator' );
				}

				// build select for each
				html += '<select class="zbs-segment-edit-var-condition-operator">';
				jQuery.each(
					window.jpcrm_available_conditions[ selected ].operators,
					function ( ind2, ele2 ) {
						html += '<option value="' + ele2 + '"';
						// needs to check if setting
						//if (typeof rule != "undefined" && rule !== false && typeof rule.type != "undefined" && rule.type == ind) html += ' selected="selected"';
						if ( ele2 == origVal ) {
							html += ' selected="selected"';
						}
						html += '>' + window.zbsAvailableConditionOperators[ ele2 ].name + '</option>';
					}
				);
				html += '</select>';
			} else {
				// is tagged, or ext source? pass hidden input
				if (
					window.jpcrm_available_conditions[ selected ].operators[ 0 ] == 'tag' ||
					window.jpcrm_available_conditions[ selected ].operators[ 0 ] == 'tag_transaction' ||
					window.jpcrm_available_conditions[ selected ].operators[ 0 ] == 'extsource' ||
					window.jpcrm_available_conditions[ selected ].operators[ 0 ] == 'mailpoet_status'
				) {
					html +=
						'<input type="hidden" class="zbs-segment-edit-var-condition-operator" value="' +
						window.jpcrm_available_conditions[ selected ].operators[ 0 ] +
						'" />';
				}
			}
		} else {
			// get original value
			var original_value = '';
			if ( typeof jQuery( ele ).attr( 'data-orig-operator' ) !== 'undefined' ) {
				original_value = jQuery( ele ).attr( 'data-orig-operator' );
			}

			// add in as a 'disabled' option (so saving doesn't remove it, but user can remove it/not edit it)
			html +=
				'<input type="text" disabled="disabled" class="zbs-segment-edit-var-condition-operator segment-condition-errored" value="' +
				original_value +
				'" />';
		}

		// appropriate value selector

		// append
		jQuery( ele ).append( html );

		// mark clean
		// actually leave that for cascade 2 jQuery(ele).removeClass('dirty');
	}
}

// cycle through each operator + build out their "cascade" value
/**
 *
 */
function zeroBSCRMJS_segment_buildConditionCascades2() {
	jQuery( '.zbs-segment-edit-condition.dirty' ).each( function ( ind, ele ) {
		// what's selected?
		var selected = jQuery( '.zbs-segment-edit-var-condition-operator', jQuery( ele ) ).val();
		var typeselected = jQuery( '.zbs-segment-edit-var-condition-type', jQuery( ele ) ).val();

		// shim for backward compatibility with Advanced segments < v1.8
		if ( typeselected && typeselected.startsWith( 'zbsc_' ) ) {
			typeselected = typeselected.substr( 5 );
		}

		if ( typeof selected !== 'undefined' ) {
			// clear existing + start html
			jQuery(
				'.zbs-segment-edit-var-condition-value, .zbs-segment-edit-var-condition-value-2, span',
				jQuery( ele )
			).remove();
			jQuery( '.jpcrm-condition-info', jQuery( ele ) ).remove();
			var html = '';
			var inputmask_class = '';

			// attempt to discern any passed `inputmask` (note that int + float obvious fields already automatically input mask)
			if (
				window.jpcrm_available_conditions[ typeselected ] &&
				window.jpcrm_available_conditions[ typeselected ].inputmask
			) {
				// e.g. jpcrm-inputmask-int
				inputmask_class =
					' jpcrm-inputmask-' + window.jpcrm_available_conditions[ typeselected ].inputmask;
			}

			// allows injection on edit page (if injected, then remove after inserted/loaded)
			var v = '',
				v2 = '';
			if ( typeof jQuery( ele ).attr( 'data-orig-value' ) !== 'undefined' ) {
				v = jQuery( ele ).attr( 'data-orig-value' );
			}
			if ( typeof jQuery( ele ).attr( 'data-orig-value2' ) !== 'undefined' ) {
				v2 = jQuery( ele ).attr( 'data-orig-value2' );
			}

			// appropriate value selector
			switch ( selected ) {
				// these two, the operator is the value, in a way, is a backward way of doing this, but
				// only used for hypo for now... value ignored, operator used to filter
				case 'istrue':
				case 'isfalse':
					html += '<input type="hidden" class="zbs-segment-edit-var-condition-value" value="1" />';

					break;

				case 'equal':
				case 'notequal':
					if ( typeselected == 'status' ) {
						// status ddl
						html += '<select class="zbs-segment-edit-var-condition-value">';

						if (
							typeof window.zbsAvailableStatuses !== 'undefined' &&
							window.zbsAvailableStatuses.length > 0
						) {
							jQuery.each( window.zbsAvailableStatuses, function ( ind2, ele2 ) {
								html += '<option value="' + ele2 + '"';
								if ( v == ele2 ) {
									html += ' selected="selected"';
								}
								html += '>' + ele2 + '</option>';
							} );
						} else {
							html += '<option value="">' + zeroBSCRMJS_segmentLang( 'nostatuses' ) + '</option>';
						}

						html += '</select>';
					} else {
						// other input
						html +=
							'<input type="text" class="zbs-segment-edit-var-condition-value' +
							inputmask_class +
							'" value="' +
							jpcrm.esc_attr( v ) +
							'" />';
					}

					break;

				case 'contains':
				case 'doesnotcontain':
					html +=
						'<input type="text" class="zbs-segment-edit-var-condition-value' +
						inputmask_class +
						'" value="' +
						jpcrm.esc_attr( v ) +
						'" />';

					break;

				case 'larger':
				case 'less':
				case 'largerequal':
				case 'lessequal':
				case 'nextdays':
				case 'previousdays':
					html +=
						'<input type="text" class="zbs-segment-edit-var-condition-value jpcrm-inputmask-int" value="' +
						jpcrm.esc_attr( v ) +
						'" />';

					break;

				case 'before':
				case 'after':
					html +=
						'<input type="text" class="jpcrm-date-time zbs-segment-edit-var-condition-value" data-date-picker-format="YYYY-MM-DD HH:mm" value="' +
						jpcrm.esc_attr( v ) +
						'" />';

					break;

				case 'beforeequal':
				case 'afterequal':
					html +=
						'<input type="text" class="jpcrm-date zbs-segment-edit-var-condition-value" data-date-picker-format="YYYY-MM-DD" value="' +
						jpcrm.esc_attr( v ) +
						'" />';

					break;

				case 'daterange':
					var date_value = '';
					if ( v !== '' && v2 !== '' ) {
						date_value = jpcrm.esc_attr( v ) + ' - ' + jpcrm.esc_attr( v2 );
					}

					html +=
						'<input type="text" class="jpcrm-date-range zbs-segment-edit-var-condition-value" data-date-picker-format="YYYY-MM-DD" value="' +
						date_value +
						'" />';

					break;

				case 'datetimerange':
					var date_value = '';
					if ( v !== '' && v2 !== '' ) {
						date_value = jpcrm.esc_attr( v ) + ' - ' + jpcrm.esc_attr( v2 );
					}

					html +=
						'<input type="text" class="jpcrm-datetime-range zbs-segment-edit-var-condition-value" data-date-picker-format="YYYY-MM-DD HH:mm" value="' +
						date_value +
						'" />';

					break;

				case 'floatrange':
					html +=
						'<input type="text" class="zbs-float zbs-segment-edit-var-condition-value zbs-segment-pair-input jpcrm-inputmask-float' +
						inputmask_class +
						'" value="' +
						jpcrm.esc_attr( v ) +
						'" placeholder="' +
						zeroBSCRMJS_segmentLang( 'eg' ) +
						' 0.00" />';
					html +=
						'<span>' +
						zeroBSCRMJS_segmentLang( 'to' ) +
						'</span><input type="text" class="zbs-float zbs-segment-edit-var-condition-value-2 zbs-segment-pair-input jpcrm-inputmask-float" value="' +
						jpcrm.esc_attr( v2 ) +
						'" placeholder="' +
						zeroBSCRMJS_segmentLang( 'eg' ) +
						' 100.00" />';

					break;

				case 'intrange':
					html +=
						'<input type="text" class="zbs-int zbs-segment-edit-var-condition-value zbs-segment-pair-input jpcrm-inputmask-int' +
						inputmask_class +
						'" value="' +
						jpcrm.esc_attr( v ) +
						'" placeholder="' +
						zeroBSCRMJS_segmentLang( 'eg' ) +
						' 0" />';
					html +=
						'<span>' +
						zeroBSCRMJS_segmentLang( 'to' ) +
						'</span><input type="text" class="zbs-int zbs-segment-edit-var-condition-value-2 zbs-segment-pair-input jpcrm-inputmask-int" value="' +
						jpcrm.esc_attr( v2 ) +
						'" placeholder="' +
						zeroBSCRMJS_segmentLang( 'eg' ) +
						' 100" />';

					break;

				case 'tag':
					// select of avail tags
					html += '<select class="zbs-segment-edit-var-condition-value">';

					if (
						typeof window.jpcrm_available_contact_tags !== 'undefined' &&
						window.jpcrm_available_contact_tags.length > 0
					) {
						jQuery.each( window.jpcrm_available_contact_tags, function ( ind2, ele2 ) {
							html += '<option value="' + ele2.id + '"';
							if ( v == ele2.id ) {
								html += ' selected="selected"';
							}
							html += '>' + ele2.name + '</option>';
						} );
					} else {
						html += '<option value="">' + zeroBSCRMJS_segmentLang( 'notags' ) + '</option>';
					}

					html += '</select>';

					break;

				// transaction tags
				case 'tag_transaction':
					// select of avail tags
					html += '<select class="zbs-segment-edit-var-condition-value">';

					if (
						typeof window.jpcrm_available_transaction_tags !== 'undefined' &&
						window.jpcrm_available_transaction_tags.length > 0
					) {
						jQuery.each( window.jpcrm_available_transaction_tags, function ( ind2, ele2 ) {
							html += '<option value="' + ele2.id + '"';
							if ( v == ele2.id ) {
								html += ' selected="selected"';
							}
							html += '>' + ele2.name + '</option>';
						} );
					} else {
						html += '<option value="">' + zeroBSCRMJS_segmentLang( 'notags' ) + '</option>';
					}

					html += '</select>';

					break;

				case 'extsource':
					// select of avail external sources
					html += '<select class="zbs-segment-edit-var-condition-value">';

					if (
						typeof window.jpcrm_external_source_list !== 'undefined' &&
						window.jpcrm_external_source_list.length > 0
					) {
						jQuery.each( window.jpcrm_external_source_list, function ( ind2, ele2 ) {
							html += '<option value="' + ele2.key + '"';
							if ( v == ele2.key ) {
								html += ' selected="selected"';
							}
							html += '>' + ele2.name + '</option>';
						} );
					} else {
						html += '<option value="">' + zeroBSCRMJS_segmentLang( 'noextsources' ) + '</option>';
					}

					html += '</select>';

					break;

				case 'mailpoet_status':
					// select of avail external sources
					html += '<select class="zbs-segment-edit-var-condition-value">';

					if ( window.jpcrm_mailpoet_status_list && window.jpcrm_mailpoet_status_list.length > 0 ) {
						for ( var i = 0; i < window.jpcrm_mailpoet_status_list.length; i++ ) {
							var cur_status = window.jpcrm_mailpoet_status_list[ i ];
							html +=
								'<option value="' +
								cur_status.key +
								'"' +
								( v === cur_status.key ? ' selected="selected"' : '' ) +
								'>' +
								cur_status.name +
								'</option>';
						}
					} else {
						html +=
							'<option value="">' + zeroBSCRMJS_segmentLang( 'no_mailpoet_statuses' ) + '</option>';
					}

					html += '</select>';

					break;
			}

			// potentially has condition not currently supported.
			if ( typeof window.jpcrm_available_conditions[ typeselected ] === 'undefined' ) {
				// add in as hidden values (so saving doesn't remove it, but user can remove it/not edit it)
				html =
					'<input type="hidden" class="zbs-segment-edit-var-condition-value" value="' + v + '" />';
				html +=
					'<input type="hidden" class="zbs-segment-edit-var-condition-value-2" value="' +
					v2 +
					'" />';

				// display a namesake
				var original_value = v;
				if ( v2 != '' ) {
					original_value += '-' + v2;
				}
				html +=
					'<input type="text" disabled="disabled" class="segment-condition-errored" value="' +
					original_value +
					'" />';
			}

			// add descriptor div back in (always last)
			html += '<div class="jpcrm-condition-info hidden"></div>';

			// append
			jQuery( ele ).append( html );

			// remove the v's if orig passed
			if ( typeof jQuery( ele ).attr( 'data-orig-value' ) !== 'undefined' ) {
				jQuery( ele ).removeAttr( 'data-orig-value' );
			}
			if ( typeof jQuery( ele ).attr( 'data-orig-value2' ) !== 'undefined' ) {
				jQuery( ele ).removeAttr( 'data-orig-value2' );
			}
			if ( typeof jQuery( ele ).attr( 'data-orig-operator' ) !== 'undefined' ) {
				jQuery( ele ).removeAttr( 'data-orig-operator' );
			}

			setTimeout( function () {
				// bind datetime ranges
				zbscrm_JS_bindDateRangePicker();

				// this makes sure we're rebuilding post operator change
				zeroBSCRMJS_segment_bindPostRender();

				// input masking
				zbscrm_JS_bindFieldValidators();
			}, 0 );
		}

		// mark clean
		jQuery( ele ).removeClass( 'dirty' );
	} );
}

/**
 *
 */
function zeroBSCRMJS_segment_previewAudience() {
	// id's
	var snameid = 'zbs-segment-edit-var-title';
	var smatchtypeid = 'zbs-segment-edit-var-matchtype';

	// retrieve
	var sname = jQuery( '#' + snameid ).val();
	var smatchtype = jQuery( '#' + smatchtypeid ).val();

	// check (these also show "required")
	var errors = 0;
	if ( ! zeroBSCRMJS_genericCheckNotEmptySemantic( snameid ) ) {
		errors++;
		// and focus it as on this ui might be far down page
		jQuery( '#zbs-segment-edit-var-title' ).focus();
	}
	// trust matchtype for now

	// clear these
	jQuery( '#zbs-segment-edit-emptypreview-err' ).hide();

	if ( errors == 0 ) {
		// continue

		// check conditions
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

			//Nope.if (typeof value2 != "undefined") condition.value += '|'.value2;

			// push
			sconditions.push( condition );
		} );

		// if good, get preview audience
		// for now that means 1 + :)
		if ( sconditions.length > 0 ) {
			// loading button
			jQuery( '#zbs-segment-edit-act-p2preview' ).addClass( 'loading' );
			jQuery( '#zbs-segment-edit-act-save, #zbs-segment-edit-act-delete' ).addClass( 'loading' );

			// make a segment obj
			var segment = {
				title: sname,
				matchtype: smatchtype,
				conditions: sconditions,
			};

			// if ID present in local obj, inject (update not insert)
			if (
				typeof window.zbsSegment !== 'undefined' &&
				typeof window.zbsSegment.id !== 'undefined'
			) {
				segment.id = window.zbsSegment.id;
			}

			// fire ajax save
			zeroBSCRMJS_segment_previewSegment(
				segment,
				function ( previewList ) {
					// successfully retrieved

					// localise
					var seg = segment;

					// build preview out
					var html = '';

					// catch errors
					if ( typeof previewList === 'undefined' ) {
						var previewList = { list: [], count: 0 };
					}

					if ( previewList.count == 0 ) {
						// no contacts returned
						html = '';
						jQuery( '#zbs-segment-edit-emptypreview-err' ).show();
					} else {
						// some contacts returned, show in table
						html +=
							'<h2 class="ui header" style="margin-left:0">' +
							previewList.count +
							' ' +
							zeroBSCRMJS_segmentLang( 'currentlyInSegment' ) +
							'</h2>';
						html +=
							'<table class="ui celled striped table"><thead><tr><th colspan="2">' +
							zeroBSCRMJS_segmentLang( 'previewTitle' ) +
							':</th></tr></thead><tbody>';

						// for each preview line
						jQuery.each( previewList.list, function ( ind, ele ) {
							var fn = ele.fullname;
							if ( fn == '' ) {
								fn = zeroBSCRMJS_segmentLang( 'noName' );
							}
							var em = ele.email;
							if ( em == '' ) {
								em = zeroBSCRMJS_segmentLang( 'noEmail' );
							}

							// if can view, make link
							if ( window.jpcrm_contact_stem_URL && ele.id ) {
								fn =
									'<a href="' +
									jpcrm.esc_attr( window.jpcrm_contact_stem_URL + ele.id ) +
									'" target="_blank">' +
									jpcrm.esc_html( fn ) +
									'</a>';
							}

							html += '<tr><td>' + fn + '</td><td>' + em + '</td></tr>';
						} );

						html += '</tbody></table>';
					}

					// inject
					jQuery( '#zbs-segment-edit-preview-output' ).html( html );

					// loading button
					jQuery( '#zbs-segment-edit-act-p2preview' ).removeClass( 'loading' );
					jQuery( '#zbs-segment-edit-act-save, #zbs-segment-edit-act-delete' )
						.removeClass( 'loading' )
						.prop( 'disabled', false );

					// show
					jQuery( '#zbs-segment-edit-preview' ).show();
				},
				function ( r ) {
					// error saving

					// loading button
					jQuery( '#zbs-segment-edit-act-p2preview' ).removeClass( 'loading' );
					jQuery( '#zbs-segment-edit-act-save, #zbs-segment-edit-act-delete' )
						.removeClass( 'loading' )
						.prop( 'disabled', false );

					// err
					swal(
						zeroBSCRMJS_segmentLang( 'generalerrortitle' ) + ' #219',
						zeroBSCRMJS_segmentLang( 'generalerror' ),
						'error'
					);
				}
			);
		} else {
			// shouldn't be able to fire :)

			// show notice
			jQuery( '#zbs-segment-edit-conditions-err' ).show();

			// hide in 2 s
			setTimeout( function () {
				jQuery( '#zbs-segment-edit-conditions-err' ).hide();
			}, 1800 );
		}
	}
}

// this matches preview substancially, but it's effecetively preview + 1 step
/**
 *
 */
function zeroBSCRMJS_segment_saveSegmentAct() {
	// id's
	var snameid = 'zbs-segment-edit-var-title';
	var smatchtypeid = 'zbs-segment-edit-var-matchtype';

	// retrieve
	var sname = jQuery( '#' + snameid ).val();
	var smatchtype = jQuery( '#' + smatchtypeid ).val();

	// check (these also show "required")
	var errors = 0;
	if ( ! zeroBSCRMJS_genericCheckNotEmptySemantic( snameid ) ) {
		errors++;
		// and focus it as on this ui might be far down page
		jQuery( '#zbs-segment-edit-var-title' ).focus();
	}
	// trust matchtype for now

	if ( errors == 0 ) {
		// show blocker
		// not using jQuery('#zbs-segment-editor-blocker').removeClass('hidden');
		jQuery( '#zbs-segment-edit-act-p2submit' ).addClass( 'loading' ).attr( 'disabled', 'disabled' );
		jQuery( '#zbs-segment-edit-act-p2preview' )
			.addClass( 'loading' )
			.attr( 'disabled', 'disabled' );

		// and any header buttons
		jQuery( '#zbs-segment-edit-act-save, #zbs-segment-edit-act-delete' )
			.addClass( 'loading' )
			.attr( 'disabled', 'disabled' );

		// continue

		// check conditions
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

			// Nope if (typeof value2 != "undefined") condition.value += '|'.value2;

			// push
			sconditions.push( condition );
		} );

		// if good, get preview audience
		// for now that means 1 + :)
		if ( sconditions.length > 0 ) {
			// make a segment obj
			var segment = {
				title: sname,
				matchtype: smatchtype,
				conditions: sconditions,
			};

			// if ID present in local obj, inject (update not insert)
			if (
				typeof window.zbsSegment !== 'undefined' &&
				typeof window.zbsSegment.id !== 'undefined'
			) {
				segment.id = window.zbsSegment.id;
			}

			// fire ajax save
			zeroBSCRMJS_segment_saveSegment(
				segment,
				function ( id ) {
					// successfully saved

					// needs page refresh? (if new -> edit, not edit->edit)
					var refreshReq = false;
					if ( window.zbsSegment == false ) {
						refreshReq = true;
					}

					// localise
					var seg = segment;

					// update local obj
					window.zbsSegment.id = id;
					window.zbsSegment.name = seg.title;
					window.zbsSegment.matchtype = seg.matchtype;
					window.zbsSegment.conditions = seg.conditions;

					// inject
					jQuery( '#zbs-segment-edit-preview-output' ).html( '' );
					jQuery( '#zbs-segment-edit-preview' ).show();

					// hide blocker
					// not using jQuery('#zbs-segment-editor-blocker').addClass('hidden');
					jQuery( '#zbs-segment-edit-act-p2submit' )
						.removeClass( 'loading' )
						.prop( 'disabled', false );
					jQuery( '#zbs-segment-edit-act-p2preview' )
						.removeClass( 'loading' )
						.prop( 'disabled', false );
					jQuery( '#zbs-segment-edit-act-save, #zbs-segment-edit-act-delete' )
						.removeClass( 'loading' )
						.prop( 'disabled', false );

					jQuery( '#zbs-segment-edit-act-save' ).html( window.zbsSegmentLang.savedSegment );

					setTimeout( function () {
						// reset
						jQuery( '#zbs-segment-edit-act-save' ).html( window.zbsSegmentLang.saveSegment );
					}, 1500 );

					// move to edit page
					if ( refreshReq ) {
						window.location = window.zbsSegmentStemURL + id;
					}
				},
				function ( r ) {
					// error saving

					// hide blocker
					// not using jQuery('#zbs-segment-editor-blocker').addClass('hidden');
					jQuery( '#zbs-segment-edit-act-p2submit' )
						.removeClass( 'loading' )
						.prop( 'disabled', false );
					jQuery( '#zbs-segment-edit-act-p2preview' )
						.removeClass( 'loading' )
						.prop( 'disabled', false );
					jQuery( '#zbs-segment-edit-act-save, #zbs-segment-edit-act-delete' )
						.removeClass( 'loading' )
						.prop( 'disabled', false );

					// err
					swal(
						zeroBSCRMJS_segmentLang( 'generalerrortitle' ) + ' #221',
						zeroBSCRMJS_segmentLang( 'generalerror' ),
						'error'
					);
				}
			);
		} else {
			// shouldn't be able to fire :)

			// show notice
			jQuery( '#zbs-segment-edit-conditions-err' ).show();

			// hide blocker
			// not using jQuery('#zbs-segment-editor-blocker').addClass('hidden');
			jQuery( '#zbs-segment-edit-act-p2submit' ).removeClass( 'loading' ).prop( 'disabled', false );
			jQuery( '#zbs-segment-edit-act-p2preview' )
				.removeClass( 'loading' )
				.prop( 'disabled', false );
			jQuery( '#zbs-segment-edit-act-save, #zbs-segment-edit-act-delete' )
				.removeClass( 'loading' )
				.prop( 'disabled', false );

			// hide in 2 s
			setTimeout( function () {
				jQuery( '#zbs-segment-edit-conditions-err' ).hide();
			}, 1800 );
		}
	}
}

// this should be in a semantic helper js file
// checks a semantic ui field and returns true/false if empty + shows 'required' txt if empty
/**
 * @param eleid
 */
function zeroBSCRMJS_genericCheckNotEmptySemantic( eleid ) {
	var val = jQuery( '#' + eleid ).val();

	if ( typeof val === 'undefined' || val.length < 1 ) {
		// show error + mark field
		jQuery( '#' + eleid )
			.closest( '.field' )
			.addClass( 'error' );
		jQuery( '.ui.message', jQuery( '#' + eleid ).closest( '.field' ) ).show();

		return false;
	}
	// hide errors
	jQuery( '#' + eleid )
		.closest( '.field' )
		.removeClass( 'error' );
	jQuery( '.ui.message', jQuery( '#' + eleid ).closest( '.field' ) ).hide();

	return true;

	return false;
}

var zbsAJAXSending = false;
/**
 * @param segment
 * @param callback
 * @param cbfail
 */
function zeroBSCRMJS_segment_saveSegment( segment, callback, cbfail ) {
	// if not blocked
	if ( ! window.zbsAJAXSending ) {
		window.zbsAJAXSending = true;

		// pull through vars
		var sID = -1;

		// get id from passed js if avail
		// from obj if (typeof window.zbsSegment != "undefined" && typeof window.zbsSegment.id != "undefined") sID = window.zbsSegment.id;
		// from passed
		if ( typeof segment !== 'undefined' && typeof segment.id !== 'undefined' ) {
			sID = segment.id;
		}

		// get deets - whatever's passed is updated, so don't pass nulls
		var data = {
			action: 'zbs_segment_savesegment',
			sID: sID,
			sec: window.zbsSegmentSEC,
		};

		// pass into data
		if ( typeof segment.title !== 'undefined' ) {
			data.sTitle = segment.title;
		}
		if ( typeof segment.matchtype !== 'undefined' ) {
			data.sMatchType = segment.matchtype;
		}
		if ( typeof segment.conditions !== 'undefined' ) {
			data.sConditions = segment.conditions;
		}

		// Send it Pat :D
		jQuery.ajax( {
			type: 'POST',
			url: ajaxurl,
			data: data,
			timeout: 20000,
			success: function ( response ) {
				//console.log("response",response);

				// unblock
				window.zbsAJAXSending = false;

				// any callback
				if ( typeof callback === 'function' ) {
					callback( response.id );
				}

				return true;
			},
			error: function ( response ) {
				//console.log('err',response);

				// unblock
				window.zbsAJAXSending = false;

				// any callback
				if ( typeof cbfail === 'function' ) {
					cbfail( response );
				}

				return false;
			},
		} );
	} // / ifnot blocked
}

// load a preview of segment
/**
 * @param segment
 * @param callback
 * @param cbfail
 */
function zeroBSCRMJS_segment_previewSegment( segment, callback, cbfail ) {
	// if not blocked
	if ( ! window.zbsAJAXSending ) {
		window.zbsAJAXSending = true;

		// pull through vars
		var sID = -1;

		// get id from passed js if avail
		// from obj if (typeof window.zbsSegment != "undefined" && typeof window.zbsSegment.id != "undefined") sID = window.zbsSegment.id;
		// from passed
		if ( typeof segment !== 'undefined' && typeof segment.id !== 'undefined' ) {
			sID = segment.id;
		}

		// get deets - whatever's passed is updated, so don't pass nulls
		var data = {
			action: 'zbs_segment_previewsegment',
			sID: sID,
			sec: window.zbsSegmentSEC,
		};

		// pass into data
		if ( typeof segment.title !== 'undefined' ) {
			data.sTitle = segment.title;
		}
		if ( typeof segment.matchtype !== 'undefined' ) {
			data.sMatchType = segment.matchtype;
		}
		if ( typeof segment.conditions !== 'undefined' ) {
			data.sConditions = segment.conditions;
		}

		// Send it Pat :D
		jQuery.ajax( {
			type: 'POST',
			url: ajaxurl,
			data: data,
			timeout: 20000,
			success: function ( response ) {
				//console.log("response",response);

				// unblock
				window.zbsAJAXSending = false;

				// any callback
				if ( typeof callback === 'function' ) {
					callback( response );
				}

				return true;
			},
			error: function ( response ) {
				//console.log('err',response);

				// unblock
				window.zbsAJAXSending = false;

				// any callback
				if ( typeof cbfail === 'function' ) {
					cbfail( response );
				}

				return false;
			},
		} );
	} // / ifnot blocked
}

/*
 * Shows a condition line description info
 * (pass any child of a `.zbs-segment-edit-condition``)
 */
/**
 * @param ele
 */
function jpcrm_js_show_condition_info( ele ) {
	// load description
	var condition_key = jQuery( '.zbs-segment-edit-var-condition-type', jQuery( ele ).parent() )
		.find( 'option:selected' )
		.val();

	// shim for backward compatibility with Advanced segments < v1.8
	if ( condition_key.startsWith( 'zbsc_' ) ) {
		condition_key = condition_key.substr( 5 );
	}

	// load description
	var description = zeroBSCRMJS_segmentLang( 'default_description' );

	if (
		typeof window.jpcrm_available_conditions[ condition_key ] !== 'undefined' &&
		typeof window.jpcrm_available_conditions[ condition_key ].description !== 'undefined' &&
		window.jpcrm_available_conditions[ condition_key ].description !== ''
	) {
		description = window.jpcrm_available_conditions[ condition_key ].description;
	}

	// parent keeps the score
	jQuery( ele ).parent().removeClass( 'description-hidden' );

	// show hide
	jQuery( '.jpcrm-expand-info', jQuery( ele ).parent() ).addClass( 'hidden' );
	jQuery( '.jpcrm-condition-info', jQuery( ele ).parent() )
		.text( description )
		.removeClass( 'hidden' );
	jQuery( '.jpcrm-hide-info', jQuery( ele ).parent() ).removeClass( 'hidden' );
}

/*
 * Hides a condition line description info
 * (pass any child of a `.zbs-segment-edit-condition``)
 */
/**
 * @param ele
 */
function jpcrm_js_hide_condition_info( ele ) {
	// parent keeps the score
	jQuery( ele ).parent().addClass( 'description-hidden' );

	// show hide
	jQuery( '.jpcrm-hide-info', jQuery( ele ).parent() ).addClass( 'hidden' );
	jQuery( '.jpcrm-condition-info', jQuery( ele ).parent() ).addClass( 'hidden' ).html( '' );
	jQuery( '.jpcrm-expand-info', jQuery( ele ).parent() ).removeClass( 'hidden' );
}

/*
 * Output php-passed language strings
 */
/**
 * @param key
 * @param fallback
 */
function zeroBSCRMJS_segmentLang( key, fallback ) {
	if ( typeof fallback === 'undefined' ) {
		var fallback = '';
	}

	// local
	if ( typeof window.zbsSegmentLang[ key ] !== 'undefined' ) {
		return window.zbsSegmentLang[ key ];
	}

	// fallback to globals
	if ( typeof window.zbs_root.lang[ key ] !== 'undefined' ) {
		return window.zbs_root.lang[ key ];
	}

	// fallback
	return fallback;
}

/*
 * Compares two segment conditions to see if either has a position value higher than other
 */
/**
 * @param a
 * @param b
 */
function jpcrm_js_compare_conditions( a, b ) {
	if ( a.position < b.position ) {
		return 1;
	}
	if ( a.position > b.position ) {
		return -1;
	}

	return 0;
}

if ( typeof module !== 'undefined' ) {
    module.exports = { zbsAJAXSending, zeroBSCRMJS_segment_bindPostRender,
		zeroBSCRMJS_segment_buildConditions, zeroBSCRMJS_segment_buildConditionLine,
		zeroBSCRMJS_segment_buildConditionCascades,
		zeroBSCRMJS_segment_buildConditionCascadesForEle,
		zeroBSCRMJS_segment_buildConditionCascades2,
		zeroBSCRMJS_segment_previewAudience, zeroBSCRMJS_segment_saveSegmentAct,
		zeroBSCRMJS_genericCheckNotEmptySemantic, zeroBSCRMJS_segment_saveSegment,
		zeroBSCRMJS_segment_previewSegment, jpcrm_js_show_condition_info,
		jpcrm_js_hide_condition_info, zeroBSCRMJS_segmentLang,
		jpcrm_js_compare_conditions };
}
