import { mergeThemes } from '../merge-themes';
import type { ChartTheme } from '../../types';

describe( 'mergeThemes', () => {
	const baseTheme: ChartTheme = {
		backgroundColor: '#FFFFFF',
		colors: [ '#red', '#blue' ],
		gridStyles: {
			stroke: '#DCDCDE',
			strokeWidth: 1,
		},
		tickLength: 4,
		gridColor: '',
		gridColorDark: '',
		leaderboardChart: {
			primaryColor: '#global-primary',
			secondaryColor: '#global-secondary',
		},
	};

	const overrideTheme: ChartTheme = {
		backgroundColor: '#F0F0F0',
		colors: [ '#green', '#yellow' ],
		gridStyles: {
			stroke: '#000000',
			strokeWidth: 2,
		},
		tickLength: 8,
		gridColor: '',
		gridColorDark: '',
		leaderboardChart: {
			primaryColor: '#local-primary',
		},
	};

	it( 'should return base theme when override theme is empty', () => {
		const result = mergeThemes( baseTheme, {} );
		expect( result ).toEqual( baseTheme );
	} );

	it( 'should merge themes with local theme taking precedence for top-level properties', () => {
		const result = mergeThemes( baseTheme, overrideTheme );

		expect( result.backgroundColor ).toBe( '#F0F0F0' ); // from local
		expect( result.tickLength ).toBe( 8 ); // from local
		expect( result.colors ).toEqual( [ '#green', '#yellow' ] ); // from local (array replacement)
	} );

	it( 'should deeply merge nested objects with local theme taking precedence', () => {
		const result = mergeThemes( baseTheme, overrideTheme );

		// gridStyles should be merged
		expect( result.gridStyles ).toEqual( {
			stroke: '#000000', // from local
			strokeWidth: 2, // from local
		} );

		// leaderboardChart should be merged
		expect( result.leaderboardChart ).toEqual( {
			primaryColor: '#local-primary', // from local
			secondaryColor: '#global-secondary', // from global (not overridden)
		} );
	} );

	it( 'should use global theme properties when not defined in local theme', () => {
		const partialLocalTheme: ChartTheme = {
			backgroundColor: '#F0F0F0',
			colors: [ '#green' ],
			tickLength: 8,
			gridColor: '',
			gridColorDark: '',
		};

		const result = mergeThemes( baseTheme, partialLocalTheme );

		expect( result.backgroundColor ).toBe( '#F0F0F0' ); // from local
		expect( result.gridStyles ).toEqual( baseTheme.gridStyles ); // from global
		expect( result.leaderboardChart ).toEqual( baseTheme.leaderboardChart ); // from global
	} );

	it( 'should handle array replacement correctly', () => {
		const globalWithColors: ChartTheme = {
			...baseTheme,
			colors: [ '#red', '#blue', '#purple' ],
		};

		const localWithFewerColors: ChartTheme = {
			...overrideTheme,
			colors: [ '#green' ],
		};

		const result = mergeThemes( globalWithColors, localWithFewerColors );

		// Arrays should be replaced, not concatenated
		expect( result.colors ).toEqual( [ '#green' ] );
		expect( result.colors ).not.toContain( '#red' );
		expect( result.colors ).not.toContain( '#blue' );
		expect( result.colors ).not.toContain( '#purple' );
	} );
} );
