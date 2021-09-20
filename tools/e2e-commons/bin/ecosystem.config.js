module.exports = {
	apps: [
		{
			script: require( 'path' ).dirname( __filename ) + '/tunnel.js',
			args: 'on',
			name: 'tunnel',
			time: true,
			wait_ready: true,
			listen_timeout: 15000,
			env: {
				NODE_ENV: 'test',
			},
		},
	],
};
