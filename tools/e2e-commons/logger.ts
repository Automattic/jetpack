import path from 'path';
import config from 'config';
import { createLogger, format, transports, addColors } from 'winston';

const myCustomLevels = {
	levels: {
		error: 10,
		warn: 20,
		info: 30,
		debug: 40,
	},
	colors: {
		action: 'cyan',
		step: 'cyan',
		prerequisites: 'cyan',
		cli: 'cyanBG black',
		sync: 'cyan',
	},
};

addColors( myCustomLevels.colors );

let consoleLogLevel = process.env.CONSOLE_LOG_LEVEL || 'debug';

if ( process.env.CI ) {
	consoleLogLevel = 'error';
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
	} ),
	format.uncolorize()
);

export default createLogger( {
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
		new transports.File( {
			filename: path.resolve( config.get( 'dirs.logs' ), 'e2e-debug.log' ),
			format: stringFormat,
			level: 'debug',
		} ),

		new transports.Console( {
			format: format.combine(
				format.timestamp(),
				format.colorize(),
				format.printf( ( { level, message, timestamp } ) => {
					return `${ timestamp } ${ level }: ${ message }`;
				} )
			),
			level: consoleLogLevel,
		} ),
	],
} );
