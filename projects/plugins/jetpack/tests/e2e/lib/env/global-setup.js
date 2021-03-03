import fs from 'fs';
import TunnelManager from './tunnel-manager';

module.exports = async function () {
	// Create tunnel. Make it global so we can access it in global-teardown
	global.tunnelManager = new TunnelManager();
	await global.tunnelManager.create( process.env.SKIP_CONNECT );

	// Create the file used to save browser storage to skip login actions
	// If the file is missing Playwright context creation will fail
	// If the file already exists the content gets overwritten with an empty object
	fs.writeFileSync( 'config/storage.json', '{}' );

	// Create the file used to save video files that need to be renamed at teardown
	// If the file already exists the content gets overwritten with an empty object
	// It's important this file is empty at global setup time as content will be appended to it
	fs.writeFileSync( 'output/video_files', '' );
};
