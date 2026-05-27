import { render, screen } from '@testing-library/react';
import { CategorySparkline } from '@/routes/overview/category-sparkline';

describe( 'CategorySparkline', () => {
	it( 'renders nothing when the series is empty', () => {
		const { container } = render( <CategorySparkline series={ [] } label="Logins" /> );
		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'renders an accessible <svg role="img"> when given points', () => {
		const series = [
			{ date: '2026-05-25', blocked: 10 },
			{ date: '2026-05-26', blocked: 20 },
			{ date: '2026-05-27', blocked: 5 },
		];
		render( <CategorySparkline series={ series } label="Comments" /> );
		expect( screen.getByRole( 'img', { name: /comments/i } ) ).toBeInTheDocument();
		expect( screen.getByTestId( 'akismet-sparkline-polyline' ) ).toBeInTheDocument();
	} );

	it( 'handles a single-point series without dividing by zero', () => {
		const series = [ { date: '2026-05-27', blocked: 7 } ];
		render( <CategorySparkline series={ series } label="Logins" /> );
		expect( screen.getByRole( 'img', { name: /logins/i } ) ).toBeInTheDocument();
	} );

	it( 'flattens a constant series without NaN coordinates', () => {
		const series = [
			{ date: '2026-05-25', blocked: 10 },
			{ date: '2026-05-26', blocked: 10 },
			{ date: '2026-05-27', blocked: 10 },
		];
		render( <CategorySparkline series={ series } label="Logins" /> );
		const polyline = screen.getByTestId( 'akismet-sparkline-polyline' );
		expect( polyline.getAttribute( 'points' ) ).not.toMatch( /NaN/ );
	} );
} );
