import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { SpotlightStep } from '../spotlight-step';

type HarnessProps = {
	withAnchor?: boolean;
	rect?: Pick< DOMRect, 'top' | 'left' | 'width' | 'height' >;
	step?: number;
	totalSteps?: number;
	scrollIntoView?: () => void;
	onNext: () => void;
	onDismiss: () => void;
};

// Mounts the anchor in the same tree as the step, the way a tour does.
function Harness( {
	withAnchor = true,
	rect,
	step = 1,
	totalSteps = 3,
	scrollIntoView,
	onNext,
	onDismiss,
}: HarnessProps ) {
	const [ anchor, setAnchor ] = useState< HTMLElement | null >( null );

	const attach = ( element: HTMLButtonElement | null ) => {
		if ( element && rect ) {
			element.getBoundingClientRect = () => rect as DOMRect;
		}
		if ( element && scrollIntoView ) {
			element.scrollIntoView = scrollIntoView;
		}
		setAnchor( element );
	};

	return (
		<>
			{ withAnchor && <button ref={ attach }>Options</button> }
			<SpotlightStep
				anchor={ anchor }
				title="Customize your experience"
				description="Access customization from this menu."
				step={ step }
				totalSteps={ totalSteps }
				onNext={ onNext }
				onDismiss={ onDismiss }
			/>
		</>
	);
}

async function renderStep( props: Partial< HarnessProps > = {} ) {
	const onNext = jest.fn();
	const onDismiss = jest.fn();
	const view = render( <Harness onNext={ onNext } onDismiss={ onDismiss } { ...props } /> );

	// The card positions itself asynchronously; let it settle before asserting.
	if ( props.withAnchor !== false ) {
		await expect( screen.findByRole( 'dialog' ) ).resolves.toBeInTheDocument();
	}

	return { ...view, onNext, onDismiss };
}

describe( 'SpotlightStep', () => {
	it( 'renders nothing until the anchor is mounted', async () => {
		await renderStep( { withAnchor: false } );

		expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument();
		expect( screen.queryByText( '1 of 3' ) ).not.toBeInTheDocument();
	} );

	it( 'shows the copy, the position in the tour and a way forward', async () => {
		await renderStep();

		expect(
			screen.getByRole( 'heading', { name: 'Customize your experience' } )
		).toBeInTheDocument();
		expect( screen.getByText( 'Access customization from this menu.' ) ).toBeInTheDocument();
		expect( screen.getByText( '1 of 3' ) ).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Continue' } ) ).toBeInTheDocument();
	} );

	it( 'offers Finish on the last step', async () => {
		await renderStep( { step: 3, totalSteps: 3 } );

		expect( screen.getByText( '3 of 3' ) ).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Finish' } ) ).toBeInTheDocument();
	} );

	it( 'moves forward on Continue', async () => {
		const { onNext, onDismiss } = await renderStep();

		await userEvent.click( screen.getByRole( 'button', { name: 'Continue' } ) );

		expect( onNext ).toHaveBeenCalledTimes( 1 );
		expect( onDismiss ).not.toHaveBeenCalled();
	} );

	it( 'leaves the tour on Escape', async () => {
		const { onNext, onDismiss } = await renderStep();

		await userEvent.keyboard( '{Escape}' );

		expect( onDismiss ).toHaveBeenCalledTimes( 1 );
		expect( onDismiss ).toHaveBeenCalledWith( 'escape' );
		expect( onNext ).not.toHaveBeenCalled();
	} );

	it( 'offers a way out besides walking every step', async () => {
		const { onNext, onDismiss } = await renderStep();

		await userEvent.click( screen.getByRole( 'button', { name: 'Skip tour' } ) );

		expect( onDismiss ).toHaveBeenCalledTimes( 1 );
		expect( onDismiss ).toHaveBeenCalledWith( 'close' );
		expect( onNext ).not.toHaveBeenCalled();
	} );

	it( 'keeps keyboard focus inside the card', async () => {
		await renderStep();
		const next = screen.getByRole( 'button', { name: 'Continue' } );
		const skip = screen.getByRole( 'button', { name: 'Skip tour' } );

		await waitFor( () => expect( next ).toHaveFocus() );

		// Base UI's focus guards hand focus back on the next frame.
		await userEvent.tab();
		await waitFor( () => expect( skip ).toHaveFocus() );

		await userEvent.tab();
		await waitFor( () => expect( next ).toHaveFocus() );
	} );

	it( 'draws the halo around the anchor with room to breathe', async () => {
		await renderStep( { rect: { top: 100, left: 200, width: 32, height: 24 } } );

		expect( screen.getByTestId( 'spotlight-halo' ) ).toHaveStyle( {
			top: '96px',
			left: '196px',
			width: '40px',
			height: '32px',
		} );
	} );

	it( 'brings the anchor into view', async () => {
		const scrollIntoView = jest.fn();
		await renderStep( { scrollIntoView } );

		expect( scrollIntoView ).toHaveBeenCalledWith( { block: 'nearest' } );
	} );

	it( 'dims the page from outside the tree it is rendered in', async () => {
		const { container } = await renderStep();
		const halo = screen.getByTestId( 'spotlight-halo' );

		expect( container ).not.toContainElement( halo );
		expect( document.body ).toContainElement( halo );
	} );
} );
