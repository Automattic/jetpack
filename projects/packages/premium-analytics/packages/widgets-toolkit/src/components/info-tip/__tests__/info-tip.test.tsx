/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
/**
 * Internal dependencies
 */
import { InfoTip } from '../info-tip';

describe( 'InfoTip', () => {
	it( 'opens the explanation from a button named by the label', async () => {
		render( <InfoTip label="About Views">Views shaded by country.</InfoTip> );

		expect( screen.queryByText( 'Views shaded by country.' ) ).not.toBeInTheDocument();

		await userEvent.click( screen.getByRole( 'button', { name: 'About Views' } ) );

		await expect( screen.findByText( 'Views shaded by country.' ) ).resolves.toBeInTheDocument();
	} );

	it( 'closes on Escape', async () => {
		render( <InfoTip label="About Views">Views shaded by country.</InfoTip> );

		await userEvent.click( screen.getByRole( 'button', { name: 'About Views' } ) );
		await expect( screen.findByText( 'Views shaded by country.' ) ).resolves.toBeInTheDocument();

		await userEvent.keyboard( '{Escape}' );

		await expect( screen.findByText( 'Views shaded by country.' ) ).rejects.toThrow();
	} );

	it( 'opens on hover only when asked to', async () => {
		const { unmount } = render( <InfoTip label="About Views">Views shaded by country.</InfoTip> );

		await userEvent.hover( screen.getByRole( 'button', { name: 'About Views' } ) );
		await expect( screen.findByText( 'Views shaded by country.' ) ).rejects.toThrow();
		unmount();

		render(
			<InfoTip label="About Views" openOnHover>
				Views shaded by country.
			</InfoTip>
		);

		await userEvent.hover( screen.getByRole( 'button', { name: 'About Views' } ) );
		await expect( screen.findByText( 'Views shaded by country.' ) ).resolves.toBeInTheDocument();
	} );
} );
