/**
 * WordPress dependencies
 */
import { Fragment, useEffect, useCallback, useMemo } from '@wordpress/element';
import {
	BaseControl,
	Button,
	SelectControl,
	ToggleControl,
	TreeSelect,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { InspectorAdvancedControls } from '@wordpress/block-editor'; // eslint-disable-line import/no-unresolved
import { Icon, close } from '@wordpress/icons';

/* global widget_conditions_data, wpcom */
/* eslint-disable react/react-in-jsx-scope */

const blockHasVisibilitySettings = name => {
	// When I put extra attributes on these blocks, they
	// refuse to render with a message "Error loading block: Invalid parameter(s): attributes"
	// However, most blocks don't do this. Why is this?
	const disallowed = new Set( [ 'core/archives', 'core/latest-comments', 'core/latest-posts' ] );
	return ! disallowed.has( name );
};

/*
 * We are using the same options data for legacy widgets (rendered in PHP) and
 * block widgets (rendered in React). This converts the data form for a "tree select"
 * used in php to one appropriate for gutenberg's TreeSelect component.
 *
 * PHP style:
 * [
 *     [ "front", "Front page" ],
 *     [ "posts", "Posts page" ],
 *     [
 *         "Post type:",
 *         [
 *             [ "post_type-post", "Post" ],
 *             [ "post_type-page", "Page" ],
 *             [ "post_type-attachment", "Media" ]
 *         ]
 *     ],
 * ]
 * Gutenberg style:
 * [
 * 		{
 * 			name: 'Page 1',
 * 			id: 'p1',
 * 			children: [
 * 				{ name: 'Descend 1 of page 1', id: 'p11' },
 * 				{ name: 'Descend 2 of page 1', id: 'p12' },
 * 			],
 * 		},
 * 	]
 */
const phpOptionsToTree = options => {
	return options.map( ( [ item1, item2 ] ) => {
		if ( Array.isArray( item2 ) ) {
			return {
				name: item1,
				id: item1 + '__HEADER__', // These shouldn't be selectable; we'll look for this later
				children: phpOptionsToTree( item2 ),
			};
		}
		return {
			name: item2,
			id: item1,
		};
	} );
};

const VisibilityRule = props => {
	const { rule, onDelete, setMajor, setMinor } = props;

	// "User" and "Role" are hidden on wpcom
	const optionsDisabledOnWpcom = [
		{ label: __( 'User', 'jetpack' ), value: 'loggedin' },
		{ label: __( 'Role', 'jetpack' ), value: 'role' },
	];
	const isWpcom = typeof wpcom !== 'undefined';

	// "Taxonomy" is shown if there is at least one taxonomy (or if the current
	// rule is taxonomy, so they can delete an invalid rule after removing
	// taxonomies)
	const isShowTaxonomy =
		( widget_conditions_data.taxonomy && widget_conditions_data.taxonomy.length > 1 ) ||
		rule.major === 'taxonomy';
	const optionTaxonomy = [ { label: __( 'Taxonomy', 'jetpack' ), value: 'taxonomy' } ];

	// Build options, but include user/role/taxonomy as appropriate
	const majorOptions = [
		{ label: __( '-- Select --', 'jetpack' ), value: '' },
		{ label: __( 'Category', 'jetpack' ), value: 'category' },
		{ label: __( 'Author', 'jetpack' ), value: 'author' },
	]
		.concat( isWpcom ? [] : optionsDisabledOnWpcom )
		.concat( [
			{ label: __( 'Tag', 'jetpack' ), value: 'tag' },
			{ label: __( 'Date', 'jetpack' ), value: 'date' },
			{ label: __( 'Page', 'jetpack' ), value: 'page' },
		] )
		.concat( isShowTaxonomy ? optionTaxonomy : [] );

	let minorTree = [];
	if ( rule.major in widget_conditions_data ) {
		minorTree = phpOptionsToTree( widget_conditions_data[ rule.major ] );
	}

	return (
		<div className="widget-vis__rule widget-vis__flex">
			<div className="widget-vis__rule-col-1">
				<div className="widget-vis__flex">
					<div className="widget-vis__delete-rule">
						<Button onClick={ onDelete }>
							<Icon icon={ close } size={ 14 } />
						</Button>
					</div>
					<div className="widget-vis__select">
						<SelectControl
							label="Major Rule"
							hideLabelFromVision
							value={ rule.major }
							options={ majorOptions }
							onChange={ setMajor }
						/>
					</div>
				</div>
			</div>
			<div className="widget-vis__rule-col-2">
				<p className="widget-vis__is">{ __( 'is', 'jetpack' ) }</p>
			</div>
			<div className="widget-vis__rule-col-3">
				{ rule.major && (
					<TreeSelect
						className="widget-vis__select"
						label="Minor Rule"
						hideLabelFromVision
						value={ rule.minor }
						selectedId={ rule.minor }
						tree={ minorTree }
						onChange={ setMinor }
					/>
				) }
			</div>
		</div>
	);
};

const RuleSep = props => {
	const { isAnd } = props;
	if ( isAnd ) {
		return <div className="widget-vis__and-or">{ __( 'and', 'jetpack' ) }</div>;
	}
	return <div className="widget-vis__and-or">{ __( 'or', 'jetpack' ) }</div>;
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
				// Don't allow section headings to be set
				if ( value && value.includes( '__HEADER__' ) ) {
					return;
				}
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

		let mainRender = null;
		if ( rules.length === 0 ) {
			mainRender = (
				<BaseControl
					id="widget-vis__wrapper"
					className="widget-vis__wrapper"
					label={ __( 'Visibility Settings', 'jetpack' ) }
					help={ __(
						'No visibility rules yet. Add at least one rule to use this feature.',
						'jetpack'
					) }
				>
					<Button isSecondary onClick={ addNewRule } className="widget-vis__add-new-rule">
						{ __( 'Add new rule', 'jetpack' ) }
					</Button>
				</BaseControl>
			);
		} else {
			mainRender = (
				<BaseControl
					className="widget-vis__wrapper"
					id="widget-vis__wrapper"
					label={ __( 'Visibility Settings', 'jetpack' ) }
				>
					<SelectControl
						className="widget-vis__show-hide"
						label="Action"
						hideLabelFromVision
						value={ attributes.action }
						options={ [
							{ label: __( 'Show this block if:', 'jetpack' ), value: 'show' },
							{ label: __( 'Hide this block if:', 'jetpack' ), value: 'hide' },
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
									: [ ...acc, <RuleSep key={ i } isAnd={ conditions.match_all === '1' } />, item ],
							null
						) }
					{ rules.length > 1 && (
						<ToggleControl
							className="widget-vis__match-all"
							label={ __( 'Match all rules', 'jetpack' ) }
							checked={ conditions.match_all === '1' }
							onChange={ toggleMatchAll }
						/>
					) }
					<Button isSecondary onClick={ addNewRule }>
						{ __( 'Add new rule', 'jetpack' ) }
					</Button>
				</BaseControl>
			);
		}

		return (
			<Fragment>
				<BlockEdit { ...props } />
				{ isSelected && blockHasVisibilitySettings( props.name ) && (
					<InspectorAdvancedControls>{ mainRender }</InspectorAdvancedControls>
				) }
			</Fragment>
		);
	};
}, 'visibilityAdvancedControls' );

wp.hooks.addFilter( 'editor.BlockEdit', 'widget/visibility', visibilityAdvancedControls );
