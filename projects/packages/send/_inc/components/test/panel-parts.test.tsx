/* eslint-disable testing-library/no-node-access -- a row's value is the `dd` beside its `dt`. */
import { render, screen } from '@testing-library/react';
import { PanelRow, PanelRows } from '../panel-parts';

describe( 'PanelRow', () => {
	it.each( [
		[ 'null', null ],
		[ 'an empty string', '' ],
		[ 'a list of parts that render nothing', [ false, false ] ],
		[ 'a list of empty strings and nulls', [ '', null, undefined ] ],
	] )( 'leaves no row behind for %s', ( _, value ) => {
		render(
			<PanelRows>
				<PanelRow label="Backup mail">{ value }</PanelRow>
			</PanelRows>
		);

		expect( screen.queryByText( 'Backup mail' ) ).not.toBeInTheDocument();
	} );

	it( 'shows a value of 0 and a value made of parts', () => {
		render(
			<PanelRows>
				<PanelRow label="Count">{ 0 }</PanelRow>
				<PanelRow label="Sent">
					{ false }
					{ 'Oct 19' }
				</PanelRow>
			</PanelRows>
		);

		expect( screen.getByText( 'Count', { selector: 'dt' } ).nextElementSibling ).toHaveTextContent(
			'0'
		);
		expect( screen.getByText( 'Sent', { selector: 'dt' } ).nextElementSibling ).toHaveTextContent(
			'Oct 19'
		);
	} );

	it( 'puts a long value under its label when asked', () => {
		render(
			<PanelRows>
				<PanelRow label="Message ID" stacked>
					abc@example.com
				</PanelRow>
			</PanelRows>
		);

		expect( screen.getByText( 'Message ID' ).closest( '.jetpack-send-panel__row' ) ).toHaveClass(
			'jetpack-send-panel__row--stacked'
		);
	} );
} );
