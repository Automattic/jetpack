module.exports = {
	apps: [
		{
			script: 'bin/tunnel.js',
			args: 'on',
			name: 'tunnel',
			log_file: 'output/logs/tunnel-combined.log',
			time: true,
			listen_timeout: 10000,
			env: {
				NODE_ENV: 'test',
			},
		},
	],
};
