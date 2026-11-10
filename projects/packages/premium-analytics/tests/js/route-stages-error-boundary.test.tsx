import { existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { StatsErrorBoundary } from '@jetpack-premium-analytics/error-reporting';
import type { ReactElement } from 'react';

const ROUTES_DIR = join( __dirname, '../../routes' );

const stages = readdirSync( ROUTES_DIR, { withFileTypes: true } )
	.filter(
		entry => entry.isDirectory() && existsSync( join( ROUTES_DIR, entry.name, 'stage.tsx' ) )
	)
	.map( ( { name } ): [ string, () => ReactElement ] => [
		name,
		jest.requireActual< { stage: () => ReactElement } >( join( ROUTES_DIR, name, 'stage.tsx' ) )
			.stage,
	] )
	.sort( ( a, b ) => a[ 0 ].localeCompare( b[ 0 ] ) );

describe( 'route stages', () => {
	it( 'discovers the routes that have a stage', () => {
		expect( stages.length ).toBeGreaterThan( 0 );
	} );

	it.each( stages )( 'wraps %s in StatsErrorBoundary', ( _name, stage ) => {
		expect( stage().type ).toBe( StatsErrorBoundary );
	} );
} );
