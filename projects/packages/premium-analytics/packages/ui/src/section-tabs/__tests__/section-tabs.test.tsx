/**
 * External dependencies
 */
import { fireEvent, render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { SectionTabs } from '../section-tabs';

describe( 'SectionTabs', () => {
	it( 'shows a loading placeholder in place of a pending label', () => {
		render(
			<SectionTabs
				tabs={ [
					{ id: 'traffic', label: 'Post traffic', isPending: true },
					{ id: 'opens', label: 'Email opens' },
				] }
				value="traffic"
				onChange={ () => {} }
			/>
		);

		expect( screen.getByRole( 'tab', { name: 'Loading…' } ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Post traffic' ) ).not.toBeInTheDocument();
		expect( screen.getByRole( 'tab', { name: 'Email opens' } ) ).toBeInTheDocument();
	} );

	it( 'makes the tab list measure its overflow again once the indicator settles', () => {
		render(
			<SectionTabs
				tabs={ [ { id: 'traffic', label: 'Product traffic' } ] }
				value="traffic"
				onChange={ () => {} }
			/>
		);
		const tablist = screen.getByRole( 'tablist' );
		const onScroll = jest.fn();
		tablist.addEventListener( 'scroll', onScroll );

		fireEvent.transitionEnd( tablist, { propertyName: 'width' } );

		expect( onScroll ).toHaveBeenCalledTimes( 1 );
	} );
} );
