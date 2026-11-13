import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChipSelectEdit } from './chip-select-edit';

type Item = { count_roles: string[] };

const field = {
	id: 'count_roles',
	label: 'Count logged in page views from',
	elements: [ { value: 'editor', label: 'Editor' } ],
	getValue: ( { item }: { item: Item } ) => item.count_roles,
	setValue: ( { value }: { value: string[] } ) => ( { count_roles: value } ),
};

describe( 'ChipSelectEdit', () => {
	it( 'keeps a stored value with no element when another chip is removed', async () => {
		const onChange = jest.fn();
		render(
			<ChipSelectEdit< Item >
				data={ { count_roles: [ 'retired', 'editor' ] } }
				field={ field as never }
				onChange={ onChange }
			/>
		);

		const remove = screen
			.getAllByRole( 'button', { name: 'Remove' } )
			.find( button => button.parentElement?.textContent?.includes( 'Editor' ) );
		await userEvent.click( remove as HTMLElement );

		expect( onChange ).toHaveBeenCalledWith( { count_roles: [ 'retired' ] } );
	} );
} );
