import { render, screen } from '@testing-library/react';
import AdminPage from '../index.tsx';

const pageAction = <button>Page action</button>;
const globalControl = <button>Global control</button>;

describe( 'AdminPage', () => {
	it.each( [
		[ 'page actions, a separator, then global controls', pageAction, globalControl, 1 ],
		[ 'global controls alone, without a separator', null, globalControl, 0 ],
		[ 'page actions alone, as before', pageAction, undefined, 0 ],
	] )( 'renders %s', ( _, actions, globalControls, separators ) => {
		render(
			<AdminPage
				title="Jetpack"
				actions={ actions }
				globalControls={ globalControls }
				showFooter={ false }
			>
				Content
			</AdminPage>
		);

		const expected = [ actions && 'Page action', globalControls && 'Global control' ].filter(
			Boolean
		);
		const buttons = screen.getAllByRole( 'button', { name: /Page action|Global control/ } );

		expect( buttons.map( button => button.textContent ) ).toEqual( expected );
		expect( screen.queryAllByRole( 'separator' ) ).toHaveLength( separators );
	} );
} );
