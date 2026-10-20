// Files that mean --git-changed should report all projects as changed.
export const infrastructureFileSets = {};
infrastructureFileSets.base = new Set( [
	'tools/cli/commands/dependencies.js',
	'tools/cli/helpers/infrastructure-files.js',
	'tools/cli/helpers/dependencyAnalysis.js',
	'.github/actions/tool-setup/action.yml',
	'.github/actions/tool-setup/composer-plugin/composer.json',
	'.github/actions/tool-setup/composer-plugin/src/Plugin.php',
	'.github/actions/tool-setup/packagist-proxy.mjs',
	'.github/files/list-changed-projects.sh',
	'.github/versions.sh',
	// If pnpm stuff changed, we should build/test everything since we can't know what the change will affect.
	'pnpm-lock.yaml',
	'pnpm-workspace.yaml',
] );
infrastructureFileSets.test = new Set( [
	...infrastructureFileSets.base,
	'.github/files/generate-ci-matrix.php',
	'.github/files/coverage-munger/composer.json',
	'.github/files/coverage-munger/package.json',
	'.github/files/coverage-munger/extract-php-summary-data.php',
	'.github/files/coverage-munger/process-coverage.sh',
	'.github/files/coverage-munger/upload-coverage.sh',
	'.github/files/setup-wordpress-env.sh',
	'.github/workflows/tests.yml',
] );
infrastructureFileSets.build = new Set( [
	...infrastructureFileSets.base,
	'tools/cli/commands/build.js',
	'tools/cli/helpers/install.js',
	'tools/cli/helpers/projectHelpers.js',
	'.github/workflows/build.yml',
] );
infrastructureFileSets.e2e = {
	has( f ) {
		return (
			infrastructureFileSets.base.has( f ) ||
			f.startsWith( 'tools/e2e-commons/' ) ||
			f.startsWith( 'tools/docker/' )
		);
	},
};
