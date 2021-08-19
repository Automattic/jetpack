const { createLogger, format, transports, addColors } = require( 'winston' );
const config = require( 'config' );
const path = require( 'path' );

const myCustomLevels = {
	levels: {
		error: 3,
		warn: 4,
		notice: 5,
		info: 6,
		step: 7,
		action: 8,
		prerequisites: 9,
		cli: 10,
		debug: 11,
	},
	colors: {
		action: 'cyan',
		step: 'cyan',
		prerequisites: 'cyan',
		cli: 'cyanBG black',
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

// eslint-disable-next-line no-unused-vars
const logger = ( module.exports = createLogger( {
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
} ) );
