module.exports = {
	apps: [
		{
			script: __dirname + '/../bin/tunnel.js',
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
