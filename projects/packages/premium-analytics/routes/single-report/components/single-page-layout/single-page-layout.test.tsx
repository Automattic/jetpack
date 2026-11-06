import { render, screen } from '@testing-library/react';
import { SinglePageLayout, type SinglePageLayoutProps } from './single-page-layout';

const CONTROLS = [
	{ id: 'reportParams', label: 'Date range', Edit: () => <div>Date filters</div> },
] as unknown as NonNullable< SinglePageLayoutProps[ 'controls' ] >;

const HEADER = {
	visual: <svg data-testid="glyph" />,
	title: 'Launch recap',
	subTitle: 'Video uploaded on Jan 10, 2026.',
};

const noop = () => {};

/**
 * Renders the layout with a resolved header, letting a test override any prop.
 *
 * @param {Partial< SinglePageLayoutProps >} props - The props to override.
 * @return The render result.
 */
function renderLayout( props: Partial< SinglePageLayoutProps > = {} ) {
	return render(
		<SinglePageLayout
			header={ HEADER }
			controls={ CONTROLS }
			data={ {} }
			onChange={ noop }
			{ ...props }
		>
			<div>Body</div>
		</SinglePageLayout>
	);
}

describe( 'SinglePageLayout', () => {
	it( 'renders the tabs, the header with its hover text, the controls and the body', () => {
		renderLayout( { tabs: <nav>Tabs</nav> } );

		expect( screen.getByText( 'Tabs' ) ).toBeInTheDocument();
		expect( screen.getByTestId( 'glyph' ) ).toBeInTheDocument();
		expect( screen.getByRole( 'heading', { level: 2, name: 'Launch recap' } ) ).toHaveAttribute(
			'title',
			'Launch recap'
		);
		expect( screen.getByText( 'Video uploaded on Jan 10, 2026.' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Date filters' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Body' ) ).toBeInTheDocument();
	} );

	it( 'renders no form for a page without controls', () => {
		renderLayout( { controls: [] } );

		expect( screen.queryByText( 'Date filters' ) ).not.toBeInTheDocument();
		expect( screen.getByText( 'Body' ) ).toBeInTheDocument();
	} );

	it( 'leaves the header out for a page-level state', () => {
		renderLayout( { header: undefined } );

		expect( screen.queryByRole( 'heading', { level: 2 } ) ).not.toBeInTheDocument();
		expect( screen.getByText( 'Body' ) ).toBeInTheDocument();
	} );
} );
