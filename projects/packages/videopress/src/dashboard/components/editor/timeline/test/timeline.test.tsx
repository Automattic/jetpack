/* eslint-disable testing-library/prefer-user-event -- Exercise keyboard and pointer-coordinate handlers directly. */
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createEditSession, editSessionReducer } from '../../state/edit-session';
import Timeline from '../timeline';

jest.mock( '../../../../../client/components/chapters-editor/timeline/use-element-width', () => ( {
	useElementWidth: () => ( { ref: () => {}, width: 1000 } ),
} ) );

beforeAll( () => {
	Object.assign( Element.prototype, {
		setPointerCapture: () => {},
		releasePointerCapture: () => {},
		hasPointerCapture: () => false,
	} );
} );

it( 'keeps source coordinates left-to-right inside an RTL editor', () => {
	const dispatch = jest.fn();
	const onSeek = jest.fn();
	const session = editSessionReducer( createEditSession( 10000 ), {
		type: 'ADD_CUT',
		atMs: 2000,
		halfSpanMs: 1000,
		id: 'a',
	} );
	render(
		<div dir="rtl">
			<Timeline
				session={ session }
				dispatch={ dispatch }
				currentMs={ 0 }
				onSeek={ onSeek }
				onTogglePlay={ jest.fn() }
				playing={ false }
			/>
		</div>
	);
	const scroller = screen.getByTestId( 'chapters-timeline-scroller' );
	const cut = screen.getByTestId( 'studio-timeline-cut-a' );
	expect( scroller ).toHaveAttribute( 'dir', 'ltr' );
	expect( scroller ).not.toContainElement( screen.getByRole( 'button', { name: 'New cut' } ) );
	expect( cut ).toHaveStyle( { insetInlineStart: '100px', inlineSize: '200px' } );

	fireEvent.pointerDown( cut, { button: 0, pointerId: 1, clientX: 150 } );
	fireEvent.pointerMove( cut, { pointerId: 1, clientX: 250 } );
	fireEvent.pointerUp( cut, { pointerId: 1 } );
	expect( dispatch ).toHaveBeenCalledWith( {
		type: 'TRANSIENT',
		fromBase: true,
		action: { type: 'MOVE_CUT', id: 'a', startMs: 2000 },
	} );

	fireEvent.pointerDown( screen.getByTestId( 'chapters-timeline-content' ), {
		button: 0,
		pointerId: 2,
		clientX: 200,
	} );
	expect( onSeek ).toHaveBeenLastCalledWith( 2000 );
} );

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
