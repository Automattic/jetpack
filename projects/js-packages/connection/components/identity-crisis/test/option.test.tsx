import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import IdentityCrisisOption from '../option';

describe( 'IdentityCrisisOption', () => {
	it( 'ignores clicks while busy, even when the host does not pass disabled', async () => {
		const onClick = jest.fn();
		render(
			<IdentityCrisisOption
				title="Connect separately"
				description="Description"
				buttonLabel="Connect separately"
				onClick={ onClick }
				isBusy
			/>
		);

		await userEvent.click( screen.getByRole( 'button', { name: /Connect separately/ } ) );

		expect( onClick ).not.toHaveBeenCalled();
	} );
} );
