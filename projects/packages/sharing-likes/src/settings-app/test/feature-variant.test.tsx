import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import { FeatureVariant } from '../components/feature-variant';
import { SECTION_GAP } from '../components/section-card';
import { apiCalls, baseSettings, baseStatus, renderWithData } from './helpers';
import type { Feature, SectionState } from '../types';

jest.mock( '@wordpress/api-fetch' );
const mockApiFetch = apiFetch as jest.MockedFunction< typeof apiFetch >;

beforeEach( () => {
	mockApiFetch.mockReset();
	mockApiFetch.mockResolvedValue( baseStatus );
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
		'%s %s, on a server that does not offer the placements',
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
			expect( screen.queryAllByRole( 'button' ).map( node => node.textContent ) ).toEqual(
				button ? [ button ] : []
			);
		}
	);

	it.each(
		( [ 'sharing', 'likes' ] as Feature[] ).flatMap( feature =>
			(
				[
					'configure',
					'configure_with_block_nudge',
					'block_call_to_action',
					'off',
				] as SectionState[]
			 ).map( state => [ feature, state ] as [ Feature, SectionState ] )
		)
	)( '%s %s with placements offered', ( feature, state ) => {
		renderWithData( <FeatureVariant feature={ feature } state={ state } />, {
			settings: { ...baseSettings, sharing_buttons_auto_add: [], likes_auto_add: [] },
		} );

		expect( screen.queryAllByRole( 'checkbox' ) ).toHaveLength(
			state === 'block_call_to_action' ? 2 : 0
		);
		expect( screen.queryByRole( 'link', { name: 'Open Site Editor' } ) ).not.toBeInTheDocument();
	} );

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

	it( 'spaces the notice and the options the way the card spaces its other content', () => {
		renderWithData(
			<FeatureVariant feature="sharing" state="configure_with_block_nudge">
				<p>options</p>
			</FeatureVariant>
		);

		// eslint-disable-next-line testing-library/no-node-access -- The spacing lives on an unlabelled container.
		const variant = screen.getByText( 'options' ).parentElement;
		expect( variant?.style.gap ).toContain( `dimension-gap-${ SECTION_GAP }` );
	} );
} );
