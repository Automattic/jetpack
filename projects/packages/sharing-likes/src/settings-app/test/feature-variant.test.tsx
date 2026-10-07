import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import { FeatureVariant } from '../components/feature-variant';
import { apiCalls, baseStatus, renderWithData, resetNotices } from './helpers';
import type { Feature, SectionState } from '../types';

jest.mock( '@wordpress/api-fetch' );
const mockApiFetch = apiFetch as jest.MockedFunction< typeof apiFetch >;

beforeEach( () => {
	mockApiFetch.mockReset();
	mockApiFetch.mockResolvedValue( baseStatus );
	resetNotices();
} );

describe( 'FeatureVariant', () => {
	it.each( [
		[ 'sharing', 'configure', [], null ],
		[
			'sharing',
			'configure_with_block_nudge',
			[
				'Legacy sharing buttons cannot be customized on block themes. Use the Sharing Buttons block in your theme’s template instead.',
			],
			'Switch to the Sharing Buttons block',
		],
		[
			'sharing',
			'block_call_to_action',
			[ 'Add the Sharing Buttons block to your theme’s template.' ],
			null,
		],
		[
			'sharing',
			'off',
			[ 'Sharing buttons are turned off for this site.' ],
			'Turn on sharing buttons',
		],
		[ 'likes', 'configure', [], null ],
		[
			'likes',
			'configure_with_block_nudge',
			[
				'Legacy Like buttons cannot be customized on block themes. Use the Like block in your theme’s template instead.',
			],
			'Switch to the Like block',
		],
		[ 'likes', 'block_call_to_action', [ 'Add the Like block to your theme’s template.' ], null ],
		[ 'likes', 'off', [ 'Like buttons are turned off for this site.' ], 'Turn on Like buttons' ],
	] as [ Feature, SectionState, string[], string | null ][] )(
		'%s %s',
		( feature, state, texts, button ) => {
			renderWithData(
				<FeatureVariant feature={ feature } state={ state }>
					<p>options</p>
				</FeatureVariant>
			);

			texts.forEach( text => expect( screen.getByText( text ) ).toBeInTheDocument() );
			const showsOptions = state === 'configure' || state === 'configure_with_block_nudge';
			expect( screen.queryByText( 'options' ) !== null ).toBe( showsOptions );
			expect( screen.queryByRole( 'link', { name: 'Open Site Editor' } ) !== null ).toBe(
				state === 'block_call_to_action'
			);
			( button ? [ button ] : [] ).forEach( name =>
				expect( screen.getByRole( 'button', { name } ) ).toBeInTheDocument()
			);
		}
	);

	it.each( [
		[
			'configure_with_block_nudge',
			'Switch to the Like block',
			'/wpcom/v2/sharing-likes/likes/switch-to-block',
		],
		[ 'off', 'Turn on Like buttons', '/wpcom/v2/sharing-likes/likes/activate' ],
	] as [ SectionState, string, string ][] )(
		'%s posts its action',
		async ( state, button, path ) => {
			const user = userEvent.setup();
			renderWithData( <FeatureVariant feature="likes" state={ state } /> );

			await user.click( screen.getByRole( 'button', { name: button } ) );

			await waitFor( () => expect( apiCalls( 'POST' ) ).toEqual( [ { path, method: 'POST' } ] ) );
		}
	);
} );
