import { expect } from '@jest/globals';
import selectors from '../site-backup';

describe( 'siteBackupStorageSelectors', () => {
	describe( 'getStorageUsageLevel()', () => {
		it.each( [
			{
				state: {
					siteBackupStorage: {},
				},
				expected: null,
			},
			{
				state: {
					siteBackupStorage: {
						usageLevel: null,
					},
				},
				expected: null,
			},
			{
				state: {
					siteBackupStorage: {
						usageLevel: 'Full',
					},
				},
				expected: 'Full',
			},
			{
				state: {
					siteBackupStorage: {
						usageLevel: 'Normal',
					},
				},
				expected: 'Normal',
			},
		] )( 'should return expected value', ( { state, expected } ) => {
			expect( selectors.getStorageUsageLevel( state ) ).toEqual( expected );
		} );
	} );
} );
