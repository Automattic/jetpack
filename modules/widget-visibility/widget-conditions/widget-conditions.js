/* jshint onevar: false, smarttabs: true */
/* global ajaxurl */
/* global isRtl */

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
			$conditionClone = $condition.clone().insertAfter( $condition );

		$conditionClone.find( 'select.conditions-rule-major' ).val( '' );
		$conditionClone.find( 'select.conditions-rule-minor' ).html( '' ).attr( 'disabled' );
		$conditionClone.find( 'span.conditions-rule-has-children' ).hide().html( '' );
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
			$conditionsRuleHasChildren = $conditionsRuleMajor.siblings( 'span.conditions-rule-has-children' );

		if ( $conditionsRuleMajor.val() ) {
			if ( $conditionsRuleMajor.val() !== 'page' ){
				$conditionsRuleHasChildren.hide().html( '' );
			}

			$conditionsRuleMinor.html( '' ).append( $( '<option/>' ).text( $conditionsRuleMinor.data( 'loading-text' ) ) );

			var data = {
				action: 'widget_conditions_options',
				major: $conditionsRuleMajor.val()
			};

			jQuery.post( ajaxurl, data, function( html ) {
				$conditionsRuleMinor.html( html ).removeAttr( 'disabled' );
			} );
		} else {
			$conditionsRuleMajor.siblings( 'select.conditions-rule-minor' ).attr( 'disabled', 'disabled' ).html( '' );
			$conditionsRuleHasChildren.hide().html( '' );
		}
	} );

	$( document ).on( 'change.widgetconditions', 'select.conditions-rule-minor', function() {
		var $conditionsRuleMinor = $ ( this ),
			$conditionsRuleMajor = $conditionsRuleMinor.siblings( 'select.conditions-rule-major' ),
			$conditionsRuleHasChildren = $conditionsRuleMinor.siblings( 'span.conditions-rule-has-children' );

		if ( $conditionsRuleMajor.val() === 'page' ) {
			var data = {
				action: 'widget_conditions_has_children',
				major: $conditionsRuleMajor.val(),
				minor: $conditionsRuleMinor.val()
			};

			jQuery.post( ajaxurl, data, function( html ) {
				$conditionsRuleHasChildren.html( html ).show();
			} );
		} else {
			$conditionsRuleHasChildren.hide().html( '' );
		}
	} );
} );
