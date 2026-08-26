import { createJetpackMenuPreview } from '../live-preview';
import { buildMenuSequence, reorderEditableNodes, updateItemVisibility } from '../menu-sequence';
import type { AdminMenuItem, AdminMenuSeparator } from '../types';

const makeMenuItem = (
	id: string,
	label: string,
	overrides: Partial< AdminMenuItem > = {}
): AdminMenuItem => ( {
	id,
	label,
	menuSlug: id,
	order: 0,
	hasSavedOrder: false,
	customizable: true,
	hidden: false,
	external: false,
	...overrides,
} );

const items = [
	makeMenuItem( 'my-jetpack', 'My Jetpack', { customizable: false } ),
	makeMenuItem( 'forms', 'Forms' ),
	makeMenuItem( 'scan', 'Scan' ),
	makeMenuItem( 'settings', 'Settings', { customizable: false } ),
	makeMenuItem( 'jetpack-manage', 'Jetpack Manage', {
		customizable: false,
		external: true,
	} ),
];

const getRenderedIds = () =>
	Array.from( document.querySelectorAll< HTMLElement >( '.wp-submenu > li' ) ).map(
		element => element.dataset.testId
	);

describe( 'createJetpackMenuPreview', () => {
	beforeEach( () => {
		document.body.innerHTML = `
			<ul id="adminmenu">
				<li id="toplevel_page_jetpack">
					<ul class="wp-submenu">
						<li class="wp-first-item jetpack-admin-menu-item-id-my-jetpack" data-test-id="my-jetpack"><a href="admin.php?page=my-jetpack">My Jetpack</a></li>
						<li class="jetpack-admin-menu-item-id-forms" data-test-id="forms"><a href="admin.php?page=jetpack-forms-admin">Forms</a></li>
						<li class="current jetpack-admin-menu-item-id-scan" data-test-id="scan"><a class="current" href="admin.php?page=jetpack-scan">Scan</a></li>
						<li class="jetpack-admin-menu-item-id-settings" data-test-id="settings"><a href="admin.php?page=jetpack#/settings">Settings</a></li>
						<li class="jetpack-admin-menu-item-id-jetpack-manage" data-test-id="jetpack-manage"><a href="https://example.com">Jetpack Manage</a></li>
					</ul>
				</li>
			</ul>`;
	} );

	it( 'reorders the same submenu nodes, hides items, and renders titled separators', () => {
		const originalForms = document.querySelector( '[data-test-id="forms"]' );
		const separators: Record< string, AdminMenuSeparator > = {
			security: { id: 'security', title: 'Security', order: 15 },
		};
		let sequence = buildMenuSequence( items, separators );
		sequence = reorderEditableNodes( sequence, [ 'scan', 'security', 'forms' ] );
		sequence = updateItemVisibility( sequence, 'scan', false );
		const preview = createJetpackMenuPreview( document );

		preview.apply( sequence );

		expect( getRenderedIds() ).toEqual( [
			'my-jetpack',
			'scan',
			'forms',
			'settings',
			'jetpack-manage',
		] );
		expect( document.querySelector< HTMLElement >( '[data-test-id="scan"]' )?.hidden ).toBe( true );
		expect( document.querySelector( '[data-test-id="forms"]' ) ).toBe( originalForms );
		expect( document.querySelector( '[data-test-id="forms"]' )?.classList ).toContain(
			'jetpack-admin-menu-separator-start'
		);
		expect(
			document.querySelector( '[data-test-id="forms"] .jetpack-admin-menu-separator-label' )
		)?.toHaveTextContent( 'Security' );
		expect(
			document.querySelector( '[data-test-id="settings"] .jetpack-admin-menu-separator-label' )
		).toBeNull();
		expect( document.querySelector( '[data-test-id="settings"]' )?.classList ).toContain(
			'jetpack-admin-menu-separator-start'
		);
	} );

	it( 'keeps an untitled custom separator textless and does not duplicate labels on reapply', () => {
		const sequence = buildMenuSequence( items, {
			untitled: { id: 'untitled', title: '', order: 15 },
		} );
		const preview = createJetpackMenuPreview( document );

		preview.apply( sequence );
		preview.apply( sequence );

		expect( document.querySelectorAll( '.jetpack-admin-menu-separator-label' ) ).toHaveLength( 0 );
	} );

	it( 'restores order, visibility, classes, and anchor markup exactly', () => {
		const originalMarkup = document.querySelector( '.wp-submenu' )?.innerHTML;
		const sequence = updateItemVisibility(
			reorderEditableNodes( buildMenuSequence( items, {} ), [ 'scan', 'forms' ] ),
			'forms',
			false
		);
		const preview = createJetpackMenuPreview( document );

		preview.apply( sequence );
		preview.restore();
		preview.restore();

		expect( document.querySelector( '.wp-submenu' )?.innerHTML ).toBe( originalMarkup );
	} );

	it( 'can commit a saved preview as the new restoration baseline', () => {
		const savedSequence = reorderEditableNodes( buildMenuSequence( items, {} ), [
			'scan',
			'forms',
		] );
		const preview = createJetpackMenuPreview( document );

		preview.apply( savedSequence );
		preview.commit();
		preview.apply( updateItemVisibility( savedSequence, 'forms', false ) );
		preview.restore();

		expect( getRenderedIds() ).toEqual( [
			'my-jetpack',
			'scan',
			'forms',
			'settings',
			'jetpack-manage',
		] );
		expect( document.querySelector< HTMLElement >( '[data-test-id="forms"]' )?.hidden ).toBe(
			false
		);
	} );

	it( 'creates a removable preview node when a previously hidden item is not in the DOM', () => {
		document.querySelector( '[data-test-id="forms"]' )?.remove();
		const preview = createJetpackMenuPreview( document );
		const sequence = buildMenuSequence(
			items.map( item => ( item.id === 'forms' ? { ...item, hidden: false } : item ) ),
			{}
		);

		preview.apply( sequence );

		const transientItem = document.querySelector< HTMLElement >(
			'.jetpack-admin-menu-item-id-forms'
		);
		expect( transientItem ).toHaveTextContent( 'Forms' );
		expect( transientItem?.querySelector( 'a' ) ).toHaveAttribute( 'href', 'admin.php?page=forms' );

		preview.restore();
		expect( document.querySelector( '.jetpack-admin-menu-item-id-forms' ) ).toBeNull();
	} );
} );
