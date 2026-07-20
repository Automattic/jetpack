/**
 * External dependencies
 */
import { render } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { LeaderboardLabel } from '../leaderboard-label';

// The shared CSS stub (tests/style-stub.cjs) returns an empty object, so the
// component's `styles.*` lookups would all be undefined and no class name would
// reach the DOM. Provide identity class names here so the `hugTrailing`
// modifier is observable.
jest.mock( '../leaderboard-label.module.scss', () => ( {
	container: 'container',
	hugTrailing: 'hugTrailing',
	label: 'label',
	labelImage: 'labelImage',
} ) );

describe( 'LeaderboardLabel', () => {
	it( 'drops the trailing inline padding when hugTrailing is set', () => {
		const { container } = render( <LeaderboardLabel label="Alex Rivera" hugTrailing /> );

		// eslint-disable-next-line testing-library/no-node-access -- the modifier lands on the rendered root; there is no role/text handle for it.
		const root = container.firstChild;
		expect( root ).toHaveClass( 'container' );
		expect( root ).toHaveClass( 'hugTrailing' );
	} );

	it( 'preserves the trailing inline padding by default', () => {
		const { container } = render( <LeaderboardLabel label="Alex Rivera" /> );

		// eslint-disable-next-line testing-library/no-node-access -- the modifier lands on the rendered root; there is no role/text handle for it.
		const root = container.firstChild;
		expect( root ).toHaveClass( 'container' );
		expect( root ).not.toHaveClass( 'hugTrailing' );
	} );
} );
