import { render, screen } from '@testing-library/react';
import PricingTable, { PricingTableColumn, PricingTableHeader, PricingTableItem } from '../index';

describe( 'PricingTable', () => {
	const testProps = {
		title: 'Dummy Pricing Table',
		items: [ 'Dummy Item 1', 'Dummy Item 2', 'Dummy Item 3' ],
		children: (
			<>
				<PricingTableColumn>
					<PricingTableHeader>Header 1</PricingTableHeader>
					<PricingTableItem isIncluded={ true } />
					<PricingTableItem isIncluded={ true } />
					<PricingTableItem isIncluded={ true } />
				</PricingTableColumn>
				<PricingTableColumn>
					<PricingTableHeader>Header 2</PricingTableHeader>
					<PricingTableItem isIncluded={ true } />
					<PricingTableItem isIncluded={ true } />
					<PricingTableItem isIncluded={ false } />
				</PricingTableColumn>
			</>
		),
	};

	it( 'renders the title', () => {
		render( <PricingTable { ...testProps }></PricingTable> );
		expect( screen.getByRole( 'heading' ) ).toHaveTextContent( 'Dummy Pricing Table' );
	} );

	it( 'renders all included items', () => {
		render( <PricingTable { ...testProps }></PricingTable> );
		expect( screen.getAllByText( 'Dummy Item 1' ) ).toHaveLength( 2 );
		expect( screen.getAllByText( 'Dummy Item 2' ) ).toHaveLength( 2 );
		expect( screen.getAllByText( 'Dummy Item 3' ) ).toHaveLength( 1 ); // eslint-disable-line jest-dom/prefer-in-document
	} );
} );
