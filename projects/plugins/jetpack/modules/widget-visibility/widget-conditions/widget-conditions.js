/* global isRtl, widget_conditions_parent_pages, widget_conditions_data, jQuery */

jQuery( function ( $ ) {
	//  Gutenberg 'widgets.php' screen.
	var widgets_shell = $( '#widgets-editor' );

	if ( 0 === widgets_shell.length ) {
		// Legacy 'widgets.php' screen + customizer.
		widgets_shell = $( 'div#widgets-right' );

		// For backwards compatibility
		if ( 0 === widgets_shell.length ) {
			widgets_shell = $( 'form#customize-controls' );
		}
	}

	function setWidgetMargin( $widget ) {
		var currentWidth, extra;

		if ( $( 'body' ).hasClass( 'wp-customizer' ) ) {
			// set the inside widget 2 top this way we can see the widget settings
			$widget.find( '.widget-inside' ).css( 'top', 0 );

			return;
		}

		if ( $widget.hasClass( 'expanded' ) ) {
			// The expanded widget must be at least 400px wide in order to
			// contain the visibility settings. IE wasn't handling the
			// margin-left value properly.

			if ( $widget.attr( 'style' ) ) {
				$widget.data( 'original-style', $widget.attr( 'style' ) );
			}

			currentWidth = $widget.width();

			if ( currentWidth < 400 ) {
				extra = 400 - currentWidth;
				if ( isRtl ) {
					$widget
						.css( 'position', 'relative' )
						.css( 'right', '-' + extra + 'px' )
						.css( 'width', '400px' );
				} else {
					$widget
						.css( 'position', 'relative' )
						.css( 'left', '-' + extra + 'px' )
						.css( 'width', '400px' );
				}
			}
		} else if ( $widget.data( 'original-style' ) ) {
			// Restore any original inline styles when visibility is toggled off.
			$widget.attr( 'style', $widget.data( 'original-style' ) ).data( 'original-style', null );
		} else {
			$widget.removeAttr( 'style' );
		}
	}

	function moveWidgetVisibilityButton( $widget ) {
		var $displayOptionsButton = $widget.find( 'a.display-options' ).first(),
			$relativeWidget = $widget.find( 'input.widget-control-save' );

		if ( 0 === $relativeWidget.length ) {
			// The save button doesn't exist in gutenberg widget editor, the conditional HTML ought to be displayed
			// last inside the widget options, so display the button before that.
			$relativeWidget = $widget.find( 'div.widget-conditional' );
		}
		$displayOptionsButton.insertBefore( $relativeWidget );

		// Widgets with no configurable options don't show the Save button's container.
		$displayOptionsButton
			.parent()
			.removeClass( 'widget-control-noform' )
			.find( '.spinner' )
			.remove()
			.css( 'float', 'left' )
			.prependTo( $displayOptionsButton.parent() );
	}

	$( '.widget' ).each( function () {
		moveWidgetVisibilityButton( $( this ) );
	} );

	$( document ).on( 'widget-added', function ( e, $widget ) {
		if ( $widget.find( 'div.widget-control-actions a.display-options' ).length === 0 ) {
			moveWidgetVisibilityButton( $widget );
		}
	} );

	widgets_shell.on( 'click.widgetconditions', 'a.add-condition', function ( e ) {
		var $condition = $( this ).closest( 'div.condition' ),
			$conditionClone = $condition
				.clone()
				.data( 'rule-major', '' )
				.data( 'rule-minor', '' )
				.data( 'has-children', '' )
				.insertAfter( $condition );

		e.preventDefault();

		$conditionClone.find( 'select.conditions-rule-major' ).val( '' );
		$conditionClone.find( 'select.conditions-rule-minor' ).html( '' ).attr( 'disabled' );
		$conditionClone
			.find( 'span.conditions-rule-has-children' )
			.hide()
			.find( 'input[type="checkbox"]' )
			.removeAttr( 'checked' );

		resetRuleIndexes( $conditionClone.closest( '.conditions' ) );
	} );

	widgets_shell.on( 'click.widgetconditions', 'a.display-options', function ( e ) {
		var $displayOptionsButton = $( this ),
			$widget = $displayOptionsButton.closest( 'div.widget' );

		e.preventDefault();

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

	widgets_shell.on( 'click.widgetconditions', 'a.delete-condition', function ( e ) {
		var $condition = $( this ).closest( 'div.condition' );

		e.preventDefault();

		if ( $condition.is( ':first-child' ) && $condition.is( ':last-child' ) ) {
			$( this ).closest( 'div.widget' ).find( 'a.display-options' ).click();
			$condition.find( 'select.conditions-rule-major' ).val( '' ).change();
		} else {
			$condition.find( 'select.conditions-rule-major' ).change();
			$condition.detach();
		}

		resetRuleIndexes( $condition.closest( '.conditions' ) );
	} );

	widgets_shell.on( 'click.widgetconditions', 'div.widget-top', function () {
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

	widgets_shell.on( 'change.widgetconditions', 'input.conditions-match-all', function () {
		$( this )
			.parents( '.widget-conditional' )
			.toggleClass( 'conjunction' )
			.toggleClass( 'intersection' );
	} );

	$( document ).on( 'change.widgetconditions', 'select.conditions-rule-major', function () {
		var $conditionsRuleMajor = $( this ),
			$conditionsRuleMinor = $conditionsRuleMajor.siblings( 'select.conditions-rule-minor:first' ),
			$conditionsRuleHasChildren = $conditionsRuleMajor.siblings(
				'span.conditions-rule-has-children'
			),
			$condition = $conditionsRuleMinor.closest( '.condition' );

		$condition.data( 'rule-minor', '' ).data( 'rule-major', $conditionsRuleMajor.val() );

		if ( $conditionsRuleMajor.val() ) {
			buildMinorConditions( $condition );
		} else {
			$conditionsRuleMajor
				.siblings( 'select.conditions-rule-minor' )
				.attr( 'disabled', 'disabled' )
				.html( '' );
			$conditionsRuleHasChildren.hide().find( 'input[type="checkbox"]' ).removeAttr( 'checked' );
		}
	} );

	$( document ).on( 'change.widgetconditions', 'select.conditions-rule-minor', function () {
		var $conditionsRuleMinor = $( this ),
			$conditionsRuleMajor = $conditionsRuleMinor.siblings( 'select.conditions-rule-major' ),
			$conditionsRuleHasChildren = $conditionsRuleMinor.siblings(
				'span.conditions-rule-has-children'
			),
			$condition = $conditionsRuleMinor.closest( '.condition' );

		$condition.data( 'rule-minor', $conditionsRuleMinor.val() );

		if ( $conditionsRuleMajor.val() === 'page' ) {
			if ( $conditionsRuleMinor.val() in widget_conditions_parent_pages ) {
				$conditionsRuleHasChildren.show();
			} else {
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
		var minor,
			hasChildren,
			majorData,
			i,
			j,
			key,
			val,
			_len,
			_jlen,
			subkey,
			subval,
			optgroup,
			select = condition.find( '.conditions-rule-minor' ).html( '' ),
			major = condition.data( 'rule-major' );

		// Disable the select, if major rule is empty or if it's a `post_type`.
		// "Post Type" rule has been removed in Jetpack 4.7, and
		// because it breaks all other rules we should `return`.
		if ( ! major || 'post_type' === major ) {
			select.attr( 'disabled', 'disabled' );
			return;
		}

		minor = condition.data( 'rule-minor' );
		hasChildren = condition.data( 'rule-has-children' );
		majorData = widget_conditions_data[ major ];

		for ( i = 0, _len = majorData.length; i < _len; i++ ) {
			key = majorData[ i ][ 0 ];
			val = majorData[ i ][ 1 ];

			if ( typeof val === 'object' ) {
				optgroup = $( '<optgroup/>' ).attr( 'label', key );

				for ( j = 0, _jlen = val.length; j < _jlen; j++ ) {
					subkey = majorData[ i ][ 1 ][ j ][ 0 ];
					subval = majorData[ i ][ 1 ][ j ][ 1 ];

					optgroup.append(
						$( '<option/>' )
							.val( subkey )
							.text( decodeEntities( subval.replace( /&nbsp;/g, '\xA0' ) ) )
					);
				}

				select.append( optgroup );
			} else {
				select.append(
					$( '<option/>' )
						.val( key )
						.text( decodeEntities( val.replace( /&nbsp;/g, '\xA0' ) ) )
				);
			}
		}

		select.removeAttr( 'disabled' );
		select.val( minor );

		if ( 'page' === major && minor in widget_conditions_parent_pages ) {
			select.siblings( 'span.conditions-rule-has-children' ).show();

			if ( hasChildren ) {
				select
					.siblings( 'span.conditions-rule-has-children' )
					.find( 'input[type="checkbox"]' )
					.attr( 'checked', 'checked' );
			}
		} else {
			select
				.siblings( 'span.conditions-rule-has-children' )
				.hide()
				.find( 'input[type="checkbox"]' )
				.removeAttr( 'checked' );
		}
	}

	function resetRuleIndexes( widget ) {
		var index = 0;
		widget
			.find( 'span.conditions-rule-has-children' )
			.find( 'input[type="checkbox"]' )
			.each( function () {
				$( this ).attr( 'name', 'conditions[page_children][' + index + ']' );
				index++;
			} );
	}

	function decodeEntities( encodedString ) {
		var textarea = document.createElement( 'textarea' );
		textarea.innerHTML = encodedString;
		return textarea.value;
	}
} );

function blockHasVisibilitySettings( name ) {
	// When I put extra attributes on these blocks, they
	// refuse to render with a message "Error loading block: Invalid parameter(s): attributes"
	// However, most blocks don't do this. Why is this?
	const disallowed = new Set( [ 'core/archives', 'core/latest-comments', 'core/latest-posts' ] );
	return ! disallowed.has( name );
}

function addVisibilityAttribute( settings, name ) {
	if ( blockHasVisibilitySettings( name ) && typeof settings.attributes !== 'undefined' ) {
		settings.attributes = Object.assign( settings.attributes, {
			conditions: {
				type: 'object',
				default: {},
			},
		} );
	}
	return settings;
}

wp.hooks.addFilter( 'blocks.registerBlockType', 'widget/visibility', addVisibilityAttribute );

const VisibilityRule = props => {
	console.log( { widget_conditions_parent_pages, widget_conditions_data } );
	const { i, rule, onDelete, setMajor, setMinor } = props;
	const { createElement } = wp.element;
	const { __ } = wp.i18n;
	const { Button, SelectControl } = wp.components;

	let majorOptions = [
		{ label: __( '-- Select --', 'jetpack' ), value: '' },
		{ label: __( 'Category', 'jetpack' ), value: 'category' },
		{ label: __( 'Author', 'jetpack' ), value: 'author' },
		{ label: __( 'User', 'jetpack' ), value: 'loggedin' }, // TURN OFF FOR WPCOM
		{ label: __( 'Role', 'jetpack' ), value: 'role' }, // TURN OFF FOR WPCOM
		{ label: __( 'Tag', 'jetpack' ), value: 'tag' },
		{ label: __( 'Date', 'jetpack' ), value: 'date' },
		{ label: __( 'Page', 'jetpack' ), value: 'page' },
		{ label: __( 'Taxonomy', 'jetpack' ), value: 'taxonomy' }, // ONLY IF A NON-DEFAULT TAXON IS FOUND
	];

	let minorOptions = [];
	if ( rule.major in widget_conditions_data ) {
		minorOptions = widget_conditions_data[ rule.major ].map( ( [ x, y ] ) => ( {
			value: x,
			label: y,
		} ) );
		// TODO: *Page* has nested arrays
		// We don't handle these yet
		// [
		//     [ "front", "Front page" ],
		//     [ "posts", "Posts page" ],
		//     [ "archive", "Archive page" ],
		//     [ "404", "404 error page" ],
		//     [ "search", "Search results" ],
		//     [
		//         "Post type:",
		//         [
		//             [ "post_type-post", "Post" ],
		//             [ "post_type-page", "Page" ],
		//             [ "post_type-attachment", "Media" ]
		//         ]
		//     ],
		// ]
	}

	/*
	let a = (
		<div>
			This is rule number { i }
			<SelectControl
				label="Major Rule"
				value={ rule.major }
				options={ majorOptions }
				onChange={ setMajor }
			/>
			is
			{ rule.major && (
				<SelectControl
					label="Minor Rule"
					value={ rule.minor }
					options={ minorOptions }
					onChange={ setMinor }
				/>
			) }
			<Button onClick={ onDelete }>{ __( 'Delete' ) }</Button>
		</div>
	);
    */

	return createElement(
		'div',
		null,
		'This is rule number ',
		i,
		createElement( SelectControl, {
			label: 'Major Rule',
			value: rule.major,
			options: majorOptions,
			onChange: setMajor,
		} ),
		'is',
		rule.major &&
			createElement( SelectControl, {
				label: 'Minor Rule',
				value: rule.minor,
				options: minorOptions,
				onChange: setMinor,
			} ),
		createElement( Button, { onClick: onDelete }, __( 'Delete' ) )
	);
};

const RuleSep = props => {
	const { isAnd } = props;
	const { createElement } = wp.element;
	if ( isAnd ) {
		return createElement( 'div', null, 'and' );
	}
	return createElement( 'div', null, 'or' );
};

const visibilityAdvancedControls = wp.compose.createHigherOrderComponent( BlockEdit => {
	return props => {
		const { attributes, setAttributes, isSelected } = props;

		const { Fragment, useEffect, createElement } = wp.element;
		const { Button, SelectControl, ToggleControl } = wp.components;
		const { InspectorAdvancedControls } = wp.blockEditor;
		const { __ } = wp.i18n;

		let conditions = attributes.conditions || {};
		let rules = conditions.rules || [];

		// Initialize props.conditions if none is sent
		useEffect( () => {
			if ( ! ( 'action' in conditions ) || ! ( 'match_all' in conditions ) ) {
				setAttributes( {
					conditions: {
						action: 'show',
						rules: [],
						match_all: '0', // boolean with either '0' or '1' strings for backwards compat
					},
				} );
			}
		}, [] );

		const toggleMatchAll = _ =>
			setAttributes( {
				conditions: {
					...conditions,
					match_all: conditions.match_all === '0' ? '1' : '0',
				},
			} );

		const setAction = value =>
			setAttributes( {
				conditions: {
					...conditions,
					action: value,
				},
			} );

		const addNewRule = () => {
			const newRules = [ ...rules, { major: '', minor: '' } ];
			setAttributes( {
				conditions: {
					...conditions,
					rules: newRules,
				},
			} );
		};

		const deleteRule = i => {
			const newRules = [ ...rules.slice( 0, i ), ...rules.slice( i + 1 ) ];
			setAttributes( {
				conditions: {
					...conditions,
					rules: newRules,
				},
			} );
		};

		const setMajor = ( i, majorValue ) => {
			// When changing majors, also change the minor to the first available option
			var minorValue = '';
			if (
				majorValue in widget_conditions_data &&
				Array.isArray( widget_conditions_data[ majorValue ] ) &&
				widget_conditions_data[ majorValue ].length > 0
			) {
				minorValue = widget_conditions_data[ majorValue ][ 0 ][ 0 ];
			}

			const newRules = [
				...rules.slice( 0, i ),
				{ ...rules[ i ], major: majorValue, minor: minorValue },
				...rules.slice( i + 1 ),
			];
			console.log( { newRules } );
			setAttributes( {
				conditions: {
					...conditions,
					rules: newRules,
				},
			} );
		};

		const setMinor = ( i, value ) => {
			const newRules = [
				...rules.slice( 0, i ),
				{ ...rules[ i ], minor: value },
				...rules.slice( i + 1 ),
			];
			console.log( { newRules } );
			setAttributes( {
				conditions: {
					...conditions,
					rules: newRules,
				},
			} );
		};

		/*
		let a = (
			<Fragment>
				<BlockEdit { ...props } />
				{ isSelected && blockHasVisibilitySettings( props.name ) && (
					<InspectorAdvancedControls>
						<div>{ __( 'Visibility Settings' ) }</div>
						<SelectControl
							label="Action"
							value={ attributes.action }
							options={ [
								{ label: __( 'Show', 'jetpack' ), value: 'show' },
								{ label: __( 'Hide', 'jetpack' ), value: 'hide' },
							] }
							onChange={ setAction }
						/>
						{ rules
							.map( ( rule, i ) => (
								<VisibilityRule
									key={ i }
									rule={ rule }
									i={ i }
									onDelete={ () => deleteRule( i ) }
                                    setMajor={ (value) => setMajor(i, value) }
                                    setMinor={ (value) => setMinor(i, value) }
								/>
							) )
							.reduce(
								( acc, item ) =>
									acc === null
										? [ item ]
										: [ ...acc, <RuleSep isAnd={ conditions.match_all === '1' } />, item ],
								null
							) }
						<ToggleControl
							label={ __( 'match all', 'jetpack' ) }
							checked={ conditions.match_all === '1' }
							onChange={ toggleMatchAll }
						/>
						<Button onClick={ addNewRule }>{ __( 'Add New Rule' ) }</Button>
					</InspectorAdvancedControls>
				) }
			</Fragment>
		);
        */

		return createElement(
			Fragment,
			null,
			createElement( BlockEdit, props ),
			isSelected &&
				blockHasVisibilitySettings( props.name ) &&
				createElement(
					InspectorAdvancedControls,
					null,
					createElement( 'div', null, __( 'Visibility Settings' ) ),
					createElement( SelectControl, {
						label: 'Action',
						value: attributes.action,
						options: [
							{ label: __( 'Show', 'jetpack' ), value: 'show' },
							{ label: __( 'Hide', 'jetpack' ), value: 'hide' },
						],
						onChange: setAction,
					} ),
					rules
						.map( ( rule, i ) =>
							createElement( VisibilityRule, {
								key: i,
								rule: rule,
								i: i,
								onDelete: () => deleteRule( i ),
								setMajor: value => setMajor( i, value ),
								setMinor: value => setMinor( i, value ),
							} )
						)
						.reduce(
							( acc, item ) =>
								acc === null
									? [ item ]
									: [
											...acc,
											createElement( RuleSep, {
												isAnd: conditions.match_all === '1',
											} ),
											item,
									  ],
							null
						),
					createElement( ToggleControl, {
						label: __( 'match all', 'jetpack' ),
						checked: conditions.match_all === '1',
						onChange: toggleMatchAll,
					} ),
					createElement( Button, { onClick: addNewRule }, __( 'Add New Rule' ) )
				)
		);
	};
}, 'visibilityAdvancedControls' );

wp.hooks.addFilter( 'editor.BlockEdit', 'widget/visibility', visibilityAdvancedControls );
