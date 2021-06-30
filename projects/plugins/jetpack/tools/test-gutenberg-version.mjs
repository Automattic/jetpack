import { spawnSync } from 'child_process';
import fs from 'fs-extra';

cloneRepo( 'trunk' );
installGutenbergDependencies();
buildGutenbergPackages();
moveGutenbergPackages();
updatePackageJsonDependencies();
updateJetpackDependencies();
installAdditionalGutenbergDependencies();
runBlockValidationTests();

function cloneRepo( version = 'trunk' ) {
	console.log( 'Cloning the gutenberg repo' );
	spawnSync(
		'git',
		[ 'clone', 'git@github.com:WordPress/gutenberg.git', './temp', '--branch', version ],
		{ stdio: 'inherit' }
	);
}

function installGutenbergDependencies() {
	console.log( 'Installing Gutenberg dependencies' );
	spawnSync( 'npm', [ 'install' ], { stdio: 'inherit', cwd: './temp' } );
}

function buildGutenbergPackages() {
	console.log( 'Building Gutenberg packages' );
	spawnSync( 'npm', [ 'run', 'build:packages' ], { stdio: 'inherit', cwd: './temp' } );
}

function moveGutenbergPackages() {
	console.log( 'Moving Gutenberg packages' );
	fs.move( './temp/packages', '../packages', err => {
		if ( err ) return console.error( err );
		console.log( 'success!' );
	} );
}

function updatePackageJsonDependencies() {
	console.log( 'Updating Gutenberg package.json dependencies' );
	const gutenbergPackageJson = JSON.parse( fs.readFileSync( './temp/package.json' ) );
	const jetpackPackageJson = JSON.parse( fs.readFileSync( '../package.json' ) );

	const wordPressDeps = Object.fromEntries(
		Object.entries( gutenbergPackageJson.dependencies ).filter( ( [ key ] ) =>
			key.includes( '@wordpress' )
		)
	);

	const wordPressDevDeps = Object.fromEntries(
		Object.entries( gutenbergPackageJson.devDependencies ).filter( ( [ key ] ) =>
			key.includes( '@wordpress' )
		)
	);

	jetpackPackageJson.dependencies = Object.fromEntries(
		Object.entries( jetpackPackageJson.dependencies ).filter(
			( [ key ] ) => ! key.includes( '@wordpress' )
		)
	);

	jetpackPackageJson.dependencies = { ...wordPressDeps, ...jetpackPackageJson.dependencies };

	jetpackPackageJson.devDependencies = Object.fromEntries(
		Object.entries( jetpackPackageJson.devDependencies ).filter(
			( [ key ] ) => ! key.includes( '@wordpress' )
		)
	);

	jetpackPackageJson.devDependencies = {
		...wordPressDevDeps,
		...jetpackPackageJson.devDependencies,
	};

	try {
		fs.writeFileSync( '../package.json', JSON.stringify( jetpackPackageJson ) );
	} catch ( err ) {
		console.error( err );
	}
}

function updateJetpackDependencies() {
	console.log( 'Updating Jetpack dependencies' );
	spawnSync( 'pnpm', [ 'install' ], { stdio: 'inherit', cwd: '../' } );
}

function installAdditionalGutenbergDependencies() {
	console.log( 'Installing additional Gutenberg dependencies' );
	spawnSync(
		'pnpm',
		[
			'install',
			'showdown',
			'simple-html-tokenizer',
			'hpq',
			'react-autosize-textarea',
			'traverse',
			'css-mediaquery',
		],
		{ stdio: 'inherit', cwd: '../' }
	);
}

function runBlockValidationTests() {
	console.log( 'Updating Jetpack dependencies' );
	spawnSync( 'pnpm', [ 'fixtures:test' ], { stdio: 'inherit', cwd: '../' } );
}
