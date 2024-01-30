/* eslint-disable no-console */
import { z } from 'zod';

/**
 * DataSync Error returned by the REST API.
 */
type ErrorData = {
	url: string | URL;
	status:
		| number
		| 'aborted'
		| 'error_with_message'
		| 'failed_to_sync'
		| 'json_parse_error'
		| 'json_empty'
		| 'schema_error';
	namespace: string;
	method: string;
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
		console.groupCollapsed( `DataSync Debug: %c${ key }`, 'color: #dc362e; font-weight: normal;' );
		console.error( this.message );
		if ( info.error instanceof z.ZodError ) {
			const msg: string[] = [];
			const styles: string[] = [];

			// Shortcut for adding a message and style.
			const add = ( m: string, s?: string ) => {
				if ( s ) {
					msg.push( `%c${ m }%c` );
					styles.push( s );
					styles.push( '' );
				} else {
					msg.push( m );
				}
			};

			if ( info.error.issues.length > 0 ) {
				console.groupCollapsed(
					`%c🦸 Zod Issues(${ info.error.issues.length })`,
					'color: #6e6e6e; font-weight: 700; font-size: 14px;'
				);
				for ( const issue of info.error.issues ) {
					const issuePath = `${ issue.path.join( '.' ) }`;
					const issueMessage = issue.message;
					add( `\nZod Error: `, 'padding-top: 5px;' );
					add( `${ issue.code }`, 'font-weight: bold;' );
					add( ` in ` );
					add( `${ key }`, 'color: #827171; font-weight: bold;' );
					if ( issuePath ) {
						add( `.${ issuePath }`, 'font-weight: bold;' );
					}
					add( `\n` );
					add(
						`${ issueMessage }`,
						'font-style: italic; border-left: 3px solid #e9e9e3; margin: 3px 0px 3px 7px; background-color: #f9f9f6; padding: 7px;'
					);
					console.log( msg.join( '' ), ...styles );
					msg.length = 0;
					styles.length = 0;
				}
				console.groupEnd();
			}
		}

		console.groupCollapsed( `%c🪲 Debug`, 'color: #6e6e6e; font-weight: 600; font-size: 14px;' );

		console.log(
			`%cEndpoint%c:\n${ info.method } ${ info.url }`,
			'font-weight: bold; margin-top: 5px; margin-bottom: 2px;',
			''
		);
		if ( this.info.namespace in window && this.info.key in window[ this.info.namespace ] ) {
			const value = window[ this.info.namespace ][ this.info.key ];

			console.log(
				`%cInitial Data%c:\nwindow.${ key }.value =`,
				'font-weight: bold; margin-top: 5px; margin-bottom: 2px;',
				'',
				value.value
			);
			if ( 'log' in value ) {
				console.log(
					`%cPHP Log%c:`,
					'font-weight: bold; margin-top: 5px; margin-bottom: 2px;',
					'',
					value.log.length > 0 ? value.log : 'No log messages.'
				);
			}
		}
		if ( info.data !== undefined ) {
			console.log(
				`%cRaw Data Received:%c\n`,
				'font-weight: bold; margin-top: 5px; margin-bottom: 2px;',
				'',
				info.data
			);
		}
		console.groupEnd();
		console.groupEnd();
	}
}
