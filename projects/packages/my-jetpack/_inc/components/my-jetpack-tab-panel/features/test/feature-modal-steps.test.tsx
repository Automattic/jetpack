import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FeatureModal } from '../feature-modal';
import type { FeatureState } from '../feature-state';

let mockIsDesktop = true;
jest.mock( '@wordpress/compose', () => ( {
	...jest.requireActual( '@wordpress/compose' ),
	useViewportMatch: () => mockIsDesktop,
} ) );

const stats = { slug: 'stats', name: 'Stats' };
const podcast = { slug: 'podcast', name: 'Podcast' };

const state = {
	feature: {
		slug: 'forms',
		name: 'Forms',
		description: 'Build forms.',
		long_description: '',
		free_highlights: [],
		paid_highlights: [],
		plans: [],
		upgrade: { path: '', name: '' },
	},
	status: 'active',
	control: { kind: 'none' },
} as unknown as FeatureState;

const openModal = ( props: { previous?: typeof stats; next?: typeof stats } ) => {
	const onStep = jest.fn();
	render(
		<FeatureModal
			state={ state }
			position={ 2 }
			total={ 3 }
			onStep={ onStep }
			onClose={ jest.fn() }
			onFilterByPlan={ jest.fn() }
			{ ...props }
		/>
	);
	return onStep;
};

describe( 'FeatureModal stepping', () => {
	it( 'steps to the neighbouring features with the arrow keys', async () => {
		const onStep = openModal( { previous: stats, next: podcast } );

		await userEvent.keyboard( '{ArrowRight}' );
		await userEvent.keyboard( '{ArrowLeft}' );

		expect( onStep.mock.calls ).toEqual( [ [ 'podcast' ], [ 'stats' ] ] );
	} );

	it( 'stays put at either end of the list', async () => {
		const onStep = openModal( {} );

		await userEvent.keyboard( '{ArrowRight}{ArrowLeft}' );

		expect( onStep ).not.toHaveBeenCalled();
	} );

	it( 'announces which feature is showing and where it sits', () => {
		openModal( {} );

		expect( screen.getByRole( 'status' ) ).toHaveTextContent( 'Forms, 2 of 3' );
	} );

	it( 'steps with the footer buttons, which name where they go', async () => {
		mockIsDesktop = true;
		const onStep = openModal( { previous: stats, next: podcast } );

		await userEvent.click( screen.getByRole( 'button', { name: 'Next: Podcast' } ) );
		await userEvent.click( screen.getByRole( 'button', { name: 'Previous: Stats' } ) );

		expect( onStep.mock.calls ).toEqual( [ [ 'podcast' ], [ 'stats' ] ] );
	} );

	it( 'keeps a footer button focusable but inert at the end of the list', async () => {
		mockIsDesktop = true;
		const onStep = openModal( { previous: stats } );
		const next = screen.getByRole( 'button', { name: 'Next feature' } );

		await userEvent.click( next );

		expect( next ).toHaveAttribute( 'aria-disabled', 'true' );
		expect( onStep ).not.toHaveBeenCalled();
	} );

	it( 'leaves the step buttons out of the phone sheet', () => {
		mockIsDesktop = false;
		openModal( { previous: stats, next: podcast } );

		expect( screen.queryByRole( 'button', { name: /Next/ } ) ).not.toBeInTheDocument();
		mockIsDesktop = true;
	} );
} );
