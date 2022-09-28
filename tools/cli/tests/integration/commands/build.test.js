import { fileURLToPath } from 'url';
import execa from 'execa';

describe( 'build command', () => {
	test( 'production flag exists', async () => {
		const { stdout: testHelp } = await execa(
			fileURLToPath( new URL( '../../../bin/jetpack.js', import.meta.url ) ),
			[ 'build', '--help' ],
			{
				encoding: 'utf8',
			}
		);

		expect( testHelp ).toMatch( /--production/ );
		expect( testHelp ).toMatch( /-p,/ ); // Need trailing comma since --production contains -p :)
	} );
} );
