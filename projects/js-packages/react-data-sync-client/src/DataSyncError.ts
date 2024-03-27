/* eslint-disable no-console */
import { z } from 'zod';

/**
 * DataSync Error returned by the REST API.
 */
export type DataSyncErrorInfo = {
	message: string;
	code: string;
};

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
		public errorData: ErrorData
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

	public isAborted(): boolean {
		return this.errorData.status === 'aborted';
	}

	/**
	 * This is a helper method to log and format DataSync errors in the console.
	 * It's only called when `window.datasync_debug` is set to `true`.
	 */
	private debugMessage() {
		if (
			this.errorData.error instanceof DOMException &&
			this.errorData.error.name === 'AbortError'
		) {
			console.warn(
				`DataSync: ${ this.errorData.method ?? '<unknown>' } ${
					this.errorData.location
				}  request aborted.`
			);
			return;
		}

		const info = this.errorData;
		const key = `${ info.namespace }.${ info.key }`;

		// Group common styles into a single object
		const darkStyles = {
			group: 'color: #d3d3d3; font-weight: 700; font-size: 14px;',
			bold: 'font-weight: bold;',
			dim: 'color: #737373;',
			spacing: 'margin-top: 5px; margin-bottom: 2px;',
			arrow: 'margin-left: 5px; margin-right: 5px; font-size: 15px;',
			highlight: 'font-style: italic; line-height: 1.8; color: #a5aeb5;',
			key: 'color: #ffa280; font-weight: normal;',
		};

		const lightStyles = {
			group: 'color: #1d2327; font-weight: 700; font-size: 14px;',
			bold: 'font-weight: bold;',
			dim: 'color: #a89e9e;',
			spacing: 'margin-top: 5px; margin-bottom: 2px;',
			arrow: 'margin-left: 5px; margin-right: 5px; font-size: 15px;',
			highlight: 'font-style: italic; line-height: 1.8; color: #606467;',
			key: 'color: #dc362e; font-weight: normal;',
		};

		const isDarkMode =
			window.matchMedia && window.matchMedia( '(prefers-color-scheme: dark)' ).matches;
		const style = isDarkMode ? darkStyles : lightStyles;

		console.groupCollapsed( `🔄 DataSync Debug: %c${ key }`, style.key );
		console.error( this.message );
		if ( info.error instanceof z.ZodError ) {
			const msg = [];
			const messageStyle = [];

			// Shortcut for adding a message and style
			const add = ( m, s = '' ) => {
				if ( s ) {
					msg.push( `%c${ m }%c` );
					messageStyle.push( s, '' );
				} else {
					msg.push( m );
				}
			};

			if ( info.error.issues.length > 0 ) {
				console.groupCollapsed( `%c🦸 Zod Issues(${ info.error.issues.length })`, style.group );
				for ( const issue of info.error.issues ) {
					const issuePath = issue.path.join( '.' );
					const issueMessage = issue.message;

					add( '\nZod Error: ', 'padding-top: 5px;' );
					add( `${ issue.code }`, style.bold );
					add( ' in ' );
					add( `${ key }`, style.dim );
					if ( issuePath ) {
						add( `.${ issuePath }`, style.bold );
					}

					add( '\n' );
					add( '⇢', style.arrow );
					add( `${ issueMessage }`, style.highlight );
					add( `\n\n` );

					console.log( msg.join( '' ), ...messageStyle );
					msg.length = 0;
					messageStyle.length = 0;
				}
				console.groupEnd();
			}
		} else if ( info.error ) {
			console.groupCollapsed( `%c🚨 Error`, style.group );
			console.error( info.error );
			console.groupEnd();
		}

		console.groupCollapsed( `%c🪲 Debug`, style.group );

		let location = info.location;
		if ( info.method ) {
			location = `${ info.method } ${ location }`;
		}
		console.log( `%cLocation%c:\n${ location }`, `${ style.bold } ${ style.spacing }`, '' );

		if (
			this.errorData.namespace in window &&
			this.errorData.key in window[ this.errorData.namespace ]
		) {
			const value = window[ this.errorData.namespace ][ this.errorData.key ];

			console.log(
				`%cInitial Data%c:\nwindow.${ key }.value =`,
				`${ style.bold } ${ style.spacing }`,
				'',
				value.value
			);
			if ( 'log' in value ) {
				console.log(
					`%cPHP Log%c:`,
					`${ style.bold } ${ style.spacing }`,
					'',
					value.log.length > 0 ? value.log : 'No log messages.'
				);
			} else {
				console.log(
					`%cPHP Log%c: PHP Log is disabled. To enable it, place the debug code in your wp-config.php:\n%cdefine('DATASYNC_DEBUG', true);`,
					`${ style.bold } ${ style.spacing }`,
					'',
					style.highlight
				);
			}
		}
		if ( info.data !== undefined ) {
			console.log(
				`%cRaw Data Received:%c\n`,
				`${ style.bold } ${ style.spacing }`,
				'',
				info.data
			);
		}
		console.groupEnd();
		console.groupEnd();
	}

	public info(): DataSyncErrorInfo {
		let code = 'unknown_error';
		let message = this.message;

		if ( this.errorData.data instanceof Object ) {
			if ( 'code' in this.errorData.data && typeof this.errorData.data.code === 'string' ) {
				code = this.errorData.data.code;
			}
			if ( 'message' in this.errorData.data && typeof this.errorData.data.message === 'string' ) {
				message = this.errorData.data.message;
			}
		}
		return {
			message,
			code,
		};
	}
}
