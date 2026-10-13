import { render, screen } from '@testing-library/react';
import { Notice } from '@wordpress/ui';
import { OVERVIEW_UPGRADE_EVENT, type UpgradeSlotRequest } from './lib/upgrade-bridge';
import UpgradeCTA from './upgrade-cta';

function setSite( site: { online: boolean; myJetpack?: boolean } ) {
	Object.defineProperty( globalThis, 'Jetpack_Boost', { configurable: true, value: { site } } );
}

beforeEach( () => setSite( { online: true, myJetpack: true } ) );

test( 'mounts the upgrade UI once and cleans up once when removed', () => {
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

test( 'falls back to an upgrade link when nothing mounts into the slot', () => {
	render( <UpgradeCTA /> );
	expect( screen.getByRole( 'link', { name: 'Upgrade now' } ) ).toHaveAttribute(
		'href',
		'admin.php?page=my-jetpack#/add-boost'
	);
} );

test.each( [
	[ 'the site is offline', { online: false, myJetpack: false } ],
	[ 'My Jetpack is filtered off', { online: true, myJetpack: false } ],
	[ 'My Jetpack availability is unknown', { online: true } ],
] )( 'does not request the upgrade UI when %s', ( _, site ) => {
	setSite( site );
	const handleMount = jest.fn();
	window.addEventListener( OVERVIEW_UPGRADE_EVENT, handleMount );
	try {
		const { container } = render( <UpgradeCTA /> );
		expect( container ).toBeEmptyDOMElement();
		expect( handleMount ).not.toHaveBeenCalled();
	} finally {
		window.removeEventListener( OVERVIEW_UPGRADE_EVENT, handleMount );
	}
} );
