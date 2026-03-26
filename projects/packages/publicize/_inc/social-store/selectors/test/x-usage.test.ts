// Mock hasSocialPaidFeatures
let mockHasPaidFeatures = false;
jest.mock( '../../../utils/script-data', () => ( {
	hasSocialPaidFeatures: () => mockHasPaidFeatures,
} ) );

// Mock getCurrentPeriod
jest.mock( '../../../components/x-usage/utils', () => ( {
	getCurrentPeriod: () => '2026-03',
} ) );

// Mock the registry selectors — getXUsage returns configurable data
let mockUsageData: Array< { period: string; used: number; pending: number; total: number } > = [];
jest.mock( '@wordpress/core-data', () => ( {} ) );
jest.mock( '@wordpress/data', () => ( {
	createRegistrySelector: () => () => mockUsageData,
} ) );

import {
	isXQuotaExceeded,
	canShareToXNow,
	canScheduleXShareFor,
	getXQuotaRemaining,
	getXUsageFor,
} from '../x-usage';

describe( 'Social store selectors: x-usage enforcement', () => {
	beforeEach( () => {
		mockHasPaidFeatures = false;
		mockUsageData = [];
	} );

	describe( 'isXQuotaExceeded', () => {
		describe( 'free plan', () => {
			it( 'should return true when at limit (5)', () => {
				mockUsageData = [ { period: 'free', used: 4, pending: 1, total: 5 } ];
				expect( isXQuotaExceeded( {} ) ).toBe( true );
			} );

			it( 'should return true when over limit (6)', () => {
				mockUsageData = [ { period: 'free', used: 5, pending: 1, total: 6 } ];
				expect( isXQuotaExceeded( {} ) ).toBe( true );
			} );

			it( 'should return false when under limit (3)', () => {
				mockUsageData = [ { period: 'free', used: 2, pending: 1, total: 3 } ];
				expect( isXQuotaExceeded( {} ) ).toBe( false );
			} );

			it( 'should return false when no data', () => {
				expect( isXQuotaExceeded( {} ) ).toBe( false );
			} );

			it( 'should use "free" period by default', () => {
				mockUsageData = [
					{ period: 'free', used: 4, pending: 1, total: 5 },
					{ period: '2026-03', used: 0, pending: 0, total: 0 },
				];
				expect( isXQuotaExceeded( {} ) ).toBe( true );
			} );
		} );

		describe( 'paid plan', () => {
			beforeEach( () => {
				mockHasPaidFeatures = true;
			} );

			it( 'should return true when at limit (100)', () => {
				mockUsageData = [ { period: '2026-03', used: 90, pending: 10, total: 100 } ];
				expect( isXQuotaExceeded( {} ) ).toBe( true );
			} );

			it( 'should return true when over limit', () => {
				mockUsageData = [ { period: '2026-03', used: 100, pending: 5, total: 105 } ];
				expect( isXQuotaExceeded( {} ) ).toBe( true );
			} );

			it( 'should return false when under limit', () => {
				mockUsageData = [ { period: '2026-03', used: 40, pending: 10, total: 50 } ];
				expect( isXQuotaExceeded( {} ) ).toBe( false );
			} );

			it( 'should return false when no data', () => {
				expect( isXQuotaExceeded( {} ) ).toBe( false );
			} );

			it( 'should use current period by default', () => {
				mockUsageData = [
					{ period: 'free', used: 4, pending: 1, total: 5 },
					{ period: '2026-03', used: 90, pending: 10, total: 100 },
				];
				expect( isXQuotaExceeded( {} ) ).toBe( true );
			} );
		} );

		it( 'should accept an explicit period parameter', () => {
			mockUsageData = [
				{ period: '2026-01', used: 4, pending: 1, total: 5 },
				{ period: '2026-02', used: 1, pending: 0, total: 1 },
			];
			expect( isXQuotaExceeded( {}, '2026-01' ) ).toBe( true );
			expect( isXQuotaExceeded( {}, '2026-02' ) ).toBe( false );
		} );
	} );

	describe( 'canShareToXNow', () => {
		it( 'should return true when under limit', () => {
			mockUsageData = [ { period: 'free', used: 2, pending: 1, total: 3 } ];
			expect( canShareToXNow( {} ) ).toBe( true );
		} );

		it( 'should return false when at limit', () => {
			mockUsageData = [ { period: 'free', used: 4, pending: 1, total: 5 } ];
			expect( canShareToXNow( {} ) ).toBe( false );
		} );

		it( 'should return false when over limit', () => {
			mockUsageData = [ { period: 'free', used: 5, pending: 1, total: 6 } ];
			expect( canShareToXNow( {} ) ).toBe( false );
		} );

		it( 'should return true when data is missing (defaults to allowing)', () => {
			expect( canShareToXNow( {} ) ).toBe( true );
		} );
	} );

	describe( 'canScheduleXShareFor', () => {
		describe( 'free plan', () => {
			it( 'should return false when quota exhausted (no period)', () => {
				mockUsageData = [ { period: 'free', used: 4, pending: 1, total: 5 } ];
				expect( canScheduleXShareFor( {} ) ).toBe( false );
			} );

			it( 'should return true when under limit (no period)', () => {
				mockUsageData = [ { period: 'free', used: 2, pending: 1, total: 3 } ];
				expect( canScheduleXShareFor( {} ) ).toBe( true );
			} );

			it( 'should ignore period argument and check lifetime quota', () => {
				mockUsageData = [ { period: 'free', used: 4, pending: 1, total: 5 } ];
				expect( canScheduleXShareFor( {}, '2026-04' ) ).toBe( false );
			} );
		} );

		describe( 'paid plan', () => {
			beforeEach( () => {
				mockHasPaidFeatures = true;
			} );

			it( 'should return true when no period specified (user can pick future month)', () => {
				mockUsageData = [ { period: '2026-03', used: 90, pending: 10, total: 100 } ];
				expect( canScheduleXShareFor( {} ) ).toBe( true );
			} );

			it( 'should return true with null period', () => {
				mockUsageData = [ { period: '2026-03', used: 90, pending: 10, total: 100 } ];
				expect( canScheduleXShareFor( {}, null ) ).toBe( true );
			} );

			it( 'should return false when specific period quota is exhausted', () => {
				mockUsageData = [ { period: '2026-04', used: 90, pending: 10, total: 100 } ];
				expect( canScheduleXShareFor( {}, '2026-04' ) ).toBe( false );
			} );

			it( 'should return true when specific period has remaining quota', () => {
				mockUsageData = [ { period: '2026-04', used: 40, pending: 10, total: 50 } ];
				expect( canScheduleXShareFor( {}, '2026-04' ) ).toBe( true );
			} );

			it( 'should return true for a future period with no usage data', () => {
				mockUsageData = [ { period: '2026-03', used: 90, pending: 10, total: 100 } ];
				expect( canScheduleXShareFor( {}, '2026-04' ) ).toBe( true );
			} );
		} );
	} );

	describe( 'getXQuotaRemaining', () => {
		it( 'should return correct remaining for free plan', () => {
			mockUsageData = [ { period: 'free', used: 2, pending: 1, total: 3 } ];
			expect( getXQuotaRemaining( {} ) ).toBe( 2 );
		} );

		it( 'should return correct remaining for paid plan', () => {
			mockHasPaidFeatures = true;
			mockUsageData = [ { period: '2026-03', used: 40, pending: 10, total: 50 } ];
			expect( getXQuotaRemaining( {} ) ).toBe( 50 );
		} );

		it( 'should never return negative', () => {
			mockUsageData = [ { period: 'free', used: 5, pending: 1, total: 6 } ];
			expect( getXQuotaRemaining( {} ) ).toBe( 0 );
		} );

		it( 'should return full limit when no data (free plan)', () => {
			expect( getXQuotaRemaining( {} ) ).toBe( 5 );
		} );

		it( 'should return full limit when no data (paid plan)', () => {
			mockHasPaidFeatures = true;
			expect( getXQuotaRemaining( {} ) ).toBe( 100 );
		} );

		it( 'should accept an explicit period parameter', () => {
			mockUsageData = [ { period: '2026-01', used: 3, pending: 0, total: 3 } ];
			expect( getXQuotaRemaining( {}, '2026-01' ) ).toBe( 2 );
		} );
	} );

	describe( 'getXUsageFor', () => {
		it( 'should return the usage item for the given period', () => {
			mockUsageData = [
				{ period: 'free', used: 3, pending: 0, total: 3 },
				{ period: '2026-03', used: 10, pending: 5, total: 15 },
			];
			expect( getXUsageFor( {}, 'free' ) ).toEqual( {
				period: 'free',
				used: 3,
				pending: 0,
				total: 3,
			} );
		} );

		it( 'should return undefined when no matching period', () => {
			mockUsageData = [ { period: 'free', used: 3, pending: 0, total: 3 } ];
			expect( getXUsageFor( {}, 'nonexistent' ) ).toBeUndefined();
		} );
	} );
} );
