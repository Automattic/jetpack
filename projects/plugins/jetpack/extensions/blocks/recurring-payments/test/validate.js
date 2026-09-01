import runBlockFixtureTests from '../../../shared/test/block-fixtures';
import { settings as buttonSettings } from '../../button';
import metadata from '../block.json';
import deprecatedV1 from '../deprecated/v1';
import deprecatedV2 from '../deprecated/v2';
import edit from '../edit';
import save from '../save';

// Mock @automattic/jetpack-script-data functions to allow isWpcomPlatformSite to be correctly used.
jest.mock( '@automattic/jetpack-script-data', () => {
	const isWpcomPlatformSite = jest.fn().mockReturnValue( false );
	return {
		isWpcomPlatformSite,
	};
} );

const { name } = metadata;
const blocks = [
	{ name, settings: { ...metadata, edit, save, deprecated: [ deprecatedV2, deprecatedV1 ] } },
	{ name: `jetpack/button`, settings: buttonSettings },
];

runBlockFixtureTests( name, blocks, __dirname );
