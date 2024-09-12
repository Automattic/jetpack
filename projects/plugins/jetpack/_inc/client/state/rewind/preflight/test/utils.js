import { PreflightTestStatus } from '../constants';
import { calculateOverallStatus } from '../utils';

describe( 'calculateOverallStatus', () => {
	it( 'should return SUCCESS when all tests are successful', () => {
		const tests = [
			{ test: 'test1', status: PreflightTestStatus.SUCCESS },
			{ test: 'test2', status: PreflightTestStatus.SUCCESS },
		];
		expect( calculateOverallStatus( tests ) ).toEqual( PreflightTestStatus.SUCCESS );
	} );

	it( 'should return FAILED if any test has failed', () => {
		const tests = [
			{ test: 'test1', status: PreflightTestStatus.SUCCESS },
			{ test: 'test2', status: PreflightTestStatus.FAILED },
		];
		expect( calculateOverallStatus( tests ) ).toEqual( PreflightTestStatus.FAILED );
	} );

	it( 'should return IN_PROGRESS if no tests have failed but at least one is in progress', () => {
		const tests = [
			{ test: 'test1', status: PreflightTestStatus.SUCCESS },
			{ test: 'test2', status: PreflightTestStatus.IN_PROGRESS },
		];
		expect( calculateOverallStatus( tests ) ).toEqual( PreflightTestStatus.IN_PROGRESS );
	} );

	it( 'should return PENDING if tests are neither successful, failed, nor in progress', () => {
		const tests = [
			{ test: 'test1', status: PreflightTestStatus.PENDING },
			{ test: 'test2', status: PreflightTestStatus.PENDING },
		];
		expect( calculateOverallStatus( tests ) ).toEqual( PreflightTestStatus.PENDING );
	} );

	it( 'should return PENDING if tests are an empty array', () => {
		const tests = [];
		expect( calculateOverallStatus( tests ) ).toEqual( PreflightTestStatus.PENDING );
	} );
} );
