import { render, screen } from '@testing-library/react';
import { InnerBlocks } from '@wordpress/block-editor';
import SearchResultsEdit from '../../../src/search-blocks/blocks/search-results/edit';

jest.mock( '@wordpress/block-editor', () => ( {
	useBlockProps: props => ( { ...props, className: props?.className } ),
	InnerBlocks: jest.fn( () => <div data-testid="search-results-inner-blocks" /> ),
	InspectorControls: ( { children } ) => (
		<div data-testid="search-results-inspector">{ children }</div>
	),
} ) );

jest.mock( '@wordpress/components', () => ( {
	PanelBody: ( { title, children } ) => (
		<div data-testid={ `panel-${ title }` }>
			<h3>{ title }</h3>
			{ children }
		</div>
	),
} ) );

jest.mock( '@wordpress/i18n', () => ( {
	__: text => text,
} ) );

// `PostTypeScopeControl` brings in `@wordpress/data` (`useSelect`) and the
// post-type registry. Mock it to a passthrough that records the props the
// inspector passed in. We expose the captured onChange on the test so the
// "save through setAttributes" case can drive a real change synchronously.
let capturedOnChange = null;
jest.mock( '../../../src/search-blocks/editor/post-type-control', () => {
	const Component = props => {
		capturedOnChange = props.onChange;
		return (
			<div
				data-testid="post-type-scope-control"
				data-mode={ props.mode }
				data-post-types={ JSON.stringify( props.postTypes ) }
			/>
		);
	};
	return {
		__esModule: true,
		default: Component,
		MODE_INCLUDE: 'include',
		MODE_EXCLUDE: 'exclude',
	};
} );

describe( 'SearchResultsEdit', () => {
	beforeEach( () => {
		InnerBlocks.mockClear();
		capturedOnChange = null;
	} );

	const renderEdit = ( attributes = {} ) =>
		render( <SearchResultsEdit attributes={ attributes } setAttributes={ jest.fn() } /> );

	it( 'renders InnerBlocks with the default result-stack template + allowedBlocks contract', () => {
		renderEdit();

		expect( screen.getByTestId( 'search-results-inner-blocks' ) ).toBeInTheDocument();
		const props = InnerBlocks.mock.calls[ 0 ][ 0 ];
		expect( props.template ).toEqual( [
			[
				'core/group',
				{ layout: { type: 'flex', flexWrap: 'nowrap', justifyContent: 'space-between' } },
				[ [ 'jetpack-search/results-count' ], [ 'jetpack-search/results-sort' ] ],
			],
			[ 'jetpack-search/results-list' ],
			[ 'jetpack-search/results-load-more' ],
			[ 'jetpack-search/powered-by' ],
		] );
		expect( props.allowedBlocks ).toEqual( [
			'core/group',
			'jetpack-search/results-count',
			'jetpack-search/results-sort',
			'jetpack-search/results-list',
			'jetpack-search/results-load-more',
			'jetpack-search/powered-by',
		] );
	} );

	it( 'mounts the search-scope inspector panel with saved attributes', () => {
		renderEdit( { postTypeMode: 'include', postTypes: [ 'product' ] } );

		expect( screen.getByTestId( 'panel-Search scope' ) ).toBeInTheDocument();
		const control = screen.getByTestId( 'post-type-scope-control' );
		expect( control ).toHaveAttribute( 'data-mode', 'include' );
		expect( control ).toHaveAttribute( 'data-post-types', JSON.stringify( [ 'product' ] ) );
	} );

	it( 'falls back to exclude mode + empty list when attributes are missing', () => {
		renderEdit();
		const control = screen.getByTestId( 'post-type-scope-control' );
		expect( control ).toHaveAttribute( 'data-mode', 'exclude' );
		expect( control ).toHaveAttribute( 'data-post-types', JSON.stringify( [] ) );
	} );

	it( 'forwards control changes through setAttributes, renaming the neutral `mode` prop to `postTypeMode`', () => {
		const setAttributes = jest.fn();
		render( <SearchResultsEdit attributes={ {} } setAttributes={ setAttributes } /> );
		// The picker emits `{ mode, postTypes }` (neutral prop name); the edit
		// must save it as `{ postTypeMode, postTypes }` so the attribute name
		// doesn't collide with any future generic `mode` attribute.
		capturedOnChange( { mode: 'include', postTypes: [ 'post', 'page' ] } );
		expect( setAttributes ).toHaveBeenCalledWith( {
			postTypeMode: 'include',
			postTypes: [ 'post', 'page' ],
		} );
	} );
} );
