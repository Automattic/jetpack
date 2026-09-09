import { render, screen } from '@testing-library/react';
import StatsCards from '../cards.jsx';

const HREF = 'admin.php?page=stats&force_refresh=1';

const noop = () => {};

const renderCards = ( props = {} ) =>
	render(
		<StatsCards
			counts={ { views: 10, visitors: 5, likes: 2, comments: 1 } }
			previousCounts={ { views: 8, visitors: 4, likes: 1, comments: 1 } }
			headingLevel={ 3 }
			chartData={ null }
			isLoading={ false }
			detailedStatsHref={ HREF }
			onDetailedStatsClick={ noop }
			{ ...props }
		/>
	);

describe( 'StatsCards detailed stats link', () => {
	it( 'points the heading at the detailed stats page', () => {
		renderCards();

		expect( screen.getByRole( 'link', { name: /Views in the last 7 days/ } ) ).toHaveAttribute(
			'href',
			HREF
		);
	} );

	// Without a label the link is named by its content: the empty-state copy or the axis ticks.
	it( 'names the chart link by its destination', () => {
		renderCards();

		expect( screen.getByRole( 'link', { name: 'View detailed stats' } ) ).toHaveAttribute(
			'href',
			HREF
		);
	} );

	// The card is inside a "slim" ProductCard, which renders no action buttons, so these
	// links are the only route to the Stats page.
	it( 'leaves no link behind when the product has no manage URL', () => {
		renderCards( { detailedStatsHref: undefined } );

		expect( screen.queryByRole( 'link' ) ).not.toBeInTheDocument();
	} );
} );
