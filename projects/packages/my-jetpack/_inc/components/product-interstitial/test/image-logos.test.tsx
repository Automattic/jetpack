import { render, screen } from '@testing-library/react';
import { getAntiSpamConfig } from '../products/anti-spam';
import { getCrmConfig } from '../products/crm';

describe( 'Image product logos', () => {
	beforeAll( () => {
		// Mirrors boot's `:where(.boot-layout) img` reset, which outranks the `height` attribute.
		const reset = document.createElement( 'style' );
		reset.textContent = 'img { height: auto; }';
		document.head.append( reset );
	} );

	it.each( [
		[ 'CRM Logo', getCrmConfig ],
		[ 'Anti-Spam Logo', getAntiSpamConfig ],
	] )( 'renders the %s at the requested height', ( name, getConfig ) => {
		const Logo = getConfig().logo;
		render( <Logo height={ 32 } /> );

		expect( getComputedStyle( screen.getByRole( 'img', { name } ) ).height ).toBe( '32px' );
	} );
} );
