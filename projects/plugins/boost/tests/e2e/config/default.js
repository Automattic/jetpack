const outputDir = './output';
const configDir = './config';
const tempDir = `${ configDir }/tmp`;
const config = {
	WP_ADMIN_USER: {
		username: 'admin',
		password: 'password',
	},
	WP_BASE_URL: 'http://localhost',
	dirs: {
		config: configDir,
		output: outputDir,
		temp: tempDir,
		screenshots: `./${ outputDir }/screenshots`,
		videos: `./${ outputDir }/videos`,
		logs: `./${ outputDir }/logs`,
		reports: `./${ outputDir }/reports`,
	},
	temp: {
		storage: `${ tempDir }/storage.json`,
		tunnels: `${ tempDir }/e2e-tunnels.txt`,
	},
	consoleIgnore: [],
	repository: {
		url: 'https://github.com/Automattic/jetpack',
		mainBranch: 'master',
	},
	tunnel: {},
};

module.exports = config;
