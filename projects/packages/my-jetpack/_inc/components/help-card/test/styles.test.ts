import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { compileString } from 'sass-embedded';

describe( 'HelpCard styles', () => {
	it( 'sets no minimum width, so the card fits a Help column narrower than 320px', () => {
		const style = document.createElement( 'style' );
		style.textContent = compileString(
			readFileSync( join( __dirname, '..', 'styles.module.scss' ), 'utf8' )
		).css;
		document.head.appendChild( style );
		const card = document.createElement( 'section' );
		card.className = 'wrapper';
		document.body.appendChild( card );

		try {
			expect( getComputedStyle( card ).minWidth ).toBe( 'auto' );
		} finally {
			style.remove();
			card.remove();
		}
	} );
} );
