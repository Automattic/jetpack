/**
 * WordPress dependencies
 */
import { Fragment, useEffect, useCallback, useMemo } from '@wordpress/element';
import { Button, SelectControl, ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { InspectorAdvancedControls } from '@wordpress/block-editor'; // eslint-disable-line import/no-unresolved

/* global widget_conditions_data */
/* eslint-disable react/react-in-jsx-scope */

const blockHasVisibilitySettings = name => {
	// When I put extra attributes on these blocks, they
	// refuse to render with a message "Error loading block: Invalid parameter(s): attributes"
	// However, most blocks don't do this. Why is this?
	const disallowed = new Set( [ 'core/archives', 'core/latest-comments', 'core/latest-posts' ] );
	return ! disallowed.has( name );
};

const VisibilityRule = props => {
	const { i, rule, onDelete, setMajor, setMinor } = props;

	const majorOptions = [
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

	return (
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
};

const RuleSep = props => {
	const { isAnd } = props;
	if ( isAnd ) {
		return <div>and</div>;
	}
	return <div>or</div>;
};

const visibilityAdvancedControls = wp.compose.createHigherOrderComponent( BlockEdit => {
	return props => {
		const { attributes, setAttributes, isSelected } = props;
		const conditions = useMemo( () => attributes.conditions || {}, [ attributes ] );
		const rules = useMemo( () => conditions.rules || [], [ conditions ] );

		// Initialize props.conditions if none is sent.
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
		}, [ conditions, setAttributes ] );

		const toggleMatchAll = useCallback(
			() =>
				setAttributes( {
					conditions: {
						...conditions,
						match_all: conditions.match_all === '0' ? '1' : '0',
					},
				} ),
			[ setAttributes, conditions ]
		);

		const setAction = useCallback(
			value =>
				setAttributes( {
					conditions: {
						...conditions,
						action: value,
					},
				} ),
			[ setAttributes, conditions ]
		);
		const addNewRule = useCallback( () => {
			const newRules = [ ...rules, { major: '', minor: '' } ];
			setAttributes( {
				conditions: {
					...conditions,
					rules: newRules,
				},
			} );
		}, [ setAttributes, conditions, rules ] );

		const deleteRule = useCallback(
			i => {
				const newRules = [ ...rules.slice( 0, i ), ...rules.slice( i + 1 ) ];
				setAttributes( {
					conditions: {
						...conditions,
						rules: newRules,
					},
				} );
			},
			[ setAttributes, conditions, rules ]
		);

		const setMajor = useCallback(
			( i, majorValue ) => {
				// When changing majors, also change the minor to the first available option
				let minorValue = '';
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
				setAttributes( {
					conditions: {
						...conditions,
						rules: newRules,
					},
				} );
			},
			[ setAttributes, conditions, rules ]
		);

		const setMinor = useCallback(
			( i, value ) => {
				const newRules = [
					...rules.slice( 0, i ),
					{ ...rules[ i ], minor: value },
					...rules.slice( i + 1 ),
				];
				setAttributes( {
					conditions: {
						...conditions,
						rules: newRules,
					},
				} );
			},
			[ setAttributes, conditions, rules ]
		);

		return (
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
									onDelete={ () => deleteRule( i ) } // eslint-disable-line react/jsx-no-bind
									setMajor={ value => setMajor( i, value ) } // eslint-disable-line react/jsx-no-bind
									setMinor={ value => setMinor( i, value ) } // eslint-disable-line react/jsx-no-bind
								/>
							) )
							.reduce(
								( acc, item, i ) =>
									acc === null
										? [ item ]
										: [
												...acc,
												<RuleSep key={ i } isAnd={ conditions.match_all === '1' } />,
												item,
										  ],
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
	};
}, 'visibilityAdvancedControls' );

wp.hooks.addFilter( 'editor.BlockEdit', 'widget/visibility', visibilityAdvancedControls );
