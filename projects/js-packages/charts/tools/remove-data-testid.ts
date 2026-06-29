import MagicString from 'magic-string';
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
 * Removes `data-testid` JSX attributes from production output.
 *
 * @return {TsdownPlugin} The tsdown plugin.
 */
export function removeDataTestId(): TsdownPlugin {
	return {
		name: 'remove-data-testid',
		transform( code: string, id: string ) {
			if ( ! id.endsWith( '.tsx' ) || ! code.includes( 'data-testid' ) ) {
				return null;
			}
			const magicString = new MagicString( code );
			let changed = false;
			const visit = ( node: unknown ): void => {
				if ( ! node || typeof node !== 'object' ) {
					return;
				}
				const { type, name, start, end } = node as AstNode;
				if (
					type === 'JSXAttribute' &&
					name?.name === 'data-testid' &&
					typeof start === 'number' &&
					typeof end === 'number'
				) {
					magicString.remove( start, end );
					changed = true;
				}
				Object.values( node ).forEach( visit );
			};
			visit( this.parse( code, { lang: 'tsx' } ) );
			if ( ! changed ) {
				return null;
			}
			return { code: magicString.toString(), map: magicString.generateMap( { hires: true } ) };
		},
	};
}
