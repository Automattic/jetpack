import { describe, expect, jest, test } from '@jest/globals';

const ToggleControl = jest.fn( () => null );

await jest.unstable_mockModule( '@wordpress/block-editor', () => ( {
	InspectorControls: jest.fn( () => null ),
	RichText: jest.fn( () => null ),
	store: 'core/block-editor',
	useBlockProps: jest.fn( args => args ),
} ) );

await jest.unstable_mockModule( '@wordpress/components', () => ( {
	PanelBody: jest.fn( () => null ),
	ToggleControl,
	VisuallyHidden: jest.fn( () => null ),
} ) );

await jest.unstable_mockModule( '@wordpress/data', () => ( {
	useDispatch: jest.fn( () => ( { removeBlock: jest.fn() } ) ),
	useSelect: jest.fn( mapSelect =>
		mapSelect( () => ( {
			getBlockCount: () => 2,
			getBlockRootClientId: () => 'options-client-id',
			getSelectedBlockClientId: () => null,
			getSettings: () => ( { isPreviewMode: false } ),
		} ) )
	),
} ) );

await jest.unstable_mockModule( '@wordpress/element', () => ( {
	useState: jest.fn( initial => [ initial, jest.fn() ] ),
} ) );

await jest.unstable_mockModule( '@wordpress/i18n', () => ( {
	__: jest.fn( str => str ),
} ) );

await jest.unstable_mockModule( '../use-enter.js', () => ( { default: jest.fn( () => null ) } ) );

await jest.unstable_mockModule( '../../shared/hooks/use-synced-attributes.jsx', () => ( {
	useSyncedAttributes: jest.fn(),
} ) );

const OptionEdit = ( await import( '../edit.jsx' ) ).default;

/**
 * Depth-first search for the first element of a type. OptionEdit is invoked as a
 * plain function, so nothing below it renders.
 *
 * @param {*} node - Element or children to search.
 * @param {*} type - The component type to look for.
 * @return {*} The matching element, or undefined.
 */
const findElement = ( node, type ) => {
	if ( ! node || typeof node !== 'object' ) {
		return undefined;
	}
	if ( Array.isArray( node ) ) {
		for ( const child of node ) {
			const found = findElement( child, type );
			if ( found ) {
				return found;
			}
		}
		return undefined;
	}
	if ( node.type === type ) {
		return node;
	}
	return findElement( node.props?.children, type );
};

/**
 * Returns the "Other" toggle's onChange handler for a radio option.
 *
 * @param {object}   attributes    - The option block's attributes.
 * @param {Function} setAttributes - Spy to capture writes.
 * @return {Function} The toggle's onChange.
 */
const getOtherToggleOnChange = ( attributes, setAttributes ) => {
	const tree = OptionEdit( {
		attributes: { isStandalone: false, isOther: false, ...attributes },
		clientId: 'option-client-id',
		context: { 'jetpack/field-options-type': 'radio' },
		isSelected: true,
		mergeBlocks: jest.fn(),
		name: 'jetpack/option',
		setAttributes,
	} );

	return findElement( tree, ToggleControl ).props.onChange;
};

describe( 'the option block\'s "Other" toggle', () => {
	test( 'keeps a label the author already wrote when switching the option to "Other"', () => {
		const setAttributes = jest.fn();

		getOtherToggleOnChange( { label: 'Something else' }, setAttributes )( true );

		expect( setAttributes ).toHaveBeenCalledWith( { isOther: true } );
		// Stated separately: the payload assertion alone would not pin this down.
		expect( setAttributes.mock.calls[ 0 ][ 0 ] ).not.toHaveProperty( 'label' );
	} );

	test( 'keeps the label when switching the option back off "Other"', () => {
		const setAttributes = jest.fn();

		getOtherToggleOnChange( { label: 'Something else', isOther: true }, setAttributes )( false );

		expect( setAttributes ).toHaveBeenCalledWith( { isOther: false } );
		expect( setAttributes.mock.calls[ 0 ][ 0 ] ).not.toHaveProperty( 'label' );
	} );
} );
