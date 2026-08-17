import { defineReportTabs } from './define-report-tabs';

describe( 'defineReportTabs', () => {
	const build = () =>
		defineReportTabs(
			[
				{ id: 'one', getLabel: () => 'One' },
				{ id: 'two', getLabel: () => 'Two' },
				{ id: 'three', getLabel: () => 'Three' },
			] as const,
			'one'
		);

	it( 'exposes the ordered tab IDs', () => {
		expect( build().ids ).toEqual( [ 'one', 'two', 'three' ] );
	} );

	it( 'builds the ordered tab definitions with resolved labels', () => {
		expect( build().getTabs() ).toEqual( [
			{ id: 'one', label: 'One' },
			{ id: 'two', label: 'Two' },
			{ id: 'three', label: 'Three' },
		] );
	} );

	it( 'resolves labels lazily on each call', () => {
		let calls = 0;
		const tabs = defineReportTabs(
			[ { id: 'one', getLabel: () => `One ${ ++calls }` } ] as const,
			'one'
		);

		expect( tabs.getTabLabel( 'one' ) ).toBe( 'One 1' );
		expect( tabs.getTabLabel( 'one' ) ).toBe( 'One 2' );
	} );

	it( 'falls back to the tab id when a label is missing', () => {
		// `getTabLabel` is typed to known IDs, but a stray value should not throw.
		expect( build().getTabLabel( 'missing' as 'one' ) ).toBe( 'missing' );
	} );

	it( 'narrows a known value and falls back to the default otherwise', () => {
		const tabs = build();
		expect( tabs.resolve( 'two' ) ).toBe( 'two' );
		expect( tabs.resolve( 'missing' ) ).toBe( 'one' );
		expect( tabs.resolve( undefined ) ).toBe( 'one' );
	} );

	describe( 'the section heading', () => {
		it( 'reads the declared title, distinct from the tab label', () => {
			const tabs = defineReportTabs(
				[ { id: 'one', getLabel: () => 'Posts & Pages', getTitle: () => 'Posts & pages report' } ],
				'one'
			);

			expect( tabs.getTabTitle( 'one' ) ).toBe( 'Posts & pages report' );
			expect( tabs.getTabLabel( 'one' ) ).toBe( 'Posts & Pages' );
		} );

		// Undefined rather than the tab's label: what a section is called when
		// its tab does not name it belongs to the surface, which heads every
		// tab with the report's own title.
		it( 'reports no title where the tab declares none', () => {
			expect( build().getTabTitle( 'two' ) ).toBeUndefined();
		} );

		it( 'reports no title for an unknown tab', () => {
			expect( build().getTabTitle( 'missing' as 'one' ) ).toBeUndefined();
		} );

		it( 'resolves the title lazily on each call', () => {
			let calls = 0;
			const tabs = defineReportTabs(
				[ { id: 'one', getLabel: () => 'One', getTitle: () => `Title ${ ++calls }` } ] as const,
				'one'
			);

			expect( tabs.getTabTitle( 'one' ) ).toBe( 'Title 1' );
			expect( tabs.getTabTitle( 'one' ) ).toBe( 'Title 2' );
		} );
	} );
} );
