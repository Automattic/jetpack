import { currentUserCan, getScriptData } from '@automattic/jetpack-script-data';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useViewportMatch } from '@wordpress/compose';
import { useState } from 'react';
import { CustomizeActions } from '../customize-actions';

jest.mock(
	'@automattic/jetpack-analytics',
	() => jest.requireActual( '../../../../../../tests/js/analytics-test-utils' ).mockJetpackAnalytics
);
jest.mock(
	'@automattic/jetpack-script-data',
	() =>
		jest.requireActual( '../../../../../../tests/js/script-data-test-utils' ).mockJetpackScriptData
);
jest.mock( '@wordpress/api-fetch', () => jest.fn() );
jest.mock( '@wordpress/compose', () => ( {
	...jest.requireActual( '@wordpress/compose' ),
	useViewportMatch: jest.fn( () => false ),
} ) );

const editingActions = <div data-testid="dashboard-actions" />;

const setupUser = () => userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );

beforeEach( () => {
	jest.useFakeTimers();
	jest.mocked( getScriptData ).mockReturnValue( {} as ReturnType< typeof getScriptData > );
	jest.mocked( currentUserCan ).mockReturnValue( false );
	jest.mocked( useViewportMatch ).mockReturnValue( false );
} );

afterEach( () => {
	jest.useRealTimers();
} );

