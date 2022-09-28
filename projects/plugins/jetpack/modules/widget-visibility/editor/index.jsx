import { isSimpleSite } from '@automattic/jetpack-shared-extension-utils';
import { InspectorAdvancedControls } from '@wordpress/block-editor'; // eslint-disable-line import/no-unresolved
import { BaseControl, Button, SelectControl, ToggleControl } from '@wordpress/components';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { Fragment, useCallback, useMemo } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import analytics from '../../../_inc/client/lib/analytics';

/* global widget_conditions_data */
/* eslint-disable react/react-in-jsx-scope */

//// Unescape utility
const htmlUnescapes = {
	'&amp;': '&',
	'&lt;': '<',
	'&gt;': '>',
	'&quot;': '"',
	'&#39;': "'",
	'&nbsp;': '\u00A0',
};
const reEscapedHtml = /&(?:amp|lt|gt|quot|#39|nbsp);/g;

/*
 * Unescape html entities: unescape("Hello&gt;&gt;") = "Hello>>"
 * Scaled down version of unescape() from lodash.
 * (Yes, lodash's unescape() only does a few specific replacements!
 *  They recommend using "he" https://mths.be/he if you need full replacements.)
 * @param string str - input string
 * @returns string String with html entities unescaped
 */
const unescape = str => {
	if ( typeof str !== 'string' ) {
		return str;
	}
	const replacer = input => htmlUnescapes[ input ];
	return str.replace( reEscapedHtml, replacer );
};

const blockHasVisibilitySettings = name => {
	const disallowed = new Set( [
		'core/legacy-widget', // These already have legacy visibility settings, avoid 2 levels of controls
		'core/widget-area', // This is the entire outer area; I don't think the editor lets you visit here
	] );
	return ! disallowed.has( name );
};

/**
 * Adds a ".conditions" field to a block's attributes.
 * Used to store visibility rules.
 *
 * @param {Object} settings - Block settings.
 * @param {string} name - Block name.
 * @return {Object} Modified settings.
 */
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

/*
 * We are using the same options data for legacy widgets (rendered in PHP) and
 * block widgets (rendered in React). This converts the data form for a "tree select"
 * used in php to one appropriate for gutenberg's <SelectControl> component.
 *
 * This is not perfect, but:
 *   Gutenberg's <TreeSelect> doesn't allow you to make unselectable headers.
 *   Gutenberg has no components that use optgroup.
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
 *    { value: "front", label: "Front page" },
 *    { value: "posts", label: "Posts page" },
 *    { value: "Post type:", label: "Post type:", disabled: true },
 *    { value: "post_type-post", label: "   Post" },
 *    { value: "post_type-page", label: "   Page" },
 *    { value: "post_type-attachment", label: "   Media" },
 * ]
 */

const buildOptions = ( options, level = 0 ) =>
	options.reduce( ( acc, item ) => {
		const [ item1, item2 ] = item;
		const prefix = '\u00A0'.repeat( level * 3 );

		if ( Array.isArray( item2 ) ) {
			const newItem = {
				label: unescape( prefix + item1 ),
				value: item1,
				disabled: true,
			};
			const childItems = buildOptions( item2, level + 1 );
			return acc.concat( [ newItem ] ).concat( childItems );
		}

		const newItem = {
			label: unescape( prefix + item2 ),
			value: item1,
		};
		return acc.concat( [ newItem ] );
	}, [] );

const VisibilityRule = props => {
	const { rule, onDelete, setMajor, setMinor } = props;

	// "User" and "Role" are hidden on wpcom
	const optionsDisabledOnWpcom = [
		{ label: __( 'User', 'jetpack' ), value: 'loggedin' },
		{ label: __( 'Role', 'jetpack' ), value: 'role' },
	];

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
		.concat( isSimpleSite() ? [] : optionsDisabledOnWpcom )
		.concat( [
			{ label: __( 'Tag', 'jetpack' ), value: 'tag' },
			{ label: __( 'Date', 'jetpack' ), value: 'date' },
			{ label: __( 'Page', 'jetpack' ), value: 'page' },
		] )
		.concat( isShowTaxonomy ? optionTaxonomy : [] );

	let minorOptions = [];
	if ( rule.major in widget_conditions_data ) {
		minorOptions = buildOptions( widget_conditions_data[ rule.major ] );
	}

	return (
		<div className="widget-vis__rule">
			<div className="widget-vis__rule-major">
				<span className="widget-vis__if">
					{ _x(
						'If',
						'Widget Visibility: If {Rule Major [Page]} is {Rule Minor [Search results]}',
						'jetpack'
					) }
				</span>
				<div className="widget-vis__select">
					<SelectControl
						label={ __( 'Major Rule', 'jetpack' ) }
						hideLabelFromVision
						value={ rule.major }
						options={ majorOptions }
						onChange={ setMajor }
					/>
				</div>
			</div>
			{ rule.major && (
				<div className="widget-vis__rule-minor">
					<span className="widget-vis__is">
						{ _x(
							'is',
							'Widget Visibility: {Rule Major [Page]} is {Rule Minor [Search results]}',
							'jetpack'
						) }
					</span>
					<div className="widget-vis__select">
						<SelectControl
							className="widget-vis__select-multi-level"
							label={ __( 'Minor Rule', 'jetpack' ) }
							hideLabelFromVision
							value={ rule.minor }
							options={ minorOptions }
							onChange={ setMinor }
						/>
					</div>
				</div>
			) }
			<div className="widget-vis__delete-rule">
				<Button onClick={ onDelete } isSmall variant="secondary">
					{ _x( 'Remove', 'Delete this visibility rule', 'jetpack' ) }
				</Button>
			</div>
		</div>
	);
};

/* Given a conditions object, add the default values for the 'action', 'rules',
 * and 'match_all' keys if any of them are missing
 * @param object conditions
 * @return object Conditions with defaults applied if any of the keys are missing.
 */
const maybeAddDefaultConditions = conditions => ( {
	action: 'show',
	rules: [],
	match_all: 0,
	...conditions,
} );

const visibilityAdvancedControls = createHigherOrderComponent(
	BlockEdit => props => {
		const { clientId, attributes, setAttributes, isSelected } = props;
		const conditions = useMemo( () => attributes.conditions || {}, [ attributes ] );
		const rules = useMemo( () => conditions.rules || [], [ conditions ] );

		// Is this block the top-most level block in a widget?.
		const isTopLevelWidgetBlock = useSelect(
			select => {
				const { getBlockParents, getBlock } = select( 'core/block-editor' );
				const parents = getBlockParents( clientId, true );
				const parentBlock = parents ? getBlock( parents[ 0 ] ) : undefined;
				// Customizer: There is no parent.
				// Widgets.php: Parent is core/widget area.
				// Both are OK.
				return ! parentBlock || ( parentBlock && parentBlock.name === 'core/widget-area' );
			},
			[ clientId ]
		);

		const toggleMatchAll = useCallback( () => {
			analytics.tracks.recordEvent( 'jetpack_widget_visibility_toggle_match_all_click' );
			setAttributes( {
				conditions: {
					...maybeAddDefaultConditions( conditions ),
					match_all: conditions.match_all === '0' ? '1' : '0',
				},
			} );
		}, [ setAttributes, conditions ] );

		const setAction = useCallback(
			value =>
				setAttributes( {
					conditions: {
						...maybeAddDefaultConditions( conditions ),
						action: value,
					},
				} ),
			[ setAttributes, conditions ]
		);
		const addNewRule = useCallback( () => {
			const newRules = [ ...rules, { major: '', minor: '' } ];
			analytics.tracks.recordEvent( 'jetpack_widget_visibility_add_new_rule_click' );
			setAttributes( {
				conditions: {
					...maybeAddDefaultConditions( conditions ),
					rules: newRules,
				},
			} );
		}, [ setAttributes, conditions, rules ] );

		const deleteRule = useCallback(
			i => {
				const newRules = [ ...rules.slice( 0, i ), ...rules.slice( i + 1 ) ];
				analytics.tracks.recordEvent( 'jetpack_widget_visibility_delete_rule_click' );
				setAttributes( {
					conditions: {
						...maybeAddDefaultConditions( conditions ),
						rules: newRules,
					},
				} );
			},
			[ setAttributes, conditions, rules ]
		);

		const setMajor = useCallback(
			( i, majorValue ) => {
				analytics.tracks.recordEvent( 'jetpack_widget_visibility_set_major_rule_click' );
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
						...maybeAddDefaultConditions( conditions ),
						rules: newRules,
					},
				} );
			},
			[ setAttributes, conditions, rules ]
		);

		const setMinor = useCallback(
			( i, value ) => {
				analytics.tracks.recordEvent( 'jetpack_widget_visibility_set_minor_rule_click' );
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
						...maybeAddDefaultConditions( conditions ),
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
					label={ __( 'Visibility', 'jetpack' ) }
					help={ __(
						'No visibility rules yet. Add at least one rule to use this feature.',
						'jetpack'
					) }
				>
					<Button variant="secondary" onClick={ addNewRule } className="widget-vis__add-new-rule">
						{ __( 'Add new rule', 'jetpack' ) }
					</Button>
				</BaseControl>
			);
		} else {
			mainRender = (
				<BaseControl
					className="widget-vis__wrapper"
					id="widget-vis__wrapper"
					label={ __( 'Visibility', 'jetpack' ) }
				>
					<SelectControl
						className="widget-vis__show-hide"
						label={ __( 'Action', 'jetpack' ) }
						hideLabelFromVision
						value={ attributes.conditions.action }
						options={ [
							{ label: __( 'Show this block', 'jetpack' ), value: 'show' },
							{ label: __( 'Hide this block', 'jetpack' ), value: 'hide' },
						] }
						onChange={ setAction }
					/>
					{ rules.map( ( rule, i ) => (
						<VisibilityRule
							key={ i }
							rule={ rule }
							i={ i }
							onDelete={ () => deleteRule( i ) } // eslint-disable-line react/jsx-no-bind
							setMajor={ value => setMajor( i, value ) } // eslint-disable-line react/jsx-no-bind
							setMinor={ value => setMinor( i, value ) } // eslint-disable-line react/jsx-no-bind
						/>
					) ) }
					{ rules.length > 1 && (
						<ToggleControl
							className="widget-vis__match-all"
							label={ __( 'Match all rules', 'jetpack' ) }
							checked={ conditions.match_all === '1' }
							onChange={ toggleMatchAll }
						/>
					) }
					<Button variant="secondary" onClick={ addNewRule }>
						{ __( 'Add new rule', 'jetpack' ) }
					</Button>
				</BaseControl>
			);
		}

		return (
			<Fragment>
				<BlockEdit { ...props } />
				{ isSelected && isTopLevelWidgetBlock && blockHasVisibilitySettings( props.name ) && (
					<InspectorAdvancedControls>{ mainRender }</InspectorAdvancedControls>
				) }
				{ isSelected && ! isTopLevelWidgetBlock && blockHasVisibilitySettings( props.name ) && (
					<InspectorAdvancedControls>
						<BaseControl
							id="widget-vis__wrapper"
							className="widget-vis__wrapper"
							label={ __( 'Visibility', 'jetpack' ) }
							help={ __(
								'Please select the top level block of this widget to apply visibility rules.',
								'jetpack'
							) }
						></BaseControl>
					</InspectorAdvancedControls>
				) }
			</Fragment>
		);
	},
	'visibilityAdvancedControls'
);

wp.hooks.addFilter( 'editor.BlockEdit', 'widget/visibility', visibilityAdvancedControls );
