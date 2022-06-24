/**
 * @jest-environment jsdom
 */

import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import SimpleNotice from 'components/notice';
import React from 'react';

describe( 'SimpleNotice', function () {
	const testProps = {
		className: 'test-class',
	};
	describe( 'rendering', function () {
		it( 'can render', () => {
			const { container } = render( <SimpleNotice id="1" status="success" /> );
			expect(
				container.getElementsByClassName( 'dops-notice__icon-wrapper' ).length
			).toBeGreaterThan( 0 );
		} );

		it( 'can render with class name passed in', () => {
			const { container } = render( <SimpleNotice { ...testProps }>Toggle Label</SimpleNotice> );
			expect( container.firstChild.className ).toContain( 'test-class' );
		} );
	} );
} );
