/**
 * Internal dependencies
 */
import { buildCompanyRows } from '../build-company-rows';
import type { StatsAiProvider } from '@jetpack-premium-analytics/data';

function company( name: string, requests: number ): StatsAiProvider {
	return { name, requests, bots: [ { name: `${ name }Bot`, type: 'AI Crawler', requests } ] };
}

describe( 'buildCompanyRows', () => {
	it( 'lists every company, each opening onto its bots, when they fit', () => {
		const rows = buildCompanyRows( [ company( 'OpenAI', 40 ), company( 'Anthropic', 25 ) ], 4 );

		expect( rows.map( row => [ row.label, row.value ] ) ).toEqual( [
			[ 'OpenAI', 40 ],
			[ 'Anthropic', 25 ],
		] );
		expect( rows[ 0 ].children ).toEqual( [
			{ id: 'OpenAI/OpenAIBot', label: 'OpenAIBot', value: 40 },
		] );
	} );

	it( 'folds the companies past the limit into one row and keeps the ownerless bots last', () => {
		const rows = buildCompanyRows(
			[
				company( 'OpenAI', 40 ),
				company( 'Anthropic', 25 ),
				company( 'Unknown', 9 ),
				company( 'Meta', 8 ),
				company( 'Amazon', 2 ),
			],
			4
		);

		expect( rows.map( row => [ row.label, row.value ] ) ).toEqual( [
			[ 'OpenAI', 40 ],
			[ 'Anthropic', 25 ],
			[ 'Other companies', 10 ],
			[ 'Unattributed', 9 ],
		] );
		expect( rows[ 2 ].children?.map( row => row.label ) ).toEqual( [ 'Meta', 'Amazon' ] );
	} );
} );
