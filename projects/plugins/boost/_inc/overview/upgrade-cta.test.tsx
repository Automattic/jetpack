import { render, screen } from '@testing-library/react';
import { Notice } from '@wordpress/ui';
import { OVERVIEW_UPGRADE_EVENT, type UpgradeSlotRequest } from './lib/upgrade-bridge';
import UpgradeCTA from './upgrade-cta';

test( 'mounts and releases the upgrade UI once when the notice changes to paid', () => {
	const cleanup = jest.fn();
	const handleMount = jest.fn( ( event: Event ) => {
		const request = ( event as CustomEvent< UpgradeSlotRequest > ).detail;
		request.container.textContent = 'Existing upgrade flow';
		request.unmount = cleanup;
	} );
	window.addEventListener( OVERVIEW_UPGRADE_EVENT, handleMount );
	try {
		const { rerender, unmount } = render(
			<Notice.Root intent="info" spokenMessage="Unlock historical performance">
				<Notice.Title>Unlock historical performance</Notice.Title>
				<Notice.Actions>
					<UpgradeCTA />
				</Notice.Actions>
			</Notice.Root>
		);
		expect( screen.getByText( 'Existing upgrade flow' ) ).toBeInTheDocument();
		expect( handleMount ).toHaveBeenCalledTimes( 1 );
		rerender(
			<Notice.Root intent="success" spokenMessage="History is ready">
				<Notice.Title>History is ready</Notice.Title>
			</Notice.Root>
		);
		expect( screen.queryByText( 'Existing upgrade flow' ) ).not.toBeInTheDocument();
		expect( cleanup ).toHaveBeenCalledTimes( 1 );
		unmount();
		expect( handleMount ).toHaveBeenCalledTimes( 1 );
		expect( cleanup ).toHaveBeenCalledTimes( 1 );
	} finally {
		window.removeEventListener( OVERVIEW_UPGRADE_EVENT, handleMount );
	}
} );
