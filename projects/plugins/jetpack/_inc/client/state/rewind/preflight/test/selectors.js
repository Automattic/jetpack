import { PreflightTestStatus } from '../constants';
import { getPreflightStatus } from '../selectors';

describe( 'getPreflightStatus selector', () => {
	it( 'returns the overall preflight status when featureEnabled is true', () => {
		const mockState = {
			jetpack: {
				rewind: {
					preflight: {
						featureEnabled: true,
						overallStatus: PreflightTestStatus.SUCCESS,
					},
				},
			},
		};

		expect( getPreflightStatus( mockState ) ).toEqual( PreflightTestStatus.SUCCESS );
	} );

	it( 'returns PENDING if overallStatus is undefined and featureEnabled is true', () => {
		const mockState = {
			jetpack: {
				rewind: {
					preflight: {
						featureEnabled: true,
						overallStatus: undefined,
					},
				},
			},
		};
		expect( getPreflightStatus( mockState ) ).toEqual( PreflightTestStatus.PENDING );
	} );

	it( 'returns FAILED if featureEnabled is false, regardless of overallStatus', () => {
		const mockState = {
			jetpack: {
				rewind: {
					preflight: {
						featureEnabled: false,
						overallStatus: PreflightTestStatus.SUCCESS, // This value should be ignored
					},
				},
			},
		};

		expect( getPreflightStatus( mockState ) ).toEqual( PreflightTestStatus.FAILED );
	} );

	it( 'returns FAILED if featureEnabled is false and overallStatus is undefined', () => {
		const mockState = {
			jetpack: {
				rewind: {
					preflight: {
						featureEnabled: false,
						overallStatus: undefined, // This value should be ignored
					},
				},
			},
		};
		expect( getPreflightStatus( mockState ) ).toEqual( PreflightTestStatus.FAILED );
	} );
} );
