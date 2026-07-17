import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { InnerBlocks } from '@wordpress/block-editor';
import SearchResultsEdit from '../../../src/search-blocks/blocks/search-results/edit';

jest.mock( '@wordpress/block-editor', () => ( {
	useBlockProps: props => ( { ...props, className: props?.className } ),
	InnerBlocks: jest.fn( () => <div data-testid="search-results-inner-blocks" /> ),
	InspectorControls: ( { children } ) => (
		<div data-testid="search-results-inspector">{ children }</div>
	),
} ) );

jest.mock( '@wordpress/components', () => {
	// Factory can't reference top-level imports (jest.mock hoisting);
	// require() inside the factory body sidesteps that restriction.
	const { useState } = require( '@wordpress/element' );
	return {
		PanelBody: ( { title, children } ) => (
			<div data-testid={ `panel-${ title }` }>
				<h3>{ title }</h3>
				{ children }
			</div>
		),
		// Tracks its own DOM value like a real controlled input — the edit
		// component's `setAttributes` is a jest.fn() stub, so nothing re-renders
		// this with an updated `value` prop between keystrokes; without local
		// state, userEvent.type's per-character change events would each fire
		// against a value React resets back to the initial prop.
		TextControl: ( { type, value: initialValue, placeholder, min, max, onChange } ) => {
			const [ value, setValue ] = useState( initialValue );
			return (
				<input
					data-testid="results-per-page-input"
					type={ type }
					value={ value }
					placeholder={ placeholder }
					min={ min }
					max={ max }
					onChange={ event => {
						setValue( event.target.value );
						onChange( event.target.value );
					} }
				/>
			);
		},
	};
} );

jest.mock( '@wordpress/i18n', () => ( {
	__: text => text,
	sprintf: ( format, ...args ) =>
		args.reduce( ( str, arg ) => str.replace( '%d', arg ).replace( '%s', arg ), format ),
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

	afterEach( () => {
		// The Pagination panel reads window.JetpackSearchBlocksConfig on every
		// render; reset between tests so one case doesn't pin the config for
		// everything that follows.
		delete globalThis.JetpackSearchBlocksConfig;
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

	it( 'mounts the Pagination panel with the saved resultsPerPage value', () => {
		renderEdit( { resultsPerPage: 25 } );

		expect( screen.getByTestId( 'panel-Pagination' ) ).toBeInTheDocument();
		expect( screen.getByTestId( 'results-per-page-input' ) ).toHaveValue( 25 );
	} );

	it( 'shows an empty field + the site-default placeholder when resultsPerPage is unset', () => {
		globalThis.JetpackSearchBlocksConfig = { defaultResultsPerPage: 12, maxResultsPerPage: 100 };
		renderEdit();

		const input = screen.getByTestId( 'results-per-page-input' );
		expect( input ).toHaveValue( null );
		expect( input ).toHaveAttribute( 'placeholder', 'Site default (12)' );
		expect( input ).toHaveAttribute( 'max', '100' );
	} );

	it( 'clamps an in-range change and saves it as resultsPerPage', async () => {
		const user = userEvent.setup();
		const setAttributes = jest.fn();
		globalThis.JetpackSearchBlocksConfig = { maxResultsPerPage: 50 };
		render( <SearchResultsEdit attributes={ {} } setAttributes={ setAttributes } /> );

		await user.type( screen.getByTestId( 'results-per-page-input' ), '20' );
		expect( setAttributes ).toHaveBeenCalledWith( { resultsPerPage: 20 } );
	} );

	it( 'clamps a change above the max down to maxResultsPerPage', async () => {
		const user = userEvent.setup();
		const setAttributes = jest.fn();
		globalThis.JetpackSearchBlocksConfig = { maxResultsPerPage: 50 };
		render( <SearchResultsEdit attributes={ {} } setAttributes={ setAttributes } /> );

		await user.type( screen.getByTestId( 'results-per-page-input' ), '999' );
		expect( setAttributes ).toHaveBeenCalledWith( { resultsPerPage: 50 } );
	} );

	it( 'clearing the field resets resultsPerPage to 0 (site default)', async () => {
		const user = userEvent.setup();
		const setAttributes = jest.fn();
		render(
			<SearchResultsEdit attributes={ { resultsPerPage: 25 } } setAttributes={ setAttributes } />
		);

		await user.clear( screen.getByTestId( 'results-per-page-input' ) );
		expect( setAttributes ).toHaveBeenCalledWith( { resultsPerPage: 0 } );
	} );
} );
