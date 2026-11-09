import { existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { StatsErrorBoundary } from '@jetpack-premium-analytics/error-reporting';
import type { ReactElement } from 'react';

const ROUTES_DIR = join( __dirname, '../../routes' );

const stages = readdirSync( ROUTES_DIR, { withFileTypes: true } )
	.flatMap( entry =>
		entry.isDirectory()
			? [ 'stage.tsx', 'stage.ts' ]
					.map( file => join( ROUTES_DIR, entry.name, file ) )
					.filter( existsSync )
					.map( ( file ): [ string, () => ReactElement ] => [
						entry.name,
						jest.requireActual< { stage: () => ReactElement } >( file ).stage,
					] )
			: []
	)
	.sort( ( a, b ) => a[ 0 ].localeCompare( b[ 0 ] ) );

describe( 'route stages', () => {
	it( 'discovers the routes that have a stage', () => {
		expect( stages.length ).toBeGreaterThan( 0 );
	} );

	it.each( stages )( 'wraps %s in StatsErrorBoundary', ( _name, stage ) => {
		expect( stage().type ).toBe( StatsErrorBoundary );
	} );
} );
