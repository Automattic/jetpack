import { render, screen } from '@testing-library/react';
import IdentityCrisisErrorNotice from '../error-notice';

describe( 'IdentityCrisisErrorNotice', () => {
	it.each( [
		[ 'migrate', true ],
		[ 'start-fresh', false ],
		[ undefined, true ],
	] as const )( 'with action %s, shows a Migrate failure: %s', ( action, shown ) => {
		render(
			<IdentityCrisisErrorNotice
				error={ { action: 'migrate', cause: 'offline' } }
				action={ action }
			/>
		);

		expect( screen.queryByRole( 'alert' ) !== null ).toBe( shown );
	} );
} );
