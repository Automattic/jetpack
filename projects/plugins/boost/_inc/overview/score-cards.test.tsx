/* eslint-disable testing-library/prefer-user-event */
import { fireEvent, render, screen, within } from '@testing-library/react';
import ScoreCards from './score-cards';

test( 'the Overall information popover shows every grade and its score range', async () => {
	render(
		<ScoreCards
			scores={ {
				current: { mobile: 68, desktop: 80 },
				noBoost: null,
				isStale: false,
			} }
		/>
	);

	expect( screen.queryByRole( 'table' ) ).not.toBeInTheDocument();
	fireEvent.click(
		screen.getByRole( 'button', { name: 'How the overall grade is calculated' } )
	);
	const popover = within( await screen.findByRole( 'dialog', { name: 'Overall grade' } ) );
	expect( popover.getAllByRole( 'table' ) ).toHaveLength( 2 );
	for ( const [ grade, range ] of [
		[ 'A', '90+' ],
		[ 'B', '75 - 90' ],
		[ 'C', '50 - 75' ],
		[ 'D', '35 - 50' ],
		[ 'E', '25 - 35' ],
		[ 'F', '0 - 25' ],
	] ) {
		const row = within( popover.getByRole( 'row', { name: `${ grade } ${ range }` } ) );
		expect( row.getByRole( 'cell', { name: range } ) ).toBeVisible();
	}
} );
