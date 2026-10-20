import { join } from 'node:path';
import { compile } from 'sass-embedded';

describe( 'HelpCard styles', () => {
	it( 'sets no minimum width on the card', () => {
		const style = document.createElement( 'style' );
		style.textContent = compile( join( __dirname, '..', 'styles.module.scss' ) ).css;
		document.head.appendChild( style );
		const card = document.createElement( 'section' );
		card.className = 'wrapper';
		document.body.appendChild( card );

		expect( getComputedStyle( card ).minWidth ).toBe( 'auto' );
	} );
} );
