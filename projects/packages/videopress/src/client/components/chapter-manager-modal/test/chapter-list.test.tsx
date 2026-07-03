import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChapterList from '../chapter-list';
import type { ChapterRow, ChapterValidationError } from '../chapter-workspace';

jest.mock( '@wordpress/components', () => ( {
	Button: ( { children, label, onClick, disabled } ) => (
		<button aria-label={ label } onClick={ onClick } disabled={ disabled }>
			{ children }
		</button>
	),
	TextControl: ( { label, onBlur, onChange, onKeyDown, value, disabled } ) => (
		<div>
			<input
				aria-label={ label }
				value={ value }
				disabled={ disabled }
				onChange={ event => onChange( event.target.value ) }
				onBlur={ onBlur }
				onKeyDown={ onKeyDown }
			/>
		</div>
	),
} ) );

const ROWS: ChapterRow[] = [
	{ id: 1, seconds: 0, title: 'Intro' },
	{ id: 2, seconds: 84, title: 'Middle' },
	{ id: 3, seconds: 184, title: 'End' },
];

const NO_ERRORS: ChapterValidationError[] = [];

const renderList = ( props: Partial< Parameters< typeof ChapterList >[ 0 ] > = {} ) => {
	const handlers = {
		onSetTime: jest.fn(),
		onSetTitle: jest.fn(),
		onRemove: jest.fn(),
		onSeek: jest.fn(),
	};
	render(
		<ChapterList
			rows={ ROWS }
			errors={ NO_ERRORS }
			disabled={ false }
			{ ...handlers }
			{ ...props }
		/>
	);
	return handlers;
};

describe( 'ChapterList', () => {
	it( 'renders a row per chapter with formatted times', () => {
		renderList();
		const timeInputs = screen.getAllByLabelText( 'Start time' );
		expect( timeInputs.map( input => ( input as HTMLInputElement ).value ) ).toEqual( [
			'00:00',
			'01:24',
			'03:04',
		] );
	} );

	it( 'disables the first row time field', () => {
		renderList();
		const timeInputs = screen.getAllByLabelText( 'Start time' );
		expect( timeInputs[ 0 ] ).toBeDisabled();
		expect( timeInputs[ 1 ] ).toBeEnabled();
	} );

	it( 'commits a valid time on blur', async () => {
		const { onSetTime } = renderList();
		const timeInput = screen.getAllByLabelText( 'Start time' )[ 1 ];
		await userEvent.clear( timeInput );
		await userEvent.type( timeInput, '02:30' );
		fireEvent.blur( timeInput );
		expect( onSetTime ).toHaveBeenCalledWith( 2, 150 );
	} );

	it( 'reverts invalid time input on blur without committing', async () => {
		const { onSetTime } = renderList();
		const timeInput = screen.getAllByLabelText( 'Start time' )[ 1 ] as HTMLInputElement;
		await userEvent.clear( timeInput );
		await userEvent.type( timeInput, 'nonsense' );
		fireEvent.blur( timeInput );
		expect( onSetTime ).not.toHaveBeenCalled();
		expect( timeInput.value ).toBe( '01:24' );
	} );

	it( 'commits a valid time on Enter', async () => {
		const { onSetTime } = renderList();
		const timeInput = screen.getAllByLabelText( 'Start time' )[ 2 ];
		await userEvent.clear( timeInput );
		await userEvent.type( timeInput, '05:00{enter}' );
		expect( onSetTime ).toHaveBeenCalledWith( 3, 300 );
	} );

	it( 'reports title edits', async () => {
		const { onSetTitle } = renderList();
		const titleInput = screen.getAllByLabelText( 'Title' )[ 0 ];
		await userEvent.type( titleInput, '!' );
		expect( onSetTitle ).toHaveBeenCalledWith( 1, 'Intro!' );
	} );

	it( 'removes a row', async () => {
		const { onRemove } = renderList();
		await userEvent.click( screen.getAllByLabelText( 'Remove chapter' )[ 2 ] );
		expect( onRemove ).toHaveBeenCalledWith( 3 );
	} );

	it( 'seeks the preview to a row start time', async () => {
		const { onSeek } = renderList();
		await userEvent.click( screen.getAllByLabelText( 'Preview from here' )[ 1 ] );
		expect( onSeek ).toHaveBeenCalledWith( 84 );
	} );

	it( 'shows a gap error on the flagged row', () => {
		renderList( { errors: [ { code: 'gap', rowId: 2 } ] } );
		expect( screen.getByText( 'Chapters must be at least 10 seconds apart.' ) ).toBeInTheDocument();
	} );

	it( 'shows an empty-title error on the flagged row', () => {
		renderList( { errors: [ { code: 'empty-title', rowId: 3 } ] } );
		expect( screen.getByText( 'Add a title for this chapter.' ) ).toBeInTheDocument();
	} );
} );
