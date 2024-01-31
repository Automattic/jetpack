/* eslint-disable no-console */
import { z } from 'zod';

/**
 * DataSync Error returned by the REST API.
 */
type ErrorData = {
	location: string | URL;
	status:
		| number
		| 'aborted'
		| 'error_with_message'
		| 'failed_to_sync'
		| 'json_parse_error'
		| 'json_empty'
		| 'response_not_ok'
		| 'schema_error';
	namespace: string;
	method?: string;
	key: string;
	error?: unknown;
	data: unknown;
};

export class DataSyncError extends Error {
	public name = 'DataSyncError';
	constructor(
		public message: string,
		public info: ErrorData
	) {
		super( message );

		if ( 'datasync_debug' in window && window.datasync_debug ) {
			this.debugMessage();
		}

		/**
		 * This makes `foo instanceof DataSyncError` work.
		 * To make instanceof work correctly
		 * set the prototype explicitly.
		 *
		 * @see https://stackoverflow.com/a/41102306/1015046
		 */
		Object.setPrototypeOf( this, DataSyncError.prototype );
	}

	/**
	 * This is a helper method to log and format DataSync errors in the console.
	 * It's only called when `window.datasync_debug` is set to `true`.
	 */
	private debugMessage() {
		const info = this.info;
		const key = `${ info.namespace }.${ info.key }`;
		console.groupCollapsed(
			`🔄 DataSync Debug: %c${ key }`,
			'color: #dc362e; font-weight: normal;'
		);

		// Group common styles into a single object
		const styles = {
			group: 'color: #6e6e6e; font-weight: 700; font-size: 14px;',
			bold: 'font-weight: bold;',
			value: 'color: #827171; font-weight: bold;',
			spacing: 'margin-top: 5px; margin-bottom: 2px;',
			arrow: 'margin-left: 5px; margin-right: 5px; font-size: 15px;',
			highlight: 'font-style: italic; solid #e9e9e3; line-height: 1.8;',
		};

		console.error( this.message );
		if ( info.error instanceof z.ZodError ) {
			const msg = [];
			const stylesArray = [];

			// Shortcut for adding a message and style
			const add = ( m, s = '' ) => {
				if ( s ) {
					msg.push( `%c${ m }%c` );
					stylesArray.push( s, '' ); // Reset style after custom
				} else {
					msg.push( m );
				}
			};

			if ( info.error.issues.length > 0 ) {
				console.groupCollapsed( `%c🦸 Zod Issues(${ info.error.issues.length })`, styles.group );
				for ( const issue of info.error.issues ) {
					const issuePath = issue.path.join( '.' );
					const issueMessage = issue.message;

					add( '\nZod Error: ', 'padding-top: 5px;' );
					add( `${ issue.code }`, styles.bold );
					add( ' in ' );
					add( `${ key }`, styles.value );
					if ( issuePath ) {
						add( `.${ issuePath }`, styles.bold );
					}

					add( '\n' );
					add( '⇢', styles.arrow );
					add( `${ issueMessage }`, styles.highlight );
					add( `\n\n` );

					console.log( msg.join( '' ), ...stylesArray );
					msg.length = 0;
					stylesArray.length = 0;
				}
				console.groupEnd();
			}
		}

		console.groupCollapsed( `%c🪲 Debug`, styles.group );

		let location = info.location;
		if ( info.method ) {
			location = `${ info.method } ${ location }`;
		}
		console.log( `%cLocation%c:\n${ location }`, `${ styles.bold } ${ styles.spacing }`, '' );

		if ( this.info.namespace in window && this.info.key in window[ this.info.namespace ] ) {
			const value = window[ this.info.namespace ][ this.info.key ];

			console.log(
				`%cInitial Data%c:\nwindow.${ key }.value =`,
				`${ styles.bold } ${ styles.spacing }`,
				'',
				value.value
			);
			if ( 'log' in value ) {
				console.log(
					`%cPHP Log%c:`,
					`${ styles.bold } ${ styles.spacing }`,
					'',
					value.log.length > 0 ? value.log : 'No log messages.'
				);
			} else {
				console.log(
					`%cPHP Log%c: PHP Log is disabled. To enable it, place the debug code in your wp-config.php:\n%cdefine('DATASYNC_DEBUG', true);`,
					`${ styles.bold } ${ styles.spacing }`,
					'',
					styles.highlight
				);
			}
		}
		if ( info.data !== undefined ) {
			console.log(
				`%cRaw Data Received:%c\n`,
				`${ styles.bold } ${ styles.spacing }`,
				'',
				info.data
			);
		}
		console.groupEnd();
		console.groupEnd();
	}
}
