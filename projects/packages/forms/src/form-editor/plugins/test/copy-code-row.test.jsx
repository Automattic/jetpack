import { describe, expect, it } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { CopyCodeRow } from '../copy-code-row.tsx';

describe( 'CopyCodeRow', () => {
	it( 'names the snippet by its visible label and describes it with the hint', () => {
		render(
			<CopyCodeRow
				text='[contact-form id="123"]'
				label="Shortcode"
				help="Use anywhere shortcodes are supported."
			/>
		);

		const snippet = screen.getByRole( 'textbox', { name: 'Shortcode' } );
		expect( snippet ).toHaveTextContent( '[contact-form id="123"]' );
		expect( snippet ).toHaveAccessibleDescription( 'Use anywhere shortcodes are supported.' );
	} );
} );
