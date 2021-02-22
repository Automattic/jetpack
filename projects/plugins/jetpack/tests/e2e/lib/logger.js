import { createLogger, format, transports } from 'winston';
import config from 'config';
import path from 'path';

const LEVEL = Symbol.for( 'level' );

const myCustomLevels = {
	levels: {
		error: 3,
		warn: 4,
		notice: 5,
		info: 6,
		debug: 7,
		slack: 9,
	},
};

/**
 * Log only the messages the match `level`.
 *
 * @param {string} level
 */
function filterOnly( level ) {
	return format( function ( info ) {
		if ( info[ LEVEL ] === level ) {
			return info;
		}
	} )();
}

const stringFormat = format.combine(
	format.timestamp(),
	format.errors( { stack: true } ),
	format.printf( info => {
		let msg = `${ info.timestamp } ${ info.level }: ${ info.message }`;
		if ( info.stack ) {
			msg = msg + `\n${ info.stack }`;
		}

		return msg;
	} )
);

const logger = createLogger( {
	levels: myCustomLevels.levels,
	format: format.combine(
		format.timestamp( {
			format: 'YYYY-MM-DD HH:mm:ss',
		} ),
		format.errors( { stack: true } ),
		format.splat(),
		format.json()
	),
	transports: [
		//
		// - Write to all logs with level `info` and below to `quick-start-combined.log`.
		// - Write all logs error (and below) to `quick-start-error.log`.
		//
		new transports.File( {
			filename: path.resolve( config.get( 'testOutputDir' ), 'logs/e2e-json.log' ),
		} ),
		new transports.File( {
			filename: path.resolve( config.get( 'testOutputDir' ), 'logs/e2e-simple.log' ),
			format: stringFormat,
		} ),
		// Slack specific logging transport that is used later to send a report to slack.
		new transports.File( {
			filename: path.resolve( config.get( 'testOutputDir' ), 'logs/e2e-slack.log' ),
			level: 'slack',

			format: format.combine(
				filterOnly( 'slack' ),
				format.printf( info => {
					if ( typeof info.message === 'object' ) {
						const obj = info.message;

						info = Object.assign( info, obj );
						delete info.message;
						if ( info.error ) {
							// Manually serialize error object, since `stringify` can not handle it
							const error = {
								name: info.error.name,
								message: info.error.message,
								stack: info.error.stack,
							};
							info.error = error;
						}
					}

					return JSON.stringify( info );
				} )
			),
		} ),
	],
} );

// If we're running tests locally with debug enabled then **ALSO** log to the `console`
// with the colorized simple format.
if ( process.env.E2E_DEBUG || ! process.env.CI ) {
	logger.add(
		new transports.Console( {
			format: stringFormat,
		} )
	);
}

export default logger;
