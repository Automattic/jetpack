import { type TsdownPlugin } from 'tsdown';

type AstNode = {
	type?: string;
	name?: {
		name?: string;
	};
	start: number;
	end: number;
};

/**
 * Strip `data-testid` attributes from production output. tsdown compiles TS/JSX
 * natively via Oxc, so this runs as a pre-transform on the JSX source: it parses
 * each `.tsx` file with Rolldown's bundled Oxc parser (`this.parse`) and splices
 * out JSX attributes named `data-testid`, leaving non-JSX-attribute usages (e.g.
 * forwarded props or object keys) untouched.
 *
 * @return {TsdownPlugin} A tsdown plugin that removes `data-testid` JSX attributes.
 */
export function removeDataTestId(): TsdownPlugin {
	return {
		name: 'remove-data-testid',
		transform( code: string, id: string ) {
			if ( ! id.endsWith( '.tsx' ) || ! code.includes( 'data-testid' ) ) {
				return null;
			}
			const ranges: Array< [ number, number ] > = [];
			const visit = ( node: unknown ): void => {
				if ( ! node || typeof node !== 'object' ) {
					return;
				}
				const { type, name, start, end } = node as AstNode;
				if ( type === 'JSXAttribute' && name?.name === 'data-testid' ) {
					ranges.push( [ start, end ] );
				}
				Object.values( node ).forEach( visit );
			};
			visit( this.parse( code, { lang: 'tsx' } ) );
			if ( ! ranges.length ) {
				return null;
			}
			// Splice from the end so earlier offsets stay valid as we remove ranges.
			const stripped = ranges
				.sort( ( a, b ) => b[ 0 ] - a[ 0 ] )
				.reduce( ( acc, [ start, end ] ) => acc.slice( 0, start ) + acc.slice( end ), code );
			return { code: stripped };
		},
	};
}
