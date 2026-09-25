import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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
	beforeEach( () => {
		mockIsDesktop = true;
	} );

	it( 'steps to the neighboring features with the arrow keys', async () => {
		const onStep = openModal( { previous: stats, next: podcast } );
		// A browser traps focus in the dialog; jsdom leaves it on the body.
		screen.getByRole( 'dialog' ).focus();

		await userEvent.keyboard( '{ArrowRight}' );
		await userEvent.keyboard( '{ArrowLeft}' );

		expect( onStep.mock.calls ).toEqual( [ [ 'podcast' ], [ 'stats' ] ] );
	} );

	it( 'stays put at the end of the list, and still steps back from it', async () => {
		const onStep = openModal( { previous: stats } );
		screen.getByRole( 'dialog' ).focus();

		await userEvent.keyboard( '{ArrowRight}{ArrowLeft}' );

		expect( onStep.mock.calls ).toEqual( [ [ 'stats' ] ] );
	} );

	it( "moves focus to the new feature's action after an arrow-key step", async () => {
		const withLinks = ( slug: string, extra = {} ) =>
			( {
				...state,
				feature: { ...state.feature, slug, name: slug, info_url: 'https://jetpack.com/', ...extra },
			} ) as FeatureState;
		const modal = ( current: FeatureState, onStep: ( slug: string ) => void ) => (
			<FeatureModal
				state={ current }
				next={ podcast }
				position={ 1 }
				total={ 2 }
				onStep={ onStep }
				onClose={ jest.fn() }
				onFilterByPlan={ jest.fn() }
			/>
		);
		const onStep = jest.fn();
		const { rerender } = render( modal( withLinks( 'forms' ), onStep ) );
		// Let the dialog place its own initial focus first, then move away from it.
		await waitFor( () => expect( screen.getByRole( 'button', { name: 'Close' } ) ).toHaveFocus() );
		screen.getByRole( 'link', { name: /Feature page/ } ).focus();

		await userEvent.keyboard( '{ArrowRight}' );
		rerender( modal( withLinks( 'podcast', { manage_url: '/podcast' } ), onStep ) );

		expect( onStep ).toHaveBeenCalledWith( 'podcast' );
		expect( screen.getByRole( 'link', { name: 'Open' } ) ).toHaveFocus();
	} );

	it( 'resets a failed band image when stepping to a feature with its own', () => {
		const withScreenshot = ( slug: string, name: string ) =>
			( {
				...state,
				feature: {
					...state.feature,
					slug,
					name,
					screenshot: `https://jetpack.com/${ slug }.png`,
				},
			} ) as FeatureState;
		const modal = ( current: FeatureState ) => (
			<FeatureModal
				state={ current }
				position={ 1 }
				total={ 2 }
				onStep={ jest.fn() }
				onClose={ jest.fn() }
				onFilterByPlan={ jest.fn() }
			/>
		);
		const { rerender } = render( modal( withScreenshot( 'forms', 'Forms' ) ) );

		fireEvent.error( screen.getByAltText( 'Forms in use' ) );
		expect( screen.queryByAltText( 'Forms in use' ) ).not.toBeInTheDocument();

		rerender( modal( withScreenshot( 'podcast', 'Podcast' ) ) );

		expect( screen.getByAltText( 'Podcast in use' ) ).toBeInTheDocument();
		expect( console ).toHaveErrored();
	} );

	it( 'names the backdrop the way the view-transition rule expects', () => {
		openModal( {} );

		// styles.module.scss gives this element its own layer; a rename would bring the flicker back.
		expect( screen.getByTestId( 'dialog-backdrop' ) ).toBeInTheDocument();
	} );

	it( 'announces which feature is showing and where it sits', () => {
		openModal( {} );

		expect( screen.getByRole( 'status' ) ).toHaveTextContent( 'Forms, 2 of 3' );
	} );

	it( 'steps with the footer buttons, which name where they go', async () => {
		const onStep = openModal( { previous: stats, next: podcast } );

		await userEvent.click( screen.getByRole( 'button', { name: 'Next: Podcast' } ) );
		await userEvent.click( screen.getByRole( 'button', { name: 'Previous: Stats' } ) );

		expect( onStep.mock.calls ).toEqual( [ [ 'podcast' ], [ 'stats' ] ] );
	} );

	it( 'keeps a footer button focusable but inert at the end of the list', async () => {
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
	} );
} );
