const logger = require( '../logger.cjs' );

class LogReporter {
	onBegin( config, suite ) {
		logger.debug( `Starting the run for ${ this.getSuiteName( suite ) }` );
	}

	onTestBegin( test ) {
		logger.debug( `Starting test ${ test.title }` );
	}

	onTestEnd( test, result ) {
		logger.debug( `Finished test ${ test.title }: ${ result.status }` );
		if ( result.status === 'failed' ) {
			logger.debug( result.error.stack );
		}
	}

	onEnd( result ) {
		logger.debug( `Finished the run: ${ result.status }` );
	}

	getSuiteName( suite ) {
		let level = suite;
		let depth = 0;
		while ( depth < 10 ) {
			if ( level.suites && level.suites[ 0 ] ) {
				level = level.suites[ 0 ];
			} else {
				break;
			}
			depth++;
		}

		return level.titlePath().join( ' ' ).trim();
	}
}
module.exports = LogReporter;
