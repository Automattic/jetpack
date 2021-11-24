/**
 * @jest-environment jsdom
 */

/**
 * External dependencies
 */
import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

/**
 * Internal dependencies
 */
import GlobalNotices from 'components/global-notices';

describe( 'GlobalNotices', function () {
	describe( 'rendering', function () {
		it( 'can render', () => {
			const { container } = render(
				<GlobalNotices notices={ [ { id: 1, status: 'success' } ] } />
			);
			expect( container.firstChild.className ).toContain( 'global-notices' );
		} );
	} );
} );
