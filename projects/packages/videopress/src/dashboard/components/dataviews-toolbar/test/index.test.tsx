import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LayoutToggle } from '..';
import type { SupportedLayouts, View } from '@wordpress/dataviews';

const defaultLayouts = {
	grid: { layout: { previewSize: 220 } },
	table: { layout: { density: 'balanced' } },
} satisfies SupportedLayouts;

const gridView: View = {
	type: 'grid',
	fields: [ 'orientation' ],
	layout: { previewSize: 300 },
	search: 'cats',
};

describe( 'LayoutToggle', () => {
	it( 'switches to the other layout in one click, keeping the rest of the view', async () => {
		const onChangeView = jest.fn();
		render(
			<LayoutToggle
				view={ gridView }
				onChangeView={ onChangeView }
				defaultLayouts={ defaultLayouts }
			/>
		);

		expect( screen.getByRole( 'button', { name: 'Grid' } ) ).toHaveAttribute(
			'aria-pressed',
			'true'
		);
		await userEvent.click( screen.getByRole( 'button', { name: 'Table' } ) );

		expect( onChangeView ).toHaveBeenCalledWith( {
			type: 'table',
			fields: [ 'orientation' ],
			layout: { density: 'balanced' },
			search: 'cats',
		} );
	} );

	it( 'does nothing when the current layout is clicked', async () => {
		const onChangeView = jest.fn();
		render(
			<LayoutToggle
				view={ gridView }
				onChangeView={ onChangeView }
				defaultLayouts={ defaultLayouts }
			/>
		);

		await userEvent.click( screen.getByRole( 'button', { name: 'Grid' } ) );

		expect( onChangeView ).not.toHaveBeenCalled();
	} );
} );
