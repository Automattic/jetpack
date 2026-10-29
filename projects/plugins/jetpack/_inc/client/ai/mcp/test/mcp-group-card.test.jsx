import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AnchorCopyButton from '../anchor-copy-button';
import McpGroupCard from '../mcp-group-card';

const renderCard = props =>
	render(
		<McpGroupCard
			label="Posts"
			allEnabled={ false }
			isSaving={ false }
			onEnableAll={ jest.fn() }
			{ ...props }
		>
			<p>Card body</p>
		</McpGroupCard>
	);

describe( 'McpGroupCard', () => {
	test( 'opens from the chevron', async () => {
		renderCard();
		expect( screen.queryByText( 'Card body' ) ).not.toBeInTheDocument();

		await userEvent.click( screen.getByRole( 'button', { name: 'Show operations' } ) );

		expect( screen.getByText( 'Card body' ) ).toBeInTheDocument();
	} );

	test( 'stays open and locks the chevron while forceOpen is set', () => {
		renderCard( { forceOpen: true } );

		expect( screen.getByText( 'Card body' ) ).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Hide operations' } ) ).toBeDisabled();
	} );

	test( 'reports the new state from Enable all', async () => {
		const onEnableAll = jest.fn();
		renderCard( { onEnableAll } );

		await userEvent.click( screen.getByRole( 'switch', { name: 'Enable all' } ) );

		expect( onEnableAll ).toHaveBeenCalledWith( true, undefined );
	} );
} );

describe( 'AnchorCopyButton', () => {
	test( 'copies a link with the anchor in the hash path and shows Copied', async () => {
		const writeText = jest.fn().mockResolvedValue();
		Object.defineProperty( window.navigator, 'clipboard', {
			value: { writeText },
			configurable: true,
		} );
		render( <AnchorCopyButton view="mcp/read" anchor="wpcom-mcp/posts-list" /> );

		await userEvent.click( screen.getByRole( 'button', { name: 'Copy link to this tool' } ) );

		expect( writeText ).toHaveBeenCalledWith(
			expect.stringMatching( /#\/mcp\/read\/wpcom-mcp\/posts-list$/ )
		);
		await expect( screen.findByRole( 'button', { name: 'Copied' } ) ).resolves.toBeInTheDocument();
	} );
} );
