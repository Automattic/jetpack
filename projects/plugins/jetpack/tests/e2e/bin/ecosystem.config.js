module.exports = {
	apps: [
		{
			script: 'bin/tunnel.js',
			args: 'on',
			name: 'tunnel',
			log_file: 'output/logs/tunnel.log',
			time: true,
			wait_ready: true,
			listen_timeout: 15000,
			env: {
				NODE_ENV: 'test',
			},
		},
	],
};
