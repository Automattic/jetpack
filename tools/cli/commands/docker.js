/**
 * "docker:build": "docker run -it --rm  -v ${PWD}:/usr/src/app -w /usr/src/app node yarn build",
		"docker:build-image": "docker build -t automattic/jetpack-wordpress-dev tools/docker",
		"docker:clean": "yarn docker:compose down --rmi all -v && rm -rf tools/docker/wordpress/* tools/docker/wordpress/.htaccess tools/docker/wordpress-develop/* tools/docker/logs/* tools/docker/data/mysql/*",
		"docker:compose": "yarn docker:env && yarn docker:compose-volumes && yarn docker:compose-extras && docker-compose -f tools/docker/docker-compose.yml -f tools/docker/compose-volumes.built.yml -f tools/docker/compose-extras.yml",
		"docker:compose-extras": "[ -f tools/docker/compose-extras.yml ] || cp tools/docker/compose-extras.yml.sample tools/docker/compose-extras.yml",
		"docker:compose-volumes": "[ -f tools/docker/compose-volumes.yml ] || cp tools/docker/compose-volumes.yml.sample tools/docker/compose-volumes.yml; bash ./tools/compose-volumes.sh tools/docker/compose-volumes.yml > tools/docker/compose-volumes.built.yml",
		"docker:db": "yarn docker:compose exec wordpress bash -c \"mysql --defaults-group-suffix=docker\"",
		"docker:down": "yarn docker:compose down",
		"docker:env": "node -e \"require('fs').createWriteStream( 'tools/docker/.env', { flags: 'a' } );\"",
		"docker:install": "yarn docker:compose exec wordpress bash -c \"/var/scripts/install.sh\"",
		"docker:jt-config": "[ -f ./tools/docker/bin/jt/config.sh ] || { echo 'Tunneling scripts are not installed. See the section \"Jurassic Tube Tunneling Service\" in tools/docker/README.md.'; exit; }; ./tools/docker/bin/jt/config.sh",
		"docker:jt-down": "[ -f ./tools/docker/bin/jt/tunnel.sh ] || { echo 'Tunneling scripts are not installed. See the section \"Jurassic Tube Tunneling Service\" in tools/docker/README.md.'; exit; }; ./tools/docker/bin/jt/tunnel.sh break",
		"docker:jt-up": "[ -f ./tools/docker/bin/jt/tunnel.sh ] || { echo 'Tunneling scripts are not installed. See the section \"Jurassic Tube Tunneling Service\" in tools/docker/README.md.'; exit; }; ./tools/docker/bin/jt/tunnel.sh",
		"docker:multisite-convert": "yarn docker:compose exec wordpress bash -c \"/var/scripts/multisite-convert.sh\"",
		"docker:ngrok": "yarn docker:compose -f tools/docker/docker-compose-ngrok.yml",
		"docker:ngrok-down": "yarn docker:ngrok down",
		"docker:ngrok-up": "yarn docker:ngrok up",
		"docker:phpunit": "yarn docker:compose exec wordpress phpunit --configuration=/var/www/html/wp-content/plugins/jetpack/phpunit.xml.dist",
		"docker:phpunit:multisite": "yarn docker:compose exec wordpress phpunit --configuration=/var/www/html/wp-content/plugins/jetpack/tests/php.multisite.xml",
		"docker:phpunit:package": "bash ./tests/package-runner.sh",
		"docker:run-extras": "yarn docker:compose exec wordpress bash -c \"chmod +x /var/scripts/run-extras.sh && . /var/scripts/run-extras.sh\"",
		"docker:sh": "yarn docker:compose exec wordpress bash",
		"docker:stop": "yarn docker:compose stop",
		"docker:tail": "yarn docker:compose exec wordpress bash -c \"/var/scripts/tail.sh\"",
		"docker:uninstall": "yarn docker:compose exec wordpress bash -c \"/var/scripts/uninstall.sh\"",
		"docker:up": "yarn docker:compose up",
		"docker:update-core-unit-tests": "yarn docker:compose exec wordpress svn up /tmp/wordpress-develop/tests/phpunit/data/ /tmp/wordpress-develop/tests/phpunit/includes",
		"docker:wp": "yarn docker:compose exec wordpress wp --allow-root --path=/var/www/html/",
 */

export async function dockerCli( argv ) {
	// do something.
}

export function dockerDefine( yargs ) {
	yargs.command(
		'docker', 'Manages the Jetpack Docker instance',
		( yarg ) => {
			// add builder things here.
		},
		async ( argv ) => {
			await dockerCli( argv );

			if ( argv.v ) {
				console.log( argv );
			}
		}
	);
	return yargs;
}
