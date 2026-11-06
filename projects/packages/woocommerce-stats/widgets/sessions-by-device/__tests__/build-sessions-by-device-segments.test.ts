/**
 * Internal dependencies
 */
import { buildSessionsByDeviceSegments } from '../build-sessions-by-device-segments';

const report = ( rows: Array< [ string, number ] > ) => ( {
	data: rows.map( ( [ device_type, active_sessions ] ) => ( { device_type, active_sessions } ) ),
} );

describe( 'buildSessionsByDeviceSegments', () => {
	it( 'keeps a device seen in the comparison period alone, at zero for the selected period', () => {
		const segments = buildSessionsByDeviceSegments(
			report( [ [ 'Mobile', 100 ] ] ),
			report( [
				[ 'mobile', 100 ],
				[ 'Tablet', 100 ],
			] )
		);

		expect( segments ).toEqual( [
			{ label: 'Mobile', value: 100, previousValue: 100 },
			{ label: 'Tablet', value: 0, previousValue: 100 },
		] );
	} );

	it( 'merges the rows with no recorded device into one Unknown segment in each period', () => {
		const segments = buildSessionsByDeviceSegments(
			report( [
				[ '', 3 ],
				[ '', 4 ],
			] ),
			report( [
				[ '', 2 ],
				[ '', 5 ],
			] )
		);

		expect( segments ).toEqual( [ { label: 'Unknown', value: 7, previousValue: 7 } ] );
	} );

	it( 'reads a device missing from the comparison period as zero there', () => {
		const segments = buildSessionsByDeviceSegments(
			report( [
				[ 'mobile', 100 ],
				[ 'desktop', 50 ],
			] ),
			report( [ [ 'mobile', 80 ] ] )
		);

		expect( segments ).toEqual( [
			{ label: 'Mobile', value: 100, previousValue: 80 },
			{ label: 'Desktop', value: 50, previousValue: 0 },
		] );
	} );
} );
