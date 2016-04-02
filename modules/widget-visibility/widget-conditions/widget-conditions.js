/* jshint onevar: false, smarttabs: true */
/* global isRtl */
/* global widget_conditions_parent_pages */
/* global widget_conditions_data */
/* global jQuery */

jQuery( function( $ ) {
	var widgets_shell = $( 'div#widgets-right' );

	if ( ! widgets_shell.length || ! $( widgets_shell ).find( '.widget-control-actions' ).length ) {
		widgets_shell = $( 'form#customize-controls' );
	}

	function setWidgetMargin( $widget ) {

		if ( $( 'body' ).hasClass( 'wp-customizer' ) ) {
			// set the inside widget 2 top this way we can see the widget settings
			$widget.find('.widget-inside').css( 'top', 0 );

			return;
		}

		if ( $widget.hasClass( 'expanded' ) ) {
			// The expanded widget must be at least 400px wide in order to
			// contain the visibility settings. IE wasn't handling the
			// margin-left value properly.

			if ( $widget.attr( 'style' ) ) {
				$widget.data( 'original-style', $widget.attr( 'style' ) );
			}

			var currentWidth = $widget.width();

			if ( currentWidth < 400 ) {
				var extra = 400 - currentWidth;
				if( isRtl ) {
					$widget.css( 'position', 'relative' ).css( 'right', '-' + extra + 'px' ).css( 'width', '400px' );
				} else {
					$widget.css( 'position', 'relative' ).css( 'left', '-' + extra + 'px' ).css( 'width', '400px' );
				}

			}
		}
		else if ( $widget.data( 'original-style' ) ) {
			// Restore any original inline styles when visibility is toggled off.
			$widget.attr( 'style', $widget.data( 'original-style' ) ).data( 'original-style', null );
		}
		else {
			$widget.removeAttr( 'style' );
		}
	}

	function moveWidgetVisibilityButton( $widget ) {
		var $displayOptionsButton = $widget.find( 'a.display-options' ).first();
		$displayOptionsButton.insertBefore( $widget.find( 'input.widget-control-save' ) );

		// Widgets with no configurable options don't show the Save button's container.
		$displayOptionsButton
			.parent()
				.removeClass( 'widget-control-noform' )
				.find( '.spinner' )
					.remove()
					.css( 'float', 'left' )
					.prependTo( $displayOptionsButton.parent() );
	}

	$( '.widget' ).each( function() {
		moveWidgetVisibilityButton( $( this ) );
	} );

	$( document ).on( 'widget-added', function( e, $widget ) {
		if ( $widget.find( 'div.widget-control-actions a.display-options' ).length === 0 ) {
			moveWidgetVisibilityButton( $widget );
		}
	} );

	widgets_shell.on( 'click.widgetconditions', 'a.add-condition', function( e ) {
		e.preventDefault();

		var $condition = $( this ).closest( 'div.condition' ),
			$conditionClone = $condition.clone().data( 'rule-major', '' ).data( 'rule-minor', '' ).data( 'has-children','' ).insertAfter( $condition );

		$conditionClone.find( 'select.conditions-rule-major' ).val( '' );
		$conditionClone.find( 'select.conditions-rule-minor' ).html( '' ).attr( 'disabled' );
		$conditionClone.find( 'span.conditions-rule-has-children' ).hide().find( 'input[type="checkbox"]' ).removeAttr( 'checked' );

		resetRuleIndexes( $conditionClone.closest( '.conditions' ) );
	} );

	widgets_shell.on( 'click.widgetconditions', 'a.display-options', function ( e ) {
		e.preventDefault();

		var $displayOptionsButton = $( this ),
			$widget = $displayOptionsButton.closest( 'div.widget' );

		$widget.find( 'div.widget-conditional' ).toggleClass( 'widget-conditional-hide' );
		$( this ).toggleClass( 'active' );
		$widget.toggleClass( 'expanded' );
		setWidgetMargin( $widget );

		if ( $( this ).hasClass( 'active' ) ) {
			$widget.find( 'input[name=widget-conditions-visible]' ).val( '1' );
			$widget.find( '.condition' ).each( function () {
				buildMinorConditions( $( this ) );
			} );
		} else {
			$widget.find( 'input[name=widget-conditions-visible]' ).val( '0' );
		}

	} );

	widgets_shell.on( 'click.widgetconditions', 'a.delete-condition', function( e ) {
		e.preventDefault();

		var $condition = $( this ).closest( 'div.condition' );

		if ( $condition.is( ':first-child' ) && $condition.is( ':last-child' ) ) {
			$( this ).closest( 'div.widget' ).find( 'a.display-options' ).click();
			$condition.find( 'select.conditions-rule-major' ).val( '' ).change();
		} else {
			$condition.detach();
		}

		resetRuleIndexes( $condition.closest( '.conditions' ) );
	} );

	widgets_shell.on( 'click.widgetconditions', 'div.widget-top', function() {
		var $widget = $( this ).closest( 'div.widget' ),
			$displayOptionsButton = $widget.find( 'a.display-options' );

		if ( $displayOptionsButton.hasClass( 'active' ) ) {
			$displayOptionsButton.attr( 'opened', 'true' );
		}

		if ( $displayOptionsButton.attr( 'opened' ) ) {
			$displayOptionsButton.removeAttr( 'opened' );
			$widget.toggleClass( 'expanded' );
			setWidgetMargin( $widget );
		}
	} );

	$( document ).on( 'change.widgetconditions', 'select.conditions-rule-major', function() {
		var $conditionsRuleMajor = $ ( this ),
			$conditionsRuleMinor = $conditionsRuleMajor.siblings( 'select.conditions-rule-minor:first' ),
			$conditionsRuleHasChildren = $conditionsRuleMajor.siblings( 'span.conditions-rule-has-children' ),
			$condition = $conditionsRuleMinor.closest( '.condition' );

		$condition.data( 'rule-minor', '' ).data( 'rule-major', $conditionsRuleMajor.val() );

		if ( $conditionsRuleMajor.val() ) {
			buildMinorConditions( $condition );
		} else {
			$conditionsRuleMajor.siblings( 'select.conditions-rule-minor' ).attr( 'disabled', 'disabled' ).html( '' );
			$conditionsRuleHasChildren.hide().find( 'input[type="checkbox"]' ).removeAttr( 'checked' );
		}
	} );

	$( document ).on( 'change.widgetconditions', 'select.conditions-rule-minor', function() {
		var $conditionsRuleMinor = $ ( this ),
			$conditionsRuleMajor = $conditionsRuleMinor.siblings( 'select.conditions-rule-major' ),
			$conditionsRuleHasChildren = $conditionsRuleMinor.siblings( 'span.conditions-rule-has-children' );

		if ( $conditionsRuleMajor.val() === 'page' ) {
			if ( $conditionsRuleMinor.val() in widget_conditions_parent_pages ) {
				$conditionsRuleHasChildren.show();
			}
			else {
				$conditionsRuleHasChildren.hide().find( 'input[type="checkbox"]' ).removeAttr( 'checked' );
			}
		} else {
			$conditionsRuleHasChildren.hide().find( 'input[type="checkbox"]' ).removeAttr( 'checked' );
		}
	} );

	$( document ).on( 'widget-updated widget-synced', function ( e, widget ) {
		widget.find( '.condition' ).each( function () {
			buildMinorConditions( $( this ) );
		} );
	} );

	function buildMinorConditions( condition ) {
		var select = condition.find( '.conditions-rule-minor' );
		select.html( '' );

		var major = condition.data( 'rule-major' );

		if ( ! major ) {
			select.attr( 'disabled', 'disabled' );
			return;
		}

		var minor = condition.data( 'rule-minor' );
		var hasChildren = condition.data( 'rule-has-children' );
		var majorData = widget_conditions_data[ major ];

		for ( var i = 0, _len = majorData.length; i < _len; i++ ) {
			var key = majorData[i][0];
			var val = majorData[i][1];

			if ( typeof val === 'object' ) {
				var optgroup = $( '<optgroup/>' );
				optgroup.attr( 'label', key );

				for ( var j = 0, _jlen = val.length; j < _jlen; j++ ) {
					var subkey = majorData[i][1][j][0];
					var subval = majorData[i][1][j][1];

					optgroup.append( $( '<option/>' ).val( subkey ).text( subval.replace( /&nbsp;/g, '\xA0' ) ) );
				}

				select.append( optgroup );
			}
			else {
				select.append( $( '<option/>' ).val( key ).text( val.replace( /&nbsp;/g, '\xA0' ) ) );
			}
		}

		select.removeAttr( 'disabled' );
		select.val( minor );

		if ( 'page' === major && minor in widget_conditions_parent_pages ) {
			select.siblings( 'span.conditions-rule-has-children' ).show();

			if ( hasChildren ) {
				select.siblings( 'span.conditions-rule-has-children' ).find( 'input[type="checkbox"]' ).attr( 'checked', 'checked' );
			}
		}
		else {
			select.siblings( 'span.conditions-rule-has-children' ).hide().find( 'input[type="checkbox"]' ).removeAttr( 'checked' );
		}
	}

	function resetRuleIndexes( widget ) {
		var index = 0;
		widget.find( 'span.conditions-rule-has-children' ).find( 'input[type="checkbox"]' ).each( function () {
			$( this ).attr( 'name', 'conditions[page_children][' + index + ']' );
			index++;
		} );
	}
} );
