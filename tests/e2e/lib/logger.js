import { createLogger, format, transports } from 'winston';

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
	level: 'info',
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
		new transports.File( { filename: 'logs/e2e-json.log' } ),
		new transports.File( { filename: 'logs/e2e-simple.log', format: stringFormat } ),
	],
} );

//
// If we're not in production then **ALSO** log to the `console`
// with the colorized simple format.
//
if ( process.env.E2E_DEBUG || ! process.env.CI ) {
	logger.add(
		new transports.Console( {
			format: stringFormat,
		} )
	);
}

export default logger;
