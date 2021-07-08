import { spawnSync } from 'child_process';
import fs from 'fs-extra';

const task = process.argv.slice( 2 )[ 0 ];
const commit = process.argv.slice( 2 )[ 1 ];

let gutenbergVersion;

switch ( task ) {
	case 'reset':
		reset();
		break;

	case 'test-validation':
		runBlockValidationAndUnitTests();
		break;

	default:
		const version = task;
		cloneRepo( version );
		if ( commit ) {
			checkoutCommit( commit );
		}
		installGutenbergDependencies();
		buildGutenbergPackages();
		moveGutenbergPackages().then( () => {
			updatePackageJsonDependencies();
			updateJetpackDependencies();
			installAdditionalGutenbergDependencies();
			runBlockValidationAndUnitTests();
		} );
}

function reset() {
	console.log( 'Restoring jetpack repo' );

	if ( fs.existsSync( './tests/temp-gutenberg-checkout' ) ) {
		fs.rmdirSync( './tests/temp-gutenberg-checkout', { recursive: true } );
	}

	if ( fs.existsSync( './packages' ) ) {
		fs.rmdirSync( './packages', { recursive: true } );
	}

	spawnSync( 'git', [ 'checkout', './projects/plugins/jetpack/package.json', './pnpm-lock.yaml' ], {
		stdio: 'inherit',
		cwd: '../../../',
	} );
}

function cloneRepo( version = 'trunk' ) {
	console.log( `Cloning ${ version } from gutenberg repo` );

	if ( fs.existsSync( './tests/temp-gutenberg-checkout' ) ) {
		fs.rmdirSync( './tests/temp-gutenberg-checkout', { recursive: true } );
	}

	spawnSync(
		'git',
		[
			'clone',
			'git@github.com:WordPress/gutenberg.git',
			'./tests/temp-gutenberg-checkout',
			'--branch',
			version,
		],
		{ stdio: 'inherit' }
	);
}

function checkoutCommit( commit ) {
	console.log( `Checking out commit ${ commit } from gutenberg repo` );
	spawnSync( 'git', [ 'checkout', commit ], {
		stdio: 'inherit',
		cwd: './tests/temp-gutenberg-checkout',
	} );
}

function installGutenbergDependencies() {
	console.log( 'Installing Gutenberg dependencies' );
	spawnSync( 'npm', [ 'install' ], { stdio: 'inherit', cwd: './tests/temp-gutenberg-checkout' } );
}

function buildGutenbergPackages() {
	console.log( 'Building Gutenberg packages' );
	spawnSync( 'npm', [ 'run', 'build:packages' ], {
		stdio: 'inherit',
		cwd: './tests/temp-gutenberg-checkout',
	} );
}

function moveGutenbergPackages() {
	console.log( 'Moving Gutenberg packages' );
	return fs.move( './tests/temp-gutenberg-checkout/packages', './packages' );
}

function updatePackageJsonDependencies() {
	console.log( 'Updating Gutenberg package.json dependencies' );
	const gutenbergPackageJson = JSON.parse(
		fs.readFileSync( './tests/temp-gutenberg-checkout/package.json' )
	);
	gutenbergVersion = gutenbergPackageJson.version;

	const jetpackPackageJson = JSON.parse( fs.readFileSync( './package.json' ) );

	const wordPressDeps = Object.fromEntries(
		Object.entries( gutenbergPackageJson.dependencies ).filter(
			( [ key ] ) => key.includes( '@wordpress' ) || key.includes( '@emotion' )
		)
	);

	const wordPressDevDeps = Object.fromEntries(
		Object.entries( gutenbergPackageJson.devDependencies ).filter(
			( [ key ] ) => key.includes( '@wordpress' ) || key.includes( '@emotion' )
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
		fs.writeFileSync( './package.json', JSON.stringify( jetpackPackageJson ) );
	} catch ( err ) {
		console.error( err );
	}
}

function updateJetpackDependencies() {
	console.log( 'Updating Jetpack dependencies' );
	spawnSync( 'pnpm', [ 'install' ], { stdio: 'inherit' } );
	console.log( 'Done Updating Jetpack dependencies' );
}

function installAdditionalGutenbergDependencies() {
	console.log( 'Installing additional Gutenberg dependencies' );
	spawnSync(
		'pnpm',
		[
			'add',
			'showdown',
			'simple-html-tokenizer',
			'hpq',
			'react-autosize-textarea',
			'traverse',
			'css-mediaquery',
			'@emotion/styled',
			'@emotion/react',
		],
		{ stdio: 'inherit' }
	);
	console.log( 'Finished installing additional Gutenberg dependencies' );
}

function runBlockValidationAndUnitTests() {
	console.log( 'Running block validation tests' );
	const command = `test-extensions -- --globals='{\\"gutenbergVersion\\":\\"${ gutenbergVersion }\\"}'`;
	spawnSync( 'pnpm', [ command ], {
		stdio: 'inherit',
		shell: true,
	} );
}
