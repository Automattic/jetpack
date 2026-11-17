import { render, screen } from '@testing-library/react';
import IdentityCrisisOptions from '../options';

describe( 'IdentityCrisisOptions', () => {
	it( 'puts "or" only between options', () => {
		const { container } = render(
			<IdentityCrisisOptions>
				<div>First</div>
				<div>Second</div>
				<div>Third</div>
			</IdentityCrisisOptions>
		);

		expect( screen.getAllByText( 'or' ) ).toHaveLength( 2 );
		expect( container ).toHaveTextContent( /^First\s*or\s*Second\s*or\s*Third$/ );
	} );
} );