describe( 'CustomizeActions', () => {
	it( 'offers Customize as a button outside the menu', async () => {
		const user = setupUser();
		const onCustomize = jest.fn();
		render(
			<CustomizeActions
				isCustomizing={ false }
				onCustomize={ onCustomize }
				onReset={ () => {} }
				editingActions={ editingActions }
			>
				<a href="https://example.com/">View post</a>
			</CustomizeActions>
		);

		expect( screen.getByRole( 'link', { name: 'View post' } ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: 'Reset to default' } ) ).not.toBeInTheDocument();

		await user.click( screen.getByRole( 'button', { name: 'Page options' } ) );
		const items = await screen.findAllByRole( 'menuitem' );
		expect( items.map( item => item.textContent ) ).toEqual( [ 'Any feedback?' ] );
		await user.keyboard( '{Escape}' );

		await user.click( screen.getByRole( 'button', { name: 'Customize' } ) );

		expect( onCustomize ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'offers Customize from the menu on a narrow screen', async () => {
		jest.mocked( useViewportMatch ).mockReturnValue( true );
		const user = setupUser();
		const onCustomize = jest.fn();
		render(
			<CustomizeActions
				isCustomizing={ false }
				onCustomize={ onCustomize }
				editingActions={ editingActions }
			/>
		);

		expect( screen.queryByRole( 'button', { name: 'Customize' } ) ).not.toBeInTheDocument();

		await user.click( screen.getByRole( 'button', { name: 'Page options' } ) );
		await user.click( await screen.findByRole( 'menuitem', { name: 'Customize' } ) );

		expect( onCustomize ).toHaveBeenCalledTimes( 1 );
		// Closing hands focus back to the trigger, whose tooltip opens on a timer.
		await act( () => jest.runOnlyPendingTimersAsync() );
	} );

	it( "swaps Customize for Reset to default beside the dashboard's own actions, keeping the menu", () => {
		render(
			<CustomizeActions
				isCustomizing
				onCustomize={ () => {} }
				onReset={ () => {} }
				editingActions={ editingActions }
			>
				<a href="https://example.com/">View post</a>
			</CustomizeActions>
		);

		expect( screen.getByTestId( 'dashboard-actions' ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'link' ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: 'Customize' } ) ).not.toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Reset to default' } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Page options' } ) ).toBeInTheDocument();
	} );

	it.each( [
		[ 'Customize', () => {} ],
		[ 'Page options', undefined ],
	] )(
		'moves focus onto %s when leaving unmounts the focused control',
		async ( target, onCustomize ) => {
			const user = setupUser();
			const dashboardActions = (
				<>
					<button>Cancel</button>
					<button disabled>Done</button>
				</>
			);
			const { rerender } = render(
				<CustomizeActions
					isCustomizing
					onCustomize={ onCustomize }
					editingActions={ dashboardActions }
				/>
			);

			await user.click( screen.getByRole( 'button', { name: 'Cancel' } ) );
			rerender(
				<CustomizeActions
					isCustomizing={ false }
					onCustomize={ onCustomize }
					editingActions={ dashboardActions }
				/>
			);
			expect( screen.getByRole( 'button', { name: target } ) ).toHaveFocus();
		}
	);

	it( 'leaves focus alone at load and when customize mode starts on its own, as an empty layout does', () => {
		const dashboardActions = <button>Cancel</button>;
		const { rerender } = render(
			<CustomizeActions
				isCustomizing={ false }
				onCustomize={ () => {} }
				editingActions={ dashboardActions }
			/>
		);
		expect( document.body ).toHaveFocus();

		rerender(
			<CustomizeActions
				isCustomizing
				onCustomize={ () => {} }
				editingActions={ dashboardActions }
			/>
		);

		expect( screen.getByRole( 'button', { name: 'Cancel' } ) ).not.toHaveFocus();
	} );

	it( 'leaves focus alone when customize mode ends while focus is elsewhere, as on a tab switch', () => {
		const dashboardActions = <button>Cancel</button>;
		const page = ( isCustomizing: boolean ) => (
			<>
				<button>Tab</button>
				<CustomizeActions
					isCustomizing={ isCustomizing }
					onCustomize={ () => {} }
					editingActions={ dashboardActions }
				/>
			</>
		);
		const { rerender } = render( page( true ) );
		const tab = screen.getByRole( 'button', { name: 'Tab' } );
		act( () => tab.focus() );

		rerender( page( false ) );

		expect( tab ).toHaveFocus();
	} );

	it( 'moves focus onto the first editing action when entering unmounts Customize', async () => {
		const user = setupUser();
		const dashboardActions = (
			<>
				<button>Cancel</button>
				<button disabled>Done</button>
			</>
		);
		const { rerender } = render(
			<CustomizeActions
				isCustomizing={ false }
				onCustomize={ () => {} }
				editingActions={ dashboardActions }
			/>
		);

		await user.click( screen.getByRole( 'button', { name: 'Customize' } ) );
		rerender(
			<CustomizeActions
				isCustomizing
				onCustomize={ () => {} }
				editingActions={ dashboardActions }
			/>
		);
		expect( screen.getByRole( 'button', { name: 'Cancel' } ) ).toHaveFocus();
	} );

	it( 'moves focus onto Customize after Reset to default, even once another popup has closed', async () => {
		const user = setupUser();
		function Page() {
			const [ isCustomizing, setIsCustomizing ] = useState( false );
			return (
				<CustomizeActions
					isCustomizing={ isCustomizing }
					onCustomize={ () => setIsCustomizing( true ) }
					onReset={ () => setIsCustomizing( false ) }
					editingActions={ <button>Cancel</button> }
				/>
			);
		}
		render( <Page /> );

		await user.click( screen.getByRole( 'button', { name: 'Page options' } ) );
		await expect( screen.findAllByRole( 'menuitem' ) ).resolves.not.toHaveLength( 0 );
		await user.keyboard( '{Escape}' );
		await user.click( screen.getByRole( 'button', { name: 'Customize' } ) );
		await user.click( screen.getByRole( 'button', { name: 'Reset to default' } ) );
		await user.click(
			within( await screen.findByRole( 'alertdialog' ) ).getByRole( 'button', { name: 'Reset' } )
		);

		await waitFor( () => expect( screen.queryByRole( 'alertdialog' ) ).not.toBeInTheDocument() );
		expect( screen.getByRole( 'button', { name: 'Customize' } ) ).toHaveFocus();
	} );
} );
