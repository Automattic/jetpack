import { render, screen } from '@testing-library/react';
import { SinglePageLayout, type SinglePageLayoutProps } from './single-page-layout';

const CONTROLS = [
	{ id: 'reportParams', label: 'Date range', Edit: () => <div>Date filters</div> },
] as unknown as NonNullable< SinglePageLayoutProps[ 'controls' ] >;

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
			visual={ <svg data-testid="glyph" /> }
			title="Launch recap"
			subTitle="Video uploaded on Jan 10, 2026."
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
	it( 'renders the visual, the title with its hover text, the subtitle, the controls and the body', () => {
		renderLayout();

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
} );
