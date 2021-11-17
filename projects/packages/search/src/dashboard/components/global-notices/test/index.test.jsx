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
		it( 'should render', () => {
			const { container } = render(
				<GlobalNotices notices={ [ { id: 1, status: 'success' } ] } />
			);
			expect( container.getElementsByClassName( 'global-notices' ).length ).toBeGreaterThan( 0 );
		} );
	} );
} );
