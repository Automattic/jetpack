/* eslint-disable testing-library/prefer-user-event -- Exercise the document keyboard handler directly. */
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createEditSession, editSessionReducer } from '../../state/edit-session';
import Timeline from '../timeline';

it( 'disables edits during processing while transport remains available', async () => {
	const dispatch = jest.fn();
	const onTogglePlay = jest.fn();
	const session = editSessionReducer( createEditSession( 10000 ), {
		type: 'ADD_CUT',
		atMs: 5000,
		id: 'a',
	} );
	render(
		<Timeline
			session={ session }
			dispatch={ dispatch }
			currentMs={ 5000 }
			onSeek={ jest.fn() }
			onTogglePlay={ onTogglePlay }
			playing={ false }
			locked
		/>
	);
	expect( screen.getByRole( 'button', { name: 'New cut' } ) ).toHaveAttribute(
		'aria-disabled',
		'true'
	);
	fireEvent.keyDown( document.body, { key: 'Delete' } );
	fireEvent.keyDown( document.body, { key: 'z', ctrlKey: true } );
	fireEvent.keyDown( screen.getByRole( 'slider', { name: 'Trim start' } ), { key: 'ArrowRight' } );
	expect( dispatch ).not.toHaveBeenCalled();
	await userEvent.setup().click( screen.getByRole( 'button', { name: 'Play' } ) );
	expect( onTogglePlay ).toHaveBeenCalledTimes( 1 );
} );

it( 'does not offer another cut when only the minimum output remains', () => {
	render(
		<Timeline
			session={ createEditSession( 1000 ) }
			dispatch={ jest.fn() }
			currentMs={ 500 }
			onSeek={ jest.fn() }
			onTogglePlay={ jest.fn() }
			playing={ false }
		/>
	);
	expect( screen.getByRole( 'button', { name: 'New cut' } ) ).toHaveAttribute(
		'aria-disabled',
		'true'
	);
} );
