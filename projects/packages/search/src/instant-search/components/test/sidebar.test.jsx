import { render, screen } from '@testing-library/react';
import * as React from 'react';
import Sidebar from '../sidebar';

jest.mock( '../search-filters', () => props => (
	<div data-testid="search-filters" data-widget={ props.widget?.widget_id } />
) );
jest.mock( '../widget-area-container', () => () => <div data-testid="widget-area-container" /> );
jest.mock( '../sidebar.scss', () => {} );

const defaultProps = {
	citations: [],
	filters: [],
	staticFilters: {},
	isLoading: false,
	locale: 'en',
	postTypes: [],
	response: {},
	widgetOutsideOverlay: null,
	widgets: [],
};

describe( 'Sidebar', () => {
	it( 'renders SearchFilters and WidgetAreaContainer', () => {
		render( <Sidebar { ...defaultProps } /> );
		expect( screen.getByTestId( 'search-filters' ) ).toBeInTheDocument();
		expect( screen.getByTestId( 'widget-area-container' ) ).toBeInTheDocument();
	} );

	it( 'does not render citations section when citations is empty', () => {
		render( <Sidebar { ...defaultProps } citations={ [] } /> );
		expect( screen.queryAllByRole( 'link' ) ).toHaveLength( 0 );
	} );

	it( 'renders citation cards when citations are provided', () => {
		const citations = [
			{ title: 'How to reset your password', url: 'https://example.com/reset' },
			{ title: 'Getting started guide', url: 'https://example.com/guide' },
		];
		render( <Sidebar { ...defaultProps } citations={ citations } /> );
		expect( screen.getByText( 'How to reset your password' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Getting started guide' ) ).toBeInTheDocument();
	} );

	it( 'shows the hostname of each citation URL', () => {
		const citations = [ { title: 'Docs', url: 'https://docs.example.com/page' } ];
		render( <Sidebar { ...defaultProps } citations={ citations } /> );
		expect( screen.getByText( 'docs.example.com' ) ).toBeInTheDocument();
	} );

	it( 'citation links open in a new tab with noopener', () => {
		const citations = [ { title: 'Article', url: 'https://example.com/article' } ];
		render( <Sidebar { ...defaultProps } citations={ citations } /> );
		const link = screen.getByRole( 'link', { name: /Article/ } );
		expect( link ).toHaveAttribute( 'target', '_blank' );
		expect( link ).toHaveAttribute( 'rel', 'noopener noreferrer' );
		expect( link ).toHaveAttribute( 'href', 'https://example.com/article' );
	} );

	it( 'creates a portal for each widget', () => {
		const widgetId = 'jetpack-search-widget-1';
		const wrapper = document.createElement( 'div' );
		wrapper.id = `${ widgetId }-wrapper`;
		document.body.appendChild( wrapper );

		const widgets = [ { widget_id: widgetId } ];
		render( <Sidebar { ...defaultProps } widgets={ widgets } /> );

		// The portaled SearchFilters mock carries the widget id as data-widget.
		const allFilters = screen.getAllByTestId( 'search-filters' );
		const portaled = allFilters.find( el => el.getAttribute( 'data-widget' ) === widgetId );
		expect( portaled ).toBeInTheDocument();

		document.body.removeChild( wrapper );
	} );
} );
