import { watch, src, dest, parallel } from 'gulp';
import autoprefixer from 'gulp-autoprefixer'; // add vendor-specific CSS prefixes: https://github.com/postcss/autoprefixer
import cleanCSS from 'gulp-clean-css'; // optimise/minify CSS: https://github.com/clean-css/clean-css
import rename from 'gulp-rename'; // rename files: https://github.com/hparra/gulp-rename
import gulpsass from 'gulp-sass';
import uglify from 'gulp-uglify'; // optimize/minify JS: https://github.com/mishoo/UglifyJS
import dartsass from 'sass'; // SASS compiler: https://sass-lang.com/dart-sass
const sass = gulpsass( dartsass );

// These paths should always be ignored when watching files
export const alwaysIgnoredPaths = [
	'!**/node_modules/**',
	'!**/vendor/**',
	'!**/tests/**',
	'!**/lib/**',
];
const js_files = [ '**/js/**/*.js', '!**/js/**/*.min.js' ].concat( alwaysIgnoredPaths );
const sass_files_to_watch = [ '**/sass/**/*.scss' ].concat( alwaysIgnoredPaths );
const sass_files_to_compile = sass_files_to_watch.concat( [ '!**/sass/**/_*.scss' ] );

// Compile JS: gulp compileJS
/**
 *
 */
export function compileJS() {
	return src( js_files )
		.pipe(
			uglify().on( 'error', function ( uglify ) {
				console.error( uglify.toString() );
				this.emit( 'end' );
			} )
		)
		.pipe( rename( { extname: '.min.js' } ) )
		.pipe( dest( '.' ) );
}

// Compile SCSS: gulp compileSCSS)
/**
 *
 */
export function compileSASS() {
	return (
		src( sass_files_to_compile )
			// Build *.css
			.pipe( sass( { outputStyle: 'expanded' } ).on( 'error', sass.logError ) )
			.pipe( autoprefixer() )
			.pipe(
				rename( function ( path ) {
					path.dirname = path.dirname.replace( 'sass', 'css' );
				} )
			)
			.pipe( dest( '.' ) )
			// Build *.min.css
			.pipe( cleanCSS() )
			.pipe(
				rename( function ( path ) {
					path.dirname = path.dirname.replace( 'sass', 'css' );
					path.basename += '.min';
				} )
			)
			.pipe( dest( '.' ) )
	);
}

// Watcher Process: gulp watchFiles
/**
 *
 */
export function watchFiles() {
	compileAll();
	watch( js_files, compileJS );
	watch( sass_files_to_watch, compileSASS );
}
export { watchFiles as watch };

export const compileAll = parallel( compileJS, compileSASS );

// Default: gulp
/**
 * @param cb
 */
export default function build( cb ) {
	console.log( '|----- Building JS & CSS -----|' );
	compileAll( function () {
		console.log( '|----- Finished Building JS & CSS -----|' );
		cb();
	} );
}
