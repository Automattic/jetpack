import { render, screen } from '@testing-library/react';
import { moduleSettings } from '../registry';
import { SeoSettings } from '../seo';
import type { MyJetpackModule } from '../../../types';

jest.mock( '../../seo-opt-in-card', () => ( {
	__esModule: true,
	default: () => <p>Opt-in invitation</p>,
} ) );
jest.mock( '../fallback-settings', () => ( {
	FallbackSettings: ( { module: $module }: { module: MyJetpackModule } ) => (
		<p>Fallback of { $module.name }</p>
	),
} ) );

describe( 'SeoSettings', () => {
	it.each( [ 'seo-tools', 'verification-tools', 'sitemaps' ] )( 'is the panel of %s', slug => {
		expect( moduleSettings[ slug ] ).toBe( SeoSettings );
	} );

	it( 'puts the invitation above the usual panel', () => {
		render( <SeoSettings module={ { name: 'SEO Tools' } as MyJetpackModule } /> );

		const invitation = screen.getByText( 'Opt-in invitation' );
		const fallback = screen.getByText( 'Fallback of SEO Tools' );

		expect( invitation.compareDocumentPosition( fallback ) ).toBe(
			Node.DOCUMENT_POSITION_FOLLOWING
		);
	} );
} );
