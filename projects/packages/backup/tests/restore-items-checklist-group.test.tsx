// Ungrouped, each checkbox is read out without the question it answers.

import { render, screen, within } from '@testing-library/react';
import RestoreItemsChecklist from '../src/dashboard/components/restore-items-checklist';
import { DEFAULT_RESTORE_ITEMS } from '../src/dashboard/types/restore';

it( 'groups all six checkboxes under the question they answer', async () => {
	render(
		<RestoreItemsChecklist
			legend="Choose the items you wish to restore:"
			value={ DEFAULT_RESTORE_ITEMS }
			onChange={ jest.fn() }
		/>
	);

	const group = await screen.findByRole( 'group', {
		name: 'Choose the items you wish to restore:',
	} );
	expect( within( group ).getAllByRole( 'checkbox' ) ).toHaveLength( 6 );
} );
