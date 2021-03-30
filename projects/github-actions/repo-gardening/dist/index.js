require( './sourcemap-register.js' );
module.exports = /******/ ( () => {
	// webpackBootstrap
	/******/ var __webpack_modules__ = {
		/***/ 7351: /***/ function ( __unused_webpack_module, exports, __nccwpck_require__ ) {
			'use strict';

			var __importStar =
				( this && this.__importStar ) ||
				function ( mod ) {
					if ( mod && mod.__esModule ) return mod;
					var result = {};
					if ( mod != null )
						for ( var k in mod ) if ( Object.hasOwnProperty.call( mod, k ) ) result[ k ] = mod[ k ];
					result[ 'default' ] = mod;
					return result;
				};
			Object.defineProperty( exports, '__esModule', { value: true } );
			const os = __importStar( __nccwpck_require__( 2087 ) );
			const utils_1 = __nccwpck_require__( 5278 );
			/**
			 * Commands
			 *
			 * Command Format:
			 *   ::name key=value,key=value::message
			 *
			 * Examples:
			 *   ::warning::This is the message
			 *   ::set-env name=MY_VAR::some value
			 */
			function issueCommand( command, properties, message ) {
				const cmd = new Command( command, properties, message );
				process.stdout.write( cmd.toString() + os.EOL );
			}
			exports.issueCommand = issueCommand;
			function issue( name, message = '' ) {
				issueCommand( name, {}, message );
			}
			exports.issue = issue;
			const CMD_STRING = '::';
			class Command {
				constructor( command, properties, message ) {
					if ( ! command ) {
						command = 'missing.command';
					}
					this.command = command;
					this.properties = properties;
					this.message = message;
				}
				toString() {
					let cmdStr = CMD_STRING + this.command;
					if ( this.properties && Object.keys( this.properties ).length > 0 ) {
						cmdStr += ' ';
						let first = true;
						for ( const key in this.properties ) {
							if ( this.properties.hasOwnProperty( key ) ) {
								const val = this.properties[ key ];
								if ( val ) {
									if ( first ) {
										first = false;
									} else {
										cmdStr += ',';
									}
									cmdStr += `${ key }=${ escapeProperty( val ) }`;
								}
							}
						}
					}
					cmdStr += `${ CMD_STRING }${ escapeData( this.message ) }`;
					return cmdStr;
				}
			}
			function escapeData( s ) {
				return utils_1
					.toCommandValue( s )
					.replace( /%/g, '%25' )
					.replace( /\r/g, '%0D' )
					.replace( /\n/g, '%0A' );
			}
			function escapeProperty( s ) {
				return utils_1
					.toCommandValue( s )
					.replace( /%/g, '%25' )
					.replace( /\r/g, '%0D' )
					.replace( /\n/g, '%0A' )
					.replace( /:/g, '%3A' )
					.replace( /,/g, '%2C' );
			}
			//# sourceMappingURL=command.js.map

			/***/
		},

		/***/ 2186: /***/ function ( __unused_webpack_module, exports, __nccwpck_require__ ) {
			'use strict';

			var __awaiter =
				( this && this.__awaiter ) ||
				function ( thisArg, _arguments, P, generator ) {
					function adopt( value ) {
						return value instanceof P
							? value
							: new P( function ( resolve ) {
									resolve( value );
							  } );
					}
					return new ( P || ( P = Promise ) )( function ( resolve, reject ) {
						function fulfilled( value ) {
							try {
								step( generator.next( value ) );
							} catch ( e ) {
								reject( e );
							}
						}
						function rejected( value ) {
							try {
								step( generator[ 'throw' ]( value ) );
							} catch ( e ) {
								reject( e );
							}
						}
						function step( result ) {
							result.done
								? resolve( result.value )
								: adopt( result.value ).then( fulfilled, rejected );
						}
						step( ( generator = generator.apply( thisArg, _arguments || [] ) ).next() );
					} );
				};
			var __importStar =
				( this && this.__importStar ) ||
				function ( mod ) {
					if ( mod && mod.__esModule ) return mod;
					var result = {};
					if ( mod != null )
						for ( var k in mod ) if ( Object.hasOwnProperty.call( mod, k ) ) result[ k ] = mod[ k ];
					result[ 'default' ] = mod;
					return result;
				};
			Object.defineProperty( exports, '__esModule', { value: true } );
			const command_1 = __nccwpck_require__( 7351 );
			const file_command_1 = __nccwpck_require__( 717 );
			const utils_1 = __nccwpck_require__( 5278 );
			const os = __importStar( __nccwpck_require__( 2087 ) );
			const path = __importStar( __nccwpck_require__( 5622 ) );
			/**
			 * The code to exit an action
			 */
			var ExitCode;
			( function ( ExitCode ) {
				/**
				 * A code indicating that the action was successful
				 */
				ExitCode[ ( ExitCode[ 'Success' ] = 0 ) ] = 'Success';
				/**
				 * A code indicating that the action was a failure
				 */
				ExitCode[ ( ExitCode[ 'Failure' ] = 1 ) ] = 'Failure';
			} )( ( ExitCode = exports.ExitCode || ( exports.ExitCode = {} ) ) );
			//-----------------------------------------------------------------------
			// Variables
			//-----------------------------------------------------------------------
			/**
			 * Sets env variable for this action and future actions in the job
			 * @param name the name of the variable to set
			 * @param val the value of the variable. Non-string values will be converted to a string via JSON.stringify
			 */
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			function exportVariable( name, val ) {
				const convertedVal = utils_1.toCommandValue( val );
				process.env[ name ] = convertedVal;
				const filePath = process.env[ 'GITHUB_ENV' ] || '';
				if ( filePath ) {
					const delimiter = '_GitHubActionsFileCommandDelimeter_';
					const commandValue = `${ name }<<${ delimiter }${ os.EOL }${ convertedVal }${ os.EOL }${ delimiter }`;
					file_command_1.issueCommand( 'ENV', commandValue );
				} else {
					command_1.issueCommand( 'set-env', { name }, convertedVal );
				}
			}
			exports.exportVariable = exportVariable;
			/**
			 * Registers a secret which will get masked from logs
			 * @param secret value of the secret
			 */
			function setSecret( secret ) {
				command_1.issueCommand( 'add-mask', {}, secret );
			}
			exports.setSecret = setSecret;
			/**
			 * Prepends inputPath to the PATH (for this action and future actions)
			 * @param inputPath
			 */
			function addPath( inputPath ) {
				const filePath = process.env[ 'GITHUB_PATH' ] || '';
				if ( filePath ) {
					file_command_1.issueCommand( 'PATH', inputPath );
				} else {
					command_1.issueCommand( 'add-path', {}, inputPath );
				}
				process.env[ 'PATH' ] = `${ inputPath }${ path.delimiter }${ process.env[ 'PATH' ] }`;
			}
			exports.addPath = addPath;
			/**
			 * Gets the value of an input.  The value is also trimmed.
			 *
			 * @param     name     name of the input to get
			 * @param     options  optional. See InputOptions.
			 * @returns   string
			 */
			function getInput( name, options ) {
				const val = process.env[ `INPUT_${ name.replace( / /g, '_' ).toUpperCase() }` ] || '';
				if ( options && options.required && ! val ) {
					throw new Error( `Input required and not supplied: ${ name }` );
				}
				return val.trim();
			}
			exports.getInput = getInput;
			/**
			 * Sets the value of an output.
			 *
			 * @param     name     name of the output to set
			 * @param     value    value to store. Non-string values will be converted to a string via JSON.stringify
			 */
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			function setOutput( name, value ) {
				command_1.issueCommand( 'set-output', { name }, value );
			}
			exports.setOutput = setOutput;
			/**
			 * Enables or disables the echoing of commands into stdout for the rest of the step.
			 * Echoing is disabled by default if ACTIONS_STEP_DEBUG is not set.
			 *
			 */
			function setCommandEcho( enabled ) {
				command_1.issue( 'echo', enabled ? 'on' : 'off' );
			}
			exports.setCommandEcho = setCommandEcho;
			//-----------------------------------------------------------------------
			// Results
			//-----------------------------------------------------------------------
			/**
			 * Sets the action status to failed.
			 * When the action exits it will be with an exit code of 1
			 * @param message add error issue message
			 */
			function setFailed( message ) {
				process.exitCode = ExitCode.Failure;
				error( message );
			}
			exports.setFailed = setFailed;
			//-----------------------------------------------------------------------
			// Logging Commands
			//-----------------------------------------------------------------------
			/**
			 * Gets whether Actions Step Debug is on or not
			 */
			function isDebug() {
				return process.env[ 'RUNNER_DEBUG' ] === '1';
			}
			exports.isDebug = isDebug;
			/**
			 * Writes debug message to user log
			 * @param message debug message
			 */
			function debug( message ) {
				command_1.issueCommand( 'debug', {}, message );
			}
			exports.debug = debug;
			/**
			 * Adds an error issue
			 * @param message error issue message. Errors will be converted to string via toString()
			 */
			function error( message ) {
				command_1.issue( 'error', message instanceof Error ? message.toString() : message );
			}
			exports.error = error;
			/**
			 * Adds an warning issue
			 * @param message warning issue message. Errors will be converted to string via toString()
			 */
			function warning( message ) {
				command_1.issue( 'warning', message instanceof Error ? message.toString() : message );
			}
			exports.warning = warning;
			/**
			 * Writes info to log with console.log.
			 * @param message info message
			 */
			function info( message ) {
				process.stdout.write( message + os.EOL );
			}
			exports.info = info;
			/**
			 * Begin an output group.
			 *
			 * Output until the next `groupEnd` will be foldable in this group
			 *
			 * @param name The name of the output group
			 */
			function startGroup( name ) {
				command_1.issue( 'group', name );
			}
			exports.startGroup = startGroup;
			/**
			 * End an output group.
			 */
			function endGroup() {
				command_1.issue( 'endgroup' );
			}
			exports.endGroup = endGroup;
			/**
			 * Wrap an asynchronous function call in a group.
			 *
			 * Returns the same type as the function itself.
			 *
			 * @param name The name of the group
			 * @param fn The function to wrap in the group
			 */
			function group( name, fn ) {
				return __awaiter( this, void 0, void 0, function* () {
					startGroup( name );
					let result;
					try {
						result = yield fn();
					} finally {
						endGroup();
					}
					return result;
				} );
			}
			exports.group = group;
			//-----------------------------------------------------------------------
			// Wrapper action state
			//-----------------------------------------------------------------------
			/**
			 * Saves state for current action, the state can only be retrieved by this action's post job execution.
			 *
			 * @param     name     name of the state to store
			 * @param     value    value to store. Non-string values will be converted to a string via JSON.stringify
			 */
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			function saveState( name, value ) {
				command_1.issueCommand( 'save-state', { name }, value );
			}
			exports.saveState = saveState;
			/**
			 * Gets the value of an state set by this action's main execution.
			 *
			 * @param     name     name of the state to get
			 * @returns   string
			 */
			function getState( name ) {
				return process.env[ `STATE_${ name }` ] || '';
			}
			exports.getState = getState;
			//# sourceMappingURL=core.js.map

			/***/
		},

		/***/ 717: /***/ function ( __unused_webpack_module, exports, __nccwpck_require__ ) {
			'use strict';

			// For internal use, subject to change.
			var __importStar =
				( this && this.__importStar ) ||
				function ( mod ) {
					if ( mod && mod.__esModule ) return mod;
					var result = {};
					if ( mod != null )
						for ( var k in mod ) if ( Object.hasOwnProperty.call( mod, k ) ) result[ k ] = mod[ k ];
					result[ 'default' ] = mod;
					return result;
				};
			Object.defineProperty( exports, '__esModule', { value: true } );
			// We use any as a valid input type
			/* eslint-disable @typescript-eslint/no-explicit-any */
			const fs = __importStar( __nccwpck_require__( 5747 ) );
			const os = __importStar( __nccwpck_require__( 2087 ) );
			const utils_1 = __nccwpck_require__( 5278 );
			function issueCommand( command, message ) {
				const filePath = process.env[ `GITHUB_${ command }` ];
				if ( ! filePath ) {
					throw new Error( `Unable to find environment variable for file command ${ command }` );
				}
				if ( ! fs.existsSync( filePath ) ) {
					throw new Error( `Missing file at path: ${ filePath }` );
				}
				fs.appendFileSync( filePath, `${ utils_1.toCommandValue( message ) }${ os.EOL }`, {
					encoding: 'utf8',
				} );
			}
			exports.issueCommand = issueCommand;
			//# sourceMappingURL=file-command.js.map

			/***/
		},

		/***/ 5278: /***/ ( __unused_webpack_module, exports ) => {
			'use strict';

			// We use any as a valid input type
			/* eslint-disable @typescript-eslint/no-explicit-any */
			Object.defineProperty( exports, '__esModule', { value: true } );
			/**
			 * Sanitizes an input into a string so it can be passed into issueCommand safely
			 * @param input input to sanitize into a string
			 */
			function toCommandValue( input ) {
				if ( input === null || input === undefined ) {
					return '';
				} else if ( typeof input === 'string' || input instanceof String ) {
					return input;
				}
				return JSON.stringify( input );
			}
			exports.toCommandValue = toCommandValue;
			//# sourceMappingURL=utils.js.map

			/***/
		},

		/***/ 4087: /***/ ( __unused_webpack_module, exports, __nccwpck_require__ ) => {
			'use strict';

			Object.defineProperty( exports, '__esModule', { value: true } );
			exports.Context = void 0;
			const fs_1 = __nccwpck_require__( 5747 );
			const os_1 = __nccwpck_require__( 2087 );
			class Context {
				/**
				 * Hydrate the context from the environment
				 */
				constructor() {
					this.payload = {};
					if ( process.env.GITHUB_EVENT_PATH ) {
						if ( fs_1.existsSync( process.env.GITHUB_EVENT_PATH ) ) {
							this.payload = JSON.parse(
								fs_1.readFileSync( process.env.GITHUB_EVENT_PATH, { encoding: 'utf8' } )
							);
						} else {
							const path = process.env.GITHUB_EVENT_PATH;
							process.stdout.write( `GITHUB_EVENT_PATH ${ path } does not exist${ os_1.EOL }` );
						}
					}
					this.eventName = process.env.GITHUB_EVENT_NAME;
					this.sha = process.env.GITHUB_SHA;
					this.ref = process.env.GITHUB_REF;
					this.workflow = process.env.GITHUB_WORKFLOW;
					this.action = process.env.GITHUB_ACTION;
					this.actor = process.env.GITHUB_ACTOR;
					this.job = process.env.GITHUB_JOB;
					this.runNumber = parseInt( process.env.GITHUB_RUN_NUMBER, 10 );
					this.runId = parseInt( process.env.GITHUB_RUN_ID, 10 );
				}
				get issue() {
					const payload = this.payload;
					return Object.assign( Object.assign( {}, this.repo ), {
						number: ( payload.issue || payload.pull_request || payload ).number,
					} );
				}
				get repo() {
					if ( process.env.GITHUB_REPOSITORY ) {
						const [ owner, repo ] = process.env.GITHUB_REPOSITORY.split( '/' );
						return { owner, repo };
					}
					if ( this.payload.repository ) {
						return {
							owner: this.payload.repository.owner.login,
							repo: this.payload.repository.name,
						};
					}
					throw new Error(
						"context.repo requires a GITHUB_REPOSITORY environment variable like 'owner/repo'"
					);
				}
			}
			exports.Context = Context;
			//# sourceMappingURL=context.js.map

			/***/
		},

		/***/ 5438: /***/ function ( __unused_webpack_module, exports, __nccwpck_require__ ) {
			'use strict';

			var __createBinding =
				( this && this.__createBinding ) ||
				( Object.create
					? function ( o, m, k, k2 ) {
							if ( k2 === undefined ) k2 = k;
							Object.defineProperty( o, k2, {
								enumerable: true,
								get: function () {
									return m[ k ];
								},
							} );
					  }
					: function ( o, m, k, k2 ) {
							if ( k2 === undefined ) k2 = k;
							o[ k2 ] = m[ k ];
					  } );
			var __setModuleDefault =
				( this && this.__setModuleDefault ) ||
				( Object.create
					? function ( o, v ) {
							Object.defineProperty( o, 'default', { enumerable: true, value: v } );
					  }
					: function ( o, v ) {
							o[ 'default' ] = v;
					  } );
			var __importStar =
				( this && this.__importStar ) ||
				function ( mod ) {
					if ( mod && mod.__esModule ) return mod;
					var result = {};
					if ( mod != null )
						for ( var k in mod )
							if ( Object.hasOwnProperty.call( mod, k ) ) __createBinding( result, mod, k );
					__setModuleDefault( result, mod );
					return result;
				};
			Object.defineProperty( exports, '__esModule', { value: true } );
			exports.getOctokit = exports.context = void 0;
			const Context = __importStar( __nccwpck_require__( 4087 ) );
			const utils_1 = __nccwpck_require__( 3030 );
			exports.context = new Context.Context();
			/**
			 * Returns a hydrated octokit ready to use for GitHub Actions
			 *
			 * @param     token    the repo PAT or GITHUB_TOKEN
			 * @param     options  other options to set
			 */
			function getOctokit( token, options ) {
				return new utils_1.GitHub( utils_1.getOctokitOptions( token, options ) );
			}
			exports.getOctokit = getOctokit;
			//# sourceMappingURL=github.js.map

			/***/
		},

		/***/ 7914: /***/ function ( __unused_webpack_module, exports, __nccwpck_require__ ) {
			'use strict';

			var __createBinding =
				( this && this.__createBinding ) ||
				( Object.create
					? function ( o, m, k, k2 ) {
							if ( k2 === undefined ) k2 = k;
							Object.defineProperty( o, k2, {
								enumerable: true,
								get: function () {
									return m[ k ];
								},
							} );
					  }
					: function ( o, m, k, k2 ) {
							if ( k2 === undefined ) k2 = k;
							o[ k2 ] = m[ k ];
					  } );
			var __setModuleDefault =
				( this && this.__setModuleDefault ) ||
				( Object.create
					? function ( o, v ) {
							Object.defineProperty( o, 'default', { enumerable: true, value: v } );
					  }
					: function ( o, v ) {
							o[ 'default' ] = v;
					  } );
			var __importStar =
				( this && this.__importStar ) ||
				function ( mod ) {
					if ( mod && mod.__esModule ) return mod;
					var result = {};
					if ( mod != null )
						for ( var k in mod )
							if ( Object.hasOwnProperty.call( mod, k ) ) __createBinding( result, mod, k );
					__setModuleDefault( result, mod );
					return result;
				};
			Object.defineProperty( exports, '__esModule', { value: true } );
			exports.getApiBaseUrl = exports.getProxyAgent = exports.getAuthString = void 0;
			const httpClient = __importStar( __nccwpck_require__( 9925 ) );
			function getAuthString( token, options ) {
				if ( ! token && ! options.auth ) {
					throw new Error( 'Parameter token or opts.auth is required' );
				} else if ( token && options.auth ) {
					throw new Error( 'Parameters token and opts.auth may not both be specified' );
				}
				return typeof options.auth === 'string' ? options.auth : `token ${ token }`;
			}
			exports.getAuthString = getAuthString;
			function getProxyAgent( destinationUrl ) {
				const hc = new httpClient.HttpClient();
				return hc.getAgent( destinationUrl );
			}
			exports.getProxyAgent = getProxyAgent;
			function getApiBaseUrl() {
				return process.env[ 'GITHUB_API_URL' ] || 'https://api.github.com';
			}
			exports.getApiBaseUrl = getApiBaseUrl;
			//# sourceMappingURL=utils.js.map

			/***/
		},

		/***/ 3030: /***/ function ( __unused_webpack_module, exports, __nccwpck_require__ ) {
			'use strict';

			var __createBinding =
				( this && this.__createBinding ) ||
				( Object.create
					? function ( o, m, k, k2 ) {
							if ( k2 === undefined ) k2 = k;
							Object.defineProperty( o, k2, {
								enumerable: true,
								get: function () {
									return m[ k ];
								},
							} );
					  }
					: function ( o, m, k, k2 ) {
							if ( k2 === undefined ) k2 = k;
							o[ k2 ] = m[ k ];
					  } );
			var __setModuleDefault =
				( this && this.__setModuleDefault ) ||
				( Object.create
					? function ( o, v ) {
							Object.defineProperty( o, 'default', { enumerable: true, value: v } );
					  }
					: function ( o, v ) {
							o[ 'default' ] = v;
					  } );
			var __importStar =
				( this && this.__importStar ) ||
				function ( mod ) {
					if ( mod && mod.__esModule ) return mod;
					var result = {};
					if ( mod != null )
						for ( var k in mod )
							if ( Object.hasOwnProperty.call( mod, k ) ) __createBinding( result, mod, k );
					__setModuleDefault( result, mod );
					return result;
				};
			Object.defineProperty( exports, '__esModule', { value: true } );
			exports.getOctokitOptions = exports.GitHub = exports.context = void 0;
			const Context = __importStar( __nccwpck_require__( 4087 ) );
			const Utils = __importStar( __nccwpck_require__( 7914 ) );
			// octokit + plugins
			const core_1 = __nccwpck_require__( 6762 );
			const plugin_rest_endpoint_methods_1 = __nccwpck_require__( 3044 );
			const plugin_paginate_rest_1 = __nccwpck_require__( 4193 );
			exports.context = new Context.Context();
			const baseUrl = Utils.getApiBaseUrl();
			const defaults = {
				baseUrl,
				request: {
					agent: Utils.getProxyAgent( baseUrl ),
				},
			};
			exports.GitHub = core_1.Octokit.plugin(
				plugin_rest_endpoint_methods_1.restEndpointMethods,
				plugin_paginate_rest_1.paginateRest
			).defaults( defaults );
			/**
			 * Convience function to correctly format Octokit Options to pass into the constructor.
			 *
			 * @param     token    the repo PAT or GITHUB_TOKEN
			 * @param     options  other options to set
			 */
			function getOctokitOptions( token, options ) {
				const opts = Object.assign( {}, options || {} ); // Shallow clone - don't mutate the object provided by the caller
				// Auth
				const auth = Utils.getAuthString( token, opts );
				if ( auth ) {
					opts.auth = auth;
				}
				return opts;
			}
			exports.getOctokitOptions = getOctokitOptions;
			//# sourceMappingURL=utils.js.map

			/***/
		},

		/***/ 9925: /***/ ( __unused_webpack_module, exports, __nccwpck_require__ ) => {
			'use strict';

			Object.defineProperty( exports, '__esModule', { value: true } );
			const http = __nccwpck_require__( 8605 );
			const https = __nccwpck_require__( 7211 );
			const pm = __nccwpck_require__( 6443 );
			let tunnel;
			var HttpCodes;
			( function ( HttpCodes ) {
				HttpCodes[ ( HttpCodes[ 'OK' ] = 200 ) ] = 'OK';
				HttpCodes[ ( HttpCodes[ 'MultipleChoices' ] = 300 ) ] = 'MultipleChoices';
				HttpCodes[ ( HttpCodes[ 'MovedPermanently' ] = 301 ) ] = 'MovedPermanently';
				HttpCodes[ ( HttpCodes[ 'ResourceMoved' ] = 302 ) ] = 'ResourceMoved';
				HttpCodes[ ( HttpCodes[ 'SeeOther' ] = 303 ) ] = 'SeeOther';
				HttpCodes[ ( HttpCodes[ 'NotModified' ] = 304 ) ] = 'NotModified';
				HttpCodes[ ( HttpCodes[ 'UseProxy' ] = 305 ) ] = 'UseProxy';
				HttpCodes[ ( HttpCodes[ 'SwitchProxy' ] = 306 ) ] = 'SwitchProxy';
				HttpCodes[ ( HttpCodes[ 'TemporaryRedirect' ] = 307 ) ] = 'TemporaryRedirect';
				HttpCodes[ ( HttpCodes[ 'PermanentRedirect' ] = 308 ) ] = 'PermanentRedirect';
				HttpCodes[ ( HttpCodes[ 'BadRequest' ] = 400 ) ] = 'BadRequest';
				HttpCodes[ ( HttpCodes[ 'Unauthorized' ] = 401 ) ] = 'Unauthorized';
				HttpCodes[ ( HttpCodes[ 'PaymentRequired' ] = 402 ) ] = 'PaymentRequired';
				HttpCodes[ ( HttpCodes[ 'Forbidden' ] = 403 ) ] = 'Forbidden';
				HttpCodes[ ( HttpCodes[ 'NotFound' ] = 404 ) ] = 'NotFound';
				HttpCodes[ ( HttpCodes[ 'MethodNotAllowed' ] = 405 ) ] = 'MethodNotAllowed';
				HttpCodes[ ( HttpCodes[ 'NotAcceptable' ] = 406 ) ] = 'NotAcceptable';
				HttpCodes[ ( HttpCodes[ 'ProxyAuthenticationRequired' ] = 407 ) ] =
					'ProxyAuthenticationRequired';
				HttpCodes[ ( HttpCodes[ 'RequestTimeout' ] = 408 ) ] = 'RequestTimeout';
				HttpCodes[ ( HttpCodes[ 'Conflict' ] = 409 ) ] = 'Conflict';
				HttpCodes[ ( HttpCodes[ 'Gone' ] = 410 ) ] = 'Gone';
				HttpCodes[ ( HttpCodes[ 'TooManyRequests' ] = 429 ) ] = 'TooManyRequests';
				HttpCodes[ ( HttpCodes[ 'InternalServerError' ] = 500 ) ] = 'InternalServerError';
				HttpCodes[ ( HttpCodes[ 'NotImplemented' ] = 501 ) ] = 'NotImplemented';
				HttpCodes[ ( HttpCodes[ 'BadGateway' ] = 502 ) ] = 'BadGateway';
				HttpCodes[ ( HttpCodes[ 'ServiceUnavailable' ] = 503 ) ] = 'ServiceUnavailable';
				HttpCodes[ ( HttpCodes[ 'GatewayTimeout' ] = 504 ) ] = 'GatewayTimeout';
			} )( ( HttpCodes = exports.HttpCodes || ( exports.HttpCodes = {} ) ) );
			var Headers;
			( function ( Headers ) {
				Headers[ 'Accept' ] = 'accept';
				Headers[ 'ContentType' ] = 'content-type';
			} )( ( Headers = exports.Headers || ( exports.Headers = {} ) ) );
			var MediaTypes;
			( function ( MediaTypes ) {
				MediaTypes[ 'ApplicationJson' ] = 'application/json';
			} )( ( MediaTypes = exports.MediaTypes || ( exports.MediaTypes = {} ) ) );
			/**
			 * Returns the proxy URL, depending upon the supplied url and proxy environment variables.
			 * @param serverUrl  The server URL where the request will be sent. For example, https://api.github.com
			 */
			function getProxyUrl( serverUrl ) {
				let proxyUrl = pm.getProxyUrl( new URL( serverUrl ) );
				return proxyUrl ? proxyUrl.href : '';
			}
			exports.getProxyUrl = getProxyUrl;
			const HttpRedirectCodes = [
				HttpCodes.MovedPermanently,
				HttpCodes.ResourceMoved,
				HttpCodes.SeeOther,
				HttpCodes.TemporaryRedirect,
				HttpCodes.PermanentRedirect,
			];
			const HttpResponseRetryCodes = [
				HttpCodes.BadGateway,
				HttpCodes.ServiceUnavailable,
				HttpCodes.GatewayTimeout,
			];
			const RetryableHttpVerbs = [ 'OPTIONS', 'GET', 'DELETE', 'HEAD' ];
			const ExponentialBackoffCeiling = 10;
			const ExponentialBackoffTimeSlice = 5;
			class HttpClientError extends Error {
				constructor( message, statusCode ) {
					super( message );
					this.name = 'HttpClientError';
					this.statusCode = statusCode;
					Object.setPrototypeOf( this, HttpClientError.prototype );
				}
			}
			exports.HttpClientError = HttpClientError;
			class HttpClientResponse {
				constructor( message ) {
					this.message = message;
				}
				readBody() {
					return new Promise( async ( resolve, reject ) => {
						let output = Buffer.alloc( 0 );
						this.message.on( 'data', chunk => {
							output = Buffer.concat( [ output, chunk ] );
						} );
						this.message.on( 'end', () => {
							resolve( output.toString() );
						} );
					} );
				}
			}
			exports.HttpClientResponse = HttpClientResponse;
			function isHttps( requestUrl ) {
				let parsedUrl = new URL( requestUrl );
				return parsedUrl.protocol === 'https:';
			}
			exports.isHttps = isHttps;
			class HttpClient {
				constructor( userAgent, handlers, requestOptions ) {
					this._ignoreSslError = false;
					this._allowRedirects = true;
					this._allowRedirectDowngrade = false;
					this._maxRedirects = 50;
					this._allowRetries = false;
					this._maxRetries = 1;
					this._keepAlive = false;
					this._disposed = false;
					this.userAgent = userAgent;
					this.handlers = handlers || [];
					this.requestOptions = requestOptions;
					if ( requestOptions ) {
						if ( requestOptions.ignoreSslError != null ) {
							this._ignoreSslError = requestOptions.ignoreSslError;
						}
						this._socketTimeout = requestOptions.socketTimeout;
						if ( requestOptions.allowRedirects != null ) {
							this._allowRedirects = requestOptions.allowRedirects;
						}
						if ( requestOptions.allowRedirectDowngrade != null ) {
							this._allowRedirectDowngrade = requestOptions.allowRedirectDowngrade;
						}
						if ( requestOptions.maxRedirects != null ) {
							this._maxRedirects = Math.max( requestOptions.maxRedirects, 0 );
						}
						if ( requestOptions.keepAlive != null ) {
							this._keepAlive = requestOptions.keepAlive;
						}
						if ( requestOptions.allowRetries != null ) {
							this._allowRetries = requestOptions.allowRetries;
						}
						if ( requestOptions.maxRetries != null ) {
							this._maxRetries = requestOptions.maxRetries;
						}
					}
				}
				options( requestUrl, additionalHeaders ) {
					return this.request( 'OPTIONS', requestUrl, null, additionalHeaders || {} );
				}
				get( requestUrl, additionalHeaders ) {
					return this.request( 'GET', requestUrl, null, additionalHeaders || {} );
				}
				del( requestUrl, additionalHeaders ) {
					return this.request( 'DELETE', requestUrl, null, additionalHeaders || {} );
				}
				post( requestUrl, data, additionalHeaders ) {
					return this.request( 'POST', requestUrl, data, additionalHeaders || {} );
				}
				patch( requestUrl, data, additionalHeaders ) {
					return this.request( 'PATCH', requestUrl, data, additionalHeaders || {} );
				}
				put( requestUrl, data, additionalHeaders ) {
					return this.request( 'PUT', requestUrl, data, additionalHeaders || {} );
				}
				head( requestUrl, additionalHeaders ) {
					return this.request( 'HEAD', requestUrl, null, additionalHeaders || {} );
				}
				sendStream( verb, requestUrl, stream, additionalHeaders ) {
					return this.request( verb, requestUrl, stream, additionalHeaders );
				}
				/**
				 * Gets a typed object from an endpoint
				 * Be aware that not found returns a null.  Other errors (4xx, 5xx) reject the promise
				 */
				async getJson( requestUrl, additionalHeaders = {} ) {
					additionalHeaders[ Headers.Accept ] = this._getExistingOrDefaultHeader(
						additionalHeaders,
						Headers.Accept,
						MediaTypes.ApplicationJson
					);
					let res = await this.get( requestUrl, additionalHeaders );
					return this._processResponse( res, this.requestOptions );
				}
				async postJson( requestUrl, obj, additionalHeaders = {} ) {
					let data = JSON.stringify( obj, null, 2 );
					additionalHeaders[ Headers.Accept ] = this._getExistingOrDefaultHeader(
						additionalHeaders,
						Headers.Accept,
						MediaTypes.ApplicationJson
					);
					additionalHeaders[ Headers.ContentType ] = this._getExistingOrDefaultHeader(
						additionalHeaders,
						Headers.ContentType,
						MediaTypes.ApplicationJson
					);
					let res = await this.post( requestUrl, data, additionalHeaders );
					return this._processResponse( res, this.requestOptions );
				}
				async putJson( requestUrl, obj, additionalHeaders = {} ) {
					let data = JSON.stringify( obj, null, 2 );
					additionalHeaders[ Headers.Accept ] = this._getExistingOrDefaultHeader(
						additionalHeaders,
						Headers.Accept,
						MediaTypes.ApplicationJson
					);
					additionalHeaders[ Headers.ContentType ] = this._getExistingOrDefaultHeader(
						additionalHeaders,
						Headers.ContentType,
						MediaTypes.ApplicationJson
					);
					let res = await this.put( requestUrl, data, additionalHeaders );
					return this._processResponse( res, this.requestOptions );
				}
				async patchJson( requestUrl, obj, additionalHeaders = {} ) {
					let data = JSON.stringify( obj, null, 2 );
					additionalHeaders[ Headers.Accept ] = this._getExistingOrDefaultHeader(
						additionalHeaders,
						Headers.Accept,
						MediaTypes.ApplicationJson
					);
					additionalHeaders[ Headers.ContentType ] = this._getExistingOrDefaultHeader(
						additionalHeaders,
						Headers.ContentType,
						MediaTypes.ApplicationJson
					);
					let res = await this.patch( requestUrl, data, additionalHeaders );
					return this._processResponse( res, this.requestOptions );
				}
				/**
				 * Makes a raw http request.
				 * All other methods such as get, post, patch, and request ultimately call this.
				 * Prefer get, del, post and patch
				 */
				async request( verb, requestUrl, data, headers ) {
					if ( this._disposed ) {
						throw new Error( 'Client has already been disposed.' );
					}
					let parsedUrl = new URL( requestUrl );
					let info = this._prepareRequest( verb, parsedUrl, headers );
					// Only perform retries on reads since writes may not be idempotent.
					let maxTries =
						this._allowRetries && RetryableHttpVerbs.indexOf( verb ) != -1
							? this._maxRetries + 1
							: 1;
					let numTries = 0;
					let response;
					while ( numTries < maxTries ) {
						response = await this.requestRaw( info, data );
						// Check if it's an authentication challenge
						if (
							response &&
							response.message &&
							response.message.statusCode === HttpCodes.Unauthorized
						) {
							let authenticationHandler;
							for ( let i = 0; i < this.handlers.length; i++ ) {
								if ( this.handlers[ i ].canHandleAuthentication( response ) ) {
									authenticationHandler = this.handlers[ i ];
									break;
								}
							}
							if ( authenticationHandler ) {
								return authenticationHandler.handleAuthentication( this, info, data );
							} else {
								// We have received an unauthorized response but have no handlers to handle it.
								// Let the response return to the caller.
								return response;
							}
						}
						let redirectsRemaining = this._maxRedirects;
						while (
							HttpRedirectCodes.indexOf( response.message.statusCode ) != -1 &&
							this._allowRedirects &&
							redirectsRemaining > 0
						) {
							const redirectUrl = response.message.headers[ 'location' ];
							if ( ! redirectUrl ) {
								// if there's no location to redirect to, we won't
								break;
							}
							let parsedRedirectUrl = new URL( redirectUrl );
							if (
								parsedUrl.protocol == 'https:' &&
								parsedUrl.protocol != parsedRedirectUrl.protocol &&
								! this._allowRedirectDowngrade
							) {
								throw new Error(
									'Redirect from HTTPS to HTTP protocol. This downgrade is not allowed for security reasons. If you want to allow this behavior, set the allowRedirectDowngrade option to true.'
								);
							}
							// we need to finish reading the response before reassigning response
							// which will leak the open socket.
							await response.readBody();
							// strip authorization header if redirected to a different hostname
							if ( parsedRedirectUrl.hostname !== parsedUrl.hostname ) {
								for ( let header in headers ) {
									// header names are case insensitive
									if ( header.toLowerCase() === 'authorization' ) {
										delete headers[ header ];
									}
								}
							}
							// let's make the request with the new redirectUrl
							info = this._prepareRequest( verb, parsedRedirectUrl, headers );
							response = await this.requestRaw( info, data );
							redirectsRemaining--;
						}
						if ( HttpResponseRetryCodes.indexOf( response.message.statusCode ) == -1 ) {
							// If not a retry code, return immediately instead of retrying
							return response;
						}
						numTries += 1;
						if ( numTries < maxTries ) {
							await response.readBody();
							await this._performExponentialBackoff( numTries );
						}
					}
					return response;
				}
				/**
				 * Needs to be called if keepAlive is set to true in request options.
				 */
				dispose() {
					if ( this._agent ) {
						this._agent.destroy();
					}
					this._disposed = true;
				}
				/**
				 * Raw request.
				 * @param info
				 * @param data
				 */
				requestRaw( info, data ) {
					return new Promise( ( resolve, reject ) => {
						let callbackForResult = function ( err, res ) {
							if ( err ) {
								reject( err );
							}
							resolve( res );
						};
						this.requestRawWithCallback( info, data, callbackForResult );
					} );
				}
				/**
				 * Raw request with callback.
				 * @param info
				 * @param data
				 * @param onResult
				 */
				requestRawWithCallback( info, data, onResult ) {
					let socket;
					if ( typeof data === 'string' ) {
						info.options.headers[ 'Content-Length' ] = Buffer.byteLength( data, 'utf8' );
					}
					let callbackCalled = false;
					let handleResult = ( err, res ) => {
						if ( ! callbackCalled ) {
							callbackCalled = true;
							onResult( err, res );
						}
					};
					let req = info.httpModule.request( info.options, msg => {
						let res = new HttpClientResponse( msg );
						handleResult( null, res );
					} );
					req.on( 'socket', sock => {
						socket = sock;
					} );
					// If we ever get disconnected, we want the socket to timeout eventually
					req.setTimeout( this._socketTimeout || 3 * 60000, () => {
						if ( socket ) {
							socket.end();
						}
						handleResult( new Error( 'Request timeout: ' + info.options.path ), null );
					} );
					req.on( 'error', function ( err ) {
						// err has statusCode property
						// res should have headers
						handleResult( err, null );
					} );
					if ( data && typeof data === 'string' ) {
						req.write( data, 'utf8' );
					}
					if ( data && typeof data !== 'string' ) {
						data.on( 'close', function () {
							req.end();
						} );
						data.pipe( req );
					} else {
						req.end();
					}
				}
				/**
				 * Gets an http agent. This function is useful when you need an http agent that handles
				 * routing through a proxy server - depending upon the url and proxy environment variables.
				 * @param serverUrl  The server URL where the request will be sent. For example, https://api.github.com
				 */
				getAgent( serverUrl ) {
					let parsedUrl = new URL( serverUrl );
					return this._getAgent( parsedUrl );
				}
				_prepareRequest( method, requestUrl, headers ) {
					const info = {};
					info.parsedUrl = requestUrl;
					const usingSsl = info.parsedUrl.protocol === 'https:';
					info.httpModule = usingSsl ? https : http;
					const defaultPort = usingSsl ? 443 : 80;
					info.options = {};
					info.options.host = info.parsedUrl.hostname;
					info.options.port = info.parsedUrl.port ? parseInt( info.parsedUrl.port ) : defaultPort;
					info.options.path = ( info.parsedUrl.pathname || '' ) + ( info.parsedUrl.search || '' );
					info.options.method = method;
					info.options.headers = this._mergeHeaders( headers );
					if ( this.userAgent != null ) {
						info.options.headers[ 'user-agent' ] = this.userAgent;
					}
					info.options.agent = this._getAgent( info.parsedUrl );
					// gives handlers an opportunity to participate
					if ( this.handlers ) {
						this.handlers.forEach( handler => {
							handler.prepareRequest( info.options );
						} );
					}
					return info;
				}
				_mergeHeaders( headers ) {
					const lowercaseKeys = obj =>
						Object.keys( obj ).reduce( ( c, k ) => (( c[ k.toLowerCase() ] = obj[ k ] ), c), {} );
					if ( this.requestOptions && this.requestOptions.headers ) {
						return Object.assign(
							{},
							lowercaseKeys( this.requestOptions.headers ),
							lowercaseKeys( headers )
						);
					}
					return lowercaseKeys( headers || {} );
				}
				_getExistingOrDefaultHeader( additionalHeaders, header, _default ) {
					const lowercaseKeys = obj =>
						Object.keys( obj ).reduce( ( c, k ) => (( c[ k.toLowerCase() ] = obj[ k ] ), c), {} );
					let clientHeader;
					if ( this.requestOptions && this.requestOptions.headers ) {
						clientHeader = lowercaseKeys( this.requestOptions.headers )[ header ];
					}
					return additionalHeaders[ header ] || clientHeader || _default;
				}
				_getAgent( parsedUrl ) {
					let agent;
					let proxyUrl = pm.getProxyUrl( parsedUrl );
					let useProxy = proxyUrl && proxyUrl.hostname;
					if ( this._keepAlive && useProxy ) {
						agent = this._proxyAgent;
					}
					if ( this._keepAlive && ! useProxy ) {
						agent = this._agent;
					}
					// if agent is already assigned use that agent.
					if ( !! agent ) {
						return agent;
					}
					const usingSsl = parsedUrl.protocol === 'https:';
					let maxSockets = 100;
					if ( !! this.requestOptions ) {
						maxSockets = this.requestOptions.maxSockets || http.globalAgent.maxSockets;
					}
					if ( useProxy ) {
						// If using proxy, need tunnel
						if ( ! tunnel ) {
							tunnel = __nccwpck_require__( 4294 );
						}
						const agentOptions = {
							maxSockets: maxSockets,
							keepAlive: this._keepAlive,
							proxy: {
								...( ( proxyUrl.username || proxyUrl.password ) && {
									proxyAuth: `${ proxyUrl.username }:${ proxyUrl.password }`,
								} ),
								host: proxyUrl.hostname,
								port: proxyUrl.port,
							},
						};
						let tunnelAgent;
						const overHttps = proxyUrl.protocol === 'https:';
						if ( usingSsl ) {
							tunnelAgent = overHttps ? tunnel.httpsOverHttps : tunnel.httpsOverHttp;
						} else {
							tunnelAgent = overHttps ? tunnel.httpOverHttps : tunnel.httpOverHttp;
						}
						agent = tunnelAgent( agentOptions );
						this._proxyAgent = agent;
					}
					// if reusing agent across request and tunneling agent isn't assigned create a new agent
					if ( this._keepAlive && ! agent ) {
						const options = { keepAlive: this._keepAlive, maxSockets: maxSockets };
						agent = usingSsl ? new https.Agent( options ) : new http.Agent( options );
						this._agent = agent;
					}
					// if not using private agent and tunnel agent isn't setup then use global agent
					if ( ! agent ) {
						agent = usingSsl ? https.globalAgent : http.globalAgent;
					}
					if ( usingSsl && this._ignoreSslError ) {
						// we don't want to set NODE_TLS_REJECT_UNAUTHORIZED=0 since that will affect request for entire process
						// http.RequestOptions doesn't expose a way to modify RequestOptions.agent.options
						// we have to cast it to any and change it directly
						agent.options = Object.assign( agent.options || {}, {
							rejectUnauthorized: false,
						} );
					}
					return agent;
				}
				_performExponentialBackoff( retryNumber ) {
					retryNumber = Math.min( ExponentialBackoffCeiling, retryNumber );
					const ms = ExponentialBackoffTimeSlice * Math.pow( 2, retryNumber );
					return new Promise( resolve => setTimeout( () => resolve(), ms ) );
				}
				static dateTimeDeserializer( key, value ) {
					if ( typeof value === 'string' ) {
						let a = new Date( value );
						if ( ! isNaN( a.valueOf() ) ) {
							return a;
						}
					}
					return value;
				}
				async _processResponse( res, options ) {
					return new Promise( async ( resolve, reject ) => {
						const statusCode = res.message.statusCode;
						const response = {
							statusCode: statusCode,
							result: null,
							headers: {},
						};
						// not found leads to null obj returned
						if ( statusCode == HttpCodes.NotFound ) {
							resolve( response );
						}
						let obj;
						let contents;
						// get the result from the body
						try {
							contents = await res.readBody();
							if ( contents && contents.length > 0 ) {
								if ( options && options.deserializeDates ) {
									obj = JSON.parse( contents, HttpClient.dateTimeDeserializer );
								} else {
									obj = JSON.parse( contents );
								}
								response.result = obj;
							}
							response.headers = res.message.headers;
						} catch ( err ) {
							// Invalid resource (contents not json);  leaving result obj null
						}
						// note that 3xx redirects are handled by the http layer.
						if ( statusCode > 299 ) {
							let msg;
							// if exception/error in body, attempt to get better error
							if ( obj && obj.message ) {
								msg = obj.message;
							} else if ( contents && contents.length > 0 ) {
								// it may be the case that the exception is in the body message as string
								msg = contents;
							} else {
								msg = 'Failed request: (' + statusCode + ')';
							}
							let err = new HttpClientError( msg, statusCode );
							err.result = response.result;
							reject( err );
						} else {
							resolve( response );
						}
					} );
				}
			}
			exports.HttpClient = HttpClient;

			/***/
		},

		/***/ 6443: /***/ ( __unused_webpack_module, exports ) => {
			'use strict';

			Object.defineProperty( exports, '__esModule', { value: true } );
			function getProxyUrl( reqUrl ) {
				let usingSsl = reqUrl.protocol === 'https:';
				let proxyUrl;
				if ( checkBypass( reqUrl ) ) {
					return proxyUrl;
				}
				let proxyVar;
				if ( usingSsl ) {
					proxyVar = process.env[ 'https_proxy' ] || process.env[ 'HTTPS_PROXY' ];
				} else {
					proxyVar = process.env[ 'http_proxy' ] || process.env[ 'HTTP_PROXY' ];
				}
				if ( proxyVar ) {
					proxyUrl = new URL( proxyVar );
				}
				return proxyUrl;
			}
			exports.getProxyUrl = getProxyUrl;
			function checkBypass( reqUrl ) {
				if ( ! reqUrl.hostname ) {
					return false;
				}
				let noProxy = process.env[ 'no_proxy' ] || process.env[ 'NO_PROXY' ] || '';
				if ( ! noProxy ) {
					return false;
				}
				// Determine the request port
				let reqPort;
				if ( reqUrl.port ) {
					reqPort = Number( reqUrl.port );
				} else if ( reqUrl.protocol === 'http:' ) {
					reqPort = 80;
				} else if ( reqUrl.protocol === 'https:' ) {
					reqPort = 443;
				}
				// Format the request hostname and hostname with port
				let upperReqHosts = [ reqUrl.hostname.toUpperCase() ];
				if ( typeof reqPort === 'number' ) {
					upperReqHosts.push( `${ upperReqHosts[ 0 ] }:${ reqPort }` );
				}
				// Compare request host against noproxy
				for ( let upperNoProxyItem of noProxy
					.split( ',' )
					.map( x => x.trim().toUpperCase() )
					.filter( x => x ) ) {
					if ( upperReqHosts.some( x => x === upperNoProxyItem ) ) {
						return true;
					}
				}
				return false;
			}
			exports.checkBypass = checkBypass;

			/***/
		},

		/***/ 334: /***/ ( __unused_webpack_module, exports ) => {
			'use strict';

			Object.defineProperty( exports, '__esModule', { value: true } );

			async function auth( token ) {
				const tokenType =
					token.split( /\./ ).length === 3
						? 'app'
						: /^v\d+\./.test( token )
						? 'installation'
						: 'oauth';
				return {
					type: 'token',
					token: token,
					tokenType,
				};
			}

			/**
			 * Prefix token for usage in the Authorization header
			 *
			 * @param token OAuth token or JSON Web Token
			 */
			function withAuthorizationPrefix( token ) {
				if ( token.split( /\./ ).length === 3 ) {
					return `bearer ${ token }`;
				}

				return `token ${ token }`;
			}

			async function hook( token, request, route, parameters ) {
				const endpoint = request.endpoint.merge( route, parameters );
				endpoint.headers.authorization = withAuthorizationPrefix( token );
				return request( endpoint );
			}

			const createTokenAuth = function createTokenAuth( token ) {
				if ( ! token ) {
					throw new Error( '[@octokit/auth-token] No token passed to createTokenAuth' );
				}

				if ( typeof token !== 'string' ) {
					throw new Error(
						'[@octokit/auth-token] Token passed to createTokenAuth is not a string'
					);
				}

				token = token.replace( /^(token|bearer) +/i, '' );
				return Object.assign( auth.bind( null, token ), {
					hook: hook.bind( null, token ),
				} );
			};

			exports.createTokenAuth = createTokenAuth;
			//# sourceMappingURL=index.js.map

			/***/
		},

		/***/ 6762: /***/ ( __unused_webpack_module, exports, __nccwpck_require__ ) => {
			'use strict';

			Object.defineProperty( exports, '__esModule', { value: true } );

			var universalUserAgent = __nccwpck_require__( 5030 );
			var beforeAfterHook = __nccwpck_require__( 3682 );
			var request = __nccwpck_require__( 6234 );
			var graphql = __nccwpck_require__( 8467 );
			var authToken = __nccwpck_require__( 334 );

			function _objectWithoutPropertiesLoose( source, excluded ) {
				if ( source == null ) return {};
				var target = {};
				var sourceKeys = Object.keys( source );
				var key, i;

				for ( i = 0; i < sourceKeys.length; i++ ) {
					key = sourceKeys[ i ];
					if ( excluded.indexOf( key ) >= 0 ) continue;
					target[ key ] = source[ key ];
				}

				return target;
			}

			function _objectWithoutProperties( source, excluded ) {
				if ( source == null ) return {};

				var target = _objectWithoutPropertiesLoose( source, excluded );

				var key, i;

				if ( Object.getOwnPropertySymbols ) {
					var sourceSymbolKeys = Object.getOwnPropertySymbols( source );

					for ( i = 0; i < sourceSymbolKeys.length; i++ ) {
						key = sourceSymbolKeys[ i ];
						if ( excluded.indexOf( key ) >= 0 ) continue;
						if ( ! Object.prototype.propertyIsEnumerable.call( source, key ) ) continue;
						target[ key ] = source[ key ];
					}
				}

				return target;
			}

			const VERSION = '3.3.1';

			class Octokit {
				constructor( options = {} ) {
					const hook = new beforeAfterHook.Collection();
					const requestDefaults = {
						baseUrl: request.request.endpoint.DEFAULTS.baseUrl,
						headers: {},
						request: Object.assign( {}, options.request, {
							// @ts-ignore internal usage only, no need to type
							hook: hook.bind( null, 'request' ),
						} ),
						mediaType: {
							previews: [],
							format: '',
						},
					}; // prepend default user agent with `options.userAgent` if set

					requestDefaults.headers[ 'user-agent' ] = [
						options.userAgent,
						`octokit-core.js/${ VERSION } ${ universalUserAgent.getUserAgent() }`,
					]
						.filter( Boolean )
						.join( ' ' );

					if ( options.baseUrl ) {
						requestDefaults.baseUrl = options.baseUrl;
					}

					if ( options.previews ) {
						requestDefaults.mediaType.previews = options.previews;
					}

					if ( options.timeZone ) {
						requestDefaults.headers[ 'time-zone' ] = options.timeZone;
					}

					this.request = request.request.defaults( requestDefaults );
					this.graphql = graphql.withCustomRequest( this.request ).defaults( requestDefaults );
					this.log = Object.assign(
						{
							debug: () => {},
							info: () => {},
							warn: console.warn.bind( console ),
							error: console.error.bind( console ),
						},
						options.log
					);
					this.hook = hook; // (1) If neither `options.authStrategy` nor `options.auth` are set, the `octokit` instance
					//     is unauthenticated. The `this.auth()` method is a no-op and no request hook is registered.
					// (2) If only `options.auth` is set, use the default token authentication strategy.
					// (3) If `options.authStrategy` is set then use it and pass in `options.auth`. Always pass own request as many strategies accept a custom request instance.
					// TODO: type `options.auth` based on `options.authStrategy`.

					if ( ! options.authStrategy ) {
						if ( ! options.auth ) {
							// (1)
							this.auth = async () => ( {
								type: 'unauthenticated',
							} );
						} else {
							// (2)
							const auth = authToken.createTokenAuth( options.auth ); // @ts-ignore  ¯\_(ツ)_/¯

							hook.wrap( 'request', auth.hook );
							this.auth = auth;
						}
					} else {
						const { authStrategy } = options,
							otherOptions = _objectWithoutProperties( options, [ 'authStrategy' ] );

						const auth = authStrategy(
							Object.assign(
								{
									request: this.request,
									log: this.log,
									// we pass the current octokit instance as well as its constructor options
									// to allow for authentication strategies that return a new octokit instance
									// that shares the same internal state as the current one. The original
									// requirement for this was the "event-octokit" authentication strategy
									// of https://github.com/probot/octokit-auth-probot.
									octokit: this,
									octokitOptions: otherOptions,
								},
								options.auth
							)
						); // @ts-ignore  ¯\_(ツ)_/¯

						hook.wrap( 'request', auth.hook );
						this.auth = auth;
					} // apply plugins
					// https://stackoverflow.com/a/16345172

					const classConstructor = this.constructor;
					classConstructor.plugins.forEach( plugin => {
						Object.assign( this, plugin( this, options ) );
					} );
				}

				static defaults( defaults ) {
					const OctokitWithDefaults = class extends this {
						constructor( ...args ) {
							const options = args[ 0 ] || {};

							if ( typeof defaults === 'function' ) {
								super( defaults( options ) );
								return;
							}

							super(
								Object.assign(
									{},
									defaults,
									options,
									options.userAgent && defaults.userAgent
										? {
												userAgent: `${ options.userAgent } ${ defaults.userAgent }`,
										  }
										: null
								)
							);
						}
					};
					return OctokitWithDefaults;
				}
				/**
				 * Attach a plugin (or many) to your Octokit instance.
				 *
				 * @example
				 * const API = Octokit.plugin(plugin1, plugin2, plugin3, ...)
				 */

				static plugin( ...newPlugins ) {
					var _a;

					const currentPlugins = this.plugins;
					const NewOctokit =
						( ( _a = class extends this {} ),
						( _a.plugins = currentPlugins.concat(
							newPlugins.filter( plugin => ! currentPlugins.includes( plugin ) )
						) ),
						_a );
					return NewOctokit;
				}
			}
			Octokit.VERSION = VERSION;
			Octokit.plugins = [];

			exports.Octokit = Octokit;
			//# sourceMappingURL=index.js.map

			/***/
		},

		/***/ 9440: /***/ ( __unused_webpack_module, exports, __nccwpck_require__ ) => {
			'use strict';

			Object.defineProperty( exports, '__esModule', { value: true } );

			var isPlainObject = __nccwpck_require__( 3287 );
			var universalUserAgent = __nccwpck_require__( 5030 );

			function lowercaseKeys( object ) {
				if ( ! object ) {
					return {};
				}

				return Object.keys( object ).reduce( ( newObj, key ) => {
					newObj[ key.toLowerCase() ] = object[ key ];
					return newObj;
				}, {} );
			}

			function mergeDeep( defaults, options ) {
				const result = Object.assign( {}, defaults );
				Object.keys( options ).forEach( key => {
					if ( isPlainObject.isPlainObject( options[ key ] ) ) {
						if ( ! ( key in defaults ) )
							Object.assign( result, {
								[ key ]: options[ key ],
							} );
						else result[ key ] = mergeDeep( defaults[ key ], options[ key ] );
					} else {
						Object.assign( result, {
							[ key ]: options[ key ],
						} );
					}
				} );
				return result;
			}

			function removeUndefinedProperties( obj ) {
				for ( const key in obj ) {
					if ( obj[ key ] === undefined ) {
						delete obj[ key ];
					}
				}

				return obj;
			}

			function merge( defaults, route, options ) {
				if ( typeof route === 'string' ) {
					let [ method, url ] = route.split( ' ' );
					options = Object.assign(
						url
							? {
									method,
									url,
							  }
							: {
									url: method,
							  },
						options
					);
				} else {
					options = Object.assign( {}, route );
				} // lowercase header names before merging with defaults to avoid duplicates

				options.headers = lowercaseKeys( options.headers ); // remove properties with undefined values before merging

				removeUndefinedProperties( options );
				removeUndefinedProperties( options.headers );
				const mergedOptions = mergeDeep( defaults || {}, options ); // mediaType.previews arrays are merged, instead of overwritten

				if ( defaults && defaults.mediaType.previews.length ) {
					mergedOptions.mediaType.previews = defaults.mediaType.previews
						.filter( preview => ! mergedOptions.mediaType.previews.includes( preview ) )
						.concat( mergedOptions.mediaType.previews );
				}

				mergedOptions.mediaType.previews = mergedOptions.mediaType.previews.map( preview =>
					preview.replace( /-preview/, '' )
				);
				return mergedOptions;
			}

			function addQueryParameters( url, parameters ) {
				const separator = /\?/.test( url ) ? '&' : '?';
				const names = Object.keys( parameters );

				if ( names.length === 0 ) {
					return url;
				}

				return (
					url +
					separator +
					names
						.map( name => {
							if ( name === 'q' ) {
								return 'q=' + parameters.q.split( '+' ).map( encodeURIComponent ).join( '+' );
							}

							return `${ name }=${ encodeURIComponent( parameters[ name ] ) }`;
						} )
						.join( '&' )
				);
			}

			const urlVariableRegex = /\{[^}]+\}/g;

			function removeNonChars( variableName ) {
				return variableName.replace( /^\W+|\W+$/g, '' ).split( /,/ );
			}

			function extractUrlVariableNames( url ) {
				const matches = url.match( urlVariableRegex );

				if ( ! matches ) {
					return [];
				}

				return matches.map( removeNonChars ).reduce( ( a, b ) => a.concat( b ), [] );
			}

			function omit( object, keysToOmit ) {
				return Object.keys( object )
					.filter( option => ! keysToOmit.includes( option ) )
					.reduce( ( obj, key ) => {
						obj[ key ] = object[ key ];
						return obj;
					}, {} );
			}

			// Based on https://github.com/bramstein/url-template, licensed under BSD
			// TODO: create separate package.
			//
			// Copyright (c) 2012-2014, Bram Stein
			// All rights reserved.
			// Redistribution and use in source and binary forms, with or without
			// modification, are permitted provided that the following conditions
			// are met:
			//  1. Redistributions of source code must retain the above copyright
			//     notice, this list of conditions and the following disclaimer.
			//  2. Redistributions in binary form must reproduce the above copyright
			//     notice, this list of conditions and the following disclaimer in the
			//     documentation and/or other materials provided with the distribution.
			//  3. The name of the author may not be used to endorse or promote products
			//     derived from this software without specific prior written permission.
			// THIS SOFTWARE IS PROVIDED BY THE AUTHOR "AS IS" AND ANY EXPRESS OR IMPLIED
			// WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
			// MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO
			// EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
			// INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING,
			// BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
			// DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
			// OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
			// NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
			// EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

			/* istanbul ignore file */
			function encodeReserved( str ) {
				return str
					.split( /(%[0-9A-Fa-f]{2})/g )
					.map( function ( part ) {
						if ( ! /%[0-9A-Fa-f]/.test( part ) ) {
							part = encodeURI( part ).replace( /%5B/g, '[' ).replace( /%5D/g, ']' );
						}

						return part;
					} )
					.join( '' );
			}

			function encodeUnreserved( str ) {
				return encodeURIComponent( str ).replace( /[!'()*]/g, function ( c ) {
					return '%' + c.charCodeAt( 0 ).toString( 16 ).toUpperCase();
				} );
			}

			function encodeValue( operator, value, key ) {
				value =
					operator === '+' || operator === '#'
						? encodeReserved( value )
						: encodeUnreserved( value );

				if ( key ) {
					return encodeUnreserved( key ) + '=' + value;
				} else {
					return value;
				}
			}

			function isDefined( value ) {
				return value !== undefined && value !== null;
			}

			function isKeyOperator( operator ) {
				return operator === ';' || operator === '&' || operator === '?';
			}

			function getValues( context, operator, key, modifier ) {
				var value = context[ key ],
					result = [];

				if ( isDefined( value ) && value !== '' ) {
					if (
						typeof value === 'string' ||
						typeof value === 'number' ||
						typeof value === 'boolean'
					) {
						value = value.toString();

						if ( modifier && modifier !== '*' ) {
							value = value.substring( 0, parseInt( modifier, 10 ) );
						}

						result.push( encodeValue( operator, value, isKeyOperator( operator ) ? key : '' ) );
					} else {
						if ( modifier === '*' ) {
							if ( Array.isArray( value ) ) {
								value.filter( isDefined ).forEach( function ( value ) {
									result.push(
										encodeValue( operator, value, isKeyOperator( operator ) ? key : '' )
									);
								} );
							} else {
								Object.keys( value ).forEach( function ( k ) {
									if ( isDefined( value[ k ] ) ) {
										result.push( encodeValue( operator, value[ k ], k ) );
									}
								} );
							}
						} else {
							const tmp = [];

							if ( Array.isArray( value ) ) {
								value.filter( isDefined ).forEach( function ( value ) {
									tmp.push( encodeValue( operator, value ) );
								} );
							} else {
								Object.keys( value ).forEach( function ( k ) {
									if ( isDefined( value[ k ] ) ) {
										tmp.push( encodeUnreserved( k ) );
										tmp.push( encodeValue( operator, value[ k ].toString() ) );
									}
								} );
							}

							if ( isKeyOperator( operator ) ) {
								result.push( encodeUnreserved( key ) + '=' + tmp.join( ',' ) );
							} else if ( tmp.length !== 0 ) {
								result.push( tmp.join( ',' ) );
							}
						}
					}
				} else {
					if ( operator === ';' ) {
						if ( isDefined( value ) ) {
							result.push( encodeUnreserved( key ) );
						}
					} else if ( value === '' && ( operator === '&' || operator === '?' ) ) {
						result.push( encodeUnreserved( key ) + '=' );
					} else if ( value === '' ) {
						result.push( '' );
					}
				}

				return result;
			}

			function parseUrl( template ) {
				return {
					expand: expand.bind( null, template ),
				};
			}

			function expand( template, context ) {
				var operators = [ '+', '#', '.', '/', ';', '?', '&' ];
				return template.replace( /\{([^\{\}]+)\}|([^\{\}]+)/g, function ( _, expression, literal ) {
					if ( expression ) {
						let operator = '';
						const values = [];

						if ( operators.indexOf( expression.charAt( 0 ) ) !== -1 ) {
							operator = expression.charAt( 0 );
							expression = expression.substr( 1 );
						}

						expression.split( /,/g ).forEach( function ( variable ) {
							var tmp = /([^:\*]*)(?::(\d+)|(\*))?/.exec( variable );
							values.push( getValues( context, operator, tmp[ 1 ], tmp[ 2 ] || tmp[ 3 ] ) );
						} );

						if ( operator && operator !== '+' ) {
							var separator = ',';

							if ( operator === '?' ) {
								separator = '&';
							} else if ( operator !== '#' ) {
								separator = operator;
							}

							return ( values.length !== 0 ? operator : '' ) + values.join( separator );
						} else {
							return values.join( ',' );
						}
					} else {
						return encodeReserved( literal );
					}
				} );
			}

			function parse( options ) {
				// https://fetch.spec.whatwg.org/#methods
				let method = options.method.toUpperCase(); // replace :varname with {varname} to make it RFC 6570 compatible

				let url = ( options.url || '/' ).replace( /:([a-z]\w+)/g, '{$1}' );
				let headers = Object.assign( {}, options.headers );
				let body;
				let parameters = omit( options, [
					'method',
					'baseUrl',
					'url',
					'headers',
					'request',
					'mediaType',
				] ); // extract variable names from URL to calculate remaining variables later

				const urlVariableNames = extractUrlVariableNames( url );
				url = parseUrl( url ).expand( parameters );

				if ( ! /^http/.test( url ) ) {
					url = options.baseUrl + url;
				}

				const omittedParameters = Object.keys( options )
					.filter( option => urlVariableNames.includes( option ) )
					.concat( 'baseUrl' );
				const remainingParameters = omit( parameters, omittedParameters );
				const isBinaryRequest = /application\/octet-stream/i.test( headers.accept );

				if ( ! isBinaryRequest ) {
					if ( options.mediaType.format ) {
						// e.g. application/vnd.github.v3+json => application/vnd.github.v3.raw
						headers.accept = headers.accept
							.split( /,/ )
							.map( preview =>
								preview.replace(
									/application\/vnd(\.\w+)(\.v3)?(\.\w+)?(\+json)?$/,
									`application/vnd$1$2.${ options.mediaType.format }`
								)
							)
							.join( ',' );
					}

					if ( options.mediaType.previews.length ) {
						const previewsFromAcceptHeader = headers.accept.match( /[\w-]+(?=-preview)/g ) || [];
						headers.accept = previewsFromAcceptHeader
							.concat( options.mediaType.previews )
							.map( preview => {
								const format = options.mediaType.format
									? `.${ options.mediaType.format }`
									: '+json';
								return `application/vnd.github.${ preview }-preview${ format }`;
							} )
							.join( ',' );
					}
				} // for GET/HEAD requests, set URL query parameters from remaining parameters
				// for PATCH/POST/PUT/DELETE requests, set request body from remaining parameters

				if ( [ 'GET', 'HEAD' ].includes( method ) ) {
					url = addQueryParameters( url, remainingParameters );
				} else {
					if ( 'data' in remainingParameters ) {
						body = remainingParameters.data;
					} else {
						if ( Object.keys( remainingParameters ).length ) {
							body = remainingParameters;
						} else {
							headers[ 'content-length' ] = 0;
						}
					}
				} // default content-type for JSON if body is set

				if ( ! headers[ 'content-type' ] && typeof body !== 'undefined' ) {
					headers[ 'content-type' ] = 'application/json; charset=utf-8';
				} // GitHub expects 'content-length: 0' header for PUT/PATCH requests without body.
				// fetch does not allow to set `content-length` header, but we can set body to an empty string

				if ( [ 'PATCH', 'PUT' ].includes( method ) && typeof body === 'undefined' ) {
					body = '';
				} // Only return body/request keys if present

				return Object.assign(
					{
						method,
						url,
						headers,
					},
					typeof body !== 'undefined'
						? {
								body,
						  }
						: null,
					options.request
						? {
								request: options.request,
						  }
						: null
				);
			}

			function endpointWithDefaults( defaults, route, options ) {
				return parse( merge( defaults, route, options ) );
			}

			function withDefaults( oldDefaults, newDefaults ) {
				const DEFAULTS = merge( oldDefaults, newDefaults );
				const endpoint = endpointWithDefaults.bind( null, DEFAULTS );
				return Object.assign( endpoint, {
					DEFAULTS,
					defaults: withDefaults.bind( null, DEFAULTS ),
					merge: merge.bind( null, DEFAULTS ),
					parse,
				} );
			}

			const VERSION = '6.0.11';

			const userAgent = `octokit-endpoint.js/${ VERSION } ${ universalUserAgent.getUserAgent() }`; // DEFAULTS has all properties set that EndpointOptions has, except url.
			// So we use RequestParameters and add method as additional required property.

			const DEFAULTS = {
				method: 'GET',
				baseUrl: 'https://api.github.com',
				headers: {
					accept: 'application/vnd.github.v3+json',
					'user-agent': userAgent,
				},
				mediaType: {
					format: '',
					previews: [],
				},
			};

			const endpoint = withDefaults( null, DEFAULTS );

			exports.endpoint = endpoint;
			//# sourceMappingURL=index.js.map

			/***/
		},

		/***/ 8467: /***/ ( __unused_webpack_module, exports, __nccwpck_require__ ) => {
			'use strict';

			Object.defineProperty( exports, '__esModule', { value: true } );

			var request = __nccwpck_require__( 6234 );
			var universalUserAgent = __nccwpck_require__( 5030 );

			const VERSION = '4.6.1';

			class GraphqlError extends Error {
				constructor( request, response ) {
					const message = response.data.errors[ 0 ].message;
					super( message );
					Object.assign( this, response.data );
					Object.assign( this, {
						headers: response.headers,
					} );
					this.name = 'GraphqlError';
					this.request = request; // Maintains proper stack trace (only available on V8)

					/* istanbul ignore next */

					if ( Error.captureStackTrace ) {
						Error.captureStackTrace( this, this.constructor );
					}
				}
			}

			const NON_VARIABLE_OPTIONS = [
				'method',
				'baseUrl',
				'url',
				'headers',
				'request',
				'query',
				'mediaType',
			];
			const FORBIDDEN_VARIABLE_OPTIONS = [ 'query', 'method', 'url' ];
			const GHES_V3_SUFFIX_REGEX = /\/api\/v3\/?$/;
			function graphql( request, query, options ) {
				if ( options ) {
					if ( typeof query === 'string' && 'query' in options ) {
						return Promise.reject(
							new Error( `[@octokit/graphql] "query" cannot be used as variable name` )
						);
					}

					for ( const key in options ) {
						if ( ! FORBIDDEN_VARIABLE_OPTIONS.includes( key ) ) continue;
						return Promise.reject(
							new Error( `[@octokit/graphql] "${ key }" cannot be used as variable name` )
						);
					}
				}

				const parsedOptions =
					typeof query === 'string'
						? Object.assign(
								{
									query,
								},
								options
						  )
						: query;
				const requestOptions = Object.keys( parsedOptions ).reduce( ( result, key ) => {
					if ( NON_VARIABLE_OPTIONS.includes( key ) ) {
						result[ key ] = parsedOptions[ key ];
						return result;
					}

					if ( ! result.variables ) {
						result.variables = {};
					}

					result.variables[ key ] = parsedOptions[ key ];
					return result;
				}, {} ); // workaround for GitHub Enterprise baseUrl set with /api/v3 suffix
				// https://github.com/octokit/auth-app.js/issues/111#issuecomment-657610451

				const baseUrl = parsedOptions.baseUrl || request.endpoint.DEFAULTS.baseUrl;

				if ( GHES_V3_SUFFIX_REGEX.test( baseUrl ) ) {
					requestOptions.url = baseUrl.replace( GHES_V3_SUFFIX_REGEX, '/api/graphql' );
				}

				return request( requestOptions ).then( response => {
					if ( response.data.errors ) {
						const headers = {};

						for ( const key of Object.keys( response.headers ) ) {
							headers[ key ] = response.headers[ key ];
						}

						throw new GraphqlError( requestOptions, {
							headers,
							data: response.data,
						} );
					}

					return response.data.data;
				} );
			}

			function withDefaults( request$1, newDefaults ) {
				const newRequest = request$1.defaults( newDefaults );

				const newApi = ( query, options ) => {
					return graphql( newRequest, query, options );
				};

				return Object.assign( newApi, {
					defaults: withDefaults.bind( null, newRequest ),
					endpoint: request.request.endpoint,
				} );
			}

			const graphql$1 = withDefaults( request.request, {
				headers: {
					'user-agent': `octokit-graphql.js/${ VERSION } ${ universalUserAgent.getUserAgent() }`,
				},
				method: 'POST',
				url: '/graphql',
			} );
			function withCustomRequest( customRequest ) {
				return withDefaults( customRequest, {
					method: 'POST',
					url: '/graphql',
				} );
			}

			exports.graphql = graphql$1;
			exports.withCustomRequest = withCustomRequest;
			//# sourceMappingURL=index.js.map

			/***/
		},

		/***/ 4193: /***/ ( __unused_webpack_module, exports ) => {
			'use strict';

			Object.defineProperty( exports, '__esModule', { value: true } );

			const VERSION = '2.13.3';

			/**
			 * Some “list” response that can be paginated have a different response structure
			 *
			 * They have a `total_count` key in the response (search also has `incomplete_results`,
			 * /installation/repositories also has `repository_selection`), as well as a key with
			 * the list of the items which name varies from endpoint to endpoint.
			 *
			 * Octokit normalizes these responses so that paginated results are always returned following
			 * the same structure. One challenge is that if the list response has only one page, no Link
			 * header is provided, so this header alone is not sufficient to check wether a response is
			 * paginated or not.
			 *
			 * We check if a "total_count" key is present in the response data, but also make sure that
			 * a "url" property is not, as the "Get the combined status for a specific ref" endpoint would
			 * otherwise match: https://developer.github.com/v3/repos/statuses/#get-the-combined-status-for-a-specific-ref
			 */
			function normalizePaginatedListResponse( response ) {
				const responseNeedsNormalization =
					'total_count' in response.data && ! ( 'url' in response.data );
				if ( ! responseNeedsNormalization ) return response; // keep the additional properties intact as there is currently no other way
				// to retrieve the same information.

				const incompleteResults = response.data.incomplete_results;
				const repositorySelection = response.data.repository_selection;
				const totalCount = response.data.total_count;
				delete response.data.incomplete_results;
				delete response.data.repository_selection;
				delete response.data.total_count;
				const namespaceKey = Object.keys( response.data )[ 0 ];
				const data = response.data[ namespaceKey ];
				response.data = data;

				if ( typeof incompleteResults !== 'undefined' ) {
					response.data.incomplete_results = incompleteResults;
				}

				if ( typeof repositorySelection !== 'undefined' ) {
					response.data.repository_selection = repositorySelection;
				}

				response.data.total_count = totalCount;
				return response;
			}

			function iterator( octokit, route, parameters ) {
				const options =
					typeof route === 'function'
						? route.endpoint( parameters )
						: octokit.request.endpoint( route, parameters );
				const requestMethod = typeof route === 'function' ? route : octokit.request;
				const method = options.method;
				const headers = options.headers;
				let url = options.url;
				return {
					[ Symbol.asyncIterator ]: () => ( {
						async next() {
							if ( ! url )
								return {
									done: true,
								};
							const response = await requestMethod( {
								method,
								url,
								headers,
							} );
							const normalizedResponse = normalizePaginatedListResponse( response ); // `response.headers.link` format:
							// '<https://api.github.com/users/aseemk/followers?page=2>; rel="next", <https://api.github.com/users/aseemk/followers?page=2>; rel="last"'
							// sets `url` to undefined if "next" URL is not present or `link` header is not set

							url = ( ( normalizedResponse.headers.link || '' ).match(
								/<([^>]+)>;\s*rel="next"/
							) || [] )[ 1 ];
							return {
								value: normalizedResponse,
							};
						},
					} ),
				};
			}

			function paginate( octokit, route, parameters, mapFn ) {
				if ( typeof parameters === 'function' ) {
					mapFn = parameters;
					parameters = undefined;
				}

				return gather(
					octokit,
					[],
					iterator( octokit, route, parameters )[ Symbol.asyncIterator ](),
					mapFn
				);
			}

			function gather( octokit, results, iterator, mapFn ) {
				return iterator.next().then( result => {
					if ( result.done ) {
						return results;
					}

					let earlyExit = false;

					function done() {
						earlyExit = true;
					}

					results = results.concat( mapFn ? mapFn( result.value, done ) : result.value.data );

					if ( earlyExit ) {
						return results;
					}

					return gather( octokit, results, iterator, mapFn );
				} );
			}

			const composePaginateRest = Object.assign( paginate, {
				iterator,
			} );

			const paginatingEndpoints = [
				'GET /app/installations',
				'GET /applications/grants',
				'GET /authorizations',
				'GET /enterprises/{enterprise}/actions/permissions/organizations',
				'GET /enterprises/{enterprise}/actions/runner-groups',
				'GET /enterprises/{enterprise}/actions/runner-groups/{runner_group_id}/organizations',
				'GET /enterprises/{enterprise}/actions/runner-groups/{runner_group_id}/runners',
				'GET /enterprises/{enterprise}/actions/runners',
				'GET /enterprises/{enterprise}/actions/runners/downloads',
				'GET /events',
				'GET /gists',
				'GET /gists/public',
				'GET /gists/starred',
				'GET /gists/{gist_id}/comments',
				'GET /gists/{gist_id}/commits',
				'GET /gists/{gist_id}/forks',
				'GET /installation/repositories',
				'GET /issues',
				'GET /marketplace_listing/plans',
				'GET /marketplace_listing/plans/{plan_id}/accounts',
				'GET /marketplace_listing/stubbed/plans',
				'GET /marketplace_listing/stubbed/plans/{plan_id}/accounts',
				'GET /networks/{owner}/{repo}/events',
				'GET /notifications',
				'GET /organizations',
				'GET /orgs/{org}/actions/permissions/repositories',
				'GET /orgs/{org}/actions/runner-groups',
				'GET /orgs/{org}/actions/runner-groups/{runner_group_id}/repositories',
				'GET /orgs/{org}/actions/runner-groups/{runner_group_id}/runners',
				'GET /orgs/{org}/actions/runners',
				'GET /orgs/{org}/actions/runners/downloads',
				'GET /orgs/{org}/actions/secrets',
				'GET /orgs/{org}/actions/secrets/{secret_name}/repositories',
				'GET /orgs/{org}/blocks',
				'GET /orgs/{org}/credential-authorizations',
				'GET /orgs/{org}/events',
				'GET /orgs/{org}/failed_invitations',
				'GET /orgs/{org}/hooks',
				'GET /orgs/{org}/installations',
				'GET /orgs/{org}/invitations',
				'GET /orgs/{org}/invitations/{invitation_id}/teams',
				'GET /orgs/{org}/issues',
				'GET /orgs/{org}/members',
				'GET /orgs/{org}/migrations',
				'GET /orgs/{org}/migrations/{migration_id}/repositories',
				'GET /orgs/{org}/outside_collaborators',
				'GET /orgs/{org}/projects',
				'GET /orgs/{org}/public_members',
				'GET /orgs/{org}/repos',
				'GET /orgs/{org}/team-sync/groups',
				'GET /orgs/{org}/teams',
				'GET /orgs/{org}/teams/{team_slug}/discussions',
				'GET /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments',
				'GET /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments/{comment_number}/reactions',
				'GET /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/reactions',
				'GET /orgs/{org}/teams/{team_slug}/invitations',
				'GET /orgs/{org}/teams/{team_slug}/members',
				'GET /orgs/{org}/teams/{team_slug}/projects',
				'GET /orgs/{org}/teams/{team_slug}/repos',
				'GET /orgs/{org}/teams/{team_slug}/team-sync/group-mappings',
				'GET /orgs/{org}/teams/{team_slug}/teams',
				'GET /projects/columns/{column_id}/cards',
				'GET /projects/{project_id}/collaborators',
				'GET /projects/{project_id}/columns',
				'GET /repos/{owner}/{repo}/actions/artifacts',
				'GET /repos/{owner}/{repo}/actions/runners',
				'GET /repos/{owner}/{repo}/actions/runners/downloads',
				'GET /repos/{owner}/{repo}/actions/runs',
				'GET /repos/{owner}/{repo}/actions/runs/{run_id}/artifacts',
				'GET /repos/{owner}/{repo}/actions/runs/{run_id}/jobs',
				'GET /repos/{owner}/{repo}/actions/secrets',
				'GET /repos/{owner}/{repo}/actions/workflows',
				'GET /repos/{owner}/{repo}/actions/workflows/{workflow_id}/runs',
				'GET /repos/{owner}/{repo}/assignees',
				'GET /repos/{owner}/{repo}/branches',
				'GET /repos/{owner}/{repo}/check-runs/{check_run_id}/annotations',
				'GET /repos/{owner}/{repo}/check-suites/{check_suite_id}/check-runs',
				'GET /repos/{owner}/{repo}/code-scanning/alerts',
				'GET /repos/{owner}/{repo}/code-scanning/alerts/{alert_number}/instances',
				'GET /repos/{owner}/{repo}/code-scanning/analyses',
				'GET /repos/{owner}/{repo}/collaborators',
				'GET /repos/{owner}/{repo}/comments',
				'GET /repos/{owner}/{repo}/comments/{comment_id}/reactions',
				'GET /repos/{owner}/{repo}/commits',
				'GET /repos/{owner}/{repo}/commits/{commit_sha}/branches-where-head',
				'GET /repos/{owner}/{repo}/commits/{commit_sha}/comments',
				'GET /repos/{owner}/{repo}/commits/{commit_sha}/pulls',
				'GET /repos/{owner}/{repo}/commits/{ref}/check-runs',
				'GET /repos/{owner}/{repo}/commits/{ref}/check-suites',
				'GET /repos/{owner}/{repo}/commits/{ref}/statuses',
				'GET /repos/{owner}/{repo}/contributors',
				'GET /repos/{owner}/{repo}/deployments',
				'GET /repos/{owner}/{repo}/deployments/{deployment_id}/statuses',
				'GET /repos/{owner}/{repo}/events',
				'GET /repos/{owner}/{repo}/forks',
				'GET /repos/{owner}/{repo}/git/matching-refs/{ref}',
				'GET /repos/{owner}/{repo}/hooks',
				'GET /repos/{owner}/{repo}/invitations',
				'GET /repos/{owner}/{repo}/issues',
				'GET /repos/{owner}/{repo}/issues/comments',
				'GET /repos/{owner}/{repo}/issues/comments/{comment_id}/reactions',
				'GET /repos/{owner}/{repo}/issues/events',
				'GET /repos/{owner}/{repo}/issues/{issue_number}/comments',
				'GET /repos/{owner}/{repo}/issues/{issue_number}/events',
				'GET /repos/{owner}/{repo}/issues/{issue_number}/labels',
				'GET /repos/{owner}/{repo}/issues/{issue_number}/reactions',
				'GET /repos/{owner}/{repo}/issues/{issue_number}/timeline',
				'GET /repos/{owner}/{repo}/keys',
				'GET /repos/{owner}/{repo}/labels',
				'GET /repos/{owner}/{repo}/milestones',
				'GET /repos/{owner}/{repo}/milestones/{milestone_number}/labels',
				'GET /repos/{owner}/{repo}/notifications',
				'GET /repos/{owner}/{repo}/pages/builds',
				'GET /repos/{owner}/{repo}/projects',
				'GET /repos/{owner}/{repo}/pulls',
				'GET /repos/{owner}/{repo}/pulls/comments',
				'GET /repos/{owner}/{repo}/pulls/comments/{comment_id}/reactions',
				'GET /repos/{owner}/{repo}/pulls/{pull_number}/comments',
				'GET /repos/{owner}/{repo}/pulls/{pull_number}/commits',
				'GET /repos/{owner}/{repo}/pulls/{pull_number}/files',
				'GET /repos/{owner}/{repo}/pulls/{pull_number}/requested_reviewers',
				'GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews',
				'GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews/{review_id}/comments',
				'GET /repos/{owner}/{repo}/releases',
				'GET /repos/{owner}/{repo}/releases/{release_id}/assets',
				'GET /repos/{owner}/{repo}/secret-scanning/alerts',
				'GET /repos/{owner}/{repo}/stargazers',
				'GET /repos/{owner}/{repo}/subscribers',
				'GET /repos/{owner}/{repo}/tags',
				'GET /repos/{owner}/{repo}/teams',
				'GET /repositories',
				'GET /repositories/{repository_id}/environments/{environment_name}/secrets',
				'GET /scim/v2/enterprises/{enterprise}/Groups',
				'GET /scim/v2/enterprises/{enterprise}/Users',
				'GET /scim/v2/organizations/{org}/Users',
				'GET /search/code',
				'GET /search/commits',
				'GET /search/issues',
				'GET /search/labels',
				'GET /search/repositories',
				'GET /search/topics',
				'GET /search/users',
				'GET /teams/{team_id}/discussions',
				'GET /teams/{team_id}/discussions/{discussion_number}/comments',
				'GET /teams/{team_id}/discussions/{discussion_number}/comments/{comment_number}/reactions',
				'GET /teams/{team_id}/discussions/{discussion_number}/reactions',
				'GET /teams/{team_id}/invitations',
				'GET /teams/{team_id}/members',
				'GET /teams/{team_id}/projects',
				'GET /teams/{team_id}/repos',
				'GET /teams/{team_id}/team-sync/group-mappings',
				'GET /teams/{team_id}/teams',
				'GET /user/blocks',
				'GET /user/emails',
				'GET /user/followers',
				'GET /user/following',
				'GET /user/gpg_keys',
				'GET /user/installations',
				'GET /user/installations/{installation_id}/repositories',
				'GET /user/issues',
				'GET /user/keys',
				'GET /user/marketplace_purchases',
				'GET /user/marketplace_purchases/stubbed',
				'GET /user/memberships/orgs',
				'GET /user/migrations',
				'GET /user/migrations/{migration_id}/repositories',
				'GET /user/orgs',
				'GET /user/public_emails',
				'GET /user/repos',
				'GET /user/repository_invitations',
				'GET /user/starred',
				'GET /user/subscriptions',
				'GET /user/teams',
				'GET /users',
				'GET /users/{username}/events',
				'GET /users/{username}/events/orgs/{org}',
				'GET /users/{username}/events/public',
				'GET /users/{username}/followers',
				'GET /users/{username}/following',
				'GET /users/{username}/gists',
				'GET /users/{username}/gpg_keys',
				'GET /users/{username}/keys',
				'GET /users/{username}/orgs',
				'GET /users/{username}/projects',
				'GET /users/{username}/received_events',
				'GET /users/{username}/received_events/public',
				'GET /users/{username}/repos',
				'GET /users/{username}/starred',
				'GET /users/{username}/subscriptions',
			];

			function isPaginatingEndpoint( arg ) {
				if ( typeof arg === 'string' ) {
					return paginatingEndpoints.includes( arg );
				} else {
					return false;
				}
			}

			/**
			 * @param octokit Octokit instance
			 * @param options Options passed to Octokit constructor
			 */

			function paginateRest( octokit ) {
				return {
					paginate: Object.assign( paginate.bind( null, octokit ), {
						iterator: iterator.bind( null, octokit ),
					} ),
				};
			}
			paginateRest.VERSION = VERSION;

			exports.composePaginateRest = composePaginateRest;
			exports.isPaginatingEndpoint = isPaginatingEndpoint;
			exports.paginateRest = paginateRest;
			exports.paginatingEndpoints = paginatingEndpoints;
			//# sourceMappingURL=index.js.map

			/***/
		},

		/***/ 3044: /***/ ( __unused_webpack_module, exports ) => {
			'use strict';

			Object.defineProperty( exports, '__esModule', { value: true } );

			const Endpoints = {
				actions: {
					addSelectedRepoToOrgSecret: [
						'PUT /orgs/{org}/actions/secrets/{secret_name}/repositories/{repository_id}',
					],
					cancelWorkflowRun: [ 'POST /repos/{owner}/{repo}/actions/runs/{run_id}/cancel' ],
					createOrUpdateEnvironmentSecret: [
						'PUT /repositories/{repository_id}/environments/{environment_name}/secrets/{secret_name}',
					],
					createOrUpdateOrgSecret: [ 'PUT /orgs/{org}/actions/secrets/{secret_name}' ],
					createOrUpdateRepoSecret: [ 'PUT /repos/{owner}/{repo}/actions/secrets/{secret_name}' ],
					createRegistrationTokenForOrg: [ 'POST /orgs/{org}/actions/runners/registration-token' ],
					createRegistrationTokenForRepo: [
						'POST /repos/{owner}/{repo}/actions/runners/registration-token',
					],
					createRemoveTokenForOrg: [ 'POST /orgs/{org}/actions/runners/remove-token' ],
					createRemoveTokenForRepo: [ 'POST /repos/{owner}/{repo}/actions/runners/remove-token' ],
					createWorkflowDispatch: [
						'POST /repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches',
					],
					deleteArtifact: [ 'DELETE /repos/{owner}/{repo}/actions/artifacts/{artifact_id}' ],
					deleteEnvironmentSecret: [
						'DELETE /repositories/{repository_id}/environments/{environment_name}/secrets/{secret_name}',
					],
					deleteOrgSecret: [ 'DELETE /orgs/{org}/actions/secrets/{secret_name}' ],
					deleteRepoSecret: [ 'DELETE /repos/{owner}/{repo}/actions/secrets/{secret_name}' ],
					deleteSelfHostedRunnerFromOrg: [ 'DELETE /orgs/{org}/actions/runners/{runner_id}' ],
					deleteSelfHostedRunnerFromRepo: [
						'DELETE /repos/{owner}/{repo}/actions/runners/{runner_id}',
					],
					deleteWorkflowRun: [ 'DELETE /repos/{owner}/{repo}/actions/runs/{run_id}' ],
					deleteWorkflowRunLogs: [ 'DELETE /repos/{owner}/{repo}/actions/runs/{run_id}/logs' ],
					disableSelectedRepositoryGithubActionsOrganization: [
						'DELETE /orgs/{org}/actions/permissions/repositories/{repository_id}',
					],
					disableWorkflow: [ 'PUT /repos/{owner}/{repo}/actions/workflows/{workflow_id}/disable' ],
					downloadArtifact: [
						'GET /repos/{owner}/{repo}/actions/artifacts/{artifact_id}/{archive_format}',
					],
					downloadJobLogsForWorkflowRun: [ 'GET /repos/{owner}/{repo}/actions/jobs/{job_id}/logs' ],
					downloadWorkflowRunLogs: [ 'GET /repos/{owner}/{repo}/actions/runs/{run_id}/logs' ],
					enableSelectedRepositoryGithubActionsOrganization: [
						'PUT /orgs/{org}/actions/permissions/repositories/{repository_id}',
					],
					enableWorkflow: [ 'PUT /repos/{owner}/{repo}/actions/workflows/{workflow_id}/enable' ],
					getAllowedActionsOrganization: [ 'GET /orgs/{org}/actions/permissions/selected-actions' ],
					getAllowedActionsRepository: [
						'GET /repos/{owner}/{repo}/actions/permissions/selected-actions',
					],
					getArtifact: [ 'GET /repos/{owner}/{repo}/actions/artifacts/{artifact_id}' ],
					getEnvironmentPublicKey: [
						'GET /repositories/{repository_id}/environments/{environment_name}/secrets/public-key',
					],
					getEnvironmentSecret: [
						'GET /repositories/{repository_id}/environments/{environment_name}/secrets/{secret_name}',
					],
					getGithubActionsPermissionsOrganization: [ 'GET /orgs/{org}/actions/permissions' ],
					getGithubActionsPermissionsRepository: [
						'GET /repos/{owner}/{repo}/actions/permissions',
					],
					getJobForWorkflowRun: [ 'GET /repos/{owner}/{repo}/actions/jobs/{job_id}' ],
					getOrgPublicKey: [ 'GET /orgs/{org}/actions/secrets/public-key' ],
					getOrgSecret: [ 'GET /orgs/{org}/actions/secrets/{secret_name}' ],
					getPendingDeploymentsForRun: [
						'GET /repos/{owner}/{repo}/actions/runs/{run_id}/pending_deployments',
					],
					getRepoPermissions: [
						'GET /repos/{owner}/{repo}/actions/permissions',
						{},
						{
							renamed: [ 'actions', 'getGithubActionsPermissionsRepository' ],
						},
					],
					getRepoPublicKey: [ 'GET /repos/{owner}/{repo}/actions/secrets/public-key' ],
					getRepoSecret: [ 'GET /repos/{owner}/{repo}/actions/secrets/{secret_name}' ],
					getReviewsForRun: [ 'GET /repos/{owner}/{repo}/actions/runs/{run_id}/approvals' ],
					getSelfHostedRunnerForOrg: [ 'GET /orgs/{org}/actions/runners/{runner_id}' ],
					getSelfHostedRunnerForRepo: [ 'GET /repos/{owner}/{repo}/actions/runners/{runner_id}' ],
					getWorkflow: [ 'GET /repos/{owner}/{repo}/actions/workflows/{workflow_id}' ],
					getWorkflowRun: [ 'GET /repos/{owner}/{repo}/actions/runs/{run_id}' ],
					getWorkflowRunUsage: [ 'GET /repos/{owner}/{repo}/actions/runs/{run_id}/timing' ],
					getWorkflowUsage: [ 'GET /repos/{owner}/{repo}/actions/workflows/{workflow_id}/timing' ],
					listArtifactsForRepo: [ 'GET /repos/{owner}/{repo}/actions/artifacts' ],
					listEnvironmentSecrets: [
						'GET /repositories/{repository_id}/environments/{environment_name}/secrets',
					],
					listJobsForWorkflowRun: [ 'GET /repos/{owner}/{repo}/actions/runs/{run_id}/jobs' ],
					listOrgSecrets: [ 'GET /orgs/{org}/actions/secrets' ],
					listRepoSecrets: [ 'GET /repos/{owner}/{repo}/actions/secrets' ],
					listRepoWorkflows: [ 'GET /repos/{owner}/{repo}/actions/workflows' ],
					listRunnerApplicationsForOrg: [ 'GET /orgs/{org}/actions/runners/downloads' ],
					listRunnerApplicationsForRepo: [ 'GET /repos/{owner}/{repo}/actions/runners/downloads' ],
					listSelectedReposForOrgSecret: [
						'GET /orgs/{org}/actions/secrets/{secret_name}/repositories',
					],
					listSelectedRepositoriesEnabledGithubActionsOrganization: [
						'GET /orgs/{org}/actions/permissions/repositories',
					],
					listSelfHostedRunnersForOrg: [ 'GET /orgs/{org}/actions/runners' ],
					listSelfHostedRunnersForRepo: [ 'GET /repos/{owner}/{repo}/actions/runners' ],
					listWorkflowRunArtifacts: [ 'GET /repos/{owner}/{repo}/actions/runs/{run_id}/artifacts' ],
					listWorkflowRuns: [ 'GET /repos/{owner}/{repo}/actions/workflows/{workflow_id}/runs' ],
					listWorkflowRunsForRepo: [ 'GET /repos/{owner}/{repo}/actions/runs' ],
					reRunWorkflow: [ 'POST /repos/{owner}/{repo}/actions/runs/{run_id}/rerun' ],
					removeSelectedRepoFromOrgSecret: [
						'DELETE /orgs/{org}/actions/secrets/{secret_name}/repositories/{repository_id}',
					],
					reviewPendingDeploymentsForRun: [
						'POST /repos/{owner}/{repo}/actions/runs/{run_id}/pending_deployments',
					],
					setAllowedActionsOrganization: [ 'PUT /orgs/{org}/actions/permissions/selected-actions' ],
					setAllowedActionsRepository: [
						'PUT /repos/{owner}/{repo}/actions/permissions/selected-actions',
					],
					setGithubActionsPermissionsOrganization: [ 'PUT /orgs/{org}/actions/permissions' ],
					setGithubActionsPermissionsRepository: [
						'PUT /repos/{owner}/{repo}/actions/permissions',
					],
					setSelectedReposForOrgSecret: [
						'PUT /orgs/{org}/actions/secrets/{secret_name}/repositories',
					],
					setSelectedRepositoriesEnabledGithubActionsOrganization: [
						'PUT /orgs/{org}/actions/permissions/repositories',
					],
				},
				activity: {
					checkRepoIsStarredByAuthenticatedUser: [ 'GET /user/starred/{owner}/{repo}' ],
					deleteRepoSubscription: [ 'DELETE /repos/{owner}/{repo}/subscription' ],
					deleteThreadSubscription: [ 'DELETE /notifications/threads/{thread_id}/subscription' ],
					getFeeds: [ 'GET /feeds' ],
					getRepoSubscription: [ 'GET /repos/{owner}/{repo}/subscription' ],
					getThread: [ 'GET /notifications/threads/{thread_id}' ],
					getThreadSubscriptionForAuthenticatedUser: [
						'GET /notifications/threads/{thread_id}/subscription',
					],
					listEventsForAuthenticatedUser: [ 'GET /users/{username}/events' ],
					listNotificationsForAuthenticatedUser: [ 'GET /notifications' ],
					listOrgEventsForAuthenticatedUser: [ 'GET /users/{username}/events/orgs/{org}' ],
					listPublicEvents: [ 'GET /events' ],
					listPublicEventsForRepoNetwork: [ 'GET /networks/{owner}/{repo}/events' ],
					listPublicEventsForUser: [ 'GET /users/{username}/events/public' ],
					listPublicOrgEvents: [ 'GET /orgs/{org}/events' ],
					listReceivedEventsForUser: [ 'GET /users/{username}/received_events' ],
					listReceivedPublicEventsForUser: [ 'GET /users/{username}/received_events/public' ],
					listRepoEvents: [ 'GET /repos/{owner}/{repo}/events' ],
					listRepoNotificationsForAuthenticatedUser: [ 'GET /repos/{owner}/{repo}/notifications' ],
					listReposStarredByAuthenticatedUser: [ 'GET /user/starred' ],
					listReposStarredByUser: [ 'GET /users/{username}/starred' ],
					listReposWatchedByUser: [ 'GET /users/{username}/subscriptions' ],
					listStargazersForRepo: [ 'GET /repos/{owner}/{repo}/stargazers' ],
					listWatchedReposForAuthenticatedUser: [ 'GET /user/subscriptions' ],
					listWatchersForRepo: [ 'GET /repos/{owner}/{repo}/subscribers' ],
					markNotificationsAsRead: [ 'PUT /notifications' ],
					markRepoNotificationsAsRead: [ 'PUT /repos/{owner}/{repo}/notifications' ],
					markThreadAsRead: [ 'PATCH /notifications/threads/{thread_id}' ],
					setRepoSubscription: [ 'PUT /repos/{owner}/{repo}/subscription' ],
					setThreadSubscription: [ 'PUT /notifications/threads/{thread_id}/subscription' ],
					starRepoForAuthenticatedUser: [ 'PUT /user/starred/{owner}/{repo}' ],
					unstarRepoForAuthenticatedUser: [ 'DELETE /user/starred/{owner}/{repo}' ],
				},
				apps: {
					addRepoToInstallation: [
						'PUT /user/installations/{installation_id}/repositories/{repository_id}',
					],
					checkToken: [ 'POST /applications/{client_id}/token' ],
					createContentAttachment: [
						'POST /content_references/{content_reference_id}/attachments',
						{
							mediaType: {
								previews: [ 'corsair' ],
							},
						},
					],
					createFromManifest: [ 'POST /app-manifests/{code}/conversions' ],
					createInstallationAccessToken: [
						'POST /app/installations/{installation_id}/access_tokens',
					],
					deleteAuthorization: [ 'DELETE /applications/{client_id}/grant' ],
					deleteInstallation: [ 'DELETE /app/installations/{installation_id}' ],
					deleteToken: [ 'DELETE /applications/{client_id}/token' ],
					getAuthenticated: [ 'GET /app' ],
					getBySlug: [ 'GET /apps/{app_slug}' ],
					getInstallation: [ 'GET /app/installations/{installation_id}' ],
					getOrgInstallation: [ 'GET /orgs/{org}/installation' ],
					getRepoInstallation: [ 'GET /repos/{owner}/{repo}/installation' ],
					getSubscriptionPlanForAccount: [ 'GET /marketplace_listing/accounts/{account_id}' ],
					getSubscriptionPlanForAccountStubbed: [
						'GET /marketplace_listing/stubbed/accounts/{account_id}',
					],
					getUserInstallation: [ 'GET /users/{username}/installation' ],
					getWebhookConfigForApp: [ 'GET /app/hook/config' ],
					listAccountsForPlan: [ 'GET /marketplace_listing/plans/{plan_id}/accounts' ],
					listAccountsForPlanStubbed: [
						'GET /marketplace_listing/stubbed/plans/{plan_id}/accounts',
					],
					listInstallationReposForAuthenticatedUser: [
						'GET /user/installations/{installation_id}/repositories',
					],
					listInstallations: [ 'GET /app/installations' ],
					listInstallationsForAuthenticatedUser: [ 'GET /user/installations' ],
					listPlans: [ 'GET /marketplace_listing/plans' ],
					listPlansStubbed: [ 'GET /marketplace_listing/stubbed/plans' ],
					listReposAccessibleToInstallation: [ 'GET /installation/repositories' ],
					listSubscriptionsForAuthenticatedUser: [ 'GET /user/marketplace_purchases' ],
					listSubscriptionsForAuthenticatedUserStubbed: [
						'GET /user/marketplace_purchases/stubbed',
					],
					removeRepoFromInstallation: [
						'DELETE /user/installations/{installation_id}/repositories/{repository_id}',
					],
					resetToken: [ 'PATCH /applications/{client_id}/token' ],
					revokeInstallationAccessToken: [ 'DELETE /installation/token' ],
					scopeToken: [ 'POST /applications/{client_id}/token/scoped' ],
					suspendInstallation: [ 'PUT /app/installations/{installation_id}/suspended' ],
					unsuspendInstallation: [ 'DELETE /app/installations/{installation_id}/suspended' ],
					updateWebhookConfigForApp: [ 'PATCH /app/hook/config' ],
				},
				billing: {
					getGithubActionsBillingOrg: [ 'GET /orgs/{org}/settings/billing/actions' ],
					getGithubActionsBillingUser: [ 'GET /users/{username}/settings/billing/actions' ],
					getGithubPackagesBillingOrg: [ 'GET /orgs/{org}/settings/billing/packages' ],
					getGithubPackagesBillingUser: [ 'GET /users/{username}/settings/billing/packages' ],
					getSharedStorageBillingOrg: [ 'GET /orgs/{org}/settings/billing/shared-storage' ],
					getSharedStorageBillingUser: [ 'GET /users/{username}/settings/billing/shared-storage' ],
				},
				checks: {
					create: [ 'POST /repos/{owner}/{repo}/check-runs' ],
					createSuite: [ 'POST /repos/{owner}/{repo}/check-suites' ],
					get: [ 'GET /repos/{owner}/{repo}/check-runs/{check_run_id}' ],
					getSuite: [ 'GET /repos/{owner}/{repo}/check-suites/{check_suite_id}' ],
					listAnnotations: [ 'GET /repos/{owner}/{repo}/check-runs/{check_run_id}/annotations' ],
					listForRef: [ 'GET /repos/{owner}/{repo}/commits/{ref}/check-runs' ],
					listForSuite: [ 'GET /repos/{owner}/{repo}/check-suites/{check_suite_id}/check-runs' ],
					listSuitesForRef: [ 'GET /repos/{owner}/{repo}/commits/{ref}/check-suites' ],
					rerequestSuite: [ 'POST /repos/{owner}/{repo}/check-suites/{check_suite_id}/rerequest' ],
					setSuitesPreferences: [ 'PATCH /repos/{owner}/{repo}/check-suites/preferences' ],
					update: [ 'PATCH /repos/{owner}/{repo}/check-runs/{check_run_id}' ],
				},
				codeScanning: {
					deleteAnalysis: [
						'DELETE /repos/{owner}/{repo}/code-scanning/analyses/{analysis_id}{?confirm_delete}',
					],
					getAlert: [
						'GET /repos/{owner}/{repo}/code-scanning/alerts/{alert_number}',
						{},
						{
							renamedParameters: {
								alert_id: 'alert_number',
							},
						},
					],
					getAnalysis: [ 'GET /repos/{owner}/{repo}/code-scanning/analyses/{analysis_id}' ],
					getSarif: [ 'GET /repos/{owner}/{repo}/code-scanning/sarifs/{sarif_id}' ],
					listAlertsForRepo: [ 'GET /repos/{owner}/{repo}/code-scanning/alerts' ],
					listAlertsInstances: [
						'GET /repos/{owner}/{repo}/code-scanning/alerts/{alert_number}/instances',
					],
					listRecentAnalyses: [ 'GET /repos/{owner}/{repo}/code-scanning/analyses' ],
					updateAlert: [ 'PATCH /repos/{owner}/{repo}/code-scanning/alerts/{alert_number}' ],
					uploadSarif: [ 'POST /repos/{owner}/{repo}/code-scanning/sarifs' ],
				},
				codesOfConduct: {
					getAllCodesOfConduct: [
						'GET /codes_of_conduct',
						{
							mediaType: {
								previews: [ 'scarlet-witch' ],
							},
						},
					],
					getConductCode: [
						'GET /codes_of_conduct/{key}',
						{
							mediaType: {
								previews: [ 'scarlet-witch' ],
							},
						},
					],
					getForRepo: [
						'GET /repos/{owner}/{repo}/community/code_of_conduct',
						{
							mediaType: {
								previews: [ 'scarlet-witch' ],
							},
						},
					],
				},
				emojis: {
					get: [ 'GET /emojis' ],
				},
				enterpriseAdmin: {
					disableSelectedOrganizationGithubActionsEnterprise: [
						'DELETE /enterprises/{enterprise}/actions/permissions/organizations/{org_id}',
					],
					enableSelectedOrganizationGithubActionsEnterprise: [
						'PUT /enterprises/{enterprise}/actions/permissions/organizations/{org_id}',
					],
					getAllowedActionsEnterprise: [
						'GET /enterprises/{enterprise}/actions/permissions/selected-actions',
					],
					getGithubActionsPermissionsEnterprise: [
						'GET /enterprises/{enterprise}/actions/permissions',
					],
					listSelectedOrganizationsEnabledGithubActionsEnterprise: [
						'GET /enterprises/{enterprise}/actions/permissions/organizations',
					],
					setAllowedActionsEnterprise: [
						'PUT /enterprises/{enterprise}/actions/permissions/selected-actions',
					],
					setGithubActionsPermissionsEnterprise: [
						'PUT /enterprises/{enterprise}/actions/permissions',
					],
					setSelectedOrganizationsEnabledGithubActionsEnterprise: [
						'PUT /enterprises/{enterprise}/actions/permissions/organizations',
					],
				},
				gists: {
					checkIsStarred: [ 'GET /gists/{gist_id}/star' ],
					create: [ 'POST /gists' ],
					createComment: [ 'POST /gists/{gist_id}/comments' ],
					delete: [ 'DELETE /gists/{gist_id}' ],
					deleteComment: [ 'DELETE /gists/{gist_id}/comments/{comment_id}' ],
					fork: [ 'POST /gists/{gist_id}/forks' ],
					get: [ 'GET /gists/{gist_id}' ],
					getComment: [ 'GET /gists/{gist_id}/comments/{comment_id}' ],
					getRevision: [ 'GET /gists/{gist_id}/{sha}' ],
					list: [ 'GET /gists' ],
					listComments: [ 'GET /gists/{gist_id}/comments' ],
					listCommits: [ 'GET /gists/{gist_id}/commits' ],
					listForUser: [ 'GET /users/{username}/gists' ],
					listForks: [ 'GET /gists/{gist_id}/forks' ],
					listPublic: [ 'GET /gists/public' ],
					listStarred: [ 'GET /gists/starred' ],
					star: [ 'PUT /gists/{gist_id}/star' ],
					unstar: [ 'DELETE /gists/{gist_id}/star' ],
					update: [ 'PATCH /gists/{gist_id}' ],
					updateComment: [ 'PATCH /gists/{gist_id}/comments/{comment_id}' ],
				},
				git: {
					createBlob: [ 'POST /repos/{owner}/{repo}/git/blobs' ],
					createCommit: [ 'POST /repos/{owner}/{repo}/git/commits' ],
					createRef: [ 'POST /repos/{owner}/{repo}/git/refs' ],
					createTag: [ 'POST /repos/{owner}/{repo}/git/tags' ],
					createTree: [ 'POST /repos/{owner}/{repo}/git/trees' ],
					deleteRef: [ 'DELETE /repos/{owner}/{repo}/git/refs/{ref}' ],
					getBlob: [ 'GET /repos/{owner}/{repo}/git/blobs/{file_sha}' ],
					getCommit: [ 'GET /repos/{owner}/{repo}/git/commits/{commit_sha}' ],
					getRef: [ 'GET /repos/{owner}/{repo}/git/ref/{ref}' ],
					getTag: [ 'GET /repos/{owner}/{repo}/git/tags/{tag_sha}' ],
					getTree: [ 'GET /repos/{owner}/{repo}/git/trees/{tree_sha}' ],
					listMatchingRefs: [ 'GET /repos/{owner}/{repo}/git/matching-refs/{ref}' ],
					updateRef: [ 'PATCH /repos/{owner}/{repo}/git/refs/{ref}' ],
				},
				gitignore: {
					getAllTemplates: [ 'GET /gitignore/templates' ],
					getTemplate: [ 'GET /gitignore/templates/{name}' ],
				},
				interactions: {
					getRestrictionsForAuthenticatedUser: [ 'GET /user/interaction-limits' ],
					getRestrictionsForOrg: [ 'GET /orgs/{org}/interaction-limits' ],
					getRestrictionsForRepo: [ 'GET /repos/{owner}/{repo}/interaction-limits' ],
					getRestrictionsForYourPublicRepos: [
						'GET /user/interaction-limits',
						{},
						{
							renamed: [ 'interactions', 'getRestrictionsForAuthenticatedUser' ],
						},
					],
					removeRestrictionsForAuthenticatedUser: [ 'DELETE /user/interaction-limits' ],
					removeRestrictionsForOrg: [ 'DELETE /orgs/{org}/interaction-limits' ],
					removeRestrictionsForRepo: [ 'DELETE /repos/{owner}/{repo}/interaction-limits' ],
					removeRestrictionsForYourPublicRepos: [
						'DELETE /user/interaction-limits',
						{},
						{
							renamed: [ 'interactions', 'removeRestrictionsForAuthenticatedUser' ],
						},
					],
					setRestrictionsForAuthenticatedUser: [ 'PUT /user/interaction-limits' ],
					setRestrictionsForOrg: [ 'PUT /orgs/{org}/interaction-limits' ],
					setRestrictionsForRepo: [ 'PUT /repos/{owner}/{repo}/interaction-limits' ],
					setRestrictionsForYourPublicRepos: [
						'PUT /user/interaction-limits',
						{},
						{
							renamed: [ 'interactions', 'setRestrictionsForAuthenticatedUser' ],
						},
					],
				},
				issues: {
					addAssignees: [ 'POST /repos/{owner}/{repo}/issues/{issue_number}/assignees' ],
					addLabels: [ 'POST /repos/{owner}/{repo}/issues/{issue_number}/labels' ],
					checkUserCanBeAssigned: [ 'GET /repos/{owner}/{repo}/assignees/{assignee}' ],
					create: [ 'POST /repos/{owner}/{repo}/issues' ],
					createComment: [ 'POST /repos/{owner}/{repo}/issues/{issue_number}/comments' ],
					createLabel: [ 'POST /repos/{owner}/{repo}/labels' ],
					createMilestone: [ 'POST /repos/{owner}/{repo}/milestones' ],
					deleteComment: [ 'DELETE /repos/{owner}/{repo}/issues/comments/{comment_id}' ],
					deleteLabel: [ 'DELETE /repos/{owner}/{repo}/labels/{name}' ],
					deleteMilestone: [ 'DELETE /repos/{owner}/{repo}/milestones/{milestone_number}' ],
					get: [ 'GET /repos/{owner}/{repo}/issues/{issue_number}' ],
					getComment: [ 'GET /repos/{owner}/{repo}/issues/comments/{comment_id}' ],
					getEvent: [ 'GET /repos/{owner}/{repo}/issues/events/{event_id}' ],
					getLabel: [ 'GET /repos/{owner}/{repo}/labels/{name}' ],
					getMilestone: [ 'GET /repos/{owner}/{repo}/milestones/{milestone_number}' ],
					list: [ 'GET /issues' ],
					listAssignees: [ 'GET /repos/{owner}/{repo}/assignees' ],
					listComments: [ 'GET /repos/{owner}/{repo}/issues/{issue_number}/comments' ],
					listCommentsForRepo: [ 'GET /repos/{owner}/{repo}/issues/comments' ],
					listEvents: [ 'GET /repos/{owner}/{repo}/issues/{issue_number}/events' ],
					listEventsForRepo: [ 'GET /repos/{owner}/{repo}/issues/events' ],
					listEventsForTimeline: [
						'GET /repos/{owner}/{repo}/issues/{issue_number}/timeline',
						{
							mediaType: {
								previews: [ 'mockingbird' ],
							},
						},
					],
					listForAuthenticatedUser: [ 'GET /user/issues' ],
					listForOrg: [ 'GET /orgs/{org}/issues' ],
					listForRepo: [ 'GET /repos/{owner}/{repo}/issues' ],
					listLabelsForMilestone: [
						'GET /repos/{owner}/{repo}/milestones/{milestone_number}/labels',
					],
					listLabelsForRepo: [ 'GET /repos/{owner}/{repo}/labels' ],
					listLabelsOnIssue: [ 'GET /repos/{owner}/{repo}/issues/{issue_number}/labels' ],
					listMilestones: [ 'GET /repos/{owner}/{repo}/milestones' ],
					lock: [ 'PUT /repos/{owner}/{repo}/issues/{issue_number}/lock' ],
					removeAllLabels: [ 'DELETE /repos/{owner}/{repo}/issues/{issue_number}/labels' ],
					removeAssignees: [ 'DELETE /repos/{owner}/{repo}/issues/{issue_number}/assignees' ],
					removeLabel: [ 'DELETE /repos/{owner}/{repo}/issues/{issue_number}/labels/{name}' ],
					setLabels: [ 'PUT /repos/{owner}/{repo}/issues/{issue_number}/labels' ],
					unlock: [ 'DELETE /repos/{owner}/{repo}/issues/{issue_number}/lock' ],
					update: [ 'PATCH /repos/{owner}/{repo}/issues/{issue_number}' ],
					updateComment: [ 'PATCH /repos/{owner}/{repo}/issues/comments/{comment_id}' ],
					updateLabel: [ 'PATCH /repos/{owner}/{repo}/labels/{name}' ],
					updateMilestone: [ 'PATCH /repos/{owner}/{repo}/milestones/{milestone_number}' ],
				},
				licenses: {
					get: [ 'GET /licenses/{license}' ],
					getAllCommonlyUsed: [ 'GET /licenses' ],
					getForRepo: [ 'GET /repos/{owner}/{repo}/license' ],
				},
				markdown: {
					render: [ 'POST /markdown' ],
					renderRaw: [
						'POST /markdown/raw',
						{
							headers: {
								'content-type': 'text/plain; charset=utf-8',
							},
						},
					],
				},
				meta: {
					get: [ 'GET /meta' ],
					getOctocat: [ 'GET /octocat' ],
					getZen: [ 'GET /zen' ],
					root: [ 'GET /' ],
				},
				migrations: {
					cancelImport: [ 'DELETE /repos/{owner}/{repo}/import' ],
					deleteArchiveForAuthenticatedUser: [
						'DELETE /user/migrations/{migration_id}/archive',
						{
							mediaType: {
								previews: [ 'wyandotte' ],
							},
						},
					],
					deleteArchiveForOrg: [
						'DELETE /orgs/{org}/migrations/{migration_id}/archive',
						{
							mediaType: {
								previews: [ 'wyandotte' ],
							},
						},
					],
					downloadArchiveForOrg: [
						'GET /orgs/{org}/migrations/{migration_id}/archive',
						{
							mediaType: {
								previews: [ 'wyandotte' ],
							},
						},
					],
					getArchiveForAuthenticatedUser: [
						'GET /user/migrations/{migration_id}/archive',
						{
							mediaType: {
								previews: [ 'wyandotte' ],
							},
						},
					],
					getCommitAuthors: [ 'GET /repos/{owner}/{repo}/import/authors' ],
					getImportStatus: [ 'GET /repos/{owner}/{repo}/import' ],
					getLargeFiles: [ 'GET /repos/{owner}/{repo}/import/large_files' ],
					getStatusForAuthenticatedUser: [
						'GET /user/migrations/{migration_id}',
						{
							mediaType: {
								previews: [ 'wyandotte' ],
							},
						},
					],
					getStatusForOrg: [
						'GET /orgs/{org}/migrations/{migration_id}',
						{
							mediaType: {
								previews: [ 'wyandotte' ],
							},
						},
					],
					listForAuthenticatedUser: [
						'GET /user/migrations',
						{
							mediaType: {
								previews: [ 'wyandotte' ],
							},
						},
					],
					listForOrg: [
						'GET /orgs/{org}/migrations',
						{
							mediaType: {
								previews: [ 'wyandotte' ],
							},
						},
					],
					listReposForOrg: [
						'GET /orgs/{org}/migrations/{migration_id}/repositories',
						{
							mediaType: {
								previews: [ 'wyandotte' ],
							},
						},
					],
					listReposForUser: [
						'GET /user/migrations/{migration_id}/repositories',
						{
							mediaType: {
								previews: [ 'wyandotte' ],
							},
						},
					],
					mapCommitAuthor: [ 'PATCH /repos/{owner}/{repo}/import/authors/{author_id}' ],
					setLfsPreference: [ 'PATCH /repos/{owner}/{repo}/import/lfs' ],
					startForAuthenticatedUser: [ 'POST /user/migrations' ],
					startForOrg: [ 'POST /orgs/{org}/migrations' ],
					startImport: [ 'PUT /repos/{owner}/{repo}/import' ],
					unlockRepoForAuthenticatedUser: [
						'DELETE /user/migrations/{migration_id}/repos/{repo_name}/lock',
						{
							mediaType: {
								previews: [ 'wyandotte' ],
							},
						},
					],
					unlockRepoForOrg: [
						'DELETE /orgs/{org}/migrations/{migration_id}/repos/{repo_name}/lock',
						{
							mediaType: {
								previews: [ 'wyandotte' ],
							},
						},
					],
					updateImport: [ 'PATCH /repos/{owner}/{repo}/import' ],
				},
				orgs: {
					blockUser: [ 'PUT /orgs/{org}/blocks/{username}' ],
					cancelInvitation: [ 'DELETE /orgs/{org}/invitations/{invitation_id}' ],
					checkBlockedUser: [ 'GET /orgs/{org}/blocks/{username}' ],
					checkMembershipForUser: [ 'GET /orgs/{org}/members/{username}' ],
					checkPublicMembershipForUser: [ 'GET /orgs/{org}/public_members/{username}' ],
					convertMemberToOutsideCollaborator: [
						'PUT /orgs/{org}/outside_collaborators/{username}',
					],
					createInvitation: [ 'POST /orgs/{org}/invitations' ],
					createWebhook: [ 'POST /orgs/{org}/hooks' ],
					deleteWebhook: [ 'DELETE /orgs/{org}/hooks/{hook_id}' ],
					get: [ 'GET /orgs/{org}' ],
					getMembershipForAuthenticatedUser: [ 'GET /user/memberships/orgs/{org}' ],
					getMembershipForUser: [ 'GET /orgs/{org}/memberships/{username}' ],
					getWebhook: [ 'GET /orgs/{org}/hooks/{hook_id}' ],
					getWebhookConfigForOrg: [ 'GET /orgs/{org}/hooks/{hook_id}/config' ],
					list: [ 'GET /organizations' ],
					listAppInstallations: [ 'GET /orgs/{org}/installations' ],
					listBlockedUsers: [ 'GET /orgs/{org}/blocks' ],
					listFailedInvitations: [ 'GET /orgs/{org}/failed_invitations' ],
					listForAuthenticatedUser: [ 'GET /user/orgs' ],
					listForUser: [ 'GET /users/{username}/orgs' ],
					listInvitationTeams: [ 'GET /orgs/{org}/invitations/{invitation_id}/teams' ],
					listMembers: [ 'GET /orgs/{org}/members' ],
					listMembershipsForAuthenticatedUser: [ 'GET /user/memberships/orgs' ],
					listOutsideCollaborators: [ 'GET /orgs/{org}/outside_collaborators' ],
					listPendingInvitations: [ 'GET /orgs/{org}/invitations' ],
					listPublicMembers: [ 'GET /orgs/{org}/public_members' ],
					listWebhooks: [ 'GET /orgs/{org}/hooks' ],
					pingWebhook: [ 'POST /orgs/{org}/hooks/{hook_id}/pings' ],
					removeMember: [ 'DELETE /orgs/{org}/members/{username}' ],
					removeMembershipForUser: [ 'DELETE /orgs/{org}/memberships/{username}' ],
					removeOutsideCollaborator: [ 'DELETE /orgs/{org}/outside_collaborators/{username}' ],
					removePublicMembershipForAuthenticatedUser: [
						'DELETE /orgs/{org}/public_members/{username}',
					],
					setMembershipForUser: [ 'PUT /orgs/{org}/memberships/{username}' ],
					setPublicMembershipForAuthenticatedUser: [ 'PUT /orgs/{org}/public_members/{username}' ],
					unblockUser: [ 'DELETE /orgs/{org}/blocks/{username}' ],
					update: [ 'PATCH /orgs/{org}' ],
					updateMembershipForAuthenticatedUser: [ 'PATCH /user/memberships/orgs/{org}' ],
					updateWebhook: [ 'PATCH /orgs/{org}/hooks/{hook_id}' ],
					updateWebhookConfigForOrg: [ 'PATCH /orgs/{org}/hooks/{hook_id}/config' ],
				},
				packages: {
					deletePackageForAuthenticatedUser: [
						'DELETE /user/packages/{package_type}/{package_name}',
					],
					deletePackageForOrg: [ 'DELETE /orgs/{org}/packages/{package_type}/{package_name}' ],
					deletePackageVersionForAuthenticatedUser: [
						'DELETE /user/packages/{package_type}/{package_name}/versions/{package_version_id}',
					],
					deletePackageVersionForOrg: [
						'DELETE /orgs/{org}/packages/{package_type}/{package_name}/versions/{package_version_id}',
					],
					getAllPackageVersionsForAPackageOwnedByAnOrg: [
						'GET /orgs/{org}/packages/{package_type}/{package_name}/versions',
						{},
						{
							renamed: [ 'packages', 'getAllPackageVersionsForPackageOwnedByOrg' ],
						},
					],
					getAllPackageVersionsForAPackageOwnedByTheAuthenticatedUser: [
						'GET /user/packages/{package_type}/{package_name}/versions',
						{},
						{
							renamed: [ 'packages', 'getAllPackageVersionsForPackageOwnedByAuthenticatedUser' ],
						},
					],
					getAllPackageVersionsForPackageOwnedByAuthenticatedUser: [
						'GET /user/packages/{package_type}/{package_name}/versions',
					],
					getAllPackageVersionsForPackageOwnedByOrg: [
						'GET /orgs/{org}/packages/{package_type}/{package_name}/versions',
					],
					getAllPackageVersionsForPackageOwnedByUser: [
						'GET /users/{username}/packages/{package_type}/{package_name}/versions',
					],
					getPackageForAuthenticatedUser: [ 'GET /user/packages/{package_type}/{package_name}' ],
					getPackageForOrganization: [ 'GET /orgs/{org}/packages/{package_type}/{package_name}' ],
					getPackageForUser: [ 'GET /users/{username}/packages/{package_type}/{package_name}' ],
					getPackageVersionForAuthenticatedUser: [
						'GET /user/packages/{package_type}/{package_name}/versions/{package_version_id}',
					],
					getPackageVersionForOrganization: [
						'GET /orgs/{org}/packages/{package_type}/{package_name}/versions/{package_version_id}',
					],
					getPackageVersionForUser: [
						'GET /users/{username}/packages/{package_type}/{package_name}/versions/{package_version_id}',
					],
					restorePackageForAuthenticatedUser: [
						'POST /user/packages/{package_type}/{package_name}/restore{?token}',
					],
					restorePackageForOrg: [
						'POST /orgs/{org}/packages/{package_type}/{package_name}/restore{?token}',
					],
					restorePackageVersionForAuthenticatedUser: [
						'POST /user/packages/{package_type}/{package_name}/versions/{package_version_id}/restore',
					],
					restorePackageVersionForOrg: [
						'POST /orgs/{org}/packages/{package_type}/{package_name}/versions/{package_version_id}/restore',
					],
				},
				projects: {
					addCollaborator: [
						'PUT /projects/{project_id}/collaborators/{username}',
						{
							mediaType: {
								previews: [ 'inertia' ],
							},
						},
					],
					createCard: [
						'POST /projects/columns/{column_id}/cards',
						{
							mediaType: {
								previews: [ 'inertia' ],
							},
						},
					],
					createColumn: [
						'POST /projects/{project_id}/columns',
						{
							mediaType: {
								previews: [ 'inertia' ],
							},
						},
					],
					createForAuthenticatedUser: [
						'POST /user/projects',
						{
							mediaType: {
								previews: [ 'inertia' ],
							},
						},
					],
					createForOrg: [
						'POST /orgs/{org}/projects',
						{
							mediaType: {
								previews: [ 'inertia' ],
							},
						},
					],
					createForRepo: [
						'POST /repos/{owner}/{repo}/projects',
						{
							mediaType: {
								previews: [ 'inertia' ],
							},
						},
					],
					delete: [
						'DELETE /projects/{project_id}',
						{
							mediaType: {
								previews: [ 'inertia' ],
							},
						},
					],
					deleteCard: [
						'DELETE /projects/columns/cards/{card_id}',
						{
							mediaType: {
								previews: [ 'inertia' ],
							},
						},
					],
					deleteColumn: [
						'DELETE /projects/columns/{column_id}',
						{
							mediaType: {
								previews: [ 'inertia' ],
							},
						},
					],
					get: [
						'GET /projects/{project_id}',
						{
							mediaType: {
								previews: [ 'inertia' ],
							},
						},
					],
					getCard: [
						'GET /projects/columns/cards/{card_id}',
						{
							mediaType: {
								previews: [ 'inertia' ],
							},
						},
					],
					getColumn: [
						'GET /projects/columns/{column_id}',
						{
							mediaType: {
								previews: [ 'inertia' ],
							},
						},
					],
					getPermissionForUser: [
						'GET /projects/{project_id}/collaborators/{username}/permission',
						{
							mediaType: {
								previews: [ 'inertia' ],
							},
						},
					],
					listCards: [
						'GET /projects/columns/{column_id}/cards',
						{
							mediaType: {
								previews: [ 'inertia' ],
							},
						},
					],
					listCollaborators: [
						'GET /projects/{project_id}/collaborators',
						{
							mediaType: {
								previews: [ 'inertia' ],
							},
						},
					],
					listColumns: [
						'GET /projects/{project_id}/columns',
						{
							mediaType: {
								previews: [ 'inertia' ],
							},
						},
					],
					listForOrg: [
						'GET /orgs/{org}/projects',
						{
							mediaType: {
								previews: [ 'inertia' ],
							},
						},
					],
					listForRepo: [
						'GET /repos/{owner}/{repo}/projects',
						{
							mediaType: {
								previews: [ 'inertia' ],
							},
						},
					],
					listForUser: [
						'GET /users/{username}/projects',
						{
							mediaType: {
								previews: [ 'inertia' ],
							},
						},
					],
					moveCard: [
						'POST /projects/columns/cards/{card_id}/moves',
						{
							mediaType: {
								previews: [ 'inertia' ],
							},
						},
					],
					moveColumn: [
						'POST /projects/columns/{column_id}/moves',
						{
							mediaType: {
								previews: [ 'inertia' ],
							},
						},
					],
					removeCollaborator: [
						'DELETE /projects/{project_id}/collaborators/{username}',
						{
							mediaType: {
								previews: [ 'inertia' ],
							},
						},
					],
					update: [
						'PATCH /projects/{project_id}',
						{
							mediaType: {
								previews: [ 'inertia' ],
							},
						},
					],
					updateCard: [
						'PATCH /projects/columns/cards/{card_id}',
						{
							mediaType: {
								previews: [ 'inertia' ],
							},
						},
					],
					updateColumn: [
						'PATCH /projects/columns/{column_id}',
						{
							mediaType: {
								previews: [ 'inertia' ],
							},
						},
					],
				},
				pulls: {
					checkIfMerged: [ 'GET /repos/{owner}/{repo}/pulls/{pull_number}/merge' ],
					create: [ 'POST /repos/{owner}/{repo}/pulls' ],
					createReplyForReviewComment: [
						'POST /repos/{owner}/{repo}/pulls/{pull_number}/comments/{comment_id}/replies',
					],
					createReview: [ 'POST /repos/{owner}/{repo}/pulls/{pull_number}/reviews' ],
					createReviewComment: [ 'POST /repos/{owner}/{repo}/pulls/{pull_number}/comments' ],
					deletePendingReview: [
						'DELETE /repos/{owner}/{repo}/pulls/{pull_number}/reviews/{review_id}',
					],
					deleteReviewComment: [ 'DELETE /repos/{owner}/{repo}/pulls/comments/{comment_id}' ],
					dismissReview: [
						'PUT /repos/{owner}/{repo}/pulls/{pull_number}/reviews/{review_id}/dismissals',
					],
					get: [ 'GET /repos/{owner}/{repo}/pulls/{pull_number}' ],
					getReview: [ 'GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews/{review_id}' ],
					getReviewComment: [ 'GET /repos/{owner}/{repo}/pulls/comments/{comment_id}' ],
					list: [ 'GET /repos/{owner}/{repo}/pulls' ],
					listCommentsForReview: [
						'GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews/{review_id}/comments',
					],
					listCommits: [ 'GET /repos/{owner}/{repo}/pulls/{pull_number}/commits' ],
					listFiles: [ 'GET /repos/{owner}/{repo}/pulls/{pull_number}/files' ],
					listRequestedReviewers: [
						'GET /repos/{owner}/{repo}/pulls/{pull_number}/requested_reviewers',
					],
					listReviewComments: [ 'GET /repos/{owner}/{repo}/pulls/{pull_number}/comments' ],
					listReviewCommentsForRepo: [ 'GET /repos/{owner}/{repo}/pulls/comments' ],
					listReviews: [ 'GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews' ],
					merge: [ 'PUT /repos/{owner}/{repo}/pulls/{pull_number}/merge' ],
					removeRequestedReviewers: [
						'DELETE /repos/{owner}/{repo}/pulls/{pull_number}/requested_reviewers',
					],
					requestReviewers: [
						'POST /repos/{owner}/{repo}/pulls/{pull_number}/requested_reviewers',
					],
					submitReview: [
						'POST /repos/{owner}/{repo}/pulls/{pull_number}/reviews/{review_id}/events',
					],
					update: [ 'PATCH /repos/{owner}/{repo}/pulls/{pull_number}' ],
					updateBranch: [
						'PUT /repos/{owner}/{repo}/pulls/{pull_number}/update-branch',
						{
							mediaType: {
								previews: [ 'lydian' ],
							},
						},
					],
					updateReview: [ 'PUT /repos/{owner}/{repo}/pulls/{pull_number}/reviews/{review_id}' ],
					updateReviewComment: [ 'PATCH /repos/{owner}/{repo}/pulls/comments/{comment_id}' ],
				},
				rateLimit: {
					get: [ 'GET /rate_limit' ],
				},
				reactions: {
					createForCommitComment: [
						'POST /repos/{owner}/{repo}/comments/{comment_id}/reactions',
						{
							mediaType: {
								previews: [ 'squirrel-girl' ],
							},
						},
					],
					createForIssue: [
						'POST /repos/{owner}/{repo}/issues/{issue_number}/reactions',
						{
							mediaType: {
								previews: [ 'squirrel-girl' ],
							},
						},
					],
					createForIssueComment: [
						'POST /repos/{owner}/{repo}/issues/comments/{comment_id}/reactions',
						{
							mediaType: {
								previews: [ 'squirrel-girl' ],
							},
						},
					],
					createForPullRequestReviewComment: [
						'POST /repos/{owner}/{repo}/pulls/comments/{comment_id}/reactions',
						{
							mediaType: {
								previews: [ 'squirrel-girl' ],
							},
						},
					],
					createForTeamDiscussionCommentInOrg: [
						'POST /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments/{comment_number}/reactions',
						{
							mediaType: {
								previews: [ 'squirrel-girl' ],
							},
						},
					],
					createForTeamDiscussionInOrg: [
						'POST /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/reactions',
						{
							mediaType: {
								previews: [ 'squirrel-girl' ],
							},
						},
					],
					deleteForCommitComment: [
						'DELETE /repos/{owner}/{repo}/comments/{comment_id}/reactions/{reaction_id}',
						{
							mediaType: {
								previews: [ 'squirrel-girl' ],
							},
						},
					],
					deleteForIssue: [
						'DELETE /repos/{owner}/{repo}/issues/{issue_number}/reactions/{reaction_id}',
						{
							mediaType: {
								previews: [ 'squirrel-girl' ],
							},
						},
					],
					deleteForIssueComment: [
						'DELETE /repos/{owner}/{repo}/issues/comments/{comment_id}/reactions/{reaction_id}',
						{
							mediaType: {
								previews: [ 'squirrel-girl' ],
							},
						},
					],
					deleteForPullRequestComment: [
						'DELETE /repos/{owner}/{repo}/pulls/comments/{comment_id}/reactions/{reaction_id}',
						{
							mediaType: {
								previews: [ 'squirrel-girl' ],
							},
						},
					],
					deleteForTeamDiscussion: [
						'DELETE /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/reactions/{reaction_id}',
						{
							mediaType: {
								previews: [ 'squirrel-girl' ],
							},
						},
					],
					deleteForTeamDiscussionComment: [
						'DELETE /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments/{comment_number}/reactions/{reaction_id}',
						{
							mediaType: {
								previews: [ 'squirrel-girl' ],
							},
						},
					],
					deleteLegacy: [
						'DELETE /reactions/{reaction_id}',
						{
							mediaType: {
								previews: [ 'squirrel-girl' ],
							},
						},
						{
							deprecated:
								'octokit.reactions.deleteLegacy() is deprecated, see https://docs.github.com/rest/reference/reactions/#delete-a-reaction-legacy',
						},
					],
					listForCommitComment: [
						'GET /repos/{owner}/{repo}/comments/{comment_id}/reactions',
						{
							mediaType: {
								previews: [ 'squirrel-girl' ],
							},
						},
					],
					listForIssue: [
						'GET /repos/{owner}/{repo}/issues/{issue_number}/reactions',
						{
							mediaType: {
								previews: [ 'squirrel-girl' ],
							},
						},
					],
					listForIssueComment: [
						'GET /repos/{owner}/{repo}/issues/comments/{comment_id}/reactions',
						{
							mediaType: {
								previews: [ 'squirrel-girl' ],
							},
						},
					],
					listForPullRequestReviewComment: [
						'GET /repos/{owner}/{repo}/pulls/comments/{comment_id}/reactions',
						{
							mediaType: {
								previews: [ 'squirrel-girl' ],
							},
						},
					],
					listForTeamDiscussionCommentInOrg: [
						'GET /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments/{comment_number}/reactions',
						{
							mediaType: {
								previews: [ 'squirrel-girl' ],
							},
						},
					],
					listForTeamDiscussionInOrg: [
						'GET /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/reactions',
						{
							mediaType: {
								previews: [ 'squirrel-girl' ],
							},
						},
					],
				},
				repos: {
					acceptInvitation: [ 'PATCH /user/repository_invitations/{invitation_id}' ],
					addAppAccessRestrictions: [
						'POST /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/apps',
						{},
						{
							mapToData: 'apps',
						},
					],
					addCollaborator: [ 'PUT /repos/{owner}/{repo}/collaborators/{username}' ],
					addStatusCheckContexts: [
						'POST /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks/contexts',
						{},
						{
							mapToData: 'contexts',
						},
					],
					addTeamAccessRestrictions: [
						'POST /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/teams',
						{},
						{
							mapToData: 'teams',
						},
					],
					addUserAccessRestrictions: [
						'POST /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/users',
						{},
						{
							mapToData: 'users',
						},
					],
					checkCollaborator: [ 'GET /repos/{owner}/{repo}/collaborators/{username}' ],
					checkVulnerabilityAlerts: [
						'GET /repos/{owner}/{repo}/vulnerability-alerts',
						{
							mediaType: {
								previews: [ 'dorian' ],
							},
						},
					],
					compareCommits: [ 'GET /repos/{owner}/{repo}/compare/{base}...{head}' ],
					createCommitComment: [ 'POST /repos/{owner}/{repo}/commits/{commit_sha}/comments' ],
					createCommitSignatureProtection: [
						'POST /repos/{owner}/{repo}/branches/{branch}/protection/required_signatures',
						{
							mediaType: {
								previews: [ 'zzzax' ],
							},
						},
					],
					createCommitStatus: [ 'POST /repos/{owner}/{repo}/statuses/{sha}' ],
					createDeployKey: [ 'POST /repos/{owner}/{repo}/keys' ],
					createDeployment: [ 'POST /repos/{owner}/{repo}/deployments' ],
					createDeploymentStatus: [
						'POST /repos/{owner}/{repo}/deployments/{deployment_id}/statuses',
					],
					createDispatchEvent: [ 'POST /repos/{owner}/{repo}/dispatches' ],
					createForAuthenticatedUser: [ 'POST /user/repos' ],
					createFork: [ 'POST /repos/{owner}/{repo}/forks{?org,organization}' ],
					createInOrg: [ 'POST /orgs/{org}/repos' ],
					createOrUpdateEnvironment: [
						'PUT /repos/{owner}/{repo}/environments/{environment_name}',
					],
					createOrUpdateFileContents: [ 'PUT /repos/{owner}/{repo}/contents/{path}' ],
					createPagesSite: [
						'POST /repos/{owner}/{repo}/pages',
						{
							mediaType: {
								previews: [ 'switcheroo' ],
							},
						},
					],
					createRelease: [ 'POST /repos/{owner}/{repo}/releases' ],
					createUsingTemplate: [
						'POST /repos/{template_owner}/{template_repo}/generate',
						{
							mediaType: {
								previews: [ 'baptiste' ],
							},
						},
					],
					createWebhook: [ 'POST /repos/{owner}/{repo}/hooks' ],
					declineInvitation: [ 'DELETE /user/repository_invitations/{invitation_id}' ],
					delete: [ 'DELETE /repos/{owner}/{repo}' ],
					deleteAccessRestrictions: [
						'DELETE /repos/{owner}/{repo}/branches/{branch}/protection/restrictions',
					],
					deleteAdminBranchProtection: [
						'DELETE /repos/{owner}/{repo}/branches/{branch}/protection/enforce_admins',
					],
					deleteAnEnvironment: [ 'DELETE /repos/{owner}/{repo}/environments/{environment_name}' ],
					deleteBranchProtection: [ 'DELETE /repos/{owner}/{repo}/branches/{branch}/protection' ],
					deleteCommitComment: [ 'DELETE /repos/{owner}/{repo}/comments/{comment_id}' ],
					deleteCommitSignatureProtection: [
						'DELETE /repos/{owner}/{repo}/branches/{branch}/protection/required_signatures',
						{
							mediaType: {
								previews: [ 'zzzax' ],
							},
						},
					],
					deleteDeployKey: [ 'DELETE /repos/{owner}/{repo}/keys/{key_id}' ],
					deleteDeployment: [ 'DELETE /repos/{owner}/{repo}/deployments/{deployment_id}' ],
					deleteFile: [ 'DELETE /repos/{owner}/{repo}/contents/{path}' ],
					deleteInvitation: [ 'DELETE /repos/{owner}/{repo}/invitations/{invitation_id}' ],
					deletePagesSite: [
						'DELETE /repos/{owner}/{repo}/pages',
						{
							mediaType: {
								previews: [ 'switcheroo' ],
							},
						},
					],
					deletePullRequestReviewProtection: [
						'DELETE /repos/{owner}/{repo}/branches/{branch}/protection/required_pull_request_reviews',
					],
					deleteRelease: [ 'DELETE /repos/{owner}/{repo}/releases/{release_id}' ],
					deleteReleaseAsset: [ 'DELETE /repos/{owner}/{repo}/releases/assets/{asset_id}' ],
					deleteWebhook: [ 'DELETE /repos/{owner}/{repo}/hooks/{hook_id}' ],
					disableAutomatedSecurityFixes: [
						'DELETE /repos/{owner}/{repo}/automated-security-fixes',
						{
							mediaType: {
								previews: [ 'london' ],
							},
						},
					],
					disableVulnerabilityAlerts: [
						'DELETE /repos/{owner}/{repo}/vulnerability-alerts',
						{
							mediaType: {
								previews: [ 'dorian' ],
							},
						},
					],
					downloadArchive: [
						'GET /repos/{owner}/{repo}/zipball/{ref}',
						{},
						{
							renamed: [ 'repos', 'downloadZipballArchive' ],
						},
					],
					downloadTarballArchive: [ 'GET /repos/{owner}/{repo}/tarball/{ref}' ],
					downloadZipballArchive: [ 'GET /repos/{owner}/{repo}/zipball/{ref}' ],
					enableAutomatedSecurityFixes: [
						'PUT /repos/{owner}/{repo}/automated-security-fixes',
						{
							mediaType: {
								previews: [ 'london' ],
							},
						},
					],
					enableVulnerabilityAlerts: [
						'PUT /repos/{owner}/{repo}/vulnerability-alerts',
						{
							mediaType: {
								previews: [ 'dorian' ],
							},
						},
					],
					get: [ 'GET /repos/{owner}/{repo}' ],
					getAccessRestrictions: [
						'GET /repos/{owner}/{repo}/branches/{branch}/protection/restrictions',
					],
					getAdminBranchProtection: [
						'GET /repos/{owner}/{repo}/branches/{branch}/protection/enforce_admins',
					],
					getAllEnvironments: [ 'GET /repos/{owner}/{repo}/environments' ],
					getAllStatusCheckContexts: [
						'GET /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks/contexts',
					],
					getAllTopics: [
						'GET /repos/{owner}/{repo}/topics',
						{
							mediaType: {
								previews: [ 'mercy' ],
							},
						},
					],
					getAppsWithAccessToProtectedBranch: [
						'GET /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/apps',
					],
					getBranch: [ 'GET /repos/{owner}/{repo}/branches/{branch}' ],
					getBranchProtection: [ 'GET /repos/{owner}/{repo}/branches/{branch}/protection' ],
					getClones: [ 'GET /repos/{owner}/{repo}/traffic/clones' ],
					getCodeFrequencyStats: [ 'GET /repos/{owner}/{repo}/stats/code_frequency' ],
					getCollaboratorPermissionLevel: [
						'GET /repos/{owner}/{repo}/collaborators/{username}/permission',
					],
					getCombinedStatusForRef: [ 'GET /repos/{owner}/{repo}/commits/{ref}/status' ],
					getCommit: [ 'GET /repos/{owner}/{repo}/commits/{ref}' ],
					getCommitActivityStats: [ 'GET /repos/{owner}/{repo}/stats/commit_activity' ],
					getCommitComment: [ 'GET /repos/{owner}/{repo}/comments/{comment_id}' ],
					getCommitSignatureProtection: [
						'GET /repos/{owner}/{repo}/branches/{branch}/protection/required_signatures',
						{
							mediaType: {
								previews: [ 'zzzax' ],
							},
						},
					],
					getCommunityProfileMetrics: [ 'GET /repos/{owner}/{repo}/community/profile' ],
					getContent: [ 'GET /repos/{owner}/{repo}/contents/{path}' ],
					getContributorsStats: [ 'GET /repos/{owner}/{repo}/stats/contributors' ],
					getDeployKey: [ 'GET /repos/{owner}/{repo}/keys/{key_id}' ],
					getDeployment: [ 'GET /repos/{owner}/{repo}/deployments/{deployment_id}' ],
					getDeploymentStatus: [
						'GET /repos/{owner}/{repo}/deployments/{deployment_id}/statuses/{status_id}',
					],
					getEnvironment: [ 'GET /repos/{owner}/{repo}/environments/{environment_name}' ],
					getLatestPagesBuild: [ 'GET /repos/{owner}/{repo}/pages/builds/latest' ],
					getLatestRelease: [ 'GET /repos/{owner}/{repo}/releases/latest' ],
					getPages: [ 'GET /repos/{owner}/{repo}/pages' ],
					getPagesBuild: [ 'GET /repos/{owner}/{repo}/pages/builds/{build_id}' ],
					getParticipationStats: [ 'GET /repos/{owner}/{repo}/stats/participation' ],
					getPullRequestReviewProtection: [
						'GET /repos/{owner}/{repo}/branches/{branch}/protection/required_pull_request_reviews',
					],
					getPunchCardStats: [ 'GET /repos/{owner}/{repo}/stats/punch_card' ],
					getReadme: [ 'GET /repos/{owner}/{repo}/readme' ],
					getReadmeInDirectory: [ 'GET /repos/{owner}/{repo}/readme/{dir}' ],
					getRelease: [ 'GET /repos/{owner}/{repo}/releases/{release_id}' ],
					getReleaseAsset: [ 'GET /repos/{owner}/{repo}/releases/assets/{asset_id}' ],
					getReleaseByTag: [ 'GET /repos/{owner}/{repo}/releases/tags/{tag}' ],
					getStatusChecksProtection: [
						'GET /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks',
					],
					getTeamsWithAccessToProtectedBranch: [
						'GET /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/teams',
					],
					getTopPaths: [ 'GET /repos/{owner}/{repo}/traffic/popular/paths' ],
					getTopReferrers: [ 'GET /repos/{owner}/{repo}/traffic/popular/referrers' ],
					getUsersWithAccessToProtectedBranch: [
						'GET /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/users',
					],
					getViews: [ 'GET /repos/{owner}/{repo}/traffic/views' ],
					getWebhook: [ 'GET /repos/{owner}/{repo}/hooks/{hook_id}' ],
					getWebhookConfigForRepo: [ 'GET /repos/{owner}/{repo}/hooks/{hook_id}/config' ],
					listBranches: [ 'GET /repos/{owner}/{repo}/branches' ],
					listBranchesForHeadCommit: [
						'GET /repos/{owner}/{repo}/commits/{commit_sha}/branches-where-head',
						{
							mediaType: {
								previews: [ 'groot' ],
							},
						},
					],
					listCollaborators: [ 'GET /repos/{owner}/{repo}/collaborators' ],
					listCommentsForCommit: [ 'GET /repos/{owner}/{repo}/commits/{commit_sha}/comments' ],
					listCommitCommentsForRepo: [ 'GET /repos/{owner}/{repo}/comments' ],
					listCommitStatusesForRef: [ 'GET /repos/{owner}/{repo}/commits/{ref}/statuses' ],
					listCommits: [ 'GET /repos/{owner}/{repo}/commits' ],
					listContributors: [ 'GET /repos/{owner}/{repo}/contributors' ],
					listDeployKeys: [ 'GET /repos/{owner}/{repo}/keys' ],
					listDeploymentStatuses: [
						'GET /repos/{owner}/{repo}/deployments/{deployment_id}/statuses',
					],
					listDeployments: [ 'GET /repos/{owner}/{repo}/deployments' ],
					listForAuthenticatedUser: [ 'GET /user/repos' ],
					listForOrg: [ 'GET /orgs/{org}/repos' ],
					listForUser: [ 'GET /users/{username}/repos' ],
					listForks: [ 'GET /repos/{owner}/{repo}/forks' ],
					listInvitations: [ 'GET /repos/{owner}/{repo}/invitations' ],
					listInvitationsForAuthenticatedUser: [ 'GET /user/repository_invitations' ],
					listLanguages: [ 'GET /repos/{owner}/{repo}/languages' ],
					listPagesBuilds: [ 'GET /repos/{owner}/{repo}/pages/builds' ],
					listPublic: [ 'GET /repositories' ],
					listPullRequestsAssociatedWithCommit: [
						'GET /repos/{owner}/{repo}/commits/{commit_sha}/pulls',
						{
							mediaType: {
								previews: [ 'groot' ],
							},
						},
					],
					listReleaseAssets: [ 'GET /repos/{owner}/{repo}/releases/{release_id}/assets' ],
					listReleases: [ 'GET /repos/{owner}/{repo}/releases' ],
					listTags: [ 'GET /repos/{owner}/{repo}/tags' ],
					listTeams: [ 'GET /repos/{owner}/{repo}/teams' ],
					listWebhooks: [ 'GET /repos/{owner}/{repo}/hooks' ],
					merge: [ 'POST /repos/{owner}/{repo}/merges' ],
					pingWebhook: [ 'POST /repos/{owner}/{repo}/hooks/{hook_id}/pings' ],
					removeAppAccessRestrictions: [
						'DELETE /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/apps',
						{},
						{
							mapToData: 'apps',
						},
					],
					removeCollaborator: [ 'DELETE /repos/{owner}/{repo}/collaborators/{username}' ],
					removeStatusCheckContexts: [
						'DELETE /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks/contexts',
						{},
						{
							mapToData: 'contexts',
						},
					],
					removeStatusCheckProtection: [
						'DELETE /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks',
					],
					removeTeamAccessRestrictions: [
						'DELETE /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/teams',
						{},
						{
							mapToData: 'teams',
						},
					],
					removeUserAccessRestrictions: [
						'DELETE /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/users',
						{},
						{
							mapToData: 'users',
						},
					],
					renameBranch: [ 'POST /repos/{owner}/{repo}/branches/{branch}/rename' ],
					replaceAllTopics: [
						'PUT /repos/{owner}/{repo}/topics',
						{
							mediaType: {
								previews: [ 'mercy' ],
							},
						},
					],
					requestPagesBuild: [ 'POST /repos/{owner}/{repo}/pages/builds' ],
					setAdminBranchProtection: [
						'POST /repos/{owner}/{repo}/branches/{branch}/protection/enforce_admins',
					],
					setAppAccessRestrictions: [
						'PUT /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/apps',
						{},
						{
							mapToData: 'apps',
						},
					],
					setStatusCheckContexts: [
						'PUT /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks/contexts',
						{},
						{
							mapToData: 'contexts',
						},
					],
					setTeamAccessRestrictions: [
						'PUT /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/teams',
						{},
						{
							mapToData: 'teams',
						},
					],
					setUserAccessRestrictions: [
						'PUT /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/users',
						{},
						{
							mapToData: 'users',
						},
					],
					testPushWebhook: [ 'POST /repos/{owner}/{repo}/hooks/{hook_id}/tests' ],
					transfer: [ 'POST /repos/{owner}/{repo}/transfer' ],
					update: [ 'PATCH /repos/{owner}/{repo}' ],
					updateBranchProtection: [ 'PUT /repos/{owner}/{repo}/branches/{branch}/protection' ],
					updateCommitComment: [ 'PATCH /repos/{owner}/{repo}/comments/{comment_id}' ],
					updateInformationAboutPagesSite: [ 'PUT /repos/{owner}/{repo}/pages' ],
					updateInvitation: [ 'PATCH /repos/{owner}/{repo}/invitations/{invitation_id}' ],
					updatePullRequestReviewProtection: [
						'PATCH /repos/{owner}/{repo}/branches/{branch}/protection/required_pull_request_reviews',
					],
					updateRelease: [ 'PATCH /repos/{owner}/{repo}/releases/{release_id}' ],
					updateReleaseAsset: [ 'PATCH /repos/{owner}/{repo}/releases/assets/{asset_id}' ],
					updateStatusCheckPotection: [
						'PATCH /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks',
						{},
						{
							renamed: [ 'repos', 'updateStatusCheckProtection' ],
						},
					],
					updateStatusCheckProtection: [
						'PATCH /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks',
					],
					updateWebhook: [ 'PATCH /repos/{owner}/{repo}/hooks/{hook_id}' ],
					updateWebhookConfigForRepo: [ 'PATCH /repos/{owner}/{repo}/hooks/{hook_id}/config' ],
					uploadReleaseAsset: [
						'POST /repos/{owner}/{repo}/releases/{release_id}/assets{?name,label}',
						{
							baseUrl: 'https://uploads.github.com',
						},
					],
				},
				search: {
					code: [ 'GET /search/code' ],
					commits: [
						'GET /search/commits',
						{
							mediaType: {
								previews: [ 'cloak' ],
							},
						},
					],
					issuesAndPullRequests: [ 'GET /search/issues' ],
					labels: [ 'GET /search/labels' ],
					repos: [ 'GET /search/repositories' ],
					topics: [
						'GET /search/topics',
						{
							mediaType: {
								previews: [ 'mercy' ],
							},
						},
					],
					users: [ 'GET /search/users' ],
				},
				secretScanning: {
					getAlert: [ 'GET /repos/{owner}/{repo}/secret-scanning/alerts/{alert_number}' ],
					listAlertsForRepo: [ 'GET /repos/{owner}/{repo}/secret-scanning/alerts' ],
					updateAlert: [ 'PATCH /repos/{owner}/{repo}/secret-scanning/alerts/{alert_number}' ],
				},
				teams: {
					addOrUpdateMembershipForUserInOrg: [
						'PUT /orgs/{org}/teams/{team_slug}/memberships/{username}',
					],
					addOrUpdateProjectPermissionsInOrg: [
						'PUT /orgs/{org}/teams/{team_slug}/projects/{project_id}',
						{
							mediaType: {
								previews: [ 'inertia' ],
							},
						},
					],
					addOrUpdateRepoPermissionsInOrg: [
						'PUT /orgs/{org}/teams/{team_slug}/repos/{owner}/{repo}',
					],
					checkPermissionsForProjectInOrg: [
						'GET /orgs/{org}/teams/{team_slug}/projects/{project_id}',
						{
							mediaType: {
								previews: [ 'inertia' ],
							},
						},
					],
					checkPermissionsForRepoInOrg: [
						'GET /orgs/{org}/teams/{team_slug}/repos/{owner}/{repo}',
					],
					create: [ 'POST /orgs/{org}/teams' ],
					createDiscussionCommentInOrg: [
						'POST /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments',
					],
					createDiscussionInOrg: [ 'POST /orgs/{org}/teams/{team_slug}/discussions' ],
					deleteDiscussionCommentInOrg: [
						'DELETE /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments/{comment_number}',
					],
					deleteDiscussionInOrg: [
						'DELETE /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}',
					],
					deleteInOrg: [ 'DELETE /orgs/{org}/teams/{team_slug}' ],
					getByName: [ 'GET /orgs/{org}/teams/{team_slug}' ],
					getDiscussionCommentInOrg: [
						'GET /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments/{comment_number}',
					],
					getDiscussionInOrg: [
						'GET /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}',
					],
					getMembershipForUserInOrg: [ 'GET /orgs/{org}/teams/{team_slug}/memberships/{username}' ],
					list: [ 'GET /orgs/{org}/teams' ],
					listChildInOrg: [ 'GET /orgs/{org}/teams/{team_slug}/teams' ],
					listDiscussionCommentsInOrg: [
						'GET /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments',
					],
					listDiscussionsInOrg: [ 'GET /orgs/{org}/teams/{team_slug}/discussions' ],
					listForAuthenticatedUser: [ 'GET /user/teams' ],
					listMembersInOrg: [ 'GET /orgs/{org}/teams/{team_slug}/members' ],
					listPendingInvitationsInOrg: [ 'GET /orgs/{org}/teams/{team_slug}/invitations' ],
					listProjectsInOrg: [
						'GET /orgs/{org}/teams/{team_slug}/projects',
						{
							mediaType: {
								previews: [ 'inertia' ],
							},
						},
					],
					listReposInOrg: [ 'GET /orgs/{org}/teams/{team_slug}/repos' ],
					removeMembershipForUserInOrg: [
						'DELETE /orgs/{org}/teams/{team_slug}/memberships/{username}',
					],
					removeProjectInOrg: [ 'DELETE /orgs/{org}/teams/{team_slug}/projects/{project_id}' ],
					removeRepoInOrg: [ 'DELETE /orgs/{org}/teams/{team_slug}/repos/{owner}/{repo}' ],
					updateDiscussionCommentInOrg: [
						'PATCH /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments/{comment_number}',
					],
					updateDiscussionInOrg: [
						'PATCH /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}',
					],
					updateInOrg: [ 'PATCH /orgs/{org}/teams/{team_slug}' ],
				},
				users: {
					addEmailForAuthenticated: [ 'POST /user/emails' ],
					block: [ 'PUT /user/blocks/{username}' ],
					checkBlocked: [ 'GET /user/blocks/{username}' ],
					checkFollowingForUser: [ 'GET /users/{username}/following/{target_user}' ],
					checkPersonIsFollowedByAuthenticated: [ 'GET /user/following/{username}' ],
					createGpgKeyForAuthenticated: [ 'POST /user/gpg_keys' ],
					createPublicSshKeyForAuthenticated: [ 'POST /user/keys' ],
					deleteEmailForAuthenticated: [ 'DELETE /user/emails' ],
					deleteGpgKeyForAuthenticated: [ 'DELETE /user/gpg_keys/{gpg_key_id}' ],
					deletePublicSshKeyForAuthenticated: [ 'DELETE /user/keys/{key_id}' ],
					follow: [ 'PUT /user/following/{username}' ],
					getAuthenticated: [ 'GET /user' ],
					getByUsername: [ 'GET /users/{username}' ],
					getContextForUser: [ 'GET /users/{username}/hovercard' ],
					getGpgKeyForAuthenticated: [ 'GET /user/gpg_keys/{gpg_key_id}' ],
					getPublicSshKeyForAuthenticated: [ 'GET /user/keys/{key_id}' ],
					list: [ 'GET /users' ],
					listBlockedByAuthenticated: [ 'GET /user/blocks' ],
					listEmailsForAuthenticated: [ 'GET /user/emails' ],
					listFollowedByAuthenticated: [ 'GET /user/following' ],
					listFollowersForAuthenticatedUser: [ 'GET /user/followers' ],
					listFollowersForUser: [ 'GET /users/{username}/followers' ],
					listFollowingForUser: [ 'GET /users/{username}/following' ],
					listGpgKeysForAuthenticated: [ 'GET /user/gpg_keys' ],
					listGpgKeysForUser: [ 'GET /users/{username}/gpg_keys' ],
					listPublicEmailsForAuthenticated: [ 'GET /user/public_emails' ],
					listPublicKeysForUser: [ 'GET /users/{username}/keys' ],
					listPublicSshKeysForAuthenticated: [ 'GET /user/keys' ],
					setPrimaryEmailVisibilityForAuthenticated: [ 'PATCH /user/email/visibility' ],
					unblock: [ 'DELETE /user/blocks/{username}' ],
					unfollow: [ 'DELETE /user/following/{username}' ],
					updateAuthenticated: [ 'PATCH /user' ],
				},
			};

			const VERSION = '4.14.0';

			function endpointsToMethods( octokit, endpointsMap ) {
				const newMethods = {};

				for ( const [ scope, endpoints ] of Object.entries( endpointsMap ) ) {
					for ( const [ methodName, endpoint ] of Object.entries( endpoints ) ) {
						const [ route, defaults, decorations ] = endpoint;
						const [ method, url ] = route.split( / / );
						const endpointDefaults = Object.assign(
							{
								method,
								url,
							},
							defaults
						);

						if ( ! newMethods[ scope ] ) {
							newMethods[ scope ] = {};
						}

						const scopeMethods = newMethods[ scope ];

						if ( decorations ) {
							scopeMethods[ methodName ] = decorate(
								octokit,
								scope,
								methodName,
								endpointDefaults,
								decorations
							);
							continue;
						}

						scopeMethods[ methodName ] = octokit.request.defaults( endpointDefaults );
					}
				}

				return newMethods;
			}

			function decorate( octokit, scope, methodName, defaults, decorations ) {
				const requestWithDefaults = octokit.request.defaults( defaults );
				/* istanbul ignore next */

				function withDecorations( ...args ) {
					// @ts-ignore https://github.com/microsoft/TypeScript/issues/25488
					let options = requestWithDefaults.endpoint.merge( ...args ); // There are currently no other decorations than `.mapToData`

					if ( decorations.mapToData ) {
						options = Object.assign( {}, options, {
							data: options[ decorations.mapToData ],
							[ decorations.mapToData ]: undefined,
						} );
						return requestWithDefaults( options );
					}

					if ( decorations.renamed ) {
						const [ newScope, newMethodName ] = decorations.renamed;
						octokit.log.warn(
							`octokit.${ scope }.${ methodName }() has been renamed to octokit.${ newScope }.${ newMethodName }()`
						);
					}

					if ( decorations.deprecated ) {
						octokit.log.warn( decorations.deprecated );
					}

					if ( decorations.renamedParameters ) {
						// @ts-ignore https://github.com/microsoft/TypeScript/issues/25488
						const options = requestWithDefaults.endpoint.merge( ...args );

						for ( const [ name, alias ] of Object.entries( decorations.renamedParameters ) ) {
							if ( name in options ) {
								octokit.log.warn(
									`"${ name }" parameter is deprecated for "octokit.${ scope }.${ methodName }()". Use "${ alias }" instead`
								);

								if ( ! ( alias in options ) ) {
									options[ alias ] = options[ name ];
								}

								delete options[ name ];
							}
						}

						return requestWithDefaults( options );
					} // @ts-ignore https://github.com/microsoft/TypeScript/issues/25488

					return requestWithDefaults( ...args );
				}

				return Object.assign( withDecorations, requestWithDefaults );
			}

			function restEndpointMethods( octokit ) {
				return endpointsToMethods( octokit, Endpoints );
			}
			restEndpointMethods.VERSION = VERSION;

			exports.restEndpointMethods = restEndpointMethods;
			//# sourceMappingURL=index.js.map

			/***/
		},

		/***/ 537: /***/ ( __unused_webpack_module, exports, __nccwpck_require__ ) => {
			'use strict';

			Object.defineProperty( exports, '__esModule', { value: true } );

			function _interopDefault( ex ) {
				return ex && typeof ex === 'object' && 'default' in ex ? ex[ 'default' ] : ex;
			}

			var deprecation = __nccwpck_require__( 8932 );
			var once = _interopDefault( __nccwpck_require__( 1223 ) );

			const logOnce = once( deprecation => console.warn( deprecation ) );
			/**
			 * Error with extra properties to help with debugging
			 */

			class RequestError extends Error {
				constructor( message, statusCode, options ) {
					super( message ); // Maintains proper stack trace (only available on V8)

					/* istanbul ignore next */

					if ( Error.captureStackTrace ) {
						Error.captureStackTrace( this, this.constructor );
					}

					this.name = 'HttpError';
					this.status = statusCode;
					Object.defineProperty( this, 'code', {
						get() {
							logOnce(
								new deprecation.Deprecation(
									'[@octokit/request-error] `error.code` is deprecated, use `error.status`.'
								)
							);
							return statusCode;
						},
					} );
					this.headers = options.headers || {}; // redact request credentials without mutating original request options

					const requestCopy = Object.assign( {}, options.request );

					if ( options.request.headers.authorization ) {
						requestCopy.headers = Object.assign( {}, options.request.headers, {
							authorization: options.request.headers.authorization.replace( / .*$/, ' [REDACTED]' ),
						} );
					}

					requestCopy.url = requestCopy.url // client_id & client_secret can be passed as URL query parameters to increase rate limit
						// see https://developer.github.com/v3/#increasing-the-unauthenticated-rate-limit-for-oauth-applications
						.replace( /\bclient_secret=\w+/g, 'client_secret=[REDACTED]' ) // OAuth tokens can be passed as URL query parameters, although it is not recommended
						// see https://developer.github.com/v3/#oauth2-token-sent-in-a-header
						.replace( /\baccess_token=\w+/g, 'access_token=[REDACTED]' );
					this.request = requestCopy;
				}
			}

			exports.RequestError = RequestError;
			//# sourceMappingURL=index.js.map

			/***/
		},

		/***/ 6234: /***/ ( __unused_webpack_module, exports, __nccwpck_require__ ) => {
			'use strict';

			Object.defineProperty( exports, '__esModule', { value: true } );

			function _interopDefault( ex ) {
				return ex && typeof ex === 'object' && 'default' in ex ? ex[ 'default' ] : ex;
			}

			var endpoint = __nccwpck_require__( 9440 );
			var universalUserAgent = __nccwpck_require__( 5030 );
			var isPlainObject = __nccwpck_require__( 3287 );
			var nodeFetch = _interopDefault( __nccwpck_require__( 467 ) );
			var requestError = __nccwpck_require__( 537 );

			const VERSION = '5.4.14';

			function getBufferResponse( response ) {
				return response.arrayBuffer();
			}

			function fetchWrapper( requestOptions ) {
				if (
					isPlainObject.isPlainObject( requestOptions.body ) ||
					Array.isArray( requestOptions.body )
				) {
					requestOptions.body = JSON.stringify( requestOptions.body );
				}

				let headers = {};
				let status;
				let url;
				const fetch = ( requestOptions.request && requestOptions.request.fetch ) || nodeFetch;
				return fetch(
					requestOptions.url,
					Object.assign(
						{
							method: requestOptions.method,
							body: requestOptions.body,
							headers: requestOptions.headers,
							redirect: requestOptions.redirect,
						},
						requestOptions.request
					)
				)
					.then( response => {
						url = response.url;
						status = response.status;

						for ( const keyAndValue of response.headers ) {
							headers[ keyAndValue[ 0 ] ] = keyAndValue[ 1 ];
						}

						if ( status === 204 || status === 205 ) {
							return;
						} // GitHub API returns 200 for HEAD requests

						if ( requestOptions.method === 'HEAD' ) {
							if ( status < 400 ) {
								return;
							}

							throw new requestError.RequestError( response.statusText, status, {
								headers,
								request: requestOptions,
							} );
						}

						if ( status === 304 ) {
							throw new requestError.RequestError( 'Not modified', status, {
								headers,
								request: requestOptions,
							} );
						}

						if ( status >= 400 ) {
							return response.text().then( message => {
								const error = new requestError.RequestError( message, status, {
									headers,
									request: requestOptions,
								} );

								try {
									let responseBody = JSON.parse( error.message );
									Object.assign( error, responseBody );
									let errors = responseBody.errors; // Assumption `errors` would always be in Array format

									error.message = error.message + ': ' + errors.map( JSON.stringify ).join( ', ' );
								} catch ( e ) {
									// ignore, see octokit/rest.js#684
								}

								throw error;
							} );
						}

						const contentType = response.headers.get( 'content-type' );

						if ( /application\/json/.test( contentType ) ) {
							return response.json();
						}

						if ( ! contentType || /^text\/|charset=utf-8$/.test( contentType ) ) {
							return response.text();
						}

						return getBufferResponse( response );
					} )
					.then( data => {
						return {
							status,
							url,
							headers,
							data,
						};
					} )
					.catch( error => {
						if ( error instanceof requestError.RequestError ) {
							throw error;
						}

						throw new requestError.RequestError( error.message, 500, {
							headers,
							request: requestOptions,
						} );
					} );
			}

			function withDefaults( oldEndpoint, newDefaults ) {
				const endpoint = oldEndpoint.defaults( newDefaults );

				const newApi = function ( route, parameters ) {
					const endpointOptions = endpoint.merge( route, parameters );

					if ( ! endpointOptions.request || ! endpointOptions.request.hook ) {
						return fetchWrapper( endpoint.parse( endpointOptions ) );
					}

					const request = ( route, parameters ) => {
						return fetchWrapper( endpoint.parse( endpoint.merge( route, parameters ) ) );
					};

					Object.assign( request, {
						endpoint,
						defaults: withDefaults.bind( null, endpoint ),
					} );
					return endpointOptions.request.hook( request, endpointOptions );
				};

				return Object.assign( newApi, {
					endpoint,
					defaults: withDefaults.bind( null, endpoint ),
				} );
			}

			const request = withDefaults( endpoint.endpoint, {
				headers: {
					'user-agent': `octokit-request.js/${ VERSION } ${ universalUserAgent.getUserAgent() }`,
				},
			} );

			exports.request = request;
			//# sourceMappingURL=index.js.map

			/***/
		},

		/***/ 9417: /***/ module => {
			'use strict';

			module.exports = balanced;
			function balanced( a, b, str ) {
				if ( a instanceof RegExp ) a = maybeMatch( a, str );
				if ( b instanceof RegExp ) b = maybeMatch( b, str );

				var r = range( a, b, str );

				return (
					r && {
						start: r[ 0 ],
						end: r[ 1 ],
						pre: str.slice( 0, r[ 0 ] ),
						body: str.slice( r[ 0 ] + a.length, r[ 1 ] ),
						post: str.slice( r[ 1 ] + b.length ),
					}
				);
			}

			function maybeMatch( reg, str ) {
				var m = str.match( reg );
				return m ? m[ 0 ] : null;
			}

			balanced.range = range;
			function range( a, b, str ) {
				var begs, beg, left, right, result;
				var ai = str.indexOf( a );
				var bi = str.indexOf( b, ai + 1 );
				var i = ai;

				if ( ai >= 0 && bi > 0 ) {
					begs = [];
					left = str.length;

					while ( i >= 0 && ! result ) {
						if ( i == ai ) {
							begs.push( i );
							ai = str.indexOf( a, i + 1 );
						} else if ( begs.length == 1 ) {
							result = [ begs.pop(), bi ];
						} else {
							beg = begs.pop();
							if ( beg < left ) {
								left = beg;
								right = bi;
							}

							bi = str.indexOf( b, i + 1 );
						}

						i = ai < bi && ai >= 0 ? ai : bi;
					}

					if ( begs.length ) {
						result = [ left, right ];
					}
				}

				return result;
			}

			/***/
		},

		/***/ 3682: /***/ ( module, __unused_webpack_exports, __nccwpck_require__ ) => {
			var register = __nccwpck_require__( 4670 );
			var addHook = __nccwpck_require__( 5549 );
			var removeHook = __nccwpck_require__( 6819 );

			// bind with array of arguments: https://stackoverflow.com/a/21792913
			var bind = Function.bind;
			var bindable = bind.bind( bind );

			function bindApi( hook, state, name ) {
				var removeHookRef = bindable( removeHook, null ).apply(
					null,
					name ? [ state, name ] : [ state ]
				);
				hook.api = { remove: removeHookRef };
				hook.remove = removeHookRef;
				[ 'before', 'error', 'after', 'wrap' ].forEach( function ( kind ) {
					var args = name ? [ state, kind, name ] : [ state, kind ];
					hook[ kind ] = hook.api[ kind ] = bindable( addHook, null ).apply( null, args );
				} );
			}

			function HookSingular() {
				var singularHookName = 'h';
				var singularHookState = {
					registry: {},
				};
				var singularHook = register.bind( null, singularHookState, singularHookName );
				bindApi( singularHook, singularHookState, singularHookName );
				return singularHook;
			}

			function HookCollection() {
				var state = {
					registry: {},
				};

				var hook = register.bind( null, state );
				bindApi( hook, state );

				return hook;
			}

			var collectionHookDeprecationMessageDisplayed = false;
			function Hook() {
				if ( ! collectionHookDeprecationMessageDisplayed ) {
					console.warn(
						'[before-after-hook]: "Hook()" repurposing warning, use "Hook.Collection()". Read more: https://git.io/upgrade-before-after-hook-to-1.4'
					);
					collectionHookDeprecationMessageDisplayed = true;
				}
				return HookCollection();
			}

			Hook.Singular = HookSingular.bind();
			Hook.Collection = HookCollection.bind();

			module.exports = Hook;
			// expose constructors as a named property for TypeScript
			module.exports.Hook = Hook;
			module.exports.Singular = Hook.Singular;
			module.exports.Collection = Hook.Collection;

			/***/
		},

		/***/ 5549: /***/ module => {
			module.exports = addHook;

			function addHook( state, kind, name, hook ) {
				var orig = hook;
				if ( ! state.registry[ name ] ) {
					state.registry[ name ] = [];
				}

				if ( kind === 'before' ) {
					hook = function ( method, options ) {
						return Promise.resolve()
							.then( orig.bind( null, options ) )
							.then( method.bind( null, options ) );
					};
				}

				if ( kind === 'after' ) {
					hook = function ( method, options ) {
						var result;
						return Promise.resolve()
							.then( method.bind( null, options ) )
							.then( function ( result_ ) {
								result = result_;
								return orig( result, options );
							} )
							.then( function () {
								return result;
							} );
					};
				}

				if ( kind === 'error' ) {
					hook = function ( method, options ) {
						return Promise.resolve()
							.then( method.bind( null, options ) )
							.catch( function ( error ) {
								return orig( error, options );
							} );
					};
				}

				state.registry[ name ].push( {
					hook: hook,
					orig: orig,
				} );
			}

			/***/
		},

		/***/ 4670: /***/ module => {
			module.exports = register;

			function register( state, name, method, options ) {
				if ( typeof method !== 'function' ) {
					throw new Error( 'method for before hook must be a function' );
				}

				if ( ! options ) {
					options = {};
				}

				if ( Array.isArray( name ) ) {
					return name.reverse().reduce( function ( callback, name ) {
						return register.bind( null, state, name, callback, options );
					}, method )();
				}

				return Promise.resolve().then( function () {
					if ( ! state.registry[ name ] ) {
						return method( options );
					}

					return state.registry[ name ].reduce( function ( method, registered ) {
						return registered.hook.bind( null, method, options );
					}, method )();
				} );
			}

			/***/
		},

		/***/ 6819: /***/ module => {
			module.exports = removeHook;

			function removeHook( state, name, method ) {
				if ( ! state.registry[ name ] ) {
					return;
				}

				var index = state.registry[ name ]
					.map( function ( registered ) {
						return registered.orig;
					} )
					.indexOf( method );

				if ( index === -1 ) {
					return;
				}

				state.registry[ name ].splice( index, 1 );
			}

			/***/
		},

		/***/ 3717: /***/ ( module, __unused_webpack_exports, __nccwpck_require__ ) => {
			var concatMap = __nccwpck_require__( 6891 );
			var balanced = __nccwpck_require__( 9417 );

			module.exports = expandTop;

			var escSlash = '\0SLASH' + Math.random() + '\0';
			var escOpen = '\0OPEN' + Math.random() + '\0';
			var escClose = '\0CLOSE' + Math.random() + '\0';
			var escComma = '\0COMMA' + Math.random() + '\0';
			var escPeriod = '\0PERIOD' + Math.random() + '\0';

			function numeric( str ) {
				return parseInt( str, 10 ) == str ? parseInt( str, 10 ) : str.charCodeAt( 0 );
			}

			function escapeBraces( str ) {
				return str
					.split( '\\\\' )
					.join( escSlash )
					.split( '\\{' )
					.join( escOpen )
					.split( '\\}' )
					.join( escClose )
					.split( '\\,' )
					.join( escComma )
					.split( '\\.' )
					.join( escPeriod );
			}

			function unescapeBraces( str ) {
				return str
					.split( escSlash )
					.join( '\\' )
					.split( escOpen )
					.join( '{' )
					.split( escClose )
					.join( '}' )
					.split( escComma )
					.join( ',' )
					.split( escPeriod )
					.join( '.' );
			}

			// Basically just str.split(","), but handling cases
			// where we have nested braced sections, which should be
			// treated as individual members, like {a,{b,c},d}
			function parseCommaParts( str ) {
				if ( ! str ) return [ '' ];

				var parts = [];
				var m = balanced( '{', '}', str );

				if ( ! m ) return str.split( ',' );

				var pre = m.pre;
				var body = m.body;
				var post = m.post;
				var p = pre.split( ',' );

				p[ p.length - 1 ] += '{' + body + '}';
				var postParts = parseCommaParts( post );
				if ( post.length ) {
					p[ p.length - 1 ] += postParts.shift();
					p.push.apply( p, postParts );
				}

				parts.push.apply( parts, p );

				return parts;
			}

			function expandTop( str ) {
				if ( ! str ) return [];

				// I don't know why Bash 4.3 does this, but it does.
				// Anything starting with {} will have the first two bytes preserved
				// but *only* at the top level, so {},a}b will not expand to anything,
				// but a{},b}c will be expanded to [a}c,abc].
				// One could argue that this is a bug in Bash, but since the goal of
				// this module is to match Bash's rules, we escape a leading {}
				if ( str.substr( 0, 2 ) === '{}' ) {
					str = '\\{\\}' + str.substr( 2 );
				}

				return expand( escapeBraces( str ), true ).map( unescapeBraces );
			}

			function identity( e ) {
				return e;
			}

			function embrace( str ) {
				return '{' + str + '}';
			}
			function isPadded( el ) {
				return /^-?0\d/.test( el );
			}

			function lte( i, y ) {
				return i <= y;
			}
			function gte( i, y ) {
				return i >= y;
			}

			function expand( str, isTop ) {
				var expansions = [];

				var m = balanced( '{', '}', str );
				if ( ! m || /\$$/.test( m.pre ) ) return [ str ];

				var isNumericSequence = /^-?\d+\.\.-?\d+(?:\.\.-?\d+)?$/.test( m.body );
				var isAlphaSequence = /^[a-zA-Z]\.\.[a-zA-Z](?:\.\.-?\d+)?$/.test( m.body );
				var isSequence = isNumericSequence || isAlphaSequence;
				var isOptions = m.body.indexOf( ',' ) >= 0;
				if ( ! isSequence && ! isOptions ) {
					// {a},b}
					if ( m.post.match( /,.*\}/ ) ) {
						str = m.pre + '{' + m.body + escClose + m.post;
						return expand( str );
					}
					return [ str ];
				}

				var n;
				if ( isSequence ) {
					n = m.body.split( /\.\./ );
				} else {
					n = parseCommaParts( m.body );
					if ( n.length === 1 ) {
						// x{{a,b}}y ==> x{a}y x{b}y
						n = expand( n[ 0 ], false ).map( embrace );
						if ( n.length === 1 ) {
							var post = m.post.length ? expand( m.post, false ) : [ '' ];
							return post.map( function ( p ) {
								return m.pre + n[ 0 ] + p;
							} );
						}
					}
				}

				// at this point, n is the parts, and we know it's not a comma set
				// with a single entry.

				// no need to expand pre, since it is guaranteed to be free of brace-sets
				var pre = m.pre;
				var post = m.post.length ? expand( m.post, false ) : [ '' ];

				var N;

				if ( isSequence ) {
					var x = numeric( n[ 0 ] );
					var y = numeric( n[ 1 ] );
					var width = Math.max( n[ 0 ].length, n[ 1 ].length );
					var incr = n.length == 3 ? Math.abs( numeric( n[ 2 ] ) ) : 1;
					var test = lte;
					var reverse = y < x;
					if ( reverse ) {
						incr *= -1;
						test = gte;
					}
					var pad = n.some( isPadded );

					N = [];

					for ( var i = x; test( i, y ); i += incr ) {
						var c;
						if ( isAlphaSequence ) {
							c = String.fromCharCode( i );
							if ( c === '\\' ) c = '';
						} else {
							c = String( i );
							if ( pad ) {
								var need = width - c.length;
								if ( need > 0 ) {
									var z = new Array( need + 1 ).join( '0' );
									if ( i < 0 ) c = '-' + z + c.slice( 1 );
									else c = z + c;
								}
							}
						}
						N.push( c );
					}
				} else {
					N = concatMap( n, function ( el ) {
						return expand( el, false );
					} );
				}

				for ( var j = 0; j < N.length; j++ ) {
					for ( var k = 0; k < post.length; k++ ) {
						var expansion = pre + N[ j ] + post[ k ];
						if ( ! isTop || isSequence || expansion ) expansions.push( expansion );
					}
				}

				return expansions;
			}

			/***/
		},

		/***/ 9296: /***/ function ( module ) {
			/* global define */
			( function ( root, factory ) {
				/* istanbul ignore next */
				if ( typeof define === 'function' && define.amd ) {
					define( [], factory );
				} else if ( true ) {
					module.exports = factory();
				} else {
				}
			} )( this, function () {
				var semver = /^v?(?:\d+)(\.(?:[x*]|\d+)(\.(?:[x*]|\d+)(\.(?:[x*]|\d+))?(?:-[\da-z\-]+(?:\.[\da-z\-]+)*)?(?:\+[\da-z\-]+(?:\.[\da-z\-]+)*)?)?)?$/i;

				function indexOrEnd( str, q ) {
					return str.indexOf( q ) === -1 ? str.length : str.indexOf( q );
				}

				function split( v ) {
					var c = v.replace( /^v/, '' ).replace( /\+.*$/, '' );
					var patchIndex = indexOrEnd( c, '-' );
					var arr = c.substring( 0, patchIndex ).split( '.' );
					arr.push( c.substring( patchIndex + 1 ) );
					return arr;
				}

				function tryParse( v ) {
					return isNaN( Number( v ) ) ? v : Number( v );
				}

				function validate( version ) {
					if ( typeof version !== 'string' ) {
						throw new TypeError( 'Invalid argument expected string' );
					}
					if ( ! semver.test( version ) ) {
						throw new Error( "Invalid argument not valid semver ('" + version + "' received)" );
					}
				}

				function compareVersions( v1, v2 ) {
					[ v1, v2 ].forEach( validate );

					var s1 = split( v1 );
					var s2 = split( v2 );

					for ( var i = 0; i < Math.max( s1.length - 1, s2.length - 1 ); i++ ) {
						var n1 = parseInt( s1[ i ] || 0, 10 );
						var n2 = parseInt( s2[ i ] || 0, 10 );

						if ( n1 > n2 ) return 1;
						if ( n2 > n1 ) return -1;
					}

					var sp1 = s1[ s1.length - 1 ];
					var sp2 = s2[ s2.length - 1 ];

					if ( sp1 && sp2 ) {
						var p1 = sp1.split( '.' ).map( tryParse );
						var p2 = sp2.split( '.' ).map( tryParse );

						for ( i = 0; i < Math.max( p1.length, p2.length ); i++ ) {
							if (
								p1[ i ] === undefined ||
								( typeof p2[ i ] === 'string' && typeof p1[ i ] === 'number' )
							)
								return -1;
							if (
								p2[ i ] === undefined ||
								( typeof p1[ i ] === 'string' && typeof p2[ i ] === 'number' )
							)
								return 1;

							if ( p1[ i ] > p2[ i ] ) return 1;
							if ( p2[ i ] > p1[ i ] ) return -1;
						}
					} else if ( sp1 || sp2 ) {
						return sp1 ? -1 : 1;
					}

					return 0;
				}

				var allowedOperators = [ '>', '>=', '=', '<', '<=' ];

				var operatorResMap = {
					'>': [ 1 ],
					'>=': [ 0, 1 ],
					'=': [ 0 ],
					'<=': [ -1, 0 ],
					'<': [ -1 ],
				};

				function validateOperator( op ) {
					if ( typeof op !== 'string' ) {
						throw new TypeError( 'Invalid operator type, expected string but got ' + typeof op );
					}
					if ( allowedOperators.indexOf( op ) === -1 ) {
						throw new TypeError(
							'Invalid operator, expected one of ' + allowedOperators.join( '|' )
						);
					}
				}

				compareVersions.validate = function ( version ) {
					return typeof version === 'string' && semver.test( version );
				};

				compareVersions.compare = function ( v1, v2, operator ) {
					// Validate operator
					validateOperator( operator );

					// since result of compareVersions can only be -1 or 0 or 1
					// a simple map can be used to replace switch
					var res = compareVersions( v1, v2 );
					return operatorResMap[ operator ].indexOf( res ) > -1;
				};

				return compareVersions;
			} );

			/***/
		},

		/***/ 6891: /***/ module => {
			module.exports = function ( xs, fn ) {
				var res = [];
				for ( var i = 0; i < xs.length; i++ ) {
					var x = fn( xs[ i ], i );
					if ( isArray( x ) ) res.push.apply( res, x );
					else res.push( x );
				}
				return res;
			};

			var isArray =
				Array.isArray ||
				function ( xs ) {
					return Object.prototype.toString.call( xs ) === '[object Array]';
				};

			/***/
		},

		/***/ 8932: /***/ ( __unused_webpack_module, exports ) => {
			'use strict';

			Object.defineProperty( exports, '__esModule', { value: true } );

			class Deprecation extends Error {
				constructor( message ) {
					super( message ); // Maintains proper stack trace (only available on V8)

					/* istanbul ignore next */

					if ( Error.captureStackTrace ) {
						Error.captureStackTrace( this, this.constructor );
					}

					this.name = 'Deprecation';
				}
			}

			exports.Deprecation = Deprecation;

			/***/
		},

		/***/ 6863: /***/ ( module, __unused_webpack_exports, __nccwpck_require__ ) => {
			module.exports = realpath;
			realpath.realpath = realpath;
			realpath.sync = realpathSync;
			realpath.realpathSync = realpathSync;
			realpath.monkeypatch = monkeypatch;
			realpath.unmonkeypatch = unmonkeypatch;

			var fs = __nccwpck_require__( 5747 );
			var origRealpath = fs.realpath;
			var origRealpathSync = fs.realpathSync;

			var version = process.version;
			var ok = /^v[0-5]\./.test( version );
			var old = __nccwpck_require__( 1734 );

			function newError( er ) {
				return (
					er &&
					er.syscall === 'realpath' &&
					( er.code === 'ELOOP' || er.code === 'ENOMEM' || er.code === 'ENAMETOOLONG' )
				);
			}

			function realpath( p, cache, cb ) {
				if ( ok ) {
					return origRealpath( p, cache, cb );
				}

				if ( typeof cache === 'function' ) {
					cb = cache;
					cache = null;
				}
				origRealpath( p, cache, function ( er, result ) {
					if ( newError( er ) ) {
						old.realpath( p, cache, cb );
					} else {
						cb( er, result );
					}
				} );
			}

			function realpathSync( p, cache ) {
				if ( ok ) {
					return origRealpathSync( p, cache );
				}

				try {
					return origRealpathSync( p, cache );
				} catch ( er ) {
					if ( newError( er ) ) {
						return old.realpathSync( p, cache );
					} else {
						throw er;
					}
				}
			}

			function monkeypatch() {
				fs.realpath = realpath;
				fs.realpathSync = realpathSync;
			}

			function unmonkeypatch() {
				fs.realpath = origRealpath;
				fs.realpathSync = origRealpathSync;
			}

			/***/
		},

		/***/ 1734: /***/ ( __unused_webpack_module, exports, __nccwpck_require__ ) => {
			// Copyright Joyent, Inc. and other Node contributors.
			//
			// Permission is hereby granted, free of charge, to any person obtaining a
			// copy of this software and associated documentation files (the
			// "Software"), to deal in the Software without restriction, including
			// without limitation the rights to use, copy, modify, merge, publish,
			// distribute, sublicense, and/or sell copies of the Software, and to permit
			// persons to whom the Software is furnished to do so, subject to the
			// following conditions:
			//
			// The above copyright notice and this permission notice shall be included
			// in all copies or substantial portions of the Software.
			//
			// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
			// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
			// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
			// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
			// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
			// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
			// USE OR OTHER DEALINGS IN THE SOFTWARE.

			var pathModule = __nccwpck_require__( 5622 );
			var isWindows = process.platform === 'win32';
			var fs = __nccwpck_require__( 5747 );

			// JavaScript implementation of realpath, ported from node pre-v6

			var DEBUG = process.env.NODE_DEBUG && /fs/.test( process.env.NODE_DEBUG );

			function rethrow() {
				// Only enable in debug mode. A backtrace uses ~1000 bytes of heap space and
				// is fairly slow to generate.
				var callback;
				if ( DEBUG ) {
					var backtrace = new Error();
					callback = debugCallback;
				} else callback = missingCallback;

				return callback;

				function debugCallback( err ) {
					if ( err ) {
						backtrace.message = err.message;
						err = backtrace;
						missingCallback( err );
					}
				}

				function missingCallback( err ) {
					if ( err ) {
						if ( process.throwDeprecation ) throw err;
						// Forgot a callback but don't know where? Use NODE_DEBUG=fs
						else if ( ! process.noDeprecation ) {
							var msg = 'fs: missing callback ' + ( err.stack || err.message );
							if ( process.traceDeprecation ) console.trace( msg );
							else console.error( msg );
						}
					}
				}
			}

			function maybeCallback( cb ) {
				return typeof cb === 'function' ? cb : rethrow();
			}

			var normalize = pathModule.normalize;

			// Regexp that finds the next partion of a (partial) path
			// result is [base_with_slash, base], e.g. ['somedir/', 'somedir']
			if ( isWindows ) {
				var nextPartRe = /(.*?)(?:[\/\\]+|$)/g;
			} else {
				var nextPartRe = /(.*?)(?:[\/]+|$)/g;
			}

			// Regex to find the device root, including trailing slash. E.g. 'c:\\'.
			if ( isWindows ) {
				var splitRootRe = /^(?:[a-zA-Z]:|[\\\/]{2}[^\\\/]+[\\\/][^\\\/]+)?[\\\/]*/;
			} else {
				var splitRootRe = /^[\/]*/;
			}

			exports.realpathSync = function realpathSync( p, cache ) {
				// make p is absolute
				p = pathModule.resolve( p );

				if ( cache && Object.prototype.hasOwnProperty.call( cache, p ) ) {
					return cache[ p ];
				}

				var original = p,
					seenLinks = {},
					knownHard = {};

				// current character position in p
				var pos;
				// the partial path so far, including a trailing slash if any
				var current;
				// the partial path without a trailing slash (except when pointing at a root)
				var base;
				// the partial path scanned in the previous round, with slash
				var previous;

				start();

				function start() {
					// Skip over roots
					var m = splitRootRe.exec( p );
					pos = m[ 0 ].length;
					current = m[ 0 ];
					base = m[ 0 ];
					previous = '';

					// On windows, check that the root exists. On unix there is no need.
					if ( isWindows && ! knownHard[ base ] ) {
						fs.lstatSync( base );
						knownHard[ base ] = true;
					}
				}

				// walk down the path, swapping out linked pathparts for their real
				// values
				// NB: p.length changes.
				while ( pos < p.length ) {
					// find the next part
					nextPartRe.lastIndex = pos;
					var result = nextPartRe.exec( p );
					previous = current;
					current += result[ 0 ];
					base = previous + result[ 1 ];
					pos = nextPartRe.lastIndex;

					// continue if not a symlink
					if ( knownHard[ base ] || ( cache && cache[ base ] === base ) ) {
						continue;
					}

					var resolvedLink;
					if ( cache && Object.prototype.hasOwnProperty.call( cache, base ) ) {
						// some known symbolic link.  no need to stat again.
						resolvedLink = cache[ base ];
					} else {
						var stat = fs.lstatSync( base );
						if ( ! stat.isSymbolicLink() ) {
							knownHard[ base ] = true;
							if ( cache ) cache[ base ] = base;
							continue;
						}

						// read the link if it wasn't read before
						// dev/ino always return 0 on windows, so skip the check.
						var linkTarget = null;
						if ( ! isWindows ) {
							var id = stat.dev.toString( 32 ) + ':' + stat.ino.toString( 32 );
							if ( seenLinks.hasOwnProperty( id ) ) {
								linkTarget = seenLinks[ id ];
							}
						}
						if ( linkTarget === null ) {
							fs.statSync( base );
							linkTarget = fs.readlinkSync( base );
						}
						resolvedLink = pathModule.resolve( previous, linkTarget );
						// track this, if given a cache.
						if ( cache ) cache[ base ] = resolvedLink;
						if ( ! isWindows ) seenLinks[ id ] = linkTarget;
					}

					// resolve the link, then start over
					p = pathModule.resolve( resolvedLink, p.slice( pos ) );
					start();
				}

				if ( cache ) cache[ original ] = p;

				return p;
			};

			exports.realpath = function realpath( p, cache, cb ) {
				if ( typeof cb !== 'function' ) {
					cb = maybeCallback( cache );
					cache = null;
				}

				// make p is absolute
				p = pathModule.resolve( p );

				if ( cache && Object.prototype.hasOwnProperty.call( cache, p ) ) {
					return process.nextTick( cb.bind( null, null, cache[ p ] ) );
				}

				var original = p,
					seenLinks = {},
					knownHard = {};

				// current character position in p
				var pos;
				// the partial path so far, including a trailing slash if any
				var current;
				// the partial path without a trailing slash (except when pointing at a root)
				var base;
				// the partial path scanned in the previous round, with slash
				var previous;

				start();

				function start() {
					// Skip over roots
					var m = splitRootRe.exec( p );
					pos = m[ 0 ].length;
					current = m[ 0 ];
					base = m[ 0 ];
					previous = '';

					// On windows, check that the root exists. On unix there is no need.
					if ( isWindows && ! knownHard[ base ] ) {
						fs.lstat( base, function ( err ) {
							if ( err ) return cb( err );
							knownHard[ base ] = true;
							LOOP();
						} );
					} else {
						process.nextTick( LOOP );
					}
				}

				// walk down the path, swapping out linked pathparts for their real
				// values
				function LOOP() {
					// stop if scanned past end of path
					if ( pos >= p.length ) {
						if ( cache ) cache[ original ] = p;
						return cb( null, p );
					}

					// find the next part
					nextPartRe.lastIndex = pos;
					var result = nextPartRe.exec( p );
					previous = current;
					current += result[ 0 ];
					base = previous + result[ 1 ];
					pos = nextPartRe.lastIndex;

					// continue if not a symlink
					if ( knownHard[ base ] || ( cache && cache[ base ] === base ) ) {
						return process.nextTick( LOOP );
					}

					if ( cache && Object.prototype.hasOwnProperty.call( cache, base ) ) {
						// known symbolic link.  no need to stat again.
						return gotResolvedLink( cache[ base ] );
					}

					return fs.lstat( base, gotStat );
				}

				function gotStat( err, stat ) {
					if ( err ) return cb( err );

					// if not a symlink, skip to the next path part
					if ( ! stat.isSymbolicLink() ) {
						knownHard[ base ] = true;
						if ( cache ) cache[ base ] = base;
						return process.nextTick( LOOP );
					}

					// stat & read the link if not read before
					// call gotTarget as soon as the link target is known
					// dev/ino always return 0 on windows, so skip the check.
					if ( ! isWindows ) {
						var id = stat.dev.toString( 32 ) + ':' + stat.ino.toString( 32 );
						if ( seenLinks.hasOwnProperty( id ) ) {
							return gotTarget( null, seenLinks[ id ], base );
						}
					}
					fs.stat( base, function ( err ) {
						if ( err ) return cb( err );

						fs.readlink( base, function ( err, target ) {
							if ( ! isWindows ) seenLinks[ id ] = target;
							gotTarget( err, target );
						} );
					} );
				}

				function gotTarget( err, target, base ) {
					if ( err ) return cb( err );

					var resolvedLink = pathModule.resolve( previous, target );
					if ( cache ) cache[ base ] = resolvedLink;
					gotResolvedLink( resolvedLink );
				}

				function gotResolvedLink( resolvedLink ) {
					// resolve the link, then start over
					p = pathModule.resolve( resolvedLink, p.slice( pos ) );
					start();
				}
			};

			/***/
		},

		/***/ 7625: /***/ ( __unused_webpack_module, exports, __nccwpck_require__ ) => {
			exports.alphasort = alphasort;
			exports.alphasorti = alphasorti;
			exports.setopts = setopts;
			exports.ownProp = ownProp;
			exports.makeAbs = makeAbs;
			exports.finish = finish;
			exports.mark = mark;
			exports.isIgnored = isIgnored;
			exports.childrenIgnored = childrenIgnored;

			function ownProp( obj, field ) {
				return Object.prototype.hasOwnProperty.call( obj, field );
			}

			var path = __nccwpck_require__( 5622 );
			var minimatch = __nccwpck_require__( 3973 );
			var isAbsolute = __nccwpck_require__( 8714 );
			var Minimatch = minimatch.Minimatch;

			function alphasorti( a, b ) {
				return a.toLowerCase().localeCompare( b.toLowerCase() );
			}

			function alphasort( a, b ) {
				return a.localeCompare( b );
			}

			function setupIgnores( self, options ) {
				self.ignore = options.ignore || [];

				if ( ! Array.isArray( self.ignore ) ) self.ignore = [ self.ignore ];

				if ( self.ignore.length ) {
					self.ignore = self.ignore.map( ignoreMap );
				}
			}

			// ignore patterns are always in dot:true mode.
			function ignoreMap( pattern ) {
				var gmatcher = null;
				if ( pattern.slice( -3 ) === '/**' ) {
					var gpattern = pattern.replace( /(\/\*\*)+$/, '' );
					gmatcher = new Minimatch( gpattern, { dot: true } );
				}

				return {
					matcher: new Minimatch( pattern, { dot: true } ),
					gmatcher: gmatcher,
				};
			}

			function setopts( self, pattern, options ) {
				if ( ! options ) options = {};

				// base-matching: just use globstar for that.
				if ( options.matchBase && -1 === pattern.indexOf( '/' ) ) {
					if ( options.noglobstar ) {
						throw new Error( 'base matching requires globstar' );
					}
					pattern = '**/' + pattern;
				}

				self.silent = !! options.silent;
				self.pattern = pattern;
				self.strict = options.strict !== false;
				self.realpath = !! options.realpath;
				self.realpathCache = options.realpathCache || Object.create( null );
				self.follow = !! options.follow;
				self.dot = !! options.dot;
				self.mark = !! options.mark;
				self.nodir = !! options.nodir;
				if ( self.nodir ) self.mark = true;
				self.sync = !! options.sync;
				self.nounique = !! options.nounique;
				self.nonull = !! options.nonull;
				self.nosort = !! options.nosort;
				self.nocase = !! options.nocase;
				self.stat = !! options.stat;
				self.noprocess = !! options.noprocess;
				self.absolute = !! options.absolute;

				self.maxLength = options.maxLength || Infinity;
				self.cache = options.cache || Object.create( null );
				self.statCache = options.statCache || Object.create( null );
				self.symlinks = options.symlinks || Object.create( null );

				setupIgnores( self, options );

				self.changedCwd = false;
				var cwd = process.cwd();
				if ( ! ownProp( options, 'cwd' ) ) self.cwd = cwd;
				else {
					self.cwd = path.resolve( options.cwd );
					self.changedCwd = self.cwd !== cwd;
				}

				self.root = options.root || path.resolve( self.cwd, '/' );
				self.root = path.resolve( self.root );
				if ( process.platform === 'win32' ) self.root = self.root.replace( /\\/g, '/' );

				// TODO: is an absolute `cwd` supposed to be resolved against `root`?
				// e.g. { cwd: '/test', root: __dirname } === path.join(__dirname, '/test')
				self.cwdAbs = isAbsolute( self.cwd ) ? self.cwd : makeAbs( self, self.cwd );
				if ( process.platform === 'win32' ) self.cwdAbs = self.cwdAbs.replace( /\\/g, '/' );
				self.nomount = !! options.nomount;

				// disable comments and negation in Minimatch.
				// Note that they are not supported in Glob itself anyway.
				options.nonegate = true;
				options.nocomment = true;

				self.minimatch = new Minimatch( pattern, options );
				self.options = self.minimatch.options;
			}

			function finish( self ) {
				var nou = self.nounique;
				var all = nou ? [] : Object.create( null );

				for ( var i = 0, l = self.matches.length; i < l; i++ ) {
					var matches = self.matches[ i ];
					if ( ! matches || Object.keys( matches ).length === 0 ) {
						if ( self.nonull ) {
							// do like the shell, and spit out the literal glob
							var literal = self.minimatch.globSet[ i ];
							if ( nou ) all.push( literal );
							else all[ literal ] = true;
						}
					} else {
						// had matches
						var m = Object.keys( matches );
						if ( nou ) all.push.apply( all, m );
						else
							m.forEach( function ( m ) {
								all[ m ] = true;
							} );
					}
				}

				if ( ! nou ) all = Object.keys( all );

				if ( ! self.nosort ) all = all.sort( self.nocase ? alphasorti : alphasort );

				// at *some* point we statted all of these
				if ( self.mark ) {
					for ( var i = 0; i < all.length; i++ ) {
						all[ i ] = self._mark( all[ i ] );
					}
					if ( self.nodir ) {
						all = all.filter( function ( e ) {
							var notDir = ! /\/$/.test( e );
							var c = self.cache[ e ] || self.cache[ makeAbs( self, e ) ];
							if ( notDir && c ) notDir = c !== 'DIR' && ! Array.isArray( c );
							return notDir;
						} );
					}
				}

				if ( self.ignore.length )
					all = all.filter( function ( m ) {
						return ! isIgnored( self, m );
					} );

				self.found = all;
			}

			function mark( self, p ) {
				var abs = makeAbs( self, p );
				var c = self.cache[ abs ];
				var m = p;
				if ( c ) {
					var isDir = c === 'DIR' || Array.isArray( c );
					var slash = p.slice( -1 ) === '/';

					if ( isDir && ! slash ) m += '/';
					else if ( ! isDir && slash ) m = m.slice( 0, -1 );

					if ( m !== p ) {
						var mabs = makeAbs( self, m );
						self.statCache[ mabs ] = self.statCache[ abs ];
						self.cache[ mabs ] = self.cache[ abs ];
					}
				}

				return m;
			}

			// lotta situps...
			function makeAbs( self, f ) {
				var abs = f;
				if ( f.charAt( 0 ) === '/' ) {
					abs = path.join( self.root, f );
				} else if ( isAbsolute( f ) || f === '' ) {
					abs = f;
				} else if ( self.changedCwd ) {
					abs = path.resolve( self.cwd, f );
				} else {
					abs = path.resolve( f );
				}

				if ( process.platform === 'win32' ) abs = abs.replace( /\\/g, '/' );

				return abs;
			}

			// Return true, if pattern ends with globstar '**', for the accompanying parent directory.
			// Ex:- If node_modules/** is the pattern, add 'node_modules' to ignore list along with it's contents
			function isIgnored( self, path ) {
				if ( ! self.ignore.length ) return false;

				return self.ignore.some( function ( item ) {
					return item.matcher.match( path ) || !! ( item.gmatcher && item.gmatcher.match( path ) );
				} );
			}

			function childrenIgnored( self, path ) {
				if ( ! self.ignore.length ) return false;

				return self.ignore.some( function ( item ) {
					return !! ( item.gmatcher && item.gmatcher.match( path ) );
				} );
			}

			/***/
		},

		/***/ 1957: /***/ ( module, __unused_webpack_exports, __nccwpck_require__ ) => {
			// Approach:
			//
			// 1. Get the minimatch set
			// 2. For each pattern in the set, PROCESS(pattern, false)
			// 3. Store matches per-set, then uniq them
			//
			// PROCESS(pattern, inGlobStar)
			// Get the first [n] items from pattern that are all strings
			// Join these together.  This is PREFIX.
			//   If there is no more remaining, then stat(PREFIX) and
			//   add to matches if it succeeds.  END.
			//
			// If inGlobStar and PREFIX is symlink and points to dir
			//   set ENTRIES = []
			// else readdir(PREFIX) as ENTRIES
			//   If fail, END
			//
			// with ENTRIES
			//   If pattern[n] is GLOBSTAR
			//     // handle the case where the globstar match is empty
			//     // by pruning it out, and testing the resulting pattern
			//     PROCESS(pattern[0..n] + pattern[n+1 .. $], false)
			//     // handle other cases.
			//     for ENTRY in ENTRIES (not dotfiles)
			//       // attach globstar + tail onto the entry
			//       // Mark that this entry is a globstar match
			//       PROCESS(pattern[0..n] + ENTRY + pattern[n .. $], true)
			//
			//   else // not globstar
			//     for ENTRY in ENTRIES (not dotfiles, unless pattern[n] is dot)
			//       Test ENTRY against pattern[n]
			//       If fails, continue
			//       If passes, PROCESS(pattern[0..n] + item + pattern[n+1 .. $])
			//
			// Caveat:
			//   Cache all stats and readdirs results to minimize syscall.  Since all
			//   we ever care about is existence and directory-ness, we can just keep
			//   `true` for files, and [children,...] for directories, or `false` for
			//   things that don't exist.

			module.exports = glob;

			var fs = __nccwpck_require__( 5747 );
			var rp = __nccwpck_require__( 6863 );
			var minimatch = __nccwpck_require__( 3973 );
			var Minimatch = minimatch.Minimatch;
			var inherits = __nccwpck_require__( 4124 );
			var EE = __nccwpck_require__( 8614 ).EventEmitter;
			var path = __nccwpck_require__( 5622 );
			var assert = __nccwpck_require__( 2357 );
			var isAbsolute = __nccwpck_require__( 8714 );
			var globSync = __nccwpck_require__( 9010 );
			var common = __nccwpck_require__( 7625 );
			var alphasort = common.alphasort;
			var alphasorti = common.alphasorti;
			var setopts = common.setopts;
			var ownProp = common.ownProp;
			var inflight = __nccwpck_require__( 2492 );
			var util = __nccwpck_require__( 1669 );
			var childrenIgnored = common.childrenIgnored;
			var isIgnored = common.isIgnored;

			var once = __nccwpck_require__( 1223 );

			function glob( pattern, options, cb ) {
				if ( typeof options === 'function' ) ( cb = options ), ( options = {} );
				if ( ! options ) options = {};

				if ( options.sync ) {
					if ( cb ) throw new TypeError( 'callback provided to sync glob' );
					return globSync( pattern, options );
				}

				return new Glob( pattern, options, cb );
			}

			glob.sync = globSync;
			var GlobSync = ( glob.GlobSync = globSync.GlobSync );

			// old api surface
			glob.glob = glob;

			function extend( origin, add ) {
				if ( add === null || typeof add !== 'object' ) {
					return origin;
				}

				var keys = Object.keys( add );
				var i = keys.length;
				while ( i-- ) {
					origin[ keys[ i ] ] = add[ keys[ i ] ];
				}
				return origin;
			}

			glob.hasMagic = function ( pattern, options_ ) {
				var options = extend( {}, options_ );
				options.noprocess = true;

				var g = new Glob( pattern, options );
				var set = g.minimatch.set;

				if ( ! pattern ) return false;

				if ( set.length > 1 ) return true;

				for ( var j = 0; j < set[ 0 ].length; j++ ) {
					if ( typeof set[ 0 ][ j ] !== 'string' ) return true;
				}

				return false;
			};

			glob.Glob = Glob;
			inherits( Glob, EE );
			function Glob( pattern, options, cb ) {
				if ( typeof options === 'function' ) {
					cb = options;
					options = null;
				}

				if ( options && options.sync ) {
					if ( cb ) throw new TypeError( 'callback provided to sync glob' );
					return new GlobSync( pattern, options );
				}

				if ( ! ( this instanceof Glob ) ) return new Glob( pattern, options, cb );

				setopts( this, pattern, options );
				this._didRealPath = false;

				// process each pattern in the minimatch set
				var n = this.minimatch.set.length;

				// The matches are stored as {<filename>: true,...} so that
				// duplicates are automagically pruned.
				// Later, we do an Object.keys() on these.
				// Keep them as a list so we can fill in when nonull is set.
				this.matches = new Array( n );

				if ( typeof cb === 'function' ) {
					cb = once( cb );
					this.on( 'error', cb );
					this.on( 'end', function ( matches ) {
						cb( null, matches );
					} );
				}

				var self = this;
				this._processing = 0;

				this._emitQueue = [];
				this._processQueue = [];
				this.paused = false;

				if ( this.noprocess ) return this;

				if ( n === 0 ) return done();

				var sync = true;
				for ( var i = 0; i < n; i++ ) {
					this._process( this.minimatch.set[ i ], i, false, done );
				}
				sync = false;

				function done() {
					--self._processing;
					if ( self._processing <= 0 ) {
						if ( sync ) {
							process.nextTick( function () {
								self._finish();
							} );
						} else {
							self._finish();
						}
					}
				}
			}

			Glob.prototype._finish = function () {
				assert( this instanceof Glob );
				if ( this.aborted ) return;

				if ( this.realpath && ! this._didRealpath ) return this._realpath();

				common.finish( this );
				this.emit( 'end', this.found );
			};

			Glob.prototype._realpath = function () {
				if ( this._didRealpath ) return;

				this._didRealpath = true;

				var n = this.matches.length;
				if ( n === 0 ) return this._finish();

				var self = this;
				for ( var i = 0; i < this.matches.length; i++ ) this._realpathSet( i, next );

				function next() {
					if ( --n === 0 ) self._finish();
				}
			};

			Glob.prototype._realpathSet = function ( index, cb ) {
				var matchset = this.matches[ index ];
				if ( ! matchset ) return cb();

				var found = Object.keys( matchset );
				var self = this;
				var n = found.length;

				if ( n === 0 ) return cb();

				var set = ( this.matches[ index ] = Object.create( null ) );
				found.forEach( function ( p, i ) {
					// If there's a problem with the stat, then it means that
					// one or more of the links in the realpath couldn't be
					// resolved.  just return the abs value in that case.
					p = self._makeAbs( p );
					rp.realpath( p, self.realpathCache, function ( er, real ) {
						if ( ! er ) set[ real ] = true;
						else if ( er.syscall === 'stat' ) set[ p ] = true;
						else self.emit( 'error', er ); // srsly wtf right here

						if ( --n === 0 ) {
							self.matches[ index ] = set;
							cb();
						}
					} );
				} );
			};

			Glob.prototype._mark = function ( p ) {
				return common.mark( this, p );
			};

			Glob.prototype._makeAbs = function ( f ) {
				return common.makeAbs( this, f );
			};

			Glob.prototype.abort = function () {
				this.aborted = true;
				this.emit( 'abort' );
			};

			Glob.prototype.pause = function () {
				if ( ! this.paused ) {
					this.paused = true;
					this.emit( 'pause' );
				}
			};

			Glob.prototype.resume = function () {
				if ( this.paused ) {
					this.emit( 'resume' );
					this.paused = false;
					if ( this._emitQueue.length ) {
						var eq = this._emitQueue.slice( 0 );
						this._emitQueue.length = 0;
						for ( var i = 0; i < eq.length; i++ ) {
							var e = eq[ i ];
							this._emitMatch( e[ 0 ], e[ 1 ] );
						}
					}
					if ( this._processQueue.length ) {
						var pq = this._processQueue.slice( 0 );
						this._processQueue.length = 0;
						for ( var i = 0; i < pq.length; i++ ) {
							var p = pq[ i ];
							this._processing--;
							this._process( p[ 0 ], p[ 1 ], p[ 2 ], p[ 3 ] );
						}
					}
				}
			};

			Glob.prototype._process = function ( pattern, index, inGlobStar, cb ) {
				assert( this instanceof Glob );
				assert( typeof cb === 'function' );

				if ( this.aborted ) return;

				this._processing++;
				if ( this.paused ) {
					this._processQueue.push( [ pattern, index, inGlobStar, cb ] );
					return;
				}

				//console.error('PROCESS %d', this._processing, pattern)

				// Get the first [n] parts of pattern that are all strings.
				var n = 0;
				while ( typeof pattern[ n ] === 'string' ) {
					n++;
				}
				// now n is the index of the first one that is *not* a string.

				// see if there's anything else
				var prefix;
				switch ( n ) {
					// if not, then this is rather simple
					case pattern.length:
						this._processSimple( pattern.join( '/' ), index, cb );
						return;

					case 0:
						// pattern *starts* with some non-trivial item.
						// going to readdir(cwd), but not include the prefix in matches.
						prefix = null;
						break;

					default:
						// pattern has some string bits in the front.
						// whatever it starts with, whether that's 'absolute' like /foo/bar,
						// or 'relative' like '../baz'
						prefix = pattern.slice( 0, n ).join( '/' );
						break;
				}

				var remain = pattern.slice( n );

				// get the list of entries.
				var read;
				if ( prefix === null ) read = '.';
				else if ( isAbsolute( prefix ) || isAbsolute( pattern.join( '/' ) ) ) {
					if ( ! prefix || ! isAbsolute( prefix ) ) prefix = '/' + prefix;
					read = prefix;
				} else read = prefix;

				var abs = this._makeAbs( read );

				//if ignored, skip _processing
				if ( childrenIgnored( this, read ) ) return cb();

				var isGlobStar = remain[ 0 ] === minimatch.GLOBSTAR;
				if ( isGlobStar ) this._processGlobStar( prefix, read, abs, remain, index, inGlobStar, cb );
				else this._processReaddir( prefix, read, abs, remain, index, inGlobStar, cb );
			};

			Glob.prototype._processReaddir = function (
				prefix,
				read,
				abs,
				remain,
				index,
				inGlobStar,
				cb
			) {
				var self = this;
				this._readdir( abs, inGlobStar, function ( er, entries ) {
					return self._processReaddir2( prefix, read, abs, remain, index, inGlobStar, entries, cb );
				} );
			};

			Glob.prototype._processReaddir2 = function (
				prefix,
				read,
				abs,
				remain,
				index,
				inGlobStar,
				entries,
				cb
			) {
				// if the abs isn't a dir, then nothing can match!
				if ( ! entries ) return cb();

				// It will only match dot entries if it starts with a dot, or if
				// dot is set.  Stuff like @(.foo|.bar) isn't allowed.
				var pn = remain[ 0 ];
				var negate = !! this.minimatch.negate;
				var rawGlob = pn._glob;
				var dotOk = this.dot || rawGlob.charAt( 0 ) === '.';

				var matchedEntries = [];
				for ( var i = 0; i < entries.length; i++ ) {
					var e = entries[ i ];
					if ( e.charAt( 0 ) !== '.' || dotOk ) {
						var m;
						if ( negate && ! prefix ) {
							m = ! e.match( pn );
						} else {
							m = e.match( pn );
						}
						if ( m ) matchedEntries.push( e );
					}
				}

				//console.error('prd2', prefix, entries, remain[0]._glob, matchedEntries)

				var len = matchedEntries.length;
				// If there are no matched entries, then nothing matches.
				if ( len === 0 ) return cb();

				// if this is the last remaining pattern bit, then no need for
				// an additional stat *unless* the user has specified mark or
				// stat explicitly.  We know they exist, since readdir returned
				// them.

				if ( remain.length === 1 && ! this.mark && ! this.stat ) {
					if ( ! this.matches[ index ] ) this.matches[ index ] = Object.create( null );

					for ( var i = 0; i < len; i++ ) {
						var e = matchedEntries[ i ];
						if ( prefix ) {
							if ( prefix !== '/' ) e = prefix + '/' + e;
							else e = prefix + e;
						}

						if ( e.charAt( 0 ) === '/' && ! this.nomount ) {
							e = path.join( this.root, e );
						}
						this._emitMatch( index, e );
					}
					// This was the last one, and no stats were needed
					return cb();
				}

				// now test all matched entries as stand-ins for that part
				// of the pattern.
				remain.shift();
				for ( var i = 0; i < len; i++ ) {
					var e = matchedEntries[ i ];
					var newPattern;
					if ( prefix ) {
						if ( prefix !== '/' ) e = prefix + '/' + e;
						else e = prefix + e;
					}
					this._process( [ e ].concat( remain ), index, inGlobStar, cb );
				}
				cb();
			};

			Glob.prototype._emitMatch = function ( index, e ) {
				if ( this.aborted ) return;

				if ( isIgnored( this, e ) ) return;

				if ( this.paused ) {
					this._emitQueue.push( [ index, e ] );
					return;
				}

				var abs = isAbsolute( e ) ? e : this._makeAbs( e );

				if ( this.mark ) e = this._mark( e );

				if ( this.absolute ) e = abs;

				if ( this.matches[ index ][ e ] ) return;

				if ( this.nodir ) {
					var c = this.cache[ abs ];
					if ( c === 'DIR' || Array.isArray( c ) ) return;
				}

				this.matches[ index ][ e ] = true;

				var st = this.statCache[ abs ];
				if ( st ) this.emit( 'stat', e, st );

				this.emit( 'match', e );
			};

			Glob.prototype._readdirInGlobStar = function ( abs, cb ) {
				if ( this.aborted ) return;

				// follow all symlinked directories forever
				// just proceed as if this is a non-globstar situation
				if ( this.follow ) return this._readdir( abs, false, cb );

				var lstatkey = 'lstat\0' + abs;
				var self = this;
				var lstatcb = inflight( lstatkey, lstatcb_ );

				if ( lstatcb ) fs.lstat( abs, lstatcb );

				function lstatcb_( er, lstat ) {
					if ( er && er.code === 'ENOENT' ) return cb();

					var isSym = lstat && lstat.isSymbolicLink();
					self.symlinks[ abs ] = isSym;

					// If it's not a symlink or a dir, then it's definitely a regular file.
					// don't bother doing a readdir in that case.
					if ( ! isSym && lstat && ! lstat.isDirectory() ) {
						self.cache[ abs ] = 'FILE';
						cb();
					} else self._readdir( abs, false, cb );
				}
			};

			Glob.prototype._readdir = function ( abs, inGlobStar, cb ) {
				if ( this.aborted ) return;

				cb = inflight( 'readdir\0' + abs + '\0' + inGlobStar, cb );
				if ( ! cb ) return;

				//console.error('RD %j %j', +inGlobStar, abs)
				if ( inGlobStar && ! ownProp( this.symlinks, abs ) )
					return this._readdirInGlobStar( abs, cb );

				if ( ownProp( this.cache, abs ) ) {
					var c = this.cache[ abs ];
					if ( ! c || c === 'FILE' ) return cb();

					if ( Array.isArray( c ) ) return cb( null, c );
				}

				var self = this;
				fs.readdir( abs, readdirCb( this, abs, cb ) );
			};

			function readdirCb( self, abs, cb ) {
				return function ( er, entries ) {
					if ( er ) self._readdirError( abs, er, cb );
					else self._readdirEntries( abs, entries, cb );
				};
			}

			Glob.prototype._readdirEntries = function ( abs, entries, cb ) {
				if ( this.aborted ) return;

				// if we haven't asked to stat everything, then just
				// assume that everything in there exists, so we can avoid
				// having to stat it a second time.
				if ( ! this.mark && ! this.stat ) {
					for ( var i = 0; i < entries.length; i++ ) {
						var e = entries[ i ];
						if ( abs === '/' ) e = abs + e;
						else e = abs + '/' + e;
						this.cache[ e ] = true;
					}
				}

				this.cache[ abs ] = entries;
				return cb( null, entries );
			};

			Glob.prototype._readdirError = function ( f, er, cb ) {
				if ( this.aborted ) return;

				// handle errors, and cache the information
				switch ( er.code ) {
					case 'ENOTSUP': // https://github.com/isaacs/node-glob/issues/205
					case 'ENOTDIR': // totally normal. means it *does* exist.
						var abs = this._makeAbs( f );
						this.cache[ abs ] = 'FILE';
						if ( abs === this.cwdAbs ) {
							var error = new Error( er.code + ' invalid cwd ' + this.cwd );
							error.path = this.cwd;
							error.code = er.code;
							this.emit( 'error', error );
							this.abort();
						}
						break;

					case 'ENOENT': // not terribly unusual
					case 'ELOOP':
					case 'ENAMETOOLONG':
					case 'UNKNOWN':
						this.cache[ this._makeAbs( f ) ] = false;
						break;

					default:
						// some unusual error.  Treat as failure.
						this.cache[ this._makeAbs( f ) ] = false;
						if ( this.strict ) {
							this.emit( 'error', er );
							// If the error is handled, then we abort
							// if not, we threw out of here
							this.abort();
						}
						if ( ! this.silent ) console.error( 'glob error', er );
						break;
				}

				return cb();
			};

			Glob.prototype._processGlobStar = function (
				prefix,
				read,
				abs,
				remain,
				index,
				inGlobStar,
				cb
			) {
				var self = this;
				this._readdir( abs, inGlobStar, function ( er, entries ) {
					self._processGlobStar2( prefix, read, abs, remain, index, inGlobStar, entries, cb );
				} );
			};

			Glob.prototype._processGlobStar2 = function (
				prefix,
				read,
				abs,
				remain,
				index,
				inGlobStar,
				entries,
				cb
			) {
				//console.error('pgs2', prefix, remain[0], entries)

				// no entries means not a dir, so it can never have matches
				// foo.txt/** doesn't match foo.txt
				if ( ! entries ) return cb();

				// test without the globstar, and with every child both below
				// and replacing the globstar.
				var remainWithoutGlobStar = remain.slice( 1 );
				var gspref = prefix ? [ prefix ] : [];
				var noGlobStar = gspref.concat( remainWithoutGlobStar );

				// the noGlobStar pattern exits the inGlobStar state
				this._process( noGlobStar, index, false, cb );

				var isSym = this.symlinks[ abs ];
				var len = entries.length;

				// If it's a symlink, and we're in a globstar, then stop
				if ( isSym && inGlobStar ) return cb();

				for ( var i = 0; i < len; i++ ) {
					var e = entries[ i ];
					if ( e.charAt( 0 ) === '.' && ! this.dot ) continue;

					// these two cases enter the inGlobStar state
					var instead = gspref.concat( entries[ i ], remainWithoutGlobStar );
					this._process( instead, index, true, cb );

					var below = gspref.concat( entries[ i ], remain );
					this._process( below, index, true, cb );
				}

				cb();
			};

			Glob.prototype._processSimple = function ( prefix, index, cb ) {
				// XXX review this.  Shouldn't it be doing the mounting etc
				// before doing stat?  kinda weird?
				var self = this;
				this._stat( prefix, function ( er, exists ) {
					self._processSimple2( prefix, index, er, exists, cb );
				} );
			};
			Glob.prototype._processSimple2 = function ( prefix, index, er, exists, cb ) {
				//console.error('ps2', prefix, exists)

				if ( ! this.matches[ index ] ) this.matches[ index ] = Object.create( null );

				// If it doesn't exist, then just mark the lack of results
				if ( ! exists ) return cb();

				if ( prefix && isAbsolute( prefix ) && ! this.nomount ) {
					var trail = /[\/\\]$/.test( prefix );
					if ( prefix.charAt( 0 ) === '/' ) {
						prefix = path.join( this.root, prefix );
					} else {
						prefix = path.resolve( this.root, prefix );
						if ( trail ) prefix += '/';
					}
				}

				if ( process.platform === 'win32' ) prefix = prefix.replace( /\\/g, '/' );

				// Mark this as a match
				this._emitMatch( index, prefix );
				cb();
			};

			// Returns either 'DIR', 'FILE', or false
			Glob.prototype._stat = function ( f, cb ) {
				var abs = this._makeAbs( f );
				var needDir = f.slice( -1 ) === '/';

				if ( f.length > this.maxLength ) return cb();

				if ( ! this.stat && ownProp( this.cache, abs ) ) {
					var c = this.cache[ abs ];

					if ( Array.isArray( c ) ) c = 'DIR';

					// It exists, but maybe not how we need it
					if ( ! needDir || c === 'DIR' ) return cb( null, c );

					if ( needDir && c === 'FILE' ) return cb();

					// otherwise we have to stat, because maybe c=true
					// if we know it exists, but not what it is.
				}

				var exists;
				var stat = this.statCache[ abs ];
				if ( stat !== undefined ) {
					if ( stat === false ) return cb( null, stat );
					else {
						var type = stat.isDirectory() ? 'DIR' : 'FILE';
						if ( needDir && type === 'FILE' ) return cb();
						else return cb( null, type, stat );
					}
				}

				var self = this;
				var statcb = inflight( 'stat\0' + abs, lstatcb_ );
				if ( statcb ) fs.lstat( abs, statcb );

				function lstatcb_( er, lstat ) {
					if ( lstat && lstat.isSymbolicLink() ) {
						// If it's a symlink, then treat it as the target, unless
						// the target does not exist, then treat it as a file.
						return fs.stat( abs, function ( er, stat ) {
							if ( er ) self._stat2( f, abs, null, lstat, cb );
							else self._stat2( f, abs, er, stat, cb );
						} );
					} else {
						self._stat2( f, abs, er, lstat, cb );
					}
				}
			};

			Glob.prototype._stat2 = function ( f, abs, er, stat, cb ) {
				if ( er && ( er.code === 'ENOENT' || er.code === 'ENOTDIR' ) ) {
					this.statCache[ abs ] = false;
					return cb();
				}

				var needDir = f.slice( -1 ) === '/';
				this.statCache[ abs ] = stat;

				if ( abs.slice( -1 ) === '/' && stat && ! stat.isDirectory() )
					return cb( null, false, stat );

				var c = true;
				if ( stat ) c = stat.isDirectory() ? 'DIR' : 'FILE';
				this.cache[ abs ] = this.cache[ abs ] || c;

				if ( needDir && c === 'FILE' ) return cb();

				return cb( null, c, stat );
			};

			/***/
		},

		/***/ 9010: /***/ ( module, __unused_webpack_exports, __nccwpck_require__ ) => {
			module.exports = globSync;
			globSync.GlobSync = GlobSync;

			var fs = __nccwpck_require__( 5747 );
			var rp = __nccwpck_require__( 6863 );
			var minimatch = __nccwpck_require__( 3973 );
			var Minimatch = minimatch.Minimatch;
			var Glob = __nccwpck_require__( 1957 ).Glob;
			var util = __nccwpck_require__( 1669 );
			var path = __nccwpck_require__( 5622 );
			var assert = __nccwpck_require__( 2357 );
			var isAbsolute = __nccwpck_require__( 8714 );
			var common = __nccwpck_require__( 7625 );
			var alphasort = common.alphasort;
			var alphasorti = common.alphasorti;
			var setopts = common.setopts;
			var ownProp = common.ownProp;
			var childrenIgnored = common.childrenIgnored;
			var isIgnored = common.isIgnored;

			function globSync( pattern, options ) {
				if ( typeof options === 'function' || arguments.length === 3 )
					throw new TypeError(
						'callback provided to sync glob\n' +
							'See: https://github.com/isaacs/node-glob/issues/167'
					);

				return new GlobSync( pattern, options ).found;
			}

			function GlobSync( pattern, options ) {
				if ( ! pattern ) throw new Error( 'must provide pattern' );

				if ( typeof options === 'function' || arguments.length === 3 )
					throw new TypeError(
						'callback provided to sync glob\n' +
							'See: https://github.com/isaacs/node-glob/issues/167'
					);

				if ( ! ( this instanceof GlobSync ) ) return new GlobSync( pattern, options );

				setopts( this, pattern, options );

				if ( this.noprocess ) return this;

				var n = this.minimatch.set.length;
				this.matches = new Array( n );
				for ( var i = 0; i < n; i++ ) {
					this._process( this.minimatch.set[ i ], i, false );
				}
				this._finish();
			}

			GlobSync.prototype._finish = function () {
				assert( this instanceof GlobSync );
				if ( this.realpath ) {
					var self = this;
					this.matches.forEach( function ( matchset, index ) {
						var set = ( self.matches[ index ] = Object.create( null ) );
						for ( var p in matchset ) {
							try {
								p = self._makeAbs( p );
								var real = rp.realpathSync( p, self.realpathCache );
								set[ real ] = true;
							} catch ( er ) {
								if ( er.syscall === 'stat' ) set[ self._makeAbs( p ) ] = true;
								else throw er;
							}
						}
					} );
				}
				common.finish( this );
			};

			GlobSync.prototype._process = function ( pattern, index, inGlobStar ) {
				assert( this instanceof GlobSync );

				// Get the first [n] parts of pattern that are all strings.
				var n = 0;
				while ( typeof pattern[ n ] === 'string' ) {
					n++;
				}
				// now n is the index of the first one that is *not* a string.

				// See if there's anything else
				var prefix;
				switch ( n ) {
					// if not, then this is rather simple
					case pattern.length:
						this._processSimple( pattern.join( '/' ), index );
						return;

					case 0:
						// pattern *starts* with some non-trivial item.
						// going to readdir(cwd), but not include the prefix in matches.
						prefix = null;
						break;

					default:
						// pattern has some string bits in the front.
						// whatever it starts with, whether that's 'absolute' like /foo/bar,
						// or 'relative' like '../baz'
						prefix = pattern.slice( 0, n ).join( '/' );
						break;
				}

				var remain = pattern.slice( n );

				// get the list of entries.
				var read;
				if ( prefix === null ) read = '.';
				else if ( isAbsolute( prefix ) || isAbsolute( pattern.join( '/' ) ) ) {
					if ( ! prefix || ! isAbsolute( prefix ) ) prefix = '/' + prefix;
					read = prefix;
				} else read = prefix;

				var abs = this._makeAbs( read );

				//if ignored, skip processing
				if ( childrenIgnored( this, read ) ) return;

				var isGlobStar = remain[ 0 ] === minimatch.GLOBSTAR;
				if ( isGlobStar ) this._processGlobStar( prefix, read, abs, remain, index, inGlobStar );
				else this._processReaddir( prefix, read, abs, remain, index, inGlobStar );
			};

			GlobSync.prototype._processReaddir = function (
				prefix,
				read,
				abs,
				remain,
				index,
				inGlobStar
			) {
				var entries = this._readdir( abs, inGlobStar );

				// if the abs isn't a dir, then nothing can match!
				if ( ! entries ) return;

				// It will only match dot entries if it starts with a dot, or if
				// dot is set.  Stuff like @(.foo|.bar) isn't allowed.
				var pn = remain[ 0 ];
				var negate = !! this.minimatch.negate;
				var rawGlob = pn._glob;
				var dotOk = this.dot || rawGlob.charAt( 0 ) === '.';

				var matchedEntries = [];
				for ( var i = 0; i < entries.length; i++ ) {
					var e = entries[ i ];
					if ( e.charAt( 0 ) !== '.' || dotOk ) {
						var m;
						if ( negate && ! prefix ) {
							m = ! e.match( pn );
						} else {
							m = e.match( pn );
						}
						if ( m ) matchedEntries.push( e );
					}
				}

				var len = matchedEntries.length;
				// If there are no matched entries, then nothing matches.
				if ( len === 0 ) return;

				// if this is the last remaining pattern bit, then no need for
				// an additional stat *unless* the user has specified mark or
				// stat explicitly.  We know they exist, since readdir returned
				// them.

				if ( remain.length === 1 && ! this.mark && ! this.stat ) {
					if ( ! this.matches[ index ] ) this.matches[ index ] = Object.create( null );

					for ( var i = 0; i < len; i++ ) {
						var e = matchedEntries[ i ];
						if ( prefix ) {
							if ( prefix.slice( -1 ) !== '/' ) e = prefix + '/' + e;
							else e = prefix + e;
						}

						if ( e.charAt( 0 ) === '/' && ! this.nomount ) {
							e = path.join( this.root, e );
						}
						this._emitMatch( index, e );
					}
					// This was the last one, and no stats were needed
					return;
				}

				// now test all matched entries as stand-ins for that part
				// of the pattern.
				remain.shift();
				for ( var i = 0; i < len; i++ ) {
					var e = matchedEntries[ i ];
					var newPattern;
					if ( prefix ) newPattern = [ prefix, e ];
					else newPattern = [ e ];
					this._process( newPattern.concat( remain ), index, inGlobStar );
				}
			};

			GlobSync.prototype._emitMatch = function ( index, e ) {
				if ( isIgnored( this, e ) ) return;

				var abs = this._makeAbs( e );

				if ( this.mark ) e = this._mark( e );

				if ( this.absolute ) {
					e = abs;
				}

				if ( this.matches[ index ][ e ] ) return;

				if ( this.nodir ) {
					var c = this.cache[ abs ];
					if ( c === 'DIR' || Array.isArray( c ) ) return;
				}

				this.matches[ index ][ e ] = true;

				if ( this.stat ) this._stat( e );
			};

			GlobSync.prototype._readdirInGlobStar = function ( abs ) {
				// follow all symlinked directories forever
				// just proceed as if this is a non-globstar situation
				if ( this.follow ) return this._readdir( abs, false );

				var entries;
				var lstat;
				var stat;
				try {
					lstat = fs.lstatSync( abs );
				} catch ( er ) {
					if ( er.code === 'ENOENT' ) {
						// lstat failed, doesn't exist
						return null;
					}
				}

				var isSym = lstat && lstat.isSymbolicLink();
				this.symlinks[ abs ] = isSym;

				// If it's not a symlink or a dir, then it's definitely a regular file.
				// don't bother doing a readdir in that case.
				if ( ! isSym && lstat && ! lstat.isDirectory() ) this.cache[ abs ] = 'FILE';
				else entries = this._readdir( abs, false );

				return entries;
			};

			GlobSync.prototype._readdir = function ( abs, inGlobStar ) {
				var entries;

				if ( inGlobStar && ! ownProp( this.symlinks, abs ) ) return this._readdirInGlobStar( abs );

				if ( ownProp( this.cache, abs ) ) {
					var c = this.cache[ abs ];
					if ( ! c || c === 'FILE' ) return null;

					if ( Array.isArray( c ) ) return c;
				}

				try {
					return this._readdirEntries( abs, fs.readdirSync( abs ) );
				} catch ( er ) {
					this._readdirError( abs, er );
					return null;
				}
			};

			GlobSync.prototype._readdirEntries = function ( abs, entries ) {
				// if we haven't asked to stat everything, then just
				// assume that everything in there exists, so we can avoid
				// having to stat it a second time.
				if ( ! this.mark && ! this.stat ) {
					for ( var i = 0; i < entries.length; i++ ) {
						var e = entries[ i ];
						if ( abs === '/' ) e = abs + e;
						else e = abs + '/' + e;
						this.cache[ e ] = true;
					}
				}

				this.cache[ abs ] = entries;

				// mark and cache dir-ness
				return entries;
			};

			GlobSync.prototype._readdirError = function ( f, er ) {
				// handle errors, and cache the information
				switch ( er.code ) {
					case 'ENOTSUP': // https://github.com/isaacs/node-glob/issues/205
					case 'ENOTDIR': // totally normal. means it *does* exist.
						var abs = this._makeAbs( f );
						this.cache[ abs ] = 'FILE';
						if ( abs === this.cwdAbs ) {
							var error = new Error( er.code + ' invalid cwd ' + this.cwd );
							error.path = this.cwd;
							error.code = er.code;
							throw error;
						}
						break;

					case 'ENOENT': // not terribly unusual
					case 'ELOOP':
					case 'ENAMETOOLONG':
					case 'UNKNOWN':
						this.cache[ this._makeAbs( f ) ] = false;
						break;

					default:
						// some unusual error.  Treat as failure.
						this.cache[ this._makeAbs( f ) ] = false;
						if ( this.strict ) throw er;
						if ( ! this.silent ) console.error( 'glob error', er );
						break;
				}
			};

			GlobSync.prototype._processGlobStar = function (
				prefix,
				read,
				abs,
				remain,
				index,
				inGlobStar
			) {
				var entries = this._readdir( abs, inGlobStar );

				// no entries means not a dir, so it can never have matches
				// foo.txt/** doesn't match foo.txt
				if ( ! entries ) return;

				// test without the globstar, and with every child both below
				// and replacing the globstar.
				var remainWithoutGlobStar = remain.slice( 1 );
				var gspref = prefix ? [ prefix ] : [];
				var noGlobStar = gspref.concat( remainWithoutGlobStar );

				// the noGlobStar pattern exits the inGlobStar state
				this._process( noGlobStar, index, false );

				var len = entries.length;
				var isSym = this.symlinks[ abs ];

				// If it's a symlink, and we're in a globstar, then stop
				if ( isSym && inGlobStar ) return;

				for ( var i = 0; i < len; i++ ) {
					var e = entries[ i ];
					if ( e.charAt( 0 ) === '.' && ! this.dot ) continue;

					// these two cases enter the inGlobStar state
					var instead = gspref.concat( entries[ i ], remainWithoutGlobStar );
					this._process( instead, index, true );

					var below = gspref.concat( entries[ i ], remain );
					this._process( below, index, true );
				}
			};

			GlobSync.prototype._processSimple = function ( prefix, index ) {
				// XXX review this.  Shouldn't it be doing the mounting etc
				// before doing stat?  kinda weird?
				var exists = this._stat( prefix );

				if ( ! this.matches[ index ] ) this.matches[ index ] = Object.create( null );

				// If it doesn't exist, then just mark the lack of results
				if ( ! exists ) return;

				if ( prefix && isAbsolute( prefix ) && ! this.nomount ) {
					var trail = /[\/\\]$/.test( prefix );
					if ( prefix.charAt( 0 ) === '/' ) {
						prefix = path.join( this.root, prefix );
					} else {
						prefix = path.resolve( this.root, prefix );
						if ( trail ) prefix += '/';
					}
				}

				if ( process.platform === 'win32' ) prefix = prefix.replace( /\\/g, '/' );

				// Mark this as a match
				this._emitMatch( index, prefix );
			};

			// Returns either 'DIR', 'FILE', or false
			GlobSync.prototype._stat = function ( f ) {
				var abs = this._makeAbs( f );
				var needDir = f.slice( -1 ) === '/';

				if ( f.length > this.maxLength ) return false;

				if ( ! this.stat && ownProp( this.cache, abs ) ) {
					var c = this.cache[ abs ];

					if ( Array.isArray( c ) ) c = 'DIR';

					// It exists, but maybe not how we need it
					if ( ! needDir || c === 'DIR' ) return c;

					if ( needDir && c === 'FILE' ) return false;

					// otherwise we have to stat, because maybe c=true
					// if we know it exists, but not what it is.
				}

				var exists;
				var stat = this.statCache[ abs ];
				if ( ! stat ) {
					var lstat;
					try {
						lstat = fs.lstatSync( abs );
					} catch ( er ) {
						if ( er && ( er.code === 'ENOENT' || er.code === 'ENOTDIR' ) ) {
							this.statCache[ abs ] = false;
							return false;
						}
					}

					if ( lstat && lstat.isSymbolicLink() ) {
						try {
							stat = fs.statSync( abs );
						} catch ( er ) {
							stat = lstat;
						}
					} else {
						stat = lstat;
					}
				}

				this.statCache[ abs ] = stat;

				var c = true;
				if ( stat ) c = stat.isDirectory() ? 'DIR' : 'FILE';

				this.cache[ abs ] = this.cache[ abs ] || c;

				if ( needDir && c === 'FILE' ) return false;

				return c;
			};

			GlobSync.prototype._mark = function ( p ) {
				return common.mark( this, p );
			};

			GlobSync.prototype._makeAbs = function ( f ) {
				return common.makeAbs( this, f );
			};

			/***/
		},

		/***/ 2492: /***/ ( module, __unused_webpack_exports, __nccwpck_require__ ) => {
			var wrappy = __nccwpck_require__( 2940 );
			var reqs = Object.create( null );
			var once = __nccwpck_require__( 1223 );

			module.exports = wrappy( inflight );

			function inflight( key, cb ) {
				if ( reqs[ key ] ) {
					reqs[ key ].push( cb );
					return null;
				} else {
					reqs[ key ] = [ cb ];
					return makeres( key );
				}
			}

			function makeres( key ) {
				return once( function RES() {
					var cbs = reqs[ key ];
					var len = cbs.length;
					var args = slice( arguments );

					// XXX It's somewhat ambiguous whether a new callback added in this
					// pass should be queued for later execution if something in the
					// list of callbacks throws, or if it should just be discarded.
					// However, it's such an edge case that it hardly matters, and either
					// choice is likely as surprising as the other.
					// As it happens, we do go ahead and schedule it for later execution.
					try {
						for ( var i = 0; i < len; i++ ) {
							cbs[ i ].apply( null, args );
						}
					} finally {
						if ( cbs.length > len ) {
							// added more in the interim.
							// de-zalgo, just in case, but don't call again.
							cbs.splice( 0, len );
							process.nextTick( function () {
								RES.apply( null, args );
							} );
						} else {
							delete reqs[ key ];
						}
					}
				} );
			}

			function slice( args ) {
				var length = args.length;
				var array = [];

				for ( var i = 0; i < length; i++ ) array[ i ] = args[ i ];
				return array;
			}

			/***/
		},

		/***/ 4124: /***/ ( module, __unused_webpack_exports, __nccwpck_require__ ) => {
			try {
				var util = __nccwpck_require__( 1669 );
				/* istanbul ignore next */
				if ( typeof util.inherits !== 'function' ) throw '';
				module.exports = util.inherits;
			} catch ( e ) {
				/* istanbul ignore next */
				module.exports = __nccwpck_require__( 8544 );
			}

			/***/
		},

		/***/ 8544: /***/ module => {
			if ( typeof Object.create === 'function' ) {
				// implementation from standard node.js 'util' module
				module.exports = function inherits( ctor, superCtor ) {
					if ( superCtor ) {
						ctor.super_ = superCtor;
						ctor.prototype = Object.create( superCtor.prototype, {
							constructor: {
								value: ctor,
								enumerable: false,
								writable: true,
								configurable: true,
							},
						} );
					}
				};
			} else {
				// old school shim for old browsers
				module.exports = function inherits( ctor, superCtor ) {
					if ( superCtor ) {
						ctor.super_ = superCtor;
						var TempCtor = function () {};
						TempCtor.prototype = superCtor.prototype;
						ctor.prototype = new TempCtor();
						ctor.prototype.constructor = ctor;
					}
				};
			}

			/***/
		},

		/***/ 3287: /***/ ( __unused_webpack_module, exports ) => {
			'use strict';

			Object.defineProperty( exports, '__esModule', { value: true } );

			/*!
			 * is-plain-object <https://github.com/jonschlinkert/is-plain-object>
			 *
			 * Copyright (c) 2014-2017, Jon Schlinkert.
			 * Released under the MIT License.
			 */

			function isObject( o ) {
				return Object.prototype.toString.call( o ) === '[object Object]';
			}

			function isPlainObject( o ) {
				var ctor, prot;

				if ( isObject( o ) === false ) return false;

				// If has modified constructor
				ctor = o.constructor;
				if ( ctor === undefined ) return true;

				// If has modified prototype
				prot = ctor.prototype;
				if ( isObject( prot ) === false ) return false;

				// If constructor does not have an Object-specific method
				if ( prot.hasOwnProperty( 'isPrototypeOf' ) === false ) {
					return false;
				}

				// Most likely a plain Object
				return true;
			}

			exports.isPlainObject = isPlainObject;

			/***/
		},

		/***/ 3973: /***/ ( module, __unused_webpack_exports, __nccwpck_require__ ) => {
			module.exports = minimatch;
			minimatch.Minimatch = Minimatch;

			var path = { sep: '/' };
			try {
				path = __nccwpck_require__( 5622 );
			} catch ( er ) {}

			var GLOBSTAR = ( minimatch.GLOBSTAR = Minimatch.GLOBSTAR = {} );
			var expand = __nccwpck_require__( 3717 );

			var plTypes = {
				'!': { open: '(?:(?!(?:', close: '))[^/]*?)' },
				'?': { open: '(?:', close: ')?' },
				'+': { open: '(?:', close: ')+' },
				'*': { open: '(?:', close: ')*' },
				'@': { open: '(?:', close: ')' },
			};

			// any single thing other than /
			// don't need to escape / when using new RegExp()
			var qmark = '[^/]';

			// * => any number of characters
			var star = qmark + '*?';

			// ** when dots are allowed.  Anything goes, except .. and .
			// not (^ or / followed by one or two dots followed by $ or /),
			// followed by anything, any number of times.
			var twoStarDot = '(?:(?!(?:\\/|^)(?:\\.{1,2})($|\\/)).)*?';

			// not a ^ or / followed by a dot,
			// followed by anything, any number of times.
			var twoStarNoDot = '(?:(?!(?:\\/|^)\\.).)*?';

			// characters that need to be escaped in RegExp.
			var reSpecials = charSet( '().*{}+?[]^$\\!' );

			// "abc" -> { a:true, b:true, c:true }
			function charSet( s ) {
				return s.split( '' ).reduce( function ( set, c ) {
					set[ c ] = true;
					return set;
				}, {} );
			}

			// normalizes slashes.
			var slashSplit = /\/+/;

			minimatch.filter = filter;
			function filter( pattern, options ) {
				options = options || {};
				return function ( p, i, list ) {
					return minimatch( p, pattern, options );
				};
			}

			function ext( a, b ) {
				a = a || {};
				b = b || {};
				var t = {};
				Object.keys( b ).forEach( function ( k ) {
					t[ k ] = b[ k ];
				} );
				Object.keys( a ).forEach( function ( k ) {
					t[ k ] = a[ k ];
				} );
				return t;
			}

			minimatch.defaults = function ( def ) {
				if ( ! def || ! Object.keys( def ).length ) return minimatch;

				var orig = minimatch;

				var m = function minimatch( p, pattern, options ) {
					return orig.minimatch( p, pattern, ext( def, options ) );
				};

				m.Minimatch = function Minimatch( pattern, options ) {
					return new orig.Minimatch( pattern, ext( def, options ) );
				};

				return m;
			};

			Minimatch.defaults = function ( def ) {
				if ( ! def || ! Object.keys( def ).length ) return Minimatch;
				return minimatch.defaults( def ).Minimatch;
			};

			function minimatch( p, pattern, options ) {
				if ( typeof pattern !== 'string' ) {
					throw new TypeError( 'glob pattern string required' );
				}

				if ( ! options ) options = {};

				// shortcut: comments match nothing.
				if ( ! options.nocomment && pattern.charAt( 0 ) === '#' ) {
					return false;
				}

				// "" only matches ""
				if ( pattern.trim() === '' ) return p === '';

				return new Minimatch( pattern, options ).match( p );
			}

			function Minimatch( pattern, options ) {
				if ( ! ( this instanceof Minimatch ) ) {
					return new Minimatch( pattern, options );
				}

				if ( typeof pattern !== 'string' ) {
					throw new TypeError( 'glob pattern string required' );
				}

				if ( ! options ) options = {};
				pattern = pattern.trim();

				// windows support: need to use /, not \
				if ( path.sep !== '/' ) {
					pattern = pattern.split( path.sep ).join( '/' );
				}

				this.options = options;
				this.set = [];
				this.pattern = pattern;
				this.regexp = null;
				this.negate = false;
				this.comment = false;
				this.empty = false;

				// make the set of regexps etc.
				this.make();
			}

			Minimatch.prototype.debug = function () {};

			Minimatch.prototype.make = make;
			function make() {
				// don't do it more than once.
				if ( this._made ) return;

				var pattern = this.pattern;
				var options = this.options;

				// empty patterns and comments match nothing.
				if ( ! options.nocomment && pattern.charAt( 0 ) === '#' ) {
					this.comment = true;
					return;
				}
				if ( ! pattern ) {
					this.empty = true;
					return;
				}

				// step 1: figure out negation, etc.
				this.parseNegate();

				// step 2: expand braces
				var set = ( this.globSet = this.braceExpand() );

				if ( options.debug ) this.debug = console.error;

				this.debug( this.pattern, set );

				// step 3: now we have a set, so turn each one into a series of path-portion
				// matching patterns.
				// These will be regexps, except in the case of "**", which is
				// set to the GLOBSTAR object for globstar behavior,
				// and will not contain any / characters
				set = this.globParts = set.map( function ( s ) {
					return s.split( slashSplit );
				} );

				this.debug( this.pattern, set );

				// glob --> regexps
				set = set.map( function ( s, si, set ) {
					return s.map( this.parse, this );
				}, this );

				this.debug( this.pattern, set );

				// filter out everything that didn't compile properly.
				set = set.filter( function ( s ) {
					return s.indexOf( false ) === -1;
				} );

				this.debug( this.pattern, set );

				this.set = set;
			}

			Minimatch.prototype.parseNegate = parseNegate;
			function parseNegate() {
				var pattern = this.pattern;
				var negate = false;
				var options = this.options;
				var negateOffset = 0;

				if ( options.nonegate ) return;

				for ( var i = 0, l = pattern.length; i < l && pattern.charAt( i ) === '!'; i++ ) {
					negate = ! negate;
					negateOffset++;
				}

				if ( negateOffset ) this.pattern = pattern.substr( negateOffset );
				this.negate = negate;
			}

			// Brace expansion:
			// a{b,c}d -> abd acd
			// a{b,}c -> abc ac
			// a{0..3}d -> a0d a1d a2d a3d
			// a{b,c{d,e}f}g -> abg acdfg acefg
			// a{b,c}d{e,f}g -> abdeg acdeg abdeg abdfg
			//
			// Invalid sets are not expanded.
			// a{2..}b -> a{2..}b
			// a{b}c -> a{b}c
			minimatch.braceExpand = function ( pattern, options ) {
				return braceExpand( pattern, options );
			};

			Minimatch.prototype.braceExpand = braceExpand;

			function braceExpand( pattern, options ) {
				if ( ! options ) {
					if ( this instanceof Minimatch ) {
						options = this.options;
					} else {
						options = {};
					}
				}

				pattern = typeof pattern === 'undefined' ? this.pattern : pattern;

				if ( typeof pattern === 'undefined' ) {
					throw new TypeError( 'undefined pattern' );
				}

				if ( options.nobrace || ! pattern.match( /\{.*\}/ ) ) {
					// shortcut. no need to expand.
					return [ pattern ];
				}

				return expand( pattern );
			}

			// parse a component of the expanded set.
			// At this point, no pattern may contain "/" in it
			// so we're going to return a 2d array, where each entry is the full
			// pattern, split on '/', and then turned into a regular expression.
			// A regexp is made at the end which joins each array with an
			// escaped /, and another full one which joins each regexp with |.
			//
			// Following the lead of Bash 4.1, note that "**" only has special meaning
			// when it is the *only* thing in a path portion.  Otherwise, any series
			// of * is equivalent to a single *.  Globstar behavior is enabled by
			// default, and can be disabled by setting options.noglobstar.
			Minimatch.prototype.parse = parse;
			var SUBPARSE = {};
			function parse( pattern, isSub ) {
				if ( pattern.length > 1024 * 64 ) {
					throw new TypeError( 'pattern is too long' );
				}

				var options = this.options;

				// shortcuts
				if ( ! options.noglobstar && pattern === '**' ) return GLOBSTAR;
				if ( pattern === '' ) return '';

				var re = '';
				var hasMagic = !! options.nocase;
				var escaping = false;
				// ? => one single character
				var patternListStack = [];
				var negativeLists = [];
				var stateChar;
				var inClass = false;
				var reClassStart = -1;
				var classStart = -1;
				// . and .. never match anything that doesn't start with .,
				// even when options.dot is set.
				var patternStart =
					pattern.charAt( 0 ) === '.'
						? '' // anything
						: // not (start or / followed by . or .. followed by / or end)
						options.dot
						? '(?!(?:^|\\/)\\.{1,2}(?:$|\\/))'
						: '(?!\\.)';
				var self = this;

				function clearStateChar() {
					if ( stateChar ) {
						// we had some state-tracking character
						// that wasn't consumed by this pass.
						switch ( stateChar ) {
							case '*':
								re += star;
								hasMagic = true;
								break;
							case '?':
								re += qmark;
								hasMagic = true;
								break;
							default:
								re += '\\' + stateChar;
								break;
						}
						self.debug( 'clearStateChar %j %j', stateChar, re );
						stateChar = false;
					}
				}

				for ( var i = 0, len = pattern.length, c; i < len && ( c = pattern.charAt( i ) ); i++ ) {
					this.debug( '%s\t%s %s %j', pattern, i, re, c );

					// skip over any that are escaped.
					if ( escaping && reSpecials[ c ] ) {
						re += '\\' + c;
						escaping = false;
						continue;
					}

					switch ( c ) {
						case '/':
							// completely not allowed, even escaped.
							// Should already be path-split by now.
							return false;

						case '\\':
							clearStateChar();
							escaping = true;
							continue;

						// the various stateChar values
						// for the "extglob" stuff.
						case '?':
						case '*':
						case '+':
						case '@':
						case '!':
							this.debug( '%s\t%s %s %j <-- stateChar', pattern, i, re, c );

							// all of those are literals inside a class, except that
							// the glob [!a] means [^a] in regexp
							if ( inClass ) {
								this.debug( '  in class' );
								if ( c === '!' && i === classStart + 1 ) c = '^';
								re += c;
								continue;
							}

							// if we already have a stateChar, then it means
							// that there was something like ** or +? in there.
							// Handle the stateChar, then proceed with this one.
							self.debug( 'call clearStateChar %j', stateChar );
							clearStateChar();
							stateChar = c;
							// if extglob is disabled, then +(asdf|foo) isn't a thing.
							// just clear the statechar *now*, rather than even diving into
							// the patternList stuff.
							if ( options.noext ) clearStateChar();
							continue;

						case '(':
							if ( inClass ) {
								re += '(';
								continue;
							}

							if ( ! stateChar ) {
								re += '\\(';
								continue;
							}

							patternListStack.push( {
								type: stateChar,
								start: i - 1,
								reStart: re.length,
								open: plTypes[ stateChar ].open,
								close: plTypes[ stateChar ].close,
							} );
							// negation is (?:(?!js)[^/]*)
							re += stateChar === '!' ? '(?:(?!(?:' : '(?:';
							this.debug( 'plType %j %j', stateChar, re );
							stateChar = false;
							continue;

						case ')':
							if ( inClass || ! patternListStack.length ) {
								re += '\\)';
								continue;
							}

							clearStateChar();
							hasMagic = true;
							var pl = patternListStack.pop();
							// negation is (?:(?!js)[^/]*)
							// The others are (?:<pattern>)<type>
							re += pl.close;
							if ( pl.type === '!' ) {
								negativeLists.push( pl );
							}
							pl.reEnd = re.length;
							continue;

						case '|':
							if ( inClass || ! patternListStack.length || escaping ) {
								re += '\\|';
								escaping = false;
								continue;
							}

							clearStateChar();
							re += '|';
							continue;

						// these are mostly the same in regexp and glob
						case '[':
							// swallow any state-tracking char before the [
							clearStateChar();

							if ( inClass ) {
								re += '\\' + c;
								continue;
							}

							inClass = true;
							classStart = i;
							reClassStart = re.length;
							re += c;
							continue;

						case ']':
							//  a right bracket shall lose its special
							//  meaning and represent itself in
							//  a bracket expression if it occurs
							//  first in the list.  -- POSIX.2 2.8.3.2
							if ( i === classStart + 1 || ! inClass ) {
								re += '\\' + c;
								escaping = false;
								continue;
							}

							// handle the case where we left a class open.
							// "[z-a]" is valid, equivalent to "\[z-a\]"
							if ( inClass ) {
								// split where the last [ was, make sure we don't have
								// an invalid re. if so, re-walk the contents of the
								// would-be class to re-translate any characters that
								// were passed through as-is
								// TODO: It would probably be faster to determine this
								// without a try/catch and a new RegExp, but it's tricky
								// to do safely.  For now, this is safe and works.
								var cs = pattern.substring( classStart + 1, i );
								try {
									RegExp( '[' + cs + ']' );
								} catch ( er ) {
									// not a valid class!
									var sp = this.parse( cs, SUBPARSE );
									re = re.substr( 0, reClassStart ) + '\\[' + sp[ 0 ] + '\\]';
									hasMagic = hasMagic || sp[ 1 ];
									inClass = false;
									continue;
								}
							}

							// finish up the class.
							hasMagic = true;
							inClass = false;
							re += c;
							continue;

						default:
							// swallow any state char that wasn't consumed
							clearStateChar();

							if ( escaping ) {
								// no need
								escaping = false;
							} else if ( reSpecials[ c ] && ! ( c === '^' && inClass ) ) {
								re += '\\';
							}

							re += c;
					} // switch
				} // for

				// handle the case where we left a class open.
				// "[abc" is valid, equivalent to "\[abc"
				if ( inClass ) {
					// split where the last [ was, and escape it
					// this is a huge pita.  We now have to re-walk
					// the contents of the would-be class to re-translate
					// any characters that were passed through as-is
					cs = pattern.substr( classStart + 1 );
					sp = this.parse( cs, SUBPARSE );
					re = re.substr( 0, reClassStart ) + '\\[' + sp[ 0 ];
					hasMagic = hasMagic || sp[ 1 ];
				}

				// handle the case where we had a +( thing at the *end*
				// of the pattern.
				// each pattern list stack adds 3 chars, and we need to go through
				// and escape any | chars that were passed through as-is for the regexp.
				// Go through and escape them, taking care not to double-escape any
				// | chars that were already escaped.
				for ( pl = patternListStack.pop(); pl; pl = patternListStack.pop() ) {
					var tail = re.slice( pl.reStart + pl.open.length );
					this.debug( 'setting tail', re, pl );
					// maybe some even number of \, then maybe 1 \, followed by a |
					tail = tail.replace( /((?:\\{2}){0,64})(\\?)\|/g, function ( _, $1, $2 ) {
						if ( ! $2 ) {
							// the | isn't already escaped, so escape it.
							$2 = '\\';
						}

						// need to escape all those slashes *again*, without escaping the
						// one that we need for escaping the | character.  As it works out,
						// escaping an even number of slashes can be done by simply repeating
						// it exactly after itself.  That's why this trick works.
						//
						// I am sorry that you have to see this.
						return $1 + $1 + $2 + '|';
					} );

					this.debug( 'tail=%j\n   %s', tail, tail, pl, re );
					var t = pl.type === '*' ? star : pl.type === '?' ? qmark : '\\' + pl.type;

					hasMagic = true;
					re = re.slice( 0, pl.reStart ) + t + '\\(' + tail;
				}

				// handle trailing things that only matter at the very end.
				clearStateChar();
				if ( escaping ) {
					// trailing \\
					re += '\\\\';
				}

				// only need to apply the nodot start if the re starts with
				// something that could conceivably capture a dot
				var addPatternStart = false;
				switch ( re.charAt( 0 ) ) {
					case '.':
					case '[':
					case '(':
						addPatternStart = true;
				}

				// Hack to work around lack of negative lookbehind in JS
				// A pattern like: *.!(x).!(y|z) needs to ensure that a name
				// like 'a.xyz.yz' doesn't match.  So, the first negative
				// lookahead, has to look ALL the way ahead, to the end of
				// the pattern.
				for ( var n = negativeLists.length - 1; n > -1; n-- ) {
					var nl = negativeLists[ n ];

					var nlBefore = re.slice( 0, nl.reStart );
					var nlFirst = re.slice( nl.reStart, nl.reEnd - 8 );
					var nlLast = re.slice( nl.reEnd - 8, nl.reEnd );
					var nlAfter = re.slice( nl.reEnd );

					nlLast += nlAfter;

					// Handle nested stuff like *(*.js|!(*.json)), where open parens
					// mean that we should *not* include the ) in the bit that is considered
					// "after" the negated section.
					var openParensBefore = nlBefore.split( '(' ).length - 1;
					var cleanAfter = nlAfter;
					for ( i = 0; i < openParensBefore; i++ ) {
						cleanAfter = cleanAfter.replace( /\)[+*?]?/, '' );
					}
					nlAfter = cleanAfter;

					var dollar = '';
					if ( nlAfter === '' && isSub !== SUBPARSE ) {
						dollar = '$';
					}
					var newRe = nlBefore + nlFirst + nlAfter + dollar + nlLast;
					re = newRe;
				}

				// if the re is not "" at this point, then we need to make sure
				// it doesn't match against an empty path part.
				// Otherwise a/* will match a/, which it should not.
				if ( re !== '' && hasMagic ) {
					re = '(?=.)' + re;
				}

				if ( addPatternStart ) {
					re = patternStart + re;
				}

				// parsing just a piece of a larger pattern.
				if ( isSub === SUBPARSE ) {
					return [ re, hasMagic ];
				}

				// skip the regexp for non-magical patterns
				// unescape anything in it, though, so that it'll be
				// an exact match against a file etc.
				if ( ! hasMagic ) {
					return globUnescape( pattern );
				}

				var flags = options.nocase ? 'i' : '';
				try {
					var regExp = new RegExp( '^' + re + '$', flags );
				} catch ( er ) {
					// If it was an invalid regular expression, then it can't match
					// anything.  This trick looks for a character after the end of
					// the string, which is of course impossible, except in multi-line
					// mode, but it's not a /m regex.
					return new RegExp( '$.' );
				}

				regExp._glob = pattern;
				regExp._src = re;

				return regExp;
			}

			minimatch.makeRe = function ( pattern, options ) {
				return new Minimatch( pattern, options || {} ).makeRe();
			};

			Minimatch.prototype.makeRe = makeRe;
			function makeRe() {
				if ( this.regexp || this.regexp === false ) return this.regexp;

				// at this point, this.set is a 2d array of partial
				// pattern strings, or "**".
				//
				// It's better to use .match().  This function shouldn't
				// be used, really, but it's pretty convenient sometimes,
				// when you just want to work with a regex.
				var set = this.set;

				if ( ! set.length ) {
					this.regexp = false;
					return this.regexp;
				}
				var options = this.options;

				var twoStar = options.noglobstar ? star : options.dot ? twoStarDot : twoStarNoDot;
				var flags = options.nocase ? 'i' : '';

				var re = set
					.map( function ( pattern ) {
						return pattern
							.map( function ( p ) {
								return p === GLOBSTAR
									? twoStar
									: typeof p === 'string'
									? regExpEscape( p )
									: p._src;
							} )
							.join( '\\/' );
					} )
					.join( '|' );

				// must match entire pattern
				// ending in a * or ** will make it less strict.
				re = '^(?:' + re + ')$';

				// can match anything, as long as it's not this.
				if ( this.negate ) re = '^(?!' + re + ').*$';

				try {
					this.regexp = new RegExp( re, flags );
				} catch ( ex ) {
					this.regexp = false;
				}
				return this.regexp;
			}

			minimatch.match = function ( list, pattern, options ) {
				options = options || {};
				var mm = new Minimatch( pattern, options );
				list = list.filter( function ( f ) {
					return mm.match( f );
				} );
				if ( mm.options.nonull && ! list.length ) {
					list.push( pattern );
				}
				return list;
			};

			Minimatch.prototype.match = match;
			function match( f, partial ) {
				this.debug( 'match', f, this.pattern );
				// short-circuit in the case of busted things.
				// comments, etc.
				if ( this.comment ) return false;
				if ( this.empty ) return f === '';

				if ( f === '/' && partial ) return true;

				var options = this.options;

				// windows: need to use /, not \
				if ( path.sep !== '/' ) {
					f = f.split( path.sep ).join( '/' );
				}

				// treat the test path as a set of pathparts.
				f = f.split( slashSplit );
				this.debug( this.pattern, 'split', f );

				// just ONE of the pattern sets in this.set needs to match
				// in order for it to be valid.  If negating, then just one
				// match means that we have failed.
				// Either way, return on the first hit.

				var set = this.set;
				this.debug( this.pattern, 'set', set );

				// Find the basename of the path by looking for the last non-empty segment
				var filename;
				var i;
				for ( i = f.length - 1; i >= 0; i-- ) {
					filename = f[ i ];
					if ( filename ) break;
				}

				for ( i = 0; i < set.length; i++ ) {
					var pattern = set[ i ];
					var file = f;
					if ( options.matchBase && pattern.length === 1 ) {
						file = [ filename ];
					}
					var hit = this.matchOne( file, pattern, partial );
					if ( hit ) {
						if ( options.flipNegate ) return true;
						return ! this.negate;
					}
				}

				// didn't get any hits.  this is success if it's a negative
				// pattern, failure otherwise.
				if ( options.flipNegate ) return false;
				return this.negate;
			}

			// set partial to true to test if, for example,
			// "/a/b" matches the start of "/*/b/*/d"
			// Partial means, if you run out of file before you run
			// out of pattern, then that's fine, as long as all
			// the parts match.
			Minimatch.prototype.matchOne = function ( file, pattern, partial ) {
				var options = this.options;

				this.debug( 'matchOne', { this: this, file: file, pattern: pattern } );

				this.debug( 'matchOne', file.length, pattern.length );

				for (
					var fi = 0, pi = 0, fl = file.length, pl = pattern.length;
					fi < fl && pi < pl;
					fi++, pi++
				) {
					this.debug( 'matchOne loop' );
					var p = pattern[ pi ];
					var f = file[ fi ];

					this.debug( pattern, p, f );

					// should be impossible.
					// some invalid regexp stuff in the set.
					if ( p === false ) return false;

					if ( p === GLOBSTAR ) {
						this.debug( 'GLOBSTAR', [ pattern, p, f ] );

						// "**"
						// a/**/b/**/c would match the following:
						// a/b/x/y/z/c
						// a/x/y/z/b/c
						// a/b/x/b/x/c
						// a/b/c
						// To do this, take the rest of the pattern after
						// the **, and see if it would match the file remainder.
						// If so, return success.
						// If not, the ** "swallows" a segment, and try again.
						// This is recursively awful.
						//
						// a/**/b/**/c matching a/b/x/y/z/c
						// - a matches a
						// - doublestar
						//   - matchOne(b/x/y/z/c, b/**/c)
						//     - b matches b
						//     - doublestar
						//       - matchOne(x/y/z/c, c) -> no
						//       - matchOne(y/z/c, c) -> no
						//       - matchOne(z/c, c) -> no
						//       - matchOne(c, c) yes, hit
						var fr = fi;
						var pr = pi + 1;
						if ( pr === pl ) {
							this.debug( '** at the end' );
							// a ** at the end will just swallow the rest.
							// We have found a match.
							// however, it will not swallow /.x, unless
							// options.dot is set.
							// . and .. are *never* matched by **, for explosively
							// exponential reasons.
							for ( ; fi < fl; fi++ ) {
								if (
									file[ fi ] === '.' ||
									file[ fi ] === '..' ||
									( ! options.dot && file[ fi ].charAt( 0 ) === '.' )
								)
									return false;
							}
							return true;
						}

						// ok, let's see if we can swallow whatever we can.
						while ( fr < fl ) {
							var swallowee = file[ fr ];

							this.debug( '\nglobstar while', file, fr, pattern, pr, swallowee );

							// XXX remove this slice.  Just pass the start index.
							if ( this.matchOne( file.slice( fr ), pattern.slice( pr ), partial ) ) {
								this.debug( 'globstar found match!', fr, fl, swallowee );
								// found a match.
								return true;
							} else {
								// can't swallow "." or ".." ever.
								// can only swallow ".foo" when explicitly asked.
								if (
									swallowee === '.' ||
									swallowee === '..' ||
									( ! options.dot && swallowee.charAt( 0 ) === '.' )
								) {
									this.debug( 'dot detected!', file, fr, pattern, pr );
									break;
								}

								// ** swallows a segment, and continue.
								this.debug( 'globstar swallow a segment, and continue' );
								fr++;
							}
						}

						// no match was found.
						// However, in partial mode, we can't say this is necessarily over.
						// If there's more *pattern* left, then
						if ( partial ) {
							// ran out of file
							this.debug( '\n>>> no match, partial?', file, fr, pattern, pr );
							if ( fr === fl ) return true;
						}
						return false;
					}

					// something other than **
					// non-magic patterns just have to match exactly
					// patterns with magic have been turned into regexps.
					var hit;
					if ( typeof p === 'string' ) {
						if ( options.nocase ) {
							hit = f.toLowerCase() === p.toLowerCase();
						} else {
							hit = f === p;
						}
						this.debug( 'string match', p, f, hit );
					} else {
						hit = f.match( p );
						this.debug( 'pattern match', p, f, hit );
					}

					if ( ! hit ) return false;
				}

				// Note: ending in / means that we'll get a final ""
				// at the end of the pattern.  This can only match a
				// corresponding "" at the end of the file.
				// If the file ends in /, then it can only match a
				// a pattern that ends in /, unless the pattern just
				// doesn't have any more for it. But, a/b/ should *not*
				// match "a/b/*", even though "" matches against the
				// [^/]*? pattern, except in partial mode, where it might
				// simply not be reached yet.
				// However, a/b/ should still satisfy a/*

				// now either we fell off the end of the pattern, or we're done.
				if ( fi === fl && pi === pl ) {
					// ran out of pattern and filename at the same time.
					// an exact hit!
					return true;
				} else if ( fi === fl ) {
					// ran out of file, but still had pattern left.
					// this is ok if we're doing the match as part of
					// a glob fs traversal.
					return partial;
				} else if ( pi === pl ) {
					// ran out of pattern, still have file left.
					// this is only acceptable if we're on the very last
					// empty segment of a file with a trailing slash.
					// a/* should match a/b/
					var emptyFileEnd = fi === fl - 1 && file[ fi ] === '';
					return emptyFileEnd;
				}

				// should be unreachable.
				throw new Error( 'wtf?' );
			};

			// replace stuff like \* with *
			function globUnescape( s ) {
				return s.replace( /\\(.)/g, '$1' );
			}

			function regExpEscape( s ) {
				return s.replace( /[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&' );
			}

			/***/
		},

		/***/ 9623: /***/ function ( module, __unused_webpack_exports, __nccwpck_require__ ) {
			/* module decorator */ module = __nccwpck_require__.nmd( module );
			//! moment.js
			//! version : 2.29.1
			//! authors : Tim Wood, Iskren Chernev, Moment.js contributors
			//! license : MIT
			//! momentjs.com

			( function ( global, factory ) {
				true ? ( module.exports = factory() ) : 0;
			} )( this, function () {
				'use strict';

				var hookCallback;

				function hooks() {
					return hookCallback.apply( null, arguments );
				}

				// This is done to register the method called with moment()
				// without creating circular dependencies.
				function setHookCallback( callback ) {
					hookCallback = callback;
				}

				function isArray( input ) {
					return (
						input instanceof Array || Object.prototype.toString.call( input ) === '[object Array]'
					);
				}

				function isObject( input ) {
					// IE8 will treat undefined and null as object if it wasn't for
					// input != null
					return input != null && Object.prototype.toString.call( input ) === '[object Object]';
				}

				function hasOwnProp( a, b ) {
					return Object.prototype.hasOwnProperty.call( a, b );
				}

				function isObjectEmpty( obj ) {
					if ( Object.getOwnPropertyNames ) {
						return Object.getOwnPropertyNames( obj ).length === 0;
					} else {
						var k;
						for ( k in obj ) {
							if ( hasOwnProp( obj, k ) ) {
								return false;
							}
						}
						return true;
					}
				}

				function isUndefined( input ) {
					return input === void 0;
				}

				function isNumber( input ) {
					return (
						typeof input === 'number' ||
						Object.prototype.toString.call( input ) === '[object Number]'
					);
				}

				function isDate( input ) {
					return (
						input instanceof Date || Object.prototype.toString.call( input ) === '[object Date]'
					);
				}

				function map( arr, fn ) {
					var res = [],
						i;
					for ( i = 0; i < arr.length; ++i ) {
						res.push( fn( arr[ i ], i ) );
					}
					return res;
				}

				function extend( a, b ) {
					for ( var i in b ) {
						if ( hasOwnProp( b, i ) ) {
							a[ i ] = b[ i ];
						}
					}

					if ( hasOwnProp( b, 'toString' ) ) {
						a.toString = b.toString;
					}

					if ( hasOwnProp( b, 'valueOf' ) ) {
						a.valueOf = b.valueOf;
					}

					return a;
				}

				function createUTC( input, format, locale, strict ) {
					return createLocalOrUTC( input, format, locale, strict, true ).utc();
				}

				function defaultParsingFlags() {
					// We need to deep clone this object.
					return {
						empty: false,
						unusedTokens: [],
						unusedInput: [],
						overflow: -2,
						charsLeftOver: 0,
						nullInput: false,
						invalidEra: null,
						invalidMonth: null,
						invalidFormat: false,
						userInvalidated: false,
						iso: false,
						parsedDateParts: [],
						era: null,
						meridiem: null,
						rfc2822: false,
						weekdayMismatch: false,
					};
				}

				function getParsingFlags( m ) {
					if ( m._pf == null ) {
						m._pf = defaultParsingFlags();
					}
					return m._pf;
				}

				var some;
				if ( Array.prototype.some ) {
					some = Array.prototype.some;
				} else {
					some = function ( fun ) {
						var t = Object( this ),
							len = t.length >>> 0,
							i;

						for ( i = 0; i < len; i++ ) {
							if ( i in t && fun.call( this, t[ i ], i, t ) ) {
								return true;
							}
						}

						return false;
					};
				}

				function isValid( m ) {
					if ( m._isValid == null ) {
						var flags = getParsingFlags( m ),
							parsedParts = some.call( flags.parsedDateParts, function ( i ) {
								return i != null;
							} ),
							isNowValid =
								! isNaN( m._d.getTime() ) &&
								flags.overflow < 0 &&
								! flags.empty &&
								! flags.invalidEra &&
								! flags.invalidMonth &&
								! flags.invalidWeekday &&
								! flags.weekdayMismatch &&
								! flags.nullInput &&
								! flags.invalidFormat &&
								! flags.userInvalidated &&
								( ! flags.meridiem || ( flags.meridiem && parsedParts ) );

						if ( m._strict ) {
							isNowValid =
								isNowValid &&
								flags.charsLeftOver === 0 &&
								flags.unusedTokens.length === 0 &&
								flags.bigHour === undefined;
						}

						if ( Object.isFrozen == null || ! Object.isFrozen( m ) ) {
							m._isValid = isNowValid;
						} else {
							return isNowValid;
						}
					}
					return m._isValid;
				}

				function createInvalid( flags ) {
					var m = createUTC( NaN );
					if ( flags != null ) {
						extend( getParsingFlags( m ), flags );
					} else {
						getParsingFlags( m ).userInvalidated = true;
					}

					return m;
				}

				// Plugins that add properties should also add the key here (null value),
				// so we can properly clone ourselves.
				var momentProperties = ( hooks.momentProperties = [] ),
					updateInProgress = false;

				function copyConfig( to, from ) {
					var i, prop, val;

					if ( ! isUndefined( from._isAMomentObject ) ) {
						to._isAMomentObject = from._isAMomentObject;
					}
					if ( ! isUndefined( from._i ) ) {
						to._i = from._i;
					}
					if ( ! isUndefined( from._f ) ) {
						to._f = from._f;
					}
					if ( ! isUndefined( from._l ) ) {
						to._l = from._l;
					}
					if ( ! isUndefined( from._strict ) ) {
						to._strict = from._strict;
					}
					if ( ! isUndefined( from._tzm ) ) {
						to._tzm = from._tzm;
					}
					if ( ! isUndefined( from._isUTC ) ) {
						to._isUTC = from._isUTC;
					}
					if ( ! isUndefined( from._offset ) ) {
						to._offset = from._offset;
					}
					if ( ! isUndefined( from._pf ) ) {
						to._pf = getParsingFlags( from );
					}
					if ( ! isUndefined( from._locale ) ) {
						to._locale = from._locale;
					}

					if ( momentProperties.length > 0 ) {
						for ( i = 0; i < momentProperties.length; i++ ) {
							prop = momentProperties[ i ];
							val = from[ prop ];
							if ( ! isUndefined( val ) ) {
								to[ prop ] = val;
							}
						}
					}

					return to;
				}

				// Moment prototype object
				function Moment( config ) {
					copyConfig( this, config );
					this._d = new Date( config._d != null ? config._d.getTime() : NaN );
					if ( ! this.isValid() ) {
						this._d = new Date( NaN );
					}
					// Prevent infinite loop in case updateOffset creates new moment
					// objects.
					if ( updateInProgress === false ) {
						updateInProgress = true;
						hooks.updateOffset( this );
						updateInProgress = false;
					}
				}

				function isMoment( obj ) {
					return obj instanceof Moment || ( obj != null && obj._isAMomentObject != null );
				}

				function warn( msg ) {
					if (
						hooks.suppressDeprecationWarnings === false &&
						typeof console !== 'undefined' &&
						console.warn
					) {
						console.warn( 'Deprecation warning: ' + msg );
					}
				}

				function deprecate( msg, fn ) {
					var firstTime = true;

					return extend( function () {
						if ( hooks.deprecationHandler != null ) {
							hooks.deprecationHandler( null, msg );
						}
						if ( firstTime ) {
							var args = [],
								arg,
								i,
								key;
							for ( i = 0; i < arguments.length; i++ ) {
								arg = '';
								if ( typeof arguments[ i ] === 'object' ) {
									arg += '\n[' + i + '] ';
									for ( key in arguments[ 0 ] ) {
										if ( hasOwnProp( arguments[ 0 ], key ) ) {
											arg += key + ': ' + arguments[ 0 ][ key ] + ', ';
										}
									}
									arg = arg.slice( 0, -2 ); // Remove trailing comma and space
								} else {
									arg = arguments[ i ];
								}
								args.push( arg );
							}
							warn(
								msg +
									'\nArguments: ' +
									Array.prototype.slice.call( args ).join( '' ) +
									'\n' +
									new Error().stack
							);
							firstTime = false;
						}
						return fn.apply( this, arguments );
					}, fn );
				}

				var deprecations = {};

				function deprecateSimple( name, msg ) {
					if ( hooks.deprecationHandler != null ) {
						hooks.deprecationHandler( name, msg );
					}
					if ( ! deprecations[ name ] ) {
						warn( msg );
						deprecations[ name ] = true;
					}
				}

				hooks.suppressDeprecationWarnings = false;
				hooks.deprecationHandler = null;

				function isFunction( input ) {
					return (
						( typeof Function !== 'undefined' && input instanceof Function ) ||
						Object.prototype.toString.call( input ) === '[object Function]'
					);
				}

				function set( config ) {
					var prop, i;
					for ( i in config ) {
						if ( hasOwnProp( config, i ) ) {
							prop = config[ i ];
							if ( isFunction( prop ) ) {
								this[ i ] = prop;
							} else {
								this[ '_' + i ] = prop;
							}
						}
					}
					this._config = config;
					// Lenient ordinal parsing accepts just a number in addition to
					// number + (possibly) stuff coming from _dayOfMonthOrdinalParse.
					// TODO: Remove "ordinalParse" fallback in next major release.
					this._dayOfMonthOrdinalParseLenient = new RegExp(
						( this._dayOfMonthOrdinalParse.source || this._ordinalParse.source ) +
							'|' +
							/\d{1,2}/.source
					);
				}

				function mergeConfigs( parentConfig, childConfig ) {
					var res = extend( {}, parentConfig ),
						prop;
					for ( prop in childConfig ) {
						if ( hasOwnProp( childConfig, prop ) ) {
							if ( isObject( parentConfig[ prop ] ) && isObject( childConfig[ prop ] ) ) {
								res[ prop ] = {};
								extend( res[ prop ], parentConfig[ prop ] );
								extend( res[ prop ], childConfig[ prop ] );
							} else if ( childConfig[ prop ] != null ) {
								res[ prop ] = childConfig[ prop ];
							} else {
								delete res[ prop ];
							}
						}
					}
					for ( prop in parentConfig ) {
						if (
							hasOwnProp( parentConfig, prop ) &&
							! hasOwnProp( childConfig, prop ) &&
							isObject( parentConfig[ prop ] )
						) {
							// make sure changes to properties don't modify parent config
							res[ prop ] = extend( {}, res[ prop ] );
						}
					}
					return res;
				}

				function Locale( config ) {
					if ( config != null ) {
						this.set( config );
					}
				}

				var keys;

				if ( Object.keys ) {
					keys = Object.keys;
				} else {
					keys = function ( obj ) {
						var i,
							res = [];
						for ( i in obj ) {
							if ( hasOwnProp( obj, i ) ) {
								res.push( i );
							}
						}
						return res;
					};
				}

				var defaultCalendar = {
					sameDay: '[Today at] LT',
					nextDay: '[Tomorrow at] LT',
					nextWeek: 'dddd [at] LT',
					lastDay: '[Yesterday at] LT',
					lastWeek: '[Last] dddd [at] LT',
					sameElse: 'L',
				};

				function calendar( key, mom, now ) {
					var output = this._calendar[ key ] || this._calendar[ 'sameElse' ];
					return isFunction( output ) ? output.call( mom, now ) : output;
				}

				function zeroFill( number, targetLength, forceSign ) {
					var absNumber = '' + Math.abs( number ),
						zerosToFill = targetLength - absNumber.length,
						sign = number >= 0;
					return (
						( sign ? ( forceSign ? '+' : '' ) : '-' ) +
						Math.pow( 10, Math.max( 0, zerosToFill ) ).toString().substr( 1 ) +
						absNumber
					);
				}

				var formattingTokens = /(\[[^\[]*\])|(\\)?([Hh]mm(ss)?|Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|Qo?|N{1,5}|YYYYYY|YYYYY|YYYY|YY|y{2,4}|yo?|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|kk?|mm?|ss?|S{1,9}|x|X|zz?|ZZ?|.)/g,
					localFormattingTokens = /(\[[^\[]*\])|(\\)?(LTS|LT|LL?L?L?|l{1,4})/g,
					formatFunctions = {},
					formatTokenFunctions = {};

				// token:    'M'
				// padded:   ['MM', 2]
				// ordinal:  'Mo'
				// callback: function () { this.month() + 1 }
				function addFormatToken( token, padded, ordinal, callback ) {
					var func = callback;
					if ( typeof callback === 'string' ) {
						func = function () {
							return this[ callback ]();
						};
					}
					if ( token ) {
						formatTokenFunctions[ token ] = func;
					}
					if ( padded ) {
						formatTokenFunctions[ padded[ 0 ] ] = function () {
							return zeroFill( func.apply( this, arguments ), padded[ 1 ], padded[ 2 ] );
						};
					}
					if ( ordinal ) {
						formatTokenFunctions[ ordinal ] = function () {
							return this.localeData().ordinal( func.apply( this, arguments ), token );
						};
					}
				}

				function removeFormattingTokens( input ) {
					if ( input.match( /\[[\s\S]/ ) ) {
						return input.replace( /^\[|\]$/g, '' );
					}
					return input.replace( /\\/g, '' );
				}

				function makeFormatFunction( format ) {
					var array = format.match( formattingTokens ),
						i,
						length;

					for ( i = 0, length = array.length; i < length; i++ ) {
						if ( formatTokenFunctions[ array[ i ] ] ) {
							array[ i ] = formatTokenFunctions[ array[ i ] ];
						} else {
							array[ i ] = removeFormattingTokens( array[ i ] );
						}
					}

					return function ( mom ) {
						var output = '',
							i;
						for ( i = 0; i < length; i++ ) {
							output += isFunction( array[ i ] ) ? array[ i ].call( mom, format ) : array[ i ];
						}
						return output;
					};
				}

				// format date using native date object
				function formatMoment( m, format ) {
					if ( ! m.isValid() ) {
						return m.localeData().invalidDate();
					}

					format = expandFormat( format, m.localeData() );
					formatFunctions[ format ] = formatFunctions[ format ] || makeFormatFunction( format );

					return formatFunctions[ format ]( m );
				}

				function expandFormat( format, locale ) {
					var i = 5;

					function replaceLongDateFormatTokens( input ) {
						return locale.longDateFormat( input ) || input;
					}

					localFormattingTokens.lastIndex = 0;
					while ( i >= 0 && localFormattingTokens.test( format ) ) {
						format = format.replace( localFormattingTokens, replaceLongDateFormatTokens );
						localFormattingTokens.lastIndex = 0;
						i -= 1;
					}

					return format;
				}

				var defaultLongDateFormat = {
					LTS: 'h:mm:ss A',
					LT: 'h:mm A',
					L: 'MM/DD/YYYY',
					LL: 'MMMM D, YYYY',
					LLL: 'MMMM D, YYYY h:mm A',
					LLLL: 'dddd, MMMM D, YYYY h:mm A',
				};

				function longDateFormat( key ) {
					var format = this._longDateFormat[ key ],
						formatUpper = this._longDateFormat[ key.toUpperCase() ];

					if ( format || ! formatUpper ) {
						return format;
					}

					this._longDateFormat[ key ] = formatUpper
						.match( formattingTokens )
						.map( function ( tok ) {
							if ( tok === 'MMMM' || tok === 'MM' || tok === 'DD' || tok === 'dddd' ) {
								return tok.slice( 1 );
							}
							return tok;
						} )
						.join( '' );

					return this._longDateFormat[ key ];
				}

				var defaultInvalidDate = 'Invalid date';

				function invalidDate() {
					return this._invalidDate;
				}

				var defaultOrdinal = '%d',
					defaultDayOfMonthOrdinalParse = /\d{1,2}/;

				function ordinal( number ) {
					return this._ordinal.replace( '%d', number );
				}

				var defaultRelativeTime = {
					future: 'in %s',
					past: '%s ago',
					s: 'a few seconds',
					ss: '%d seconds',
					m: 'a minute',
					mm: '%d minutes',
					h: 'an hour',
					hh: '%d hours',
					d: 'a day',
					dd: '%d days',
					w: 'a week',
					ww: '%d weeks',
					M: 'a month',
					MM: '%d months',
					y: 'a year',
					yy: '%d years',
				};

				function relativeTime( number, withoutSuffix, string, isFuture ) {
					var output = this._relativeTime[ string ];
					return isFunction( output )
						? output( number, withoutSuffix, string, isFuture )
						: output.replace( /%d/i, number );
				}

				function pastFuture( diff, output ) {
					var format = this._relativeTime[ diff > 0 ? 'future' : 'past' ];
					return isFunction( format ) ? format( output ) : format.replace( /%s/i, output );
				}

				var aliases = {};

				function addUnitAlias( unit, shorthand ) {
					var lowerCase = unit.toLowerCase();
					aliases[ lowerCase ] = aliases[ lowerCase + 's' ] = aliases[ shorthand ] = unit;
				}

				function normalizeUnits( units ) {
					return typeof units === 'string'
						? aliases[ units ] || aliases[ units.toLowerCase() ]
						: undefined;
				}

				function normalizeObjectUnits( inputObject ) {
					var normalizedInput = {},
						normalizedProp,
						prop;

					for ( prop in inputObject ) {
						if ( hasOwnProp( inputObject, prop ) ) {
							normalizedProp = normalizeUnits( prop );
							if ( normalizedProp ) {
								normalizedInput[ normalizedProp ] = inputObject[ prop ];
							}
						}
					}

					return normalizedInput;
				}

				var priorities = {};

				function addUnitPriority( unit, priority ) {
					priorities[ unit ] = priority;
				}

				function getPrioritizedUnits( unitsObj ) {
					var units = [],
						u;
					for ( u in unitsObj ) {
						if ( hasOwnProp( unitsObj, u ) ) {
							units.push( { unit: u, priority: priorities[ u ] } );
						}
					}
					units.sort( function ( a, b ) {
						return a.priority - b.priority;
					} );
					return units;
				}

				function isLeapYear( year ) {
					return ( year % 4 === 0 && year % 100 !== 0 ) || year % 400 === 0;
				}

				function absFloor( number ) {
					if ( number < 0 ) {
						// -0 -> 0
						return Math.ceil( number ) || 0;
					} else {
						return Math.floor( number );
					}
				}

				function toInt( argumentForCoercion ) {
					var coercedNumber = +argumentForCoercion,
						value = 0;

					if ( coercedNumber !== 0 && isFinite( coercedNumber ) ) {
						value = absFloor( coercedNumber );
					}

					return value;
				}

				function makeGetSet( unit, keepTime ) {
					return function ( value ) {
						if ( value != null ) {
							set$1( this, unit, value );
							hooks.updateOffset( this, keepTime );
							return this;
						} else {
							return get( this, unit );
						}
					};
				}

				function get( mom, unit ) {
					return mom.isValid() ? mom._d[ 'get' + ( mom._isUTC ? 'UTC' : '' ) + unit ]() : NaN;
				}

				function set$1( mom, unit, value ) {
					if ( mom.isValid() && ! isNaN( value ) ) {
						if (
							unit === 'FullYear' &&
							isLeapYear( mom.year() ) &&
							mom.month() === 1 &&
							mom.date() === 29
						) {
							value = toInt( value );
							mom._d[ 'set' + ( mom._isUTC ? 'UTC' : '' ) + unit ](
								value,
								mom.month(),
								daysInMonth( value, mom.month() )
							);
						} else {
							mom._d[ 'set' + ( mom._isUTC ? 'UTC' : '' ) + unit ]( value );
						}
					}
				}

				// MOMENTS

				function stringGet( units ) {
					units = normalizeUnits( units );
					if ( isFunction( this[ units ] ) ) {
						return this[ units ]();
					}
					return this;
				}

				function stringSet( units, value ) {
					if ( typeof units === 'object' ) {
						units = normalizeObjectUnits( units );
						var prioritized = getPrioritizedUnits( units ),
							i;
						for ( i = 0; i < prioritized.length; i++ ) {
							this[ prioritized[ i ].unit ]( units[ prioritized[ i ].unit ] );
						}
					} else {
						units = normalizeUnits( units );
						if ( isFunction( this[ units ] ) ) {
							return this[ units ]( value );
						}
					}
					return this;
				}

				var match1 = /\d/, //       0 - 9
					match2 = /\d\d/, //      00 - 99
					match3 = /\d{3}/, //     000 - 999
					match4 = /\d{4}/, //    0000 - 9999
					match6 = /[+-]?\d{6}/, // -999999 - 999999
					match1to2 = /\d\d?/, //       0 - 99
					match3to4 = /\d\d\d\d?/, //     999 - 9999
					match5to6 = /\d\d\d\d\d\d?/, //   99999 - 999999
					match1to3 = /\d{1,3}/, //       0 - 999
					match1to4 = /\d{1,4}/, //       0 - 9999
					match1to6 = /[+-]?\d{1,6}/, // -999999 - 999999
					matchUnsigned = /\d+/, //       0 - inf
					matchSigned = /[+-]?\d+/, //    -inf - inf
					matchOffset = /Z|[+-]\d\d:?\d\d/gi, // +00:00 -00:00 +0000 -0000 or Z
					matchShortOffset = /Z|[+-]\d\d(?::?\d\d)?/gi, // +00 -00 +00:00 -00:00 +0000 -0000 or Z
					matchTimestamp = /[+-]?\d+(\.\d{1,3})?/, // 123456789 123456789.123
					// any word (or two) characters or numbers including two/three word month in arabic.
					// includes scottish gaelic two word and hyphenated months
					matchWord = /[0-9]{0,256}['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFF07\uFF10-\uFFEF]{1,256}|[\u0600-\u06FF\/]{1,256}(\s*?[\u0600-\u06FF]{1,256}){1,2}/i,
					regexes;

				regexes = {};

				function addRegexToken( token, regex, strictRegex ) {
					regexes[ token ] = isFunction( regex )
						? regex
						: function ( isStrict, localeData ) {
								return isStrict && strictRegex ? strictRegex : regex;
						  };
				}

				function getParseRegexForToken( token, config ) {
					if ( ! hasOwnProp( regexes, token ) ) {
						return new RegExp( unescapeFormat( token ) );
					}

					return regexes[ token ]( config._strict, config._locale );
				}

				// Code from http://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript
				function unescapeFormat( s ) {
					return regexEscape(
						s
							.replace( '\\', '' )
							.replace( /\\(\[)|\\(\])|\[([^\]\[]*)\]|\\(.)/g, function (
								matched,
								p1,
								p2,
								p3,
								p4
							) {
								return p1 || p2 || p3 || p4;
							} )
					);
				}

				function regexEscape( s ) {
					return s.replace( /[-\/\\^$*+?.()|[\]{}]/g, '\\$&' );
				}

				var tokens = {};

				function addParseToken( token, callback ) {
					var i,
						func = callback;
					if ( typeof token === 'string' ) {
						token = [ token ];
					}
					if ( isNumber( callback ) ) {
						func = function ( input, array ) {
							array[ callback ] = toInt( input );
						};
					}
					for ( i = 0; i < token.length; i++ ) {
						tokens[ token[ i ] ] = func;
					}
				}

				function addWeekParseToken( token, callback ) {
					addParseToken( token, function ( input, array, config, token ) {
						config._w = config._w || {};
						callback( input, config._w, config, token );
					} );
				}

				function addTimeToArrayFromToken( token, input, config ) {
					if ( input != null && hasOwnProp( tokens, token ) ) {
						tokens[ token ]( input, config._a, config, token );
					}
				}

				var YEAR = 0,
					MONTH = 1,
					DATE = 2,
					HOUR = 3,
					MINUTE = 4,
					SECOND = 5,
					MILLISECOND = 6,
					WEEK = 7,
					WEEKDAY = 8;

				function mod( n, x ) {
					return ( ( n % x ) + x ) % x;
				}

				var indexOf;

				if ( Array.prototype.indexOf ) {
					indexOf = Array.prototype.indexOf;
				} else {
					indexOf = function ( o ) {
						// I know
						var i;
						for ( i = 0; i < this.length; ++i ) {
							if ( this[ i ] === o ) {
								return i;
							}
						}
						return -1;
					};
				}

				function daysInMonth( year, month ) {
					if ( isNaN( year ) || isNaN( month ) ) {
						return NaN;
					}
					var modMonth = mod( month, 12 );
					year += ( month - modMonth ) / 12;
					return modMonth === 1 ? ( isLeapYear( year ) ? 29 : 28 ) : 31 - ( ( modMonth % 7 ) % 2 );
				}

				// FORMATTING

				addFormatToken( 'M', [ 'MM', 2 ], 'Mo', function () {
					return this.month() + 1;
				} );

				addFormatToken( 'MMM', 0, 0, function ( format ) {
					return this.localeData().monthsShort( this, format );
				} );

				addFormatToken( 'MMMM', 0, 0, function ( format ) {
					return this.localeData().months( this, format );
				} );

				// ALIASES

				addUnitAlias( 'month', 'M' );

				// PRIORITY

				addUnitPriority( 'month', 8 );

				// PARSING

				addRegexToken( 'M', match1to2 );
				addRegexToken( 'MM', match1to2, match2 );
				addRegexToken( 'MMM', function ( isStrict, locale ) {
					return locale.monthsShortRegex( isStrict );
				} );
				addRegexToken( 'MMMM', function ( isStrict, locale ) {
					return locale.monthsRegex( isStrict );
				} );

				addParseToken( [ 'M', 'MM' ], function ( input, array ) {
					array[ MONTH ] = toInt( input ) - 1;
				} );

				addParseToken( [ 'MMM', 'MMMM' ], function ( input, array, config, token ) {
					var month = config._locale.monthsParse( input, token, config._strict );
					// if we didn't find a month name, mark the date as invalid.
					if ( month != null ) {
						array[ MONTH ] = month;
					} else {
						getParsingFlags( config ).invalidMonth = input;
					}
				} );

				// LOCALES

				var defaultLocaleMonths = 'January_February_March_April_May_June_July_August_September_October_November_December'.split(
						'_'
					),
					defaultLocaleMonthsShort = 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split( '_' ),
					MONTHS_IN_FORMAT = /D[oD]?(\[[^\[\]]*\]|\s)+MMMM?/,
					defaultMonthsShortRegex = matchWord,
					defaultMonthsRegex = matchWord;

				function localeMonths( m, format ) {
					if ( ! m ) {
						return isArray( this._months ) ? this._months : this._months[ 'standalone' ];
					}
					return isArray( this._months )
						? this._months[ m.month() ]
						: this._months[
								( this._months.isFormat || MONTHS_IN_FORMAT ).test( format )
									? 'format'
									: 'standalone'
						  ][ m.month() ];
				}

				function localeMonthsShort( m, format ) {
					if ( ! m ) {
						return isArray( this._monthsShort )
							? this._monthsShort
							: this._monthsShort[ 'standalone' ];
					}
					return isArray( this._monthsShort )
						? this._monthsShort[ m.month() ]
						: this._monthsShort[ MONTHS_IN_FORMAT.test( format ) ? 'format' : 'standalone' ][
								m.month()
						  ];
				}

				function handleStrictParse( monthName, format, strict ) {
					var i,
						ii,
						mom,
						llc = monthName.toLocaleLowerCase();
					if ( ! this._monthsParse ) {
						// this is not used
						this._monthsParse = [];
						this._longMonthsParse = [];
						this._shortMonthsParse = [];
						for ( i = 0; i < 12; ++i ) {
							mom = createUTC( [ 2000, i ] );
							this._shortMonthsParse[ i ] = this.monthsShort( mom, '' ).toLocaleLowerCase();
							this._longMonthsParse[ i ] = this.months( mom, '' ).toLocaleLowerCase();
						}
					}

					if ( strict ) {
						if ( format === 'MMM' ) {
							ii = indexOf.call( this._shortMonthsParse, llc );
							return ii !== -1 ? ii : null;
						} else {
							ii = indexOf.call( this._longMonthsParse, llc );
							return ii !== -1 ? ii : null;
						}
					} else {
						if ( format === 'MMM' ) {
							ii = indexOf.call( this._shortMonthsParse, llc );
							if ( ii !== -1 ) {
								return ii;
							}
							ii = indexOf.call( this._longMonthsParse, llc );
							return ii !== -1 ? ii : null;
						} else {
							ii = indexOf.call( this._longMonthsParse, llc );
							if ( ii !== -1 ) {
								return ii;
							}
							ii = indexOf.call( this._shortMonthsParse, llc );
							return ii !== -1 ? ii : null;
						}
					}
				}

				function localeMonthsParse( monthName, format, strict ) {
					var i, mom, regex;

					if ( this._monthsParseExact ) {
						return handleStrictParse.call( this, monthName, format, strict );
					}

					if ( ! this._monthsParse ) {
						this._monthsParse = [];
						this._longMonthsParse = [];
						this._shortMonthsParse = [];
					}

					// TODO: add sorting
					// Sorting makes sure if one month (or abbr) is a prefix of another
					// see sorting in computeMonthsParse
					for ( i = 0; i < 12; i++ ) {
						// make the regex if we don't have it already
						mom = createUTC( [ 2000, i ] );
						if ( strict && ! this._longMonthsParse[ i ] ) {
							this._longMonthsParse[ i ] = new RegExp(
								'^' + this.months( mom, '' ).replace( '.', '' ) + '$',
								'i'
							);
							this._shortMonthsParse[ i ] = new RegExp(
								'^' + this.monthsShort( mom, '' ).replace( '.', '' ) + '$',
								'i'
							);
						}
						if ( ! strict && ! this._monthsParse[ i ] ) {
							regex = '^' + this.months( mom, '' ) + '|^' + this.monthsShort( mom, '' );
							this._monthsParse[ i ] = new RegExp( regex.replace( '.', '' ), 'i' );
						}
						// test the regex
						if ( strict && format === 'MMMM' && this._longMonthsParse[ i ].test( monthName ) ) {
							return i;
						} else if (
							strict &&
							format === 'MMM' &&
							this._shortMonthsParse[ i ].test( monthName )
						) {
							return i;
						} else if ( ! strict && this._monthsParse[ i ].test( monthName ) ) {
							return i;
						}
					}
				}

				// MOMENTS

				function setMonth( mom, value ) {
					var dayOfMonth;

					if ( ! mom.isValid() ) {
						// No op
						return mom;
					}

					if ( typeof value === 'string' ) {
						if ( /^\d+$/.test( value ) ) {
							value = toInt( value );
						} else {
							value = mom.localeData().monthsParse( value );
							// TODO: Another silent failure?
							if ( ! isNumber( value ) ) {
								return mom;
							}
						}
					}

					dayOfMonth = Math.min( mom.date(), daysInMonth( mom.year(), value ) );
					mom._d[ 'set' + ( mom._isUTC ? 'UTC' : '' ) + 'Month' ]( value, dayOfMonth );
					return mom;
				}

				function getSetMonth( value ) {
					if ( value != null ) {
						setMonth( this, value );
						hooks.updateOffset( this, true );
						return this;
					} else {
						return get( this, 'Month' );
					}
				}

				function getDaysInMonth() {
					return daysInMonth( this.year(), this.month() );
				}

				function monthsShortRegex( isStrict ) {
					if ( this._monthsParseExact ) {
						if ( ! hasOwnProp( this, '_monthsRegex' ) ) {
							computeMonthsParse.call( this );
						}
						if ( isStrict ) {
							return this._monthsShortStrictRegex;
						} else {
							return this._monthsShortRegex;
						}
					} else {
						if ( ! hasOwnProp( this, '_monthsShortRegex' ) ) {
							this._monthsShortRegex = defaultMonthsShortRegex;
						}
						return this._monthsShortStrictRegex && isStrict
							? this._monthsShortStrictRegex
							: this._monthsShortRegex;
					}
				}

				function monthsRegex( isStrict ) {
					if ( this._monthsParseExact ) {
						if ( ! hasOwnProp( this, '_monthsRegex' ) ) {
							computeMonthsParse.call( this );
						}
						if ( isStrict ) {
							return this._monthsStrictRegex;
						} else {
							return this._monthsRegex;
						}
					} else {
						if ( ! hasOwnProp( this, '_monthsRegex' ) ) {
							this._monthsRegex = defaultMonthsRegex;
						}
						return this._monthsStrictRegex && isStrict
							? this._monthsStrictRegex
							: this._monthsRegex;
					}
				}

				function computeMonthsParse() {
					function cmpLenRev( a, b ) {
						return b.length - a.length;
					}

					var shortPieces = [],
						longPieces = [],
						mixedPieces = [],
						i,
						mom;
					for ( i = 0; i < 12; i++ ) {
						// make the regex if we don't have it already
						mom = createUTC( [ 2000, i ] );
						shortPieces.push( this.monthsShort( mom, '' ) );
						longPieces.push( this.months( mom, '' ) );
						mixedPieces.push( this.months( mom, '' ) );
						mixedPieces.push( this.monthsShort( mom, '' ) );
					}
					// Sorting makes sure if one month (or abbr) is a prefix of another it
					// will match the longer piece.
					shortPieces.sort( cmpLenRev );
					longPieces.sort( cmpLenRev );
					mixedPieces.sort( cmpLenRev );
					for ( i = 0; i < 12; i++ ) {
						shortPieces[ i ] = regexEscape( shortPieces[ i ] );
						longPieces[ i ] = regexEscape( longPieces[ i ] );
					}
					for ( i = 0; i < 24; i++ ) {
						mixedPieces[ i ] = regexEscape( mixedPieces[ i ] );
					}

					this._monthsRegex = new RegExp( '^(' + mixedPieces.join( '|' ) + ')', 'i' );
					this._monthsShortRegex = this._monthsRegex;
					this._monthsStrictRegex = new RegExp( '^(' + longPieces.join( '|' ) + ')', 'i' );
					this._monthsShortStrictRegex = new RegExp( '^(' + shortPieces.join( '|' ) + ')', 'i' );
				}

				// FORMATTING

				addFormatToken( 'Y', 0, 0, function () {
					var y = this.year();
					return y <= 9999 ? zeroFill( y, 4 ) : '+' + y;
				} );

				addFormatToken( 0, [ 'YY', 2 ], 0, function () {
					return this.year() % 100;
				} );

				addFormatToken( 0, [ 'YYYY', 4 ], 0, 'year' );
				addFormatToken( 0, [ 'YYYYY', 5 ], 0, 'year' );
				addFormatToken( 0, [ 'YYYYYY', 6, true ], 0, 'year' );

				// ALIASES

				addUnitAlias( 'year', 'y' );

				// PRIORITIES

				addUnitPriority( 'year', 1 );

				// PARSING

				addRegexToken( 'Y', matchSigned );
				addRegexToken( 'YY', match1to2, match2 );
				addRegexToken( 'YYYY', match1to4, match4 );
				addRegexToken( 'YYYYY', match1to6, match6 );
				addRegexToken( 'YYYYYY', match1to6, match6 );

				addParseToken( [ 'YYYYY', 'YYYYYY' ], YEAR );
				addParseToken( 'YYYY', function ( input, array ) {
					array[ YEAR ] = input.length === 2 ? hooks.parseTwoDigitYear( input ) : toInt( input );
				} );
				addParseToken( 'YY', function ( input, array ) {
					array[ YEAR ] = hooks.parseTwoDigitYear( input );
				} );
				addParseToken( 'Y', function ( input, array ) {
					array[ YEAR ] = parseInt( input, 10 );
				} );

				// HELPERS

				function daysInYear( year ) {
					return isLeapYear( year ) ? 366 : 365;
				}

				// HOOKS

				hooks.parseTwoDigitYear = function ( input ) {
					return toInt( input ) + ( toInt( input ) > 68 ? 1900 : 2000 );
				};

				// MOMENTS

				var getSetYear = makeGetSet( 'FullYear', true );

				function getIsLeapYear() {
					return isLeapYear( this.year() );
				}

				function createDate( y, m, d, h, M, s, ms ) {
					// can't just apply() to create a date:
					// https://stackoverflow.com/q/181348
					var date;
					// the date constructor remaps years 0-99 to 1900-1999
					if ( y < 100 && y >= 0 ) {
						// preserve leap years using a full 400 year cycle, then reset
						date = new Date( y + 400, m, d, h, M, s, ms );
						if ( isFinite( date.getFullYear() ) ) {
							date.setFullYear( y );
						}
					} else {
						date = new Date( y, m, d, h, M, s, ms );
					}

					return date;
				}

				function createUTCDate( y ) {
					var date, args;
					// the Date.UTC function remaps years 0-99 to 1900-1999
					if ( y < 100 && y >= 0 ) {
						args = Array.prototype.slice.call( arguments );
						// preserve leap years using a full 400 year cycle, then reset
						args[ 0 ] = y + 400;
						date = new Date( Date.UTC.apply( null, args ) );
						if ( isFinite( date.getUTCFullYear() ) ) {
							date.setUTCFullYear( y );
						}
					} else {
						date = new Date( Date.UTC.apply( null, arguments ) );
					}

					return date;
				}

				// start-of-first-week - start-of-year
				function firstWeekOffset( year, dow, doy ) {
					var // first-week day -- which january is always in the first week (4 for iso, 1 for other)
						fwd = 7 + dow - doy,
						// first-week day local weekday -- which local weekday is fwd
						fwdlw = ( 7 + createUTCDate( year, 0, fwd ).getUTCDay() - dow ) % 7;

					return -fwdlw + fwd - 1;
				}

				// https://en.wikipedia.org/wiki/ISO_week_date#Calculating_a_date_given_the_year.2C_week_number_and_weekday
				function dayOfYearFromWeeks( year, week, weekday, dow, doy ) {
					var localWeekday = ( 7 + weekday - dow ) % 7,
						weekOffset = firstWeekOffset( year, dow, doy ),
						dayOfYear = 1 + 7 * ( week - 1 ) + localWeekday + weekOffset,
						resYear,
						resDayOfYear;

					if ( dayOfYear <= 0 ) {
						resYear = year - 1;
						resDayOfYear = daysInYear( resYear ) + dayOfYear;
					} else if ( dayOfYear > daysInYear( year ) ) {
						resYear = year + 1;
						resDayOfYear = dayOfYear - daysInYear( year );
					} else {
						resYear = year;
						resDayOfYear = dayOfYear;
					}

					return {
						year: resYear,
						dayOfYear: resDayOfYear,
					};
				}

				function weekOfYear( mom, dow, doy ) {
					var weekOffset = firstWeekOffset( mom.year(), dow, doy ),
						week = Math.floor( ( mom.dayOfYear() - weekOffset - 1 ) / 7 ) + 1,
						resWeek,
						resYear;

					if ( week < 1 ) {
						resYear = mom.year() - 1;
						resWeek = week + weeksInYear( resYear, dow, doy );
					} else if ( week > weeksInYear( mom.year(), dow, doy ) ) {
						resWeek = week - weeksInYear( mom.year(), dow, doy );
						resYear = mom.year() + 1;
					} else {
						resYear = mom.year();
						resWeek = week;
					}

					return {
						week: resWeek,
						year: resYear,
					};
				}

				function weeksInYear( year, dow, doy ) {
					var weekOffset = firstWeekOffset( year, dow, doy ),
						weekOffsetNext = firstWeekOffset( year + 1, dow, doy );
					return ( daysInYear( year ) - weekOffset + weekOffsetNext ) / 7;
				}

				// FORMATTING

				addFormatToken( 'w', [ 'ww', 2 ], 'wo', 'week' );
				addFormatToken( 'W', [ 'WW', 2 ], 'Wo', 'isoWeek' );

				// ALIASES

				addUnitAlias( 'week', 'w' );
				addUnitAlias( 'isoWeek', 'W' );

				// PRIORITIES

				addUnitPriority( 'week', 5 );
				addUnitPriority( 'isoWeek', 5 );

				// PARSING

				addRegexToken( 'w', match1to2 );
				addRegexToken( 'ww', match1to2, match2 );
				addRegexToken( 'W', match1to2 );
				addRegexToken( 'WW', match1to2, match2 );

				addWeekParseToken( [ 'w', 'ww', 'W', 'WW' ], function ( input, week, config, token ) {
					week[ token.substr( 0, 1 ) ] = toInt( input );
				} );

				// HELPERS

				// LOCALES

				function localeWeek( mom ) {
					return weekOfYear( mom, this._week.dow, this._week.doy ).week;
				}

				var defaultLocaleWeek = {
					dow: 0, // Sunday is the first day of the week.
					doy: 6, // The week that contains Jan 6th is the first week of the year.
				};

				function localeFirstDayOfWeek() {
					return this._week.dow;
				}

				function localeFirstDayOfYear() {
					return this._week.doy;
				}

				// MOMENTS

				function getSetWeek( input ) {
					var week = this.localeData().week( this );
					return input == null ? week : this.add( ( input - week ) * 7, 'd' );
				}

				function getSetISOWeek( input ) {
					var week = weekOfYear( this, 1, 4 ).week;
					return input == null ? week : this.add( ( input - week ) * 7, 'd' );
				}

				// FORMATTING

				addFormatToken( 'd', 0, 'do', 'day' );

				addFormatToken( 'dd', 0, 0, function ( format ) {
					return this.localeData().weekdaysMin( this, format );
				} );

				addFormatToken( 'ddd', 0, 0, function ( format ) {
					return this.localeData().weekdaysShort( this, format );
				} );

				addFormatToken( 'dddd', 0, 0, function ( format ) {
					return this.localeData().weekdays( this, format );
				} );

				addFormatToken( 'e', 0, 0, 'weekday' );
				addFormatToken( 'E', 0, 0, 'isoWeekday' );

				// ALIASES

				addUnitAlias( 'day', 'd' );
				addUnitAlias( 'weekday', 'e' );
				addUnitAlias( 'isoWeekday', 'E' );

				// PRIORITY
				addUnitPriority( 'day', 11 );
				addUnitPriority( 'weekday', 11 );
				addUnitPriority( 'isoWeekday', 11 );

				// PARSING

				addRegexToken( 'd', match1to2 );
				addRegexToken( 'e', match1to2 );
				addRegexToken( 'E', match1to2 );
				addRegexToken( 'dd', function ( isStrict, locale ) {
					return locale.weekdaysMinRegex( isStrict );
				} );
				addRegexToken( 'ddd', function ( isStrict, locale ) {
					return locale.weekdaysShortRegex( isStrict );
				} );
				addRegexToken( 'dddd', function ( isStrict, locale ) {
					return locale.weekdaysRegex( isStrict );
				} );

				addWeekParseToken( [ 'dd', 'ddd', 'dddd' ], function ( input, week, config, token ) {
					var weekday = config._locale.weekdaysParse( input, token, config._strict );
					// if we didn't get a weekday name, mark the date as invalid
					if ( weekday != null ) {
						week.d = weekday;
					} else {
						getParsingFlags( config ).invalidWeekday = input;
					}
				} );

				addWeekParseToken( [ 'd', 'e', 'E' ], function ( input, week, config, token ) {
					week[ token ] = toInt( input );
				} );

				// HELPERS

				function parseWeekday( input, locale ) {
					if ( typeof input !== 'string' ) {
						return input;
					}

					if ( ! isNaN( input ) ) {
						return parseInt( input, 10 );
					}

					input = locale.weekdaysParse( input );
					if ( typeof input === 'number' ) {
						return input;
					}

					return null;
				}

				function parseIsoWeekday( input, locale ) {
					if ( typeof input === 'string' ) {
						return locale.weekdaysParse( input ) % 7 || 7;
					}
					return isNaN( input ) ? null : input;
				}

				// LOCALES
				function shiftWeekdays( ws, n ) {
					return ws.slice( n, 7 ).concat( ws.slice( 0, n ) );
				}

				var defaultLocaleWeekdays = 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split(
						'_'
					),
					defaultLocaleWeekdaysShort = 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split( '_' ),
					defaultLocaleWeekdaysMin = 'Su_Mo_Tu_We_Th_Fr_Sa'.split( '_' ),
					defaultWeekdaysRegex = matchWord,
					defaultWeekdaysShortRegex = matchWord,
					defaultWeekdaysMinRegex = matchWord;

				function localeWeekdays( m, format ) {
					var weekdays = isArray( this._weekdays )
						? this._weekdays
						: this._weekdays[
								m && m !== true && this._weekdays.isFormat.test( format ) ? 'format' : 'standalone'
						  ];
					return m === true
						? shiftWeekdays( weekdays, this._week.dow )
						: m
						? weekdays[ m.day() ]
						: weekdays;
				}

				function localeWeekdaysShort( m ) {
					return m === true
						? shiftWeekdays( this._weekdaysShort, this._week.dow )
						: m
						? this._weekdaysShort[ m.day() ]
						: this._weekdaysShort;
				}

				function localeWeekdaysMin( m ) {
					return m === true
						? shiftWeekdays( this._weekdaysMin, this._week.dow )
						: m
						? this._weekdaysMin[ m.day() ]
						: this._weekdaysMin;
				}

				function handleStrictParse$1( weekdayName, format, strict ) {
					var i,
						ii,
						mom,
						llc = weekdayName.toLocaleLowerCase();
					if ( ! this._weekdaysParse ) {
						this._weekdaysParse = [];
						this._shortWeekdaysParse = [];
						this._minWeekdaysParse = [];

						for ( i = 0; i < 7; ++i ) {
							mom = createUTC( [ 2000, 1 ] ).day( i );
							this._minWeekdaysParse[ i ] = this.weekdaysMin( mom, '' ).toLocaleLowerCase();
							this._shortWeekdaysParse[ i ] = this.weekdaysShort( mom, '' ).toLocaleLowerCase();
							this._weekdaysParse[ i ] = this.weekdays( mom, '' ).toLocaleLowerCase();
						}
					}

					if ( strict ) {
						if ( format === 'dddd' ) {
							ii = indexOf.call( this._weekdaysParse, llc );
							return ii !== -1 ? ii : null;
						} else if ( format === 'ddd' ) {
							ii = indexOf.call( this._shortWeekdaysParse, llc );
							return ii !== -1 ? ii : null;
						} else {
							ii = indexOf.call( this._minWeekdaysParse, llc );
							return ii !== -1 ? ii : null;
						}
					} else {
						if ( format === 'dddd' ) {
							ii = indexOf.call( this._weekdaysParse, llc );
							if ( ii !== -1 ) {
								return ii;
							}
							ii = indexOf.call( this._shortWeekdaysParse, llc );
							if ( ii !== -1 ) {
								return ii;
							}
							ii = indexOf.call( this._minWeekdaysParse, llc );
							return ii !== -1 ? ii : null;
						} else if ( format === 'ddd' ) {
							ii = indexOf.call( this._shortWeekdaysParse, llc );
							if ( ii !== -1 ) {
								return ii;
							}
							ii = indexOf.call( this._weekdaysParse, llc );
							if ( ii !== -1 ) {
								return ii;
							}
							ii = indexOf.call( this._minWeekdaysParse, llc );
							return ii !== -1 ? ii : null;
						} else {
							ii = indexOf.call( this._minWeekdaysParse, llc );
							if ( ii !== -1 ) {
								return ii;
							}
							ii = indexOf.call( this._weekdaysParse, llc );
							if ( ii !== -1 ) {
								return ii;
							}
							ii = indexOf.call( this._shortWeekdaysParse, llc );
							return ii !== -1 ? ii : null;
						}
					}
				}

				function localeWeekdaysParse( weekdayName, format, strict ) {
					var i, mom, regex;

					if ( this._weekdaysParseExact ) {
						return handleStrictParse$1.call( this, weekdayName, format, strict );
					}

					if ( ! this._weekdaysParse ) {
						this._weekdaysParse = [];
						this._minWeekdaysParse = [];
						this._shortWeekdaysParse = [];
						this._fullWeekdaysParse = [];
					}

					for ( i = 0; i < 7; i++ ) {
						// make the regex if we don't have it already

						mom = createUTC( [ 2000, 1 ] ).day( i );
						if ( strict && ! this._fullWeekdaysParse[ i ] ) {
							this._fullWeekdaysParse[ i ] = new RegExp(
								'^' + this.weekdays( mom, '' ).replace( '.', '\\.?' ) + '$',
								'i'
							);
							this._shortWeekdaysParse[ i ] = new RegExp(
								'^' + this.weekdaysShort( mom, '' ).replace( '.', '\\.?' ) + '$',
								'i'
							);
							this._minWeekdaysParse[ i ] = new RegExp(
								'^' + this.weekdaysMin( mom, '' ).replace( '.', '\\.?' ) + '$',
								'i'
							);
						}
						if ( ! this._weekdaysParse[ i ] ) {
							regex =
								'^' +
								this.weekdays( mom, '' ) +
								'|^' +
								this.weekdaysShort( mom, '' ) +
								'|^' +
								this.weekdaysMin( mom, '' );
							this._weekdaysParse[ i ] = new RegExp( regex.replace( '.', '' ), 'i' );
						}
						// test the regex
						if ( strict && format === 'dddd' && this._fullWeekdaysParse[ i ].test( weekdayName ) ) {
							return i;
						} else if (
							strict &&
							format === 'ddd' &&
							this._shortWeekdaysParse[ i ].test( weekdayName )
						) {
							return i;
						} else if (
							strict &&
							format === 'dd' &&
							this._minWeekdaysParse[ i ].test( weekdayName )
						) {
							return i;
						} else if ( ! strict && this._weekdaysParse[ i ].test( weekdayName ) ) {
							return i;
						}
					}
				}

				// MOMENTS

				function getSetDayOfWeek( input ) {
					if ( ! this.isValid() ) {
						return input != null ? this : NaN;
					}
					var day = this._isUTC ? this._d.getUTCDay() : this._d.getDay();
					if ( input != null ) {
						input = parseWeekday( input, this.localeData() );
						return this.add( input - day, 'd' );
					} else {
						return day;
					}
				}

				function getSetLocaleDayOfWeek( input ) {
					if ( ! this.isValid() ) {
						return input != null ? this : NaN;
					}
					var weekday = ( this.day() + 7 - this.localeData()._week.dow ) % 7;
					return input == null ? weekday : this.add( input - weekday, 'd' );
				}

				function getSetISODayOfWeek( input ) {
					if ( ! this.isValid() ) {
						return input != null ? this : NaN;
					}

					// behaves the same as moment#day except
					// as a getter, returns 7 instead of 0 (1-7 range instead of 0-6)
					// as a setter, sunday should belong to the previous week.

					if ( input != null ) {
						var weekday = parseIsoWeekday( input, this.localeData() );
						return this.day( this.day() % 7 ? weekday : weekday - 7 );
					} else {
						return this.day() || 7;
					}
				}

				function weekdaysRegex( isStrict ) {
					if ( this._weekdaysParseExact ) {
						if ( ! hasOwnProp( this, '_weekdaysRegex' ) ) {
							computeWeekdaysParse.call( this );
						}
						if ( isStrict ) {
							return this._weekdaysStrictRegex;
						} else {
							return this._weekdaysRegex;
						}
					} else {
						if ( ! hasOwnProp( this, '_weekdaysRegex' ) ) {
							this._weekdaysRegex = defaultWeekdaysRegex;
						}
						return this._weekdaysStrictRegex && isStrict
							? this._weekdaysStrictRegex
							: this._weekdaysRegex;
					}
				}

				function weekdaysShortRegex( isStrict ) {
					if ( this._weekdaysParseExact ) {
						if ( ! hasOwnProp( this, '_weekdaysRegex' ) ) {
							computeWeekdaysParse.call( this );
						}
						if ( isStrict ) {
							return this._weekdaysShortStrictRegex;
						} else {
							return this._weekdaysShortRegex;
						}
					} else {
						if ( ! hasOwnProp( this, '_weekdaysShortRegex' ) ) {
							this._weekdaysShortRegex = defaultWeekdaysShortRegex;
						}
						return this._weekdaysShortStrictRegex && isStrict
							? this._weekdaysShortStrictRegex
							: this._weekdaysShortRegex;
					}
				}

				function weekdaysMinRegex( isStrict ) {
					if ( this._weekdaysParseExact ) {
						if ( ! hasOwnProp( this, '_weekdaysRegex' ) ) {
							computeWeekdaysParse.call( this );
						}
						if ( isStrict ) {
							return this._weekdaysMinStrictRegex;
						} else {
							return this._weekdaysMinRegex;
						}
					} else {
						if ( ! hasOwnProp( this, '_weekdaysMinRegex' ) ) {
							this._weekdaysMinRegex = defaultWeekdaysMinRegex;
						}
						return this._weekdaysMinStrictRegex && isStrict
							? this._weekdaysMinStrictRegex
							: this._weekdaysMinRegex;
					}
				}

				function computeWeekdaysParse() {
					function cmpLenRev( a, b ) {
						return b.length - a.length;
					}

					var minPieces = [],
						shortPieces = [],
						longPieces = [],
						mixedPieces = [],
						i,
						mom,
						minp,
						shortp,
						longp;
					for ( i = 0; i < 7; i++ ) {
						// make the regex if we don't have it already
						mom = createUTC( [ 2000, 1 ] ).day( i );
						minp = regexEscape( this.weekdaysMin( mom, '' ) );
						shortp = regexEscape( this.weekdaysShort( mom, '' ) );
						longp = regexEscape( this.weekdays( mom, '' ) );
						minPieces.push( minp );
						shortPieces.push( shortp );
						longPieces.push( longp );
						mixedPieces.push( minp );
						mixedPieces.push( shortp );
						mixedPieces.push( longp );
					}
					// Sorting makes sure if one weekday (or abbr) is a prefix of another it
					// will match the longer piece.
					minPieces.sort( cmpLenRev );
					shortPieces.sort( cmpLenRev );
					longPieces.sort( cmpLenRev );
					mixedPieces.sort( cmpLenRev );

					this._weekdaysRegex = new RegExp( '^(' + mixedPieces.join( '|' ) + ')', 'i' );
					this._weekdaysShortRegex = this._weekdaysRegex;
					this._weekdaysMinRegex = this._weekdaysRegex;

					this._weekdaysStrictRegex = new RegExp( '^(' + longPieces.join( '|' ) + ')', 'i' );
					this._weekdaysShortStrictRegex = new RegExp( '^(' + shortPieces.join( '|' ) + ')', 'i' );
					this._weekdaysMinStrictRegex = new RegExp( '^(' + minPieces.join( '|' ) + ')', 'i' );
				}

				// FORMATTING

				function hFormat() {
					return this.hours() % 12 || 12;
				}

				function kFormat() {
					return this.hours() || 24;
				}

				addFormatToken( 'H', [ 'HH', 2 ], 0, 'hour' );
				addFormatToken( 'h', [ 'hh', 2 ], 0, hFormat );
				addFormatToken( 'k', [ 'kk', 2 ], 0, kFormat );

				addFormatToken( 'hmm', 0, 0, function () {
					return '' + hFormat.apply( this ) + zeroFill( this.minutes(), 2 );
				} );

				addFormatToken( 'hmmss', 0, 0, function () {
					return (
						'' +
						hFormat.apply( this ) +
						zeroFill( this.minutes(), 2 ) +
						zeroFill( this.seconds(), 2 )
					);
				} );

				addFormatToken( 'Hmm', 0, 0, function () {
					return '' + this.hours() + zeroFill( this.minutes(), 2 );
				} );

				addFormatToken( 'Hmmss', 0, 0, function () {
					return '' + this.hours() + zeroFill( this.minutes(), 2 ) + zeroFill( this.seconds(), 2 );
				} );

				function meridiem( token, lowercase ) {
					addFormatToken( token, 0, 0, function () {
						return this.localeData().meridiem( this.hours(), this.minutes(), lowercase );
					} );
				}

				meridiem( 'a', true );
				meridiem( 'A', false );

				// ALIASES

				addUnitAlias( 'hour', 'h' );

				// PRIORITY
				addUnitPriority( 'hour', 13 );

				// PARSING

				function matchMeridiem( isStrict, locale ) {
					return locale._meridiemParse;
				}

				addRegexToken( 'a', matchMeridiem );
				addRegexToken( 'A', matchMeridiem );
				addRegexToken( 'H', match1to2 );
				addRegexToken( 'h', match1to2 );
				addRegexToken( 'k', match1to2 );
				addRegexToken( 'HH', match1to2, match2 );
				addRegexToken( 'hh', match1to2, match2 );
				addRegexToken( 'kk', match1to2, match2 );

				addRegexToken( 'hmm', match3to4 );
				addRegexToken( 'hmmss', match5to6 );
				addRegexToken( 'Hmm', match3to4 );
				addRegexToken( 'Hmmss', match5to6 );

				addParseToken( [ 'H', 'HH' ], HOUR );
				addParseToken( [ 'k', 'kk' ], function ( input, array, config ) {
					var kInput = toInt( input );
					array[ HOUR ] = kInput === 24 ? 0 : kInput;
				} );
				addParseToken( [ 'a', 'A' ], function ( input, array, config ) {
					config._isPm = config._locale.isPM( input );
					config._meridiem = input;
				} );
				addParseToken( [ 'h', 'hh' ], function ( input, array, config ) {
					array[ HOUR ] = toInt( input );
					getParsingFlags( config ).bigHour = true;
				} );
				addParseToken( 'hmm', function ( input, array, config ) {
					var pos = input.length - 2;
					array[ HOUR ] = toInt( input.substr( 0, pos ) );
					array[ MINUTE ] = toInt( input.substr( pos ) );
					getParsingFlags( config ).bigHour = true;
				} );
				addParseToken( 'hmmss', function ( input, array, config ) {
					var pos1 = input.length - 4,
						pos2 = input.length - 2;
					array[ HOUR ] = toInt( input.substr( 0, pos1 ) );
					array[ MINUTE ] = toInt( input.substr( pos1, 2 ) );
					array[ SECOND ] = toInt( input.substr( pos2 ) );
					getParsingFlags( config ).bigHour = true;
				} );
				addParseToken( 'Hmm', function ( input, array, config ) {
					var pos = input.length - 2;
					array[ HOUR ] = toInt( input.substr( 0, pos ) );
					array[ MINUTE ] = toInt( input.substr( pos ) );
				} );
				addParseToken( 'Hmmss', function ( input, array, config ) {
					var pos1 = input.length - 4,
						pos2 = input.length - 2;
					array[ HOUR ] = toInt( input.substr( 0, pos1 ) );
					array[ MINUTE ] = toInt( input.substr( pos1, 2 ) );
					array[ SECOND ] = toInt( input.substr( pos2 ) );
				} );

				// LOCALES

				function localeIsPM( input ) {
					// IE8 Quirks Mode & IE7 Standards Mode do not allow accessing strings like arrays
					// Using charAt should be more compatible.
					return ( input + '' ).toLowerCase().charAt( 0 ) === 'p';
				}

				var defaultLocaleMeridiemParse = /[ap]\.?m?\.?/i,
					// Setting the hour should keep the time, because the user explicitly
					// specified which hour they want. So trying to maintain the same hour (in
					// a new timezone) makes sense. Adding/subtracting hours does not follow
					// this rule.
					getSetHour = makeGetSet( 'Hours', true );

				function localeMeridiem( hours, minutes, isLower ) {
					if ( hours > 11 ) {
						return isLower ? 'pm' : 'PM';
					} else {
						return isLower ? 'am' : 'AM';
					}
				}

				var baseConfig = {
					calendar: defaultCalendar,
					longDateFormat: defaultLongDateFormat,
					invalidDate: defaultInvalidDate,
					ordinal: defaultOrdinal,
					dayOfMonthOrdinalParse: defaultDayOfMonthOrdinalParse,
					relativeTime: defaultRelativeTime,

					months: defaultLocaleMonths,
					monthsShort: defaultLocaleMonthsShort,

					week: defaultLocaleWeek,

					weekdays: defaultLocaleWeekdays,
					weekdaysMin: defaultLocaleWeekdaysMin,
					weekdaysShort: defaultLocaleWeekdaysShort,

					meridiemParse: defaultLocaleMeridiemParse,
				};

				// internal storage for locale config files
				var locales = {},
					localeFamilies = {},
					globalLocale;

				function commonPrefix( arr1, arr2 ) {
					var i,
						minl = Math.min( arr1.length, arr2.length );
					for ( i = 0; i < minl; i += 1 ) {
						if ( arr1[ i ] !== arr2[ i ] ) {
							return i;
						}
					}
					return minl;
				}

				function normalizeLocale( key ) {
					return key ? key.toLowerCase().replace( '_', '-' ) : key;
				}

				// pick the locale from the array
				// try ['en-au', 'en-gb'] as 'en-au', 'en-gb', 'en', as in move through the list trying each
				// substring from most specific to least, but move to the next array item if it's a more specific variant than the current root
				function chooseLocale( names ) {
					var i = 0,
						j,
						next,
						locale,
						split;

					while ( i < names.length ) {
						split = normalizeLocale( names[ i ] ).split( '-' );
						j = split.length;
						next = normalizeLocale( names[ i + 1 ] );
						next = next ? next.split( '-' ) : null;
						while ( j > 0 ) {
							locale = loadLocale( split.slice( 0, j ).join( '-' ) );
							if ( locale ) {
								return locale;
							}
							if ( next && next.length >= j && commonPrefix( split, next ) >= j - 1 ) {
								//the next array item is better than a shallower substring of this one
								break;
							}
							j--;
						}
						i++;
					}
					return globalLocale;
				}

				function loadLocale( name ) {
					var oldLocale = null,
						aliasedRequire;
					// TODO: Find a better way to register and load all the locales in Node
					if (
						locales[ name ] === undefined &&
						'object' !== 'undefined' &&
						module &&
						module.exports
					) {
						try {
							oldLocale = globalLocale._abbr;
							aliasedRequire = require;
							aliasedRequire( './locale/' + name );
							getSetGlobalLocale( oldLocale );
						} catch ( e ) {
							// mark as not found to avoid repeating expensive file require call causing high CPU
							// when trying to find en-US, en_US, en-us for every format call
							locales[ name ] = null; // null means not found
						}
					}
					return locales[ name ];
				}

				// This function will load locale and then set the global locale.  If
				// no arguments are passed in, it will simply return the current global
				// locale key.
				function getSetGlobalLocale( key, values ) {
					var data;
					if ( key ) {
						if ( isUndefined( values ) ) {
							data = getLocale( key );
						} else {
							data = defineLocale( key, values );
						}

						if ( data ) {
							// moment.duration._locale = moment._locale = data;
							globalLocale = data;
						} else {
							if ( typeof console !== 'undefined' && console.warn ) {
								//warn user if arguments are passed but the locale could not be set
								console.warn( 'Locale ' + key + ' not found. Did you forget to load it?' );
							}
						}
					}

					return globalLocale._abbr;
				}

				function defineLocale( name, config ) {
					if ( config !== null ) {
						var locale,
							parentConfig = baseConfig;
						config.abbr = name;
						if ( locales[ name ] != null ) {
							deprecateSimple(
								'defineLocaleOverride',
								'use moment.updateLocale(localeName, config) to change ' +
									'an existing locale. moment.defineLocale(localeName, ' +
									'config) should only be used for creating a new locale ' +
									'See http://momentjs.com/guides/#/warnings/define-locale/ for more info.'
							);
							parentConfig = locales[ name ]._config;
						} else if ( config.parentLocale != null ) {
							if ( locales[ config.parentLocale ] != null ) {
								parentConfig = locales[ config.parentLocale ]._config;
							} else {
								locale = loadLocale( config.parentLocale );
								if ( locale != null ) {
									parentConfig = locale._config;
								} else {
									if ( ! localeFamilies[ config.parentLocale ] ) {
										localeFamilies[ config.parentLocale ] = [];
									}
									localeFamilies[ config.parentLocale ].push( {
										name: name,
										config: config,
									} );
									return null;
								}
							}
						}
						locales[ name ] = new Locale( mergeConfigs( parentConfig, config ) );

						if ( localeFamilies[ name ] ) {
							localeFamilies[ name ].forEach( function ( x ) {
								defineLocale( x.name, x.config );
							} );
						}

						// backwards compat for now: also set the locale
						// make sure we set the locale AFTER all child locales have been
						// created, so we won't end up with the child locale set.
						getSetGlobalLocale( name );

						return locales[ name ];
					} else {
						// useful for testing
						delete locales[ name ];
						return null;
					}
				}

				function updateLocale( name, config ) {
					if ( config != null ) {
						var locale,
							tmpLocale,
							parentConfig = baseConfig;

						if ( locales[ name ] != null && locales[ name ].parentLocale != null ) {
							// Update existing child locale in-place to avoid memory-leaks
							locales[ name ].set( mergeConfigs( locales[ name ]._config, config ) );
						} else {
							// MERGE
							tmpLocale = loadLocale( name );
							if ( tmpLocale != null ) {
								parentConfig = tmpLocale._config;
							}
							config = mergeConfigs( parentConfig, config );
							if ( tmpLocale == null ) {
								// updateLocale is called for creating a new locale
								// Set abbr so it will have a name (getters return
								// undefined otherwise).
								config.abbr = name;
							}
							locale = new Locale( config );
							locale.parentLocale = locales[ name ];
							locales[ name ] = locale;
						}

						// backwards compat for now: also set the locale
						getSetGlobalLocale( name );
					} else {
						// pass null for config to unupdate, useful for tests
						if ( locales[ name ] != null ) {
							if ( locales[ name ].parentLocale != null ) {
								locales[ name ] = locales[ name ].parentLocale;
								if ( name === getSetGlobalLocale() ) {
									getSetGlobalLocale( name );
								}
							} else if ( locales[ name ] != null ) {
								delete locales[ name ];
							}
						}
					}
					return locales[ name ];
				}

				// returns locale data
				function getLocale( key ) {
					var locale;

					if ( key && key._locale && key._locale._abbr ) {
						key = key._locale._abbr;
					}

					if ( ! key ) {
						return globalLocale;
					}

					if ( ! isArray( key ) ) {
						//short-circuit everything else
						locale = loadLocale( key );
						if ( locale ) {
							return locale;
						}
						key = [ key ];
					}

					return chooseLocale( key );
				}

				function listLocales() {
					return keys( locales );
				}

				function checkOverflow( m ) {
					var overflow,
						a = m._a;

					if ( a && getParsingFlags( m ).overflow === -2 ) {
						overflow =
							a[ MONTH ] < 0 || a[ MONTH ] > 11
								? MONTH
								: a[ DATE ] < 1 || a[ DATE ] > daysInMonth( a[ YEAR ], a[ MONTH ] )
								? DATE
								: a[ HOUR ] < 0 ||
								  a[ HOUR ] > 24 ||
								  ( a[ HOUR ] === 24 &&
										( a[ MINUTE ] !== 0 || a[ SECOND ] !== 0 || a[ MILLISECOND ] !== 0 ) )
								? HOUR
								: a[ MINUTE ] < 0 || a[ MINUTE ] > 59
								? MINUTE
								: a[ SECOND ] < 0 || a[ SECOND ] > 59
								? SECOND
								: a[ MILLISECOND ] < 0 || a[ MILLISECOND ] > 999
								? MILLISECOND
								: -1;

						if (
							getParsingFlags( m )._overflowDayOfYear &&
							( overflow < YEAR || overflow > DATE )
						) {
							overflow = DATE;
						}
						if ( getParsingFlags( m )._overflowWeeks && overflow === -1 ) {
							overflow = WEEK;
						}
						if ( getParsingFlags( m )._overflowWeekday && overflow === -1 ) {
							overflow = WEEKDAY;
						}

						getParsingFlags( m ).overflow = overflow;
					}

					return m;
				}

				// iso 8601 regex
				// 0000-00-00 0000-W00 or 0000-W00-0 + T + 00 or 00:00 or 00:00:00 or 00:00:00.000 + +00:00 or +0000 or +00)
				var extendedIsoRegex = /^\s*((?:[+-]\d{6}|\d{4})-(?:\d\d-\d\d|W\d\d-\d|W\d\d|\d\d\d|\d\d))(?:(T| )(\d\d(?::\d\d(?::\d\d(?:[.,]\d+)?)?)?)([+-]\d\d(?::?\d\d)?|\s*Z)?)?$/,
					basicIsoRegex = /^\s*((?:[+-]\d{6}|\d{4})(?:\d\d\d\d|W\d\d\d|W\d\d|\d\d\d|\d\d|))(?:(T| )(\d\d(?:\d\d(?:\d\d(?:[.,]\d+)?)?)?)([+-]\d\d(?::?\d\d)?|\s*Z)?)?$/,
					tzRegex = /Z|[+-]\d\d(?::?\d\d)?/,
					isoDates = [
						[ 'YYYYYY-MM-DD', /[+-]\d{6}-\d\d-\d\d/ ],
						[ 'YYYY-MM-DD', /\d{4}-\d\d-\d\d/ ],
						[ 'GGGG-[W]WW-E', /\d{4}-W\d\d-\d/ ],
						[ 'GGGG-[W]WW', /\d{4}-W\d\d/, false ],
						[ 'YYYY-DDD', /\d{4}-\d{3}/ ],
						[ 'YYYY-MM', /\d{4}-\d\d/, false ],
						[ 'YYYYYYMMDD', /[+-]\d{10}/ ],
						[ 'YYYYMMDD', /\d{8}/ ],
						[ 'GGGG[W]WWE', /\d{4}W\d{3}/ ],
						[ 'GGGG[W]WW', /\d{4}W\d{2}/, false ],
						[ 'YYYYDDD', /\d{7}/ ],
						[ 'YYYYMM', /\d{6}/, false ],
						[ 'YYYY', /\d{4}/, false ],
					],
					// iso time formats and regexes
					isoTimes = [
						[ 'HH:mm:ss.SSSS', /\d\d:\d\d:\d\d\.\d+/ ],
						[ 'HH:mm:ss,SSSS', /\d\d:\d\d:\d\d,\d+/ ],
						[ 'HH:mm:ss', /\d\d:\d\d:\d\d/ ],
						[ 'HH:mm', /\d\d:\d\d/ ],
						[ 'HHmmss.SSSS', /\d\d\d\d\d\d\.\d+/ ],
						[ 'HHmmss,SSSS', /\d\d\d\d\d\d,\d+/ ],
						[ 'HHmmss', /\d\d\d\d\d\d/ ],
						[ 'HHmm', /\d\d\d\d/ ],
						[ 'HH', /\d\d/ ],
					],
					aspNetJsonRegex = /^\/?Date\((-?\d+)/i,
					// RFC 2822 regex: For details see https://tools.ietf.org/html/rfc2822#section-3.3
					rfc2822 = /^(?:(Mon|Tue|Wed|Thu|Fri|Sat|Sun),?\s)?(\d{1,2})\s(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s(\d{2,4})\s(\d\d):(\d\d)(?::(\d\d))?\s(?:(UT|GMT|[ECMP][SD]T)|([Zz])|([+-]\d{4}))$/,
					obsOffsets = {
						UT: 0,
						GMT: 0,
						EDT: -4 * 60,
						EST: -5 * 60,
						CDT: -5 * 60,
						CST: -6 * 60,
						MDT: -6 * 60,
						MST: -7 * 60,
						PDT: -7 * 60,
						PST: -8 * 60,
					};

				// date from iso format
				function configFromISO( config ) {
					var i,
						l,
						string = config._i,
						match = extendedIsoRegex.exec( string ) || basicIsoRegex.exec( string ),
						allowTime,
						dateFormat,
						timeFormat,
						tzFormat;

					if ( match ) {
						getParsingFlags( config ).iso = true;

						for ( i = 0, l = isoDates.length; i < l; i++ ) {
							if ( isoDates[ i ][ 1 ].exec( match[ 1 ] ) ) {
								dateFormat = isoDates[ i ][ 0 ];
								allowTime = isoDates[ i ][ 2 ] !== false;
								break;
							}
						}
						if ( dateFormat == null ) {
							config._isValid = false;
							return;
						}
						if ( match[ 3 ] ) {
							for ( i = 0, l = isoTimes.length; i < l; i++ ) {
								if ( isoTimes[ i ][ 1 ].exec( match[ 3 ] ) ) {
									// match[2] should be 'T' or space
									timeFormat = ( match[ 2 ] || ' ' ) + isoTimes[ i ][ 0 ];
									break;
								}
							}
							if ( timeFormat == null ) {
								config._isValid = false;
								return;
							}
						}
						if ( ! allowTime && timeFormat != null ) {
							config._isValid = false;
							return;
						}
						if ( match[ 4 ] ) {
							if ( tzRegex.exec( match[ 4 ] ) ) {
								tzFormat = 'Z';
							} else {
								config._isValid = false;
								return;
							}
						}
						config._f = dateFormat + ( timeFormat || '' ) + ( tzFormat || '' );
						configFromStringAndFormat( config );
					} else {
						config._isValid = false;
					}
				}

				function extractFromRFC2822Strings(
					yearStr,
					monthStr,
					dayStr,
					hourStr,
					minuteStr,
					secondStr
				) {
					var result = [
						untruncateYear( yearStr ),
						defaultLocaleMonthsShort.indexOf( monthStr ),
						parseInt( dayStr, 10 ),
						parseInt( hourStr, 10 ),
						parseInt( minuteStr, 10 ),
					];

					if ( secondStr ) {
						result.push( parseInt( secondStr, 10 ) );
					}

					return result;
				}

				function untruncateYear( yearStr ) {
					var year = parseInt( yearStr, 10 );
					if ( year <= 49 ) {
						return 2000 + year;
					} else if ( year <= 999 ) {
						return 1900 + year;
					}
					return year;
				}

				function preprocessRFC2822( s ) {
					// Remove comments and folding whitespace and replace multiple-spaces with a single space
					return s
						.replace( /\([^)]*\)|[\n\t]/g, ' ' )
						.replace( /(\s\s+)/g, ' ' )
						.replace( /^\s\s*/, '' )
						.replace( /\s\s*$/, '' );
				}

				function checkWeekday( weekdayStr, parsedInput, config ) {
					if ( weekdayStr ) {
						// TODO: Replace the vanilla JS Date object with an independent day-of-week check.
						var weekdayProvided = defaultLocaleWeekdaysShort.indexOf( weekdayStr ),
							weekdayActual = new Date(
								parsedInput[ 0 ],
								parsedInput[ 1 ],
								parsedInput[ 2 ]
							).getDay();
						if ( weekdayProvided !== weekdayActual ) {
							getParsingFlags( config ).weekdayMismatch = true;
							config._isValid = false;
							return false;
						}
					}
					return true;
				}

				function calculateOffset( obsOffset, militaryOffset, numOffset ) {
					if ( obsOffset ) {
						return obsOffsets[ obsOffset ];
					} else if ( militaryOffset ) {
						// the only allowed military tz is Z
						return 0;
					} else {
						var hm = parseInt( numOffset, 10 ),
							m = hm % 100,
							h = ( hm - m ) / 100;
						return h * 60 + m;
					}
				}

				// date and time from ref 2822 format
				function configFromRFC2822( config ) {
					var match = rfc2822.exec( preprocessRFC2822( config._i ) ),
						parsedArray;
					if ( match ) {
						parsedArray = extractFromRFC2822Strings(
							match[ 4 ],
							match[ 3 ],
							match[ 2 ],
							match[ 5 ],
							match[ 6 ],
							match[ 7 ]
						);
						if ( ! checkWeekday( match[ 1 ], parsedArray, config ) ) {
							return;
						}

						config._a = parsedArray;
						config._tzm = calculateOffset( match[ 8 ], match[ 9 ], match[ 10 ] );

						config._d = createUTCDate.apply( null, config._a );
						config._d.setUTCMinutes( config._d.getUTCMinutes() - config._tzm );

						getParsingFlags( config ).rfc2822 = true;
					} else {
						config._isValid = false;
					}
				}

				// date from 1) ASP.NET, 2) ISO, 3) RFC 2822 formats, or 4) optional fallback if parsing isn't strict
				function configFromString( config ) {
					var matched = aspNetJsonRegex.exec( config._i );
					if ( matched !== null ) {
						config._d = new Date( +matched[ 1 ] );
						return;
					}

					configFromISO( config );
					if ( config._isValid === false ) {
						delete config._isValid;
					} else {
						return;
					}

					configFromRFC2822( config );
					if ( config._isValid === false ) {
						delete config._isValid;
					} else {
						return;
					}

					if ( config._strict ) {
						config._isValid = false;
					} else {
						// Final attempt, use Input Fallback
						hooks.createFromInputFallback( config );
					}
				}

				hooks.createFromInputFallback = deprecate(
					'value provided is not in a recognized RFC2822 or ISO format. moment construction falls back to js Date(), ' +
						'which is not reliable across all browsers and versions. Non RFC2822/ISO date formats are ' +
						'discouraged. Please refer to http://momentjs.com/guides/#/warnings/js-date/ for more info.',
					function ( config ) {
						config._d = new Date( config._i + ( config._useUTC ? ' UTC' : '' ) );
					}
				);

				// Pick the first defined of two or three arguments.
				function defaults( a, b, c ) {
					if ( a != null ) {
						return a;
					}
					if ( b != null ) {
						return b;
					}
					return c;
				}

				function currentDateArray( config ) {
					// hooks is actually the exported moment object
					var nowValue = new Date( hooks.now() );
					if ( config._useUTC ) {
						return [ nowValue.getUTCFullYear(), nowValue.getUTCMonth(), nowValue.getUTCDate() ];
					}
					return [ nowValue.getFullYear(), nowValue.getMonth(), nowValue.getDate() ];
				}

				// convert an array to a date.
				// the array should mirror the parameters below
				// note: all values past the year are optional and will default to the lowest possible value.
				// [year, month, day , hour, minute, second, millisecond]
				function configFromArray( config ) {
					var i,
						date,
						input = [],
						currentDate,
						expectedWeekday,
						yearToUse;

					if ( config._d ) {
						return;
					}

					currentDate = currentDateArray( config );

					//compute day of the year from weeks and weekdays
					if ( config._w && config._a[ DATE ] == null && config._a[ MONTH ] == null ) {
						dayOfYearFromWeekInfo( config );
					}

					//if the day of the year is set, figure out what it is
					if ( config._dayOfYear != null ) {
						yearToUse = defaults( config._a[ YEAR ], currentDate[ YEAR ] );

						if ( config._dayOfYear > daysInYear( yearToUse ) || config._dayOfYear === 0 ) {
							getParsingFlags( config )._overflowDayOfYear = true;
						}

						date = createUTCDate( yearToUse, 0, config._dayOfYear );
						config._a[ MONTH ] = date.getUTCMonth();
						config._a[ DATE ] = date.getUTCDate();
					}

					// Default to current date.
					// * if no year, month, day of month are given, default to today
					// * if day of month is given, default month and year
					// * if month is given, default only year
					// * if year is given, don't default anything
					for ( i = 0; i < 3 && config._a[ i ] == null; ++i ) {
						config._a[ i ] = input[ i ] = currentDate[ i ];
					}

					// Zero out whatever was not defaulted, including time
					for ( ; i < 7; i++ ) {
						config._a[ i ] = input[ i ] =
							config._a[ i ] == null ? ( i === 2 ? 1 : 0 ) : config._a[ i ];
					}

					// Check for 24:00:00.000
					if (
						config._a[ HOUR ] === 24 &&
						config._a[ MINUTE ] === 0 &&
						config._a[ SECOND ] === 0 &&
						config._a[ MILLISECOND ] === 0
					) {
						config._nextDay = true;
						config._a[ HOUR ] = 0;
					}

					config._d = ( config._useUTC ? createUTCDate : createDate ).apply( null, input );
					expectedWeekday = config._useUTC ? config._d.getUTCDay() : config._d.getDay();

					// Apply timezone offset from input. The actual utcOffset can be changed
					// with parseZone.
					if ( config._tzm != null ) {
						config._d.setUTCMinutes( config._d.getUTCMinutes() - config._tzm );
					}

					if ( config._nextDay ) {
						config._a[ HOUR ] = 24;
					}

					// check for mismatching day of week
					if (
						config._w &&
						typeof config._w.d !== 'undefined' &&
						config._w.d !== expectedWeekday
					) {
						getParsingFlags( config ).weekdayMismatch = true;
					}
				}

				function dayOfYearFromWeekInfo( config ) {
					var w, weekYear, week, weekday, dow, doy, temp, weekdayOverflow, curWeek;

					w = config._w;
					if ( w.GG != null || w.W != null || w.E != null ) {
						dow = 1;
						doy = 4;

						// TODO: We need to take the current isoWeekYear, but that depends on
						// how we interpret now (local, utc, fixed offset). So create
						// a now version of current config (take local/utc/offset flags, and
						// create now).
						weekYear = defaults( w.GG, config._a[ YEAR ], weekOfYear( createLocal(), 1, 4 ).year );
						week = defaults( w.W, 1 );
						weekday = defaults( w.E, 1 );
						if ( weekday < 1 || weekday > 7 ) {
							weekdayOverflow = true;
						}
					} else {
						dow = config._locale._week.dow;
						doy = config._locale._week.doy;

						curWeek = weekOfYear( createLocal(), dow, doy );

						weekYear = defaults( w.gg, config._a[ YEAR ], curWeek.year );

						// Default to current week.
						week = defaults( w.w, curWeek.week );

						if ( w.d != null ) {
							// weekday -- low day numbers are considered next week
							weekday = w.d;
							if ( weekday < 0 || weekday > 6 ) {
								weekdayOverflow = true;
							}
						} else if ( w.e != null ) {
							// local weekday -- counting starts from beginning of week
							weekday = w.e + dow;
							if ( w.e < 0 || w.e > 6 ) {
								weekdayOverflow = true;
							}
						} else {
							// default to beginning of week
							weekday = dow;
						}
					}
					if ( week < 1 || week > weeksInYear( weekYear, dow, doy ) ) {
						getParsingFlags( config )._overflowWeeks = true;
					} else if ( weekdayOverflow != null ) {
						getParsingFlags( config )._overflowWeekday = true;
					} else {
						temp = dayOfYearFromWeeks( weekYear, week, weekday, dow, doy );
						config._a[ YEAR ] = temp.year;
						config._dayOfYear = temp.dayOfYear;
					}
				}

				// constant that refers to the ISO standard
				hooks.ISO_8601 = function () {};

				// constant that refers to the RFC 2822 form
				hooks.RFC_2822 = function () {};

				// date from string and format string
				function configFromStringAndFormat( config ) {
					// TODO: Move this to another part of the creation flow to prevent circular deps
					if ( config._f === hooks.ISO_8601 ) {
						configFromISO( config );
						return;
					}
					if ( config._f === hooks.RFC_2822 ) {
						configFromRFC2822( config );
						return;
					}
					config._a = [];
					getParsingFlags( config ).empty = true;

					// This array is used to make a Date, either with `new Date` or `Date.UTC`
					var string = '' + config._i,
						i,
						parsedInput,
						tokens,
						token,
						skipped,
						stringLength = string.length,
						totalParsedInputLength = 0,
						era;

					tokens = expandFormat( config._f, config._locale ).match( formattingTokens ) || [];

					for ( i = 0; i < tokens.length; i++ ) {
						token = tokens[ i ];
						parsedInput = ( string.match( getParseRegexForToken( token, config ) ) || [] )[ 0 ];
						if ( parsedInput ) {
							skipped = string.substr( 0, string.indexOf( parsedInput ) );
							if ( skipped.length > 0 ) {
								getParsingFlags( config ).unusedInput.push( skipped );
							}
							string = string.slice( string.indexOf( parsedInput ) + parsedInput.length );
							totalParsedInputLength += parsedInput.length;
						}
						// don't parse if it's not a known token
						if ( formatTokenFunctions[ token ] ) {
							if ( parsedInput ) {
								getParsingFlags( config ).empty = false;
							} else {
								getParsingFlags( config ).unusedTokens.push( token );
							}
							addTimeToArrayFromToken( token, parsedInput, config );
						} else if ( config._strict && ! parsedInput ) {
							getParsingFlags( config ).unusedTokens.push( token );
						}
					}

					// add remaining unparsed input length to the string
					getParsingFlags( config ).charsLeftOver = stringLength - totalParsedInputLength;
					if ( string.length > 0 ) {
						getParsingFlags( config ).unusedInput.push( string );
					}

					// clear _12h flag if hour is <= 12
					if (
						config._a[ HOUR ] <= 12 &&
						getParsingFlags( config ).bigHour === true &&
						config._a[ HOUR ] > 0
					) {
						getParsingFlags( config ).bigHour = undefined;
					}

					getParsingFlags( config ).parsedDateParts = config._a.slice( 0 );
					getParsingFlags( config ).meridiem = config._meridiem;
					// handle meridiem
					config._a[ HOUR ] = meridiemFixWrap(
						config._locale,
						config._a[ HOUR ],
						config._meridiem
					);

					// handle era
					era = getParsingFlags( config ).era;
					if ( era !== null ) {
						config._a[ YEAR ] = config._locale.erasConvertYear( era, config._a[ YEAR ] );
					}

					configFromArray( config );
					checkOverflow( config );
				}

				function meridiemFixWrap( locale, hour, meridiem ) {
					var isPm;

					if ( meridiem == null ) {
						// nothing to do
						return hour;
					}
					if ( locale.meridiemHour != null ) {
						return locale.meridiemHour( hour, meridiem );
					} else if ( locale.isPM != null ) {
						// Fallback
						isPm = locale.isPM( meridiem );
						if ( isPm && hour < 12 ) {
							hour += 12;
						}
						if ( ! isPm && hour === 12 ) {
							hour = 0;
						}
						return hour;
					} else {
						// this is not supposed to happen
						return hour;
					}
				}

				// date from string and array of format strings
				function configFromStringAndArray( config ) {
					var tempConfig,
						bestMoment,
						scoreToBeat,
						i,
						currentScore,
						validFormatFound,
						bestFormatIsValid = false;

					if ( config._f.length === 0 ) {
						getParsingFlags( config ).invalidFormat = true;
						config._d = new Date( NaN );
						return;
					}

					for ( i = 0; i < config._f.length; i++ ) {
						currentScore = 0;
						validFormatFound = false;
						tempConfig = copyConfig( {}, config );
						if ( config._useUTC != null ) {
							tempConfig._useUTC = config._useUTC;
						}
						tempConfig._f = config._f[ i ];
						configFromStringAndFormat( tempConfig );

						if ( isValid( tempConfig ) ) {
							validFormatFound = true;
						}

						// if there is any input that was not parsed add a penalty for that format
						currentScore += getParsingFlags( tempConfig ).charsLeftOver;

						//or tokens
						currentScore += getParsingFlags( tempConfig ).unusedTokens.length * 10;

						getParsingFlags( tempConfig ).score = currentScore;

						if ( ! bestFormatIsValid ) {
							if ( scoreToBeat == null || currentScore < scoreToBeat || validFormatFound ) {
								scoreToBeat = currentScore;
								bestMoment = tempConfig;
								if ( validFormatFound ) {
									bestFormatIsValid = true;
								}
							}
						} else {
							if ( currentScore < scoreToBeat ) {
								scoreToBeat = currentScore;
								bestMoment = tempConfig;
							}
						}
					}

					extend( config, bestMoment || tempConfig );
				}

				function configFromObject( config ) {
					if ( config._d ) {
						return;
					}

					var i = normalizeObjectUnits( config._i ),
						dayOrDate = i.day === undefined ? i.date : i.day;
					config._a = map(
						[ i.year, i.month, dayOrDate, i.hour, i.minute, i.second, i.millisecond ],
						function ( obj ) {
							return obj && parseInt( obj, 10 );
						}
					);

					configFromArray( config );
				}

				function createFromConfig( config ) {
					var res = new Moment( checkOverflow( prepareConfig( config ) ) );
					if ( res._nextDay ) {
						// Adding is smart enough around DST
						res.add( 1, 'd' );
						res._nextDay = undefined;
					}

					return res;
				}

				function prepareConfig( config ) {
					var input = config._i,
						format = config._f;

					config._locale = config._locale || getLocale( config._l );

					if ( input === null || ( format === undefined && input === '' ) ) {
						return createInvalid( { nullInput: true } );
					}

					if ( typeof input === 'string' ) {
						config._i = input = config._locale.preparse( input );
					}

					if ( isMoment( input ) ) {
						return new Moment( checkOverflow( input ) );
					} else if ( isDate( input ) ) {
						config._d = input;
					} else if ( isArray( format ) ) {
						configFromStringAndArray( config );
					} else if ( format ) {
						configFromStringAndFormat( config );
					} else {
						configFromInput( config );
					}

					if ( ! isValid( config ) ) {
						config._d = null;
					}

					return config;
				}

				function configFromInput( config ) {
					var input = config._i;
					if ( isUndefined( input ) ) {
						config._d = new Date( hooks.now() );
					} else if ( isDate( input ) ) {
						config._d = new Date( input.valueOf() );
					} else if ( typeof input === 'string' ) {
						configFromString( config );
					} else if ( isArray( input ) ) {
						config._a = map( input.slice( 0 ), function ( obj ) {
							return parseInt( obj, 10 );
						} );
						configFromArray( config );
					} else if ( isObject( input ) ) {
						configFromObject( config );
					} else if ( isNumber( input ) ) {
						// from milliseconds
						config._d = new Date( input );
					} else {
						hooks.createFromInputFallback( config );
					}
				}

				function createLocalOrUTC( input, format, locale, strict, isUTC ) {
					var c = {};

					if ( format === true || format === false ) {
						strict = format;
						format = undefined;
					}

					if ( locale === true || locale === false ) {
						strict = locale;
						locale = undefined;
					}

					if (
						( isObject( input ) && isObjectEmpty( input ) ) ||
						( isArray( input ) && input.length === 0 )
					) {
						input = undefined;
					}
					// object construction must be done this way.
					// https://github.com/moment/moment/issues/1423
					c._isAMomentObject = true;
					c._useUTC = c._isUTC = isUTC;
					c._l = locale;
					c._i = input;
					c._f = format;
					c._strict = strict;

					return createFromConfig( c );
				}

				function createLocal( input, format, locale, strict ) {
					return createLocalOrUTC( input, format, locale, strict, false );
				}

				var prototypeMin = deprecate(
						'moment().min is deprecated, use moment.max instead. http://momentjs.com/guides/#/warnings/min-max/',
						function () {
							var other = createLocal.apply( null, arguments );
							if ( this.isValid() && other.isValid() ) {
								return other < this ? this : other;
							} else {
								return createInvalid();
							}
						}
					),
					prototypeMax = deprecate(
						'moment().max is deprecated, use moment.min instead. http://momentjs.com/guides/#/warnings/min-max/',
						function () {
							var other = createLocal.apply( null, arguments );
							if ( this.isValid() && other.isValid() ) {
								return other > this ? this : other;
							} else {
								return createInvalid();
							}
						}
					);

				// Pick a moment m from moments so that m[fn](other) is true for all
				// other. This relies on the function fn to be transitive.
				//
				// moments should either be an array of moment objects or an array, whose
				// first element is an array of moment objects.
				function pickBy( fn, moments ) {
					var res, i;
					if ( moments.length === 1 && isArray( moments[ 0 ] ) ) {
						moments = moments[ 0 ];
					}
					if ( ! moments.length ) {
						return createLocal();
					}
					res = moments[ 0 ];
					for ( i = 1; i < moments.length; ++i ) {
						if ( ! moments[ i ].isValid() || moments[ i ][ fn ]( res ) ) {
							res = moments[ i ];
						}
					}
					return res;
				}

				// TODO: Use [].sort instead?
				function min() {
					var args = [].slice.call( arguments, 0 );

					return pickBy( 'isBefore', args );
				}

				function max() {
					var args = [].slice.call( arguments, 0 );

					return pickBy( 'isAfter', args );
				}

				var now = function () {
					return Date.now ? Date.now() : +new Date();
				};

				var ordering = [
					'year',
					'quarter',
					'month',
					'week',
					'day',
					'hour',
					'minute',
					'second',
					'millisecond',
				];

				function isDurationValid( m ) {
					var key,
						unitHasDecimal = false,
						i;
					for ( key in m ) {
						if (
							hasOwnProp( m, key ) &&
							! (
								indexOf.call( ordering, key ) !== -1 &&
								( m[ key ] == null || ! isNaN( m[ key ] ) )
							)
						) {
							return false;
						}
					}

					for ( i = 0; i < ordering.length; ++i ) {
						if ( m[ ordering[ i ] ] ) {
							if ( unitHasDecimal ) {
								return false; // only allow non-integers for smallest unit
							}
							if ( parseFloat( m[ ordering[ i ] ] ) !== toInt( m[ ordering[ i ] ] ) ) {
								unitHasDecimal = true;
							}
						}
					}

					return true;
				}

				function isValid$1() {
					return this._isValid;
				}

				function createInvalid$1() {
					return createDuration( NaN );
				}

				function Duration( duration ) {
					var normalizedInput = normalizeObjectUnits( duration ),
						years = normalizedInput.year || 0,
						quarters = normalizedInput.quarter || 0,
						months = normalizedInput.month || 0,
						weeks = normalizedInput.week || normalizedInput.isoWeek || 0,
						days = normalizedInput.day || 0,
						hours = normalizedInput.hour || 0,
						minutes = normalizedInput.minute || 0,
						seconds = normalizedInput.second || 0,
						milliseconds = normalizedInput.millisecond || 0;

					this._isValid = isDurationValid( normalizedInput );

					// representation for dateAddRemove
					this._milliseconds =
						+milliseconds +
						seconds * 1e3 + // 1000
						minutes * 6e4 + // 1000 * 60
						hours * 1000 * 60 * 60; //using 1000 * 60 * 60 instead of 36e5 to avoid floating point rounding errors https://github.com/moment/moment/issues/2978
					// Because of dateAddRemove treats 24 hours as different from a
					// day when working around DST, we need to store them separately
					this._days = +days + weeks * 7;
					// It is impossible to translate months into days without knowing
					// which months you are are talking about, so we have to store
					// it separately.
					this._months = +months + quarters * 3 + years * 12;

					this._data = {};

					this._locale = getLocale();

					this._bubble();
				}

				function isDuration( obj ) {
					return obj instanceof Duration;
				}

				function absRound( number ) {
					if ( number < 0 ) {
						return Math.round( -1 * number ) * -1;
					} else {
						return Math.round( number );
					}
				}

				// compare two arrays, return the number of differences
				function compareArrays( array1, array2, dontConvert ) {
					var len = Math.min( array1.length, array2.length ),
						lengthDiff = Math.abs( array1.length - array2.length ),
						diffs = 0,
						i;
					for ( i = 0; i < len; i++ ) {
						if (
							( dontConvert && array1[ i ] !== array2[ i ] ) ||
							( ! dontConvert && toInt( array1[ i ] ) !== toInt( array2[ i ] ) )
						) {
							diffs++;
						}
					}
					return diffs + lengthDiff;
				}

				// FORMATTING

				function offset( token, separator ) {
					addFormatToken( token, 0, 0, function () {
						var offset = this.utcOffset(),
							sign = '+';
						if ( offset < 0 ) {
							offset = -offset;
							sign = '-';
						}
						return (
							sign + zeroFill( ~~( offset / 60 ), 2 ) + separator + zeroFill( ~~offset % 60, 2 )
						);
					} );
				}

				offset( 'Z', ':' );
				offset( 'ZZ', '' );

				// PARSING

				addRegexToken( 'Z', matchShortOffset );
				addRegexToken( 'ZZ', matchShortOffset );
				addParseToken( [ 'Z', 'ZZ' ], function ( input, array, config ) {
					config._useUTC = true;
					config._tzm = offsetFromString( matchShortOffset, input );
				} );

				// HELPERS

				// timezone chunker
				// '+10:00' > ['10',  '00']
				// '-1530'  > ['-15', '30']
				var chunkOffset = /([\+\-]|\d\d)/gi;

				function offsetFromString( matcher, string ) {
					var matches = ( string || '' ).match( matcher ),
						chunk,
						parts,
						minutes;

					if ( matches === null ) {
						return null;
					}

					chunk = matches[ matches.length - 1 ] || [];
					parts = ( chunk + '' ).match( chunkOffset ) || [ '-', 0, 0 ];
					minutes = +( parts[ 1 ] * 60 ) + toInt( parts[ 2 ] );

					return minutes === 0 ? 0 : parts[ 0 ] === '+' ? minutes : -minutes;
				}

				// Return a moment from input, that is local/utc/zone equivalent to model.
				function cloneWithOffset( input, model ) {
					var res, diff;
					if ( model._isUTC ) {
						res = model.clone();
						diff =
							( isMoment( input ) || isDate( input )
								? input.valueOf()
								: createLocal( input ).valueOf() ) - res.valueOf();
						// Use low-level api, because this fn is low-level api.
						res._d.setTime( res._d.valueOf() + diff );
						hooks.updateOffset( res, false );
						return res;
					} else {
						return createLocal( input ).local();
					}
				}

				function getDateOffset( m ) {
					// On Firefox.24 Date#getTimezoneOffset returns a floating point.
					// https://github.com/moment/moment/pull/1871
					return -Math.round( m._d.getTimezoneOffset() );
				}

				// HOOKS

				// This function will be called whenever a moment is mutated.
				// It is intended to keep the offset in sync with the timezone.
				hooks.updateOffset = function () {};

				// MOMENTS

				// keepLocalTime = true means only change the timezone, without
				// affecting the local hour. So 5:31:26 +0300 --[utcOffset(2, true)]-->
				// 5:31:26 +0200 It is possible that 5:31:26 doesn't exist with offset
				// +0200, so we adjust the time as needed, to be valid.
				//
				// Keeping the time actually adds/subtracts (one hour)
				// from the actual represented time. That is why we call updateOffset
				// a second time. In case it wants us to change the offset again
				// _changeInProgress == true case, then we have to adjust, because
				// there is no such time in the given timezone.
				function getSetOffset( input, keepLocalTime, keepMinutes ) {
					var offset = this._offset || 0,
						localAdjust;
					if ( ! this.isValid() ) {
						return input != null ? this : NaN;
					}
					if ( input != null ) {
						if ( typeof input === 'string' ) {
							input = offsetFromString( matchShortOffset, input );
							if ( input === null ) {
								return this;
							}
						} else if ( Math.abs( input ) < 16 && ! keepMinutes ) {
							input = input * 60;
						}
						if ( ! this._isUTC && keepLocalTime ) {
							localAdjust = getDateOffset( this );
						}
						this._offset = input;
						this._isUTC = true;
						if ( localAdjust != null ) {
							this.add( localAdjust, 'm' );
						}
						if ( offset !== input ) {
							if ( ! keepLocalTime || this._changeInProgress ) {
								addSubtract( this, createDuration( input - offset, 'm' ), 1, false );
							} else if ( ! this._changeInProgress ) {
								this._changeInProgress = true;
								hooks.updateOffset( this, true );
								this._changeInProgress = null;
							}
						}
						return this;
					} else {
						return this._isUTC ? offset : getDateOffset( this );
					}
				}

				function getSetZone( input, keepLocalTime ) {
					if ( input != null ) {
						if ( typeof input !== 'string' ) {
							input = -input;
						}

						this.utcOffset( input, keepLocalTime );

						return this;
					} else {
						return -this.utcOffset();
					}
				}

				function setOffsetToUTC( keepLocalTime ) {
					return this.utcOffset( 0, keepLocalTime );
				}

				function setOffsetToLocal( keepLocalTime ) {
					if ( this._isUTC ) {
						this.utcOffset( 0, keepLocalTime );
						this._isUTC = false;

						if ( keepLocalTime ) {
							this.subtract( getDateOffset( this ), 'm' );
						}
					}
					return this;
				}

				function setOffsetToParsedOffset() {
					if ( this._tzm != null ) {
						this.utcOffset( this._tzm, false, true );
					} else if ( typeof this._i === 'string' ) {
						var tZone = offsetFromString( matchOffset, this._i );
						if ( tZone != null ) {
							this.utcOffset( tZone );
						} else {
							this.utcOffset( 0, true );
						}
					}
					return this;
				}

				function hasAlignedHourOffset( input ) {
					if ( ! this.isValid() ) {
						return false;
					}
					input = input ? createLocal( input ).utcOffset() : 0;

					return ( this.utcOffset() - input ) % 60 === 0;
				}

				function isDaylightSavingTime() {
					return (
						this.utcOffset() > this.clone().month( 0 ).utcOffset() ||
						this.utcOffset() > this.clone().month( 5 ).utcOffset()
					);
				}

				function isDaylightSavingTimeShifted() {
					if ( ! isUndefined( this._isDSTShifted ) ) {
						return this._isDSTShifted;
					}

					var c = {},
						other;

					copyConfig( c, this );
					c = prepareConfig( c );

					if ( c._a ) {
						other = c._isUTC ? createUTC( c._a ) : createLocal( c._a );
						this._isDSTShifted = this.isValid() && compareArrays( c._a, other.toArray() ) > 0;
					} else {
						this._isDSTShifted = false;
					}

					return this._isDSTShifted;
				}

				function isLocal() {
					return this.isValid() ? ! this._isUTC : false;
				}

				function isUtcOffset() {
					return this.isValid() ? this._isUTC : false;
				}

				function isUtc() {
					return this.isValid() ? this._isUTC && this._offset === 0 : false;
				}

				// ASP.NET json date format regex
				var aspNetRegex = /^(-|\+)?(?:(\d*)[. ])?(\d+):(\d+)(?::(\d+)(\.\d*)?)?$/,
					// from http://docs.closure-library.googlecode.com/git/closure_goog_date_date.js.source.html
					// somewhat more in line with 4.4.3.2 2004 spec, but allows decimal anywhere
					// and further modified to allow for strings containing both week and day
					isoRegex = /^(-|\+)?P(?:([-+]?[0-9,.]*)Y)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)W)?(?:([-+]?[0-9,.]*)D)?(?:T(?:([-+]?[0-9,.]*)H)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)S)?)?$/;

				function createDuration( input, key ) {
					var duration = input,
						// matching against regexp is expensive, do it on demand
						match = null,
						sign,
						ret,
						diffRes;

					if ( isDuration( input ) ) {
						duration = {
							ms: input._milliseconds,
							d: input._days,
							M: input._months,
						};
					} else if ( isNumber( input ) || ! isNaN( +input ) ) {
						duration = {};
						if ( key ) {
							duration[ key ] = +input;
						} else {
							duration.milliseconds = +input;
						}
					} else if ( ( match = aspNetRegex.exec( input ) ) ) {
						sign = match[ 1 ] === '-' ? -1 : 1;
						duration = {
							y: 0,
							d: toInt( match[ DATE ] ) * sign,
							h: toInt( match[ HOUR ] ) * sign,
							m: toInt( match[ MINUTE ] ) * sign,
							s: toInt( match[ SECOND ] ) * sign,
							ms: toInt( absRound( match[ MILLISECOND ] * 1000 ) ) * sign, // the millisecond decimal point is included in the match
						};
					} else if ( ( match = isoRegex.exec( input ) ) ) {
						sign = match[ 1 ] === '-' ? -1 : 1;
						duration = {
							y: parseIso( match[ 2 ], sign ),
							M: parseIso( match[ 3 ], sign ),
							w: parseIso( match[ 4 ], sign ),
							d: parseIso( match[ 5 ], sign ),
							h: parseIso( match[ 6 ], sign ),
							m: parseIso( match[ 7 ], sign ),
							s: parseIso( match[ 8 ], sign ),
						};
					} else if ( duration == null ) {
						// checks for null or undefined
						duration = {};
					} else if ( typeof duration === 'object' && ( 'from' in duration || 'to' in duration ) ) {
						diffRes = momentsDifference( createLocal( duration.from ), createLocal( duration.to ) );

						duration = {};
						duration.ms = diffRes.milliseconds;
						duration.M = diffRes.months;
					}

					ret = new Duration( duration );

					if ( isDuration( input ) && hasOwnProp( input, '_locale' ) ) {
						ret._locale = input._locale;
					}

					if ( isDuration( input ) && hasOwnProp( input, '_isValid' ) ) {
						ret._isValid = input._isValid;
					}

					return ret;
				}

				createDuration.fn = Duration.prototype;
				createDuration.invalid = createInvalid$1;

				function parseIso( inp, sign ) {
					// We'd normally use ~~inp for this, but unfortunately it also
					// converts floats to ints.
					// inp may be undefined, so careful calling replace on it.
					var res = inp && parseFloat( inp.replace( ',', '.' ) );
					// apply sign while we're at it
					return ( isNaN( res ) ? 0 : res ) * sign;
				}

				function positiveMomentsDifference( base, other ) {
					var res = {};

					res.months = other.month() - base.month() + ( other.year() - base.year() ) * 12;
					if ( base.clone().add( res.months, 'M' ).isAfter( other ) ) {
						--res.months;
					}

					res.milliseconds = +other - +base.clone().add( res.months, 'M' );

					return res;
				}

				function momentsDifference( base, other ) {
					var res;
					if ( ! ( base.isValid() && other.isValid() ) ) {
						return { milliseconds: 0, months: 0 };
					}

					other = cloneWithOffset( other, base );
					if ( base.isBefore( other ) ) {
						res = positiveMomentsDifference( base, other );
					} else {
						res = positiveMomentsDifference( other, base );
						res.milliseconds = -res.milliseconds;
						res.months = -res.months;
					}

					return res;
				}

				// TODO: remove 'name' arg after deprecation is removed
				function createAdder( direction, name ) {
					return function ( val, period ) {
						var dur, tmp;
						//invert the arguments, but complain about it
						if ( period !== null && ! isNaN( +period ) ) {
							deprecateSimple(
								name,
								'moment().' +
									name +
									'(period, number) is deprecated. Please use moment().' +
									name +
									'(number, period). ' +
									'See http://momentjs.com/guides/#/warnings/add-inverted-param/ for more info.'
							);
							tmp = val;
							val = period;
							period = tmp;
						}

						dur = createDuration( val, period );
						addSubtract( this, dur, direction );
						return this;
					};
				}

				function addSubtract( mom, duration, isAdding, updateOffset ) {
					var milliseconds = duration._milliseconds,
						days = absRound( duration._days ),
						months = absRound( duration._months );

					if ( ! mom.isValid() ) {
						// No op
						return;
					}

					updateOffset = updateOffset == null ? true : updateOffset;

					if ( months ) {
						setMonth( mom, get( mom, 'Month' ) + months * isAdding );
					}
					if ( days ) {
						set$1( mom, 'Date', get( mom, 'Date' ) + days * isAdding );
					}
					if ( milliseconds ) {
						mom._d.setTime( mom._d.valueOf() + milliseconds * isAdding );
					}
					if ( updateOffset ) {
						hooks.updateOffset( mom, days || months );
					}
				}

				var add = createAdder( 1, 'add' ),
					subtract = createAdder( -1, 'subtract' );

				function isString( input ) {
					return typeof input === 'string' || input instanceof String;
				}

				// type MomentInput = Moment | Date | string | number | (number | string)[] | MomentInputObject | void; // null | undefined
				function isMomentInput( input ) {
					return (
						isMoment( input ) ||
						isDate( input ) ||
						isString( input ) ||
						isNumber( input ) ||
						isNumberOrStringArray( input ) ||
						isMomentInputObject( input ) ||
						input === null ||
						input === undefined
					);
				}

				function isMomentInputObject( input ) {
					var objectTest = isObject( input ) && ! isObjectEmpty( input ),
						propertyTest = false,
						properties = [
							'years',
							'year',
							'y',
							'months',
							'month',
							'M',
							'days',
							'day',
							'd',
							'dates',
							'date',
							'D',
							'hours',
							'hour',
							'h',
							'minutes',
							'minute',
							'm',
							'seconds',
							'second',
							's',
							'milliseconds',
							'millisecond',
							'ms',
						],
						i,
						property;

					for ( i = 0; i < properties.length; i += 1 ) {
						property = properties[ i ];
						propertyTest = propertyTest || hasOwnProp( input, property );
					}

					return objectTest && propertyTest;
				}

				function isNumberOrStringArray( input ) {
					var arrayTest = isArray( input ),
						dataTypeTest = false;
					if ( arrayTest ) {
						dataTypeTest =
							input.filter( function ( item ) {
								return ! isNumber( item ) && isString( input );
							} ).length === 0;
					}
					return arrayTest && dataTypeTest;
				}

				function isCalendarSpec( input ) {
					var objectTest = isObject( input ) && ! isObjectEmpty( input ),
						propertyTest = false,
						properties = [ 'sameDay', 'nextDay', 'lastDay', 'nextWeek', 'lastWeek', 'sameElse' ],
						i,
						property;

					for ( i = 0; i < properties.length; i += 1 ) {
						property = properties[ i ];
						propertyTest = propertyTest || hasOwnProp( input, property );
					}

					return objectTest && propertyTest;
				}

				function getCalendarFormat( myMoment, now ) {
					var diff = myMoment.diff( now, 'days', true );
					return diff < -6
						? 'sameElse'
						: diff < -1
						? 'lastWeek'
						: diff < 0
						? 'lastDay'
						: diff < 1
						? 'sameDay'
						: diff < 2
						? 'nextDay'
						: diff < 7
						? 'nextWeek'
						: 'sameElse';
				}

				function calendar$1( time, formats ) {
					// Support for single parameter, formats only overload to the calendar function
					if ( arguments.length === 1 ) {
						if ( ! arguments[ 0 ] ) {
							time = undefined;
							formats = undefined;
						} else if ( isMomentInput( arguments[ 0 ] ) ) {
							time = arguments[ 0 ];
							formats = undefined;
						} else if ( isCalendarSpec( arguments[ 0 ] ) ) {
							formats = arguments[ 0 ];
							time = undefined;
						}
					}
					// We want to compare the start of today, vs this.
					// Getting start-of-today depends on whether we're local/utc/offset or not.
					var now = time || createLocal(),
						sod = cloneWithOffset( now, this ).startOf( 'day' ),
						format = hooks.calendarFormat( this, sod ) || 'sameElse',
						output =
							formats &&
							( isFunction( formats[ format ] )
								? formats[ format ].call( this, now )
								: formats[ format ] );

					return this.format(
						output || this.localeData().calendar( format, this, createLocal( now ) )
					);
				}

				function clone() {
					return new Moment( this );
				}

				function isAfter( input, units ) {
					var localInput = isMoment( input ) ? input : createLocal( input );
					if ( ! ( this.isValid() && localInput.isValid() ) ) {
						return false;
					}
					units = normalizeUnits( units ) || 'millisecond';
					if ( units === 'millisecond' ) {
						return this.valueOf() > localInput.valueOf();
					} else {
						return localInput.valueOf() < this.clone().startOf( units ).valueOf();
					}
				}

				function isBefore( input, units ) {
					var localInput = isMoment( input ) ? input : createLocal( input );
					if ( ! ( this.isValid() && localInput.isValid() ) ) {
						return false;
					}
					units = normalizeUnits( units ) || 'millisecond';
					if ( units === 'millisecond' ) {
						return this.valueOf() < localInput.valueOf();
					} else {
						return this.clone().endOf( units ).valueOf() < localInput.valueOf();
					}
				}

				function isBetween( from, to, units, inclusivity ) {
					var localFrom = isMoment( from ) ? from : createLocal( from ),
						localTo = isMoment( to ) ? to : createLocal( to );
					if ( ! ( this.isValid() && localFrom.isValid() && localTo.isValid() ) ) {
						return false;
					}
					inclusivity = inclusivity || '()';
					return (
						( inclusivity[ 0 ] === '('
							? this.isAfter( localFrom, units )
							: ! this.isBefore( localFrom, units ) ) &&
						( inclusivity[ 1 ] === ')'
							? this.isBefore( localTo, units )
							: ! this.isAfter( localTo, units ) )
					);
				}

				function isSame( input, units ) {
					var localInput = isMoment( input ) ? input : createLocal( input ),
						inputMs;
					if ( ! ( this.isValid() && localInput.isValid() ) ) {
						return false;
					}
					units = normalizeUnits( units ) || 'millisecond';
					if ( units === 'millisecond' ) {
						return this.valueOf() === localInput.valueOf();
					} else {
						inputMs = localInput.valueOf();
						return (
							this.clone().startOf( units ).valueOf() <= inputMs &&
							inputMs <= this.clone().endOf( units ).valueOf()
						);
					}
				}

				function isSameOrAfter( input, units ) {
					return this.isSame( input, units ) || this.isAfter( input, units );
				}

				function isSameOrBefore( input, units ) {
					return this.isSame( input, units ) || this.isBefore( input, units );
				}

				function diff( input, units, asFloat ) {
					var that, zoneDelta, output;

					if ( ! this.isValid() ) {
						return NaN;
					}

					that = cloneWithOffset( input, this );

					if ( ! that.isValid() ) {
						return NaN;
					}

					zoneDelta = ( that.utcOffset() - this.utcOffset() ) * 6e4;

					units = normalizeUnits( units );

					switch ( units ) {
						case 'year':
							output = monthDiff( this, that ) / 12;
							break;
						case 'month':
							output = monthDiff( this, that );
							break;
						case 'quarter':
							output = monthDiff( this, that ) / 3;
							break;
						case 'second':
							output = ( this - that ) / 1e3;
							break; // 1000
						case 'minute':
							output = ( this - that ) / 6e4;
							break; // 1000 * 60
						case 'hour':
							output = ( this - that ) / 36e5;
							break; // 1000 * 60 * 60
						case 'day':
							output = ( this - that - zoneDelta ) / 864e5;
							break; // 1000 * 60 * 60 * 24, negate dst
						case 'week':
							output = ( this - that - zoneDelta ) / 6048e5;
							break; // 1000 * 60 * 60 * 24 * 7, negate dst
						default:
							output = this - that;
					}

					return asFloat ? output : absFloor( output );
				}

				function monthDiff( a, b ) {
					if ( a.date() < b.date() ) {
						// end-of-month calculations work correct when the start month has more
						// days than the end month.
						return -monthDiff( b, a );
					}
					// difference in months
					var wholeMonthDiff = ( b.year() - a.year() ) * 12 + ( b.month() - a.month() ),
						// b is in (anchor - 1 month, anchor + 1 month)
						anchor = a.clone().add( wholeMonthDiff, 'months' ),
						anchor2,
						adjust;

					if ( b - anchor < 0 ) {
						anchor2 = a.clone().add( wholeMonthDiff - 1, 'months' );
						// linear across the month
						adjust = ( b - anchor ) / ( anchor - anchor2 );
					} else {
						anchor2 = a.clone().add( wholeMonthDiff + 1, 'months' );
						// linear across the month
						adjust = ( b - anchor ) / ( anchor2 - anchor );
					}

					//check for negative zero, return zero if negative zero
					return -( wholeMonthDiff + adjust ) || 0;
				}

				hooks.defaultFormat = 'YYYY-MM-DDTHH:mm:ssZ';
				hooks.defaultFormatUtc = 'YYYY-MM-DDTHH:mm:ss[Z]';

				function toString() {
					return this.clone().locale( 'en' ).format( 'ddd MMM DD YYYY HH:mm:ss [GMT]ZZ' );
				}

				function toISOString( keepOffset ) {
					if ( ! this.isValid() ) {
						return null;
					}
					var utc = keepOffset !== true,
						m = utc ? this.clone().utc() : this;
					if ( m.year() < 0 || m.year() > 9999 ) {
						return formatMoment(
							m,
							utc ? 'YYYYYY-MM-DD[T]HH:mm:ss.SSS[Z]' : 'YYYYYY-MM-DD[T]HH:mm:ss.SSSZ'
						);
					}
					if ( isFunction( Date.prototype.toISOString ) ) {
						// native implementation is ~50x faster, use it when we can
						if ( utc ) {
							return this.toDate().toISOString();
						} else {
							return new Date( this.valueOf() + this.utcOffset() * 60 * 1000 )
								.toISOString()
								.replace( 'Z', formatMoment( m, 'Z' ) );
						}
					}
					return formatMoment(
						m,
						utc ? 'YYYY-MM-DD[T]HH:mm:ss.SSS[Z]' : 'YYYY-MM-DD[T]HH:mm:ss.SSSZ'
					);
				}

				/**
				 * Return a human readable representation of a moment that can
				 * also be evaluated to get a new moment which is the same
				 *
				 * @link https://nodejs.org/dist/latest/docs/api/util.html#util_custom_inspect_function_on_objects
				 */
				function inspect() {
					if ( ! this.isValid() ) {
						return 'moment.invalid(/* ' + this._i + ' */)';
					}
					var func = 'moment',
						zone = '',
						prefix,
						year,
						datetime,
						suffix;
					if ( ! this.isLocal() ) {
						func = this.utcOffset() === 0 ? 'moment.utc' : 'moment.parseZone';
						zone = 'Z';
					}
					prefix = '[' + func + '("]';
					year = 0 <= this.year() && this.year() <= 9999 ? 'YYYY' : 'YYYYYY';
					datetime = '-MM-DD[T]HH:mm:ss.SSS';
					suffix = zone + '[")]';

					return this.format( prefix + year + datetime + suffix );
				}

				function format( inputString ) {
					if ( ! inputString ) {
						inputString = this.isUtc() ? hooks.defaultFormatUtc : hooks.defaultFormat;
					}
					var output = formatMoment( this, inputString );
					return this.localeData().postformat( output );
				}

				function from( time, withoutSuffix ) {
					if (
						this.isValid() &&
						( ( isMoment( time ) && time.isValid() ) || createLocal( time ).isValid() )
					) {
						return createDuration( { to: this, from: time } )
							.locale( this.locale() )
							.humanize( ! withoutSuffix );
					} else {
						return this.localeData().invalidDate();
					}
				}

				function fromNow( withoutSuffix ) {
					return this.from( createLocal(), withoutSuffix );
				}

				function to( time, withoutSuffix ) {
					if (
						this.isValid() &&
						( ( isMoment( time ) && time.isValid() ) || createLocal( time ).isValid() )
					) {
						return createDuration( { from: this, to: time } )
							.locale( this.locale() )
							.humanize( ! withoutSuffix );
					} else {
						return this.localeData().invalidDate();
					}
				}

				function toNow( withoutSuffix ) {
					return this.to( createLocal(), withoutSuffix );
				}

				// If passed a locale key, it will set the locale for this
				// instance.  Otherwise, it will return the locale configuration
				// variables for this instance.
				function locale( key ) {
					var newLocaleData;

					if ( key === undefined ) {
						return this._locale._abbr;
					} else {
						newLocaleData = getLocale( key );
						if ( newLocaleData != null ) {
							this._locale = newLocaleData;
						}
						return this;
					}
				}

				var lang = deprecate(
					'moment().lang() is deprecated. Instead, use moment().localeData() to get the language configuration. Use moment().locale() to change languages.',
					function ( key ) {
						if ( key === undefined ) {
							return this.localeData();
						} else {
							return this.locale( key );
						}
					}
				);

				function localeData() {
					return this._locale;
				}

				var MS_PER_SECOND = 1000,
					MS_PER_MINUTE = 60 * MS_PER_SECOND,
					MS_PER_HOUR = 60 * MS_PER_MINUTE,
					MS_PER_400_YEARS = ( 365 * 400 + 97 ) * 24 * MS_PER_HOUR;

				// actual modulo - handles negative numbers (for dates before 1970):
				function mod$1( dividend, divisor ) {
					return ( ( dividend % divisor ) + divisor ) % divisor;
				}

				function localStartOfDate( y, m, d ) {
					// the date constructor remaps years 0-99 to 1900-1999
					if ( y < 100 && y >= 0 ) {
						// preserve leap years using a full 400 year cycle, then reset
						return new Date( y + 400, m, d ) - MS_PER_400_YEARS;
					} else {
						return new Date( y, m, d ).valueOf();
					}
				}

				function utcStartOfDate( y, m, d ) {
					// Date.UTC remaps years 0-99 to 1900-1999
					if ( y < 100 && y >= 0 ) {
						// preserve leap years using a full 400 year cycle, then reset
						return Date.UTC( y + 400, m, d ) - MS_PER_400_YEARS;
					} else {
						return Date.UTC( y, m, d );
					}
				}

				function startOf( units ) {
					var time, startOfDate;
					units = normalizeUnits( units );
					if ( units === undefined || units === 'millisecond' || ! this.isValid() ) {
						return this;
					}

					startOfDate = this._isUTC ? utcStartOfDate : localStartOfDate;

					switch ( units ) {
						case 'year':
							time = startOfDate( this.year(), 0, 1 );
							break;
						case 'quarter':
							time = startOfDate( this.year(), this.month() - ( this.month() % 3 ), 1 );
							break;
						case 'month':
							time = startOfDate( this.year(), this.month(), 1 );
							break;
						case 'week':
							time = startOfDate( this.year(), this.month(), this.date() - this.weekday() );
							break;
						case 'isoWeek':
							time = startOfDate(
								this.year(),
								this.month(),
								this.date() - ( this.isoWeekday() - 1 )
							);
							break;
						case 'day':
						case 'date':
							time = startOfDate( this.year(), this.month(), this.date() );
							break;
						case 'hour':
							time = this._d.valueOf();
							time -= mod$1(
								time + ( this._isUTC ? 0 : this.utcOffset() * MS_PER_MINUTE ),
								MS_PER_HOUR
							);
							break;
						case 'minute':
							time = this._d.valueOf();
							time -= mod$1( time, MS_PER_MINUTE );
							break;
						case 'second':
							time = this._d.valueOf();
							time -= mod$1( time, MS_PER_SECOND );
							break;
					}

					this._d.setTime( time );
					hooks.updateOffset( this, true );
					return this;
				}

				function endOf( units ) {
					var time, startOfDate;
					units = normalizeUnits( units );
					if ( units === undefined || units === 'millisecond' || ! this.isValid() ) {
						return this;
					}

					startOfDate = this._isUTC ? utcStartOfDate : localStartOfDate;

					switch ( units ) {
						case 'year':
							time = startOfDate( this.year() + 1, 0, 1 ) - 1;
							break;
						case 'quarter':
							time = startOfDate( this.year(), this.month() - ( this.month() % 3 ) + 3, 1 ) - 1;
							break;
						case 'month':
							time = startOfDate( this.year(), this.month() + 1, 1 ) - 1;
							break;
						case 'week':
							time = startOfDate( this.year(), this.month(), this.date() - this.weekday() + 7 ) - 1;
							break;
						case 'isoWeek':
							time =
								startOfDate(
									this.year(),
									this.month(),
									this.date() - ( this.isoWeekday() - 1 ) + 7
								) - 1;
							break;
						case 'day':
						case 'date':
							time = startOfDate( this.year(), this.month(), this.date() + 1 ) - 1;
							break;
						case 'hour':
							time = this._d.valueOf();
							time +=
								MS_PER_HOUR -
								mod$1(
									time + ( this._isUTC ? 0 : this.utcOffset() * MS_PER_MINUTE ),
									MS_PER_HOUR
								) -
								1;
							break;
						case 'minute':
							time = this._d.valueOf();
							time += MS_PER_MINUTE - mod$1( time, MS_PER_MINUTE ) - 1;
							break;
						case 'second':
							time = this._d.valueOf();
							time += MS_PER_SECOND - mod$1( time, MS_PER_SECOND ) - 1;
							break;
					}

					this._d.setTime( time );
					hooks.updateOffset( this, true );
					return this;
				}

				function valueOf() {
					return this._d.valueOf() - ( this._offset || 0 ) * 60000;
				}

				function unix() {
					return Math.floor( this.valueOf() / 1000 );
				}

				function toDate() {
					return new Date( this.valueOf() );
				}

				function toArray() {
					var m = this;
					return [
						m.year(),
						m.month(),
						m.date(),
						m.hour(),
						m.minute(),
						m.second(),
						m.millisecond(),
					];
				}

				function toObject() {
					var m = this;
					return {
						years: m.year(),
						months: m.month(),
						date: m.date(),
						hours: m.hours(),
						minutes: m.minutes(),
						seconds: m.seconds(),
						milliseconds: m.milliseconds(),
					};
				}

				function toJSON() {
					// new Date(NaN).toJSON() === null
					return this.isValid() ? this.toISOString() : null;
				}

				function isValid$2() {
					return isValid( this );
				}

				function parsingFlags() {
					return extend( {}, getParsingFlags( this ) );
				}

				function invalidAt() {
					return getParsingFlags( this ).overflow;
				}

				function creationData() {
					return {
						input: this._i,
						format: this._f,
						locale: this._locale,
						isUTC: this._isUTC,
						strict: this._strict,
					};
				}

				addFormatToken( 'N', 0, 0, 'eraAbbr' );
				addFormatToken( 'NN', 0, 0, 'eraAbbr' );
				addFormatToken( 'NNN', 0, 0, 'eraAbbr' );
				addFormatToken( 'NNNN', 0, 0, 'eraName' );
				addFormatToken( 'NNNNN', 0, 0, 'eraNarrow' );

				addFormatToken( 'y', [ 'y', 1 ], 'yo', 'eraYear' );
				addFormatToken( 'y', [ 'yy', 2 ], 0, 'eraYear' );
				addFormatToken( 'y', [ 'yyy', 3 ], 0, 'eraYear' );
				addFormatToken( 'y', [ 'yyyy', 4 ], 0, 'eraYear' );

				addRegexToken( 'N', matchEraAbbr );
				addRegexToken( 'NN', matchEraAbbr );
				addRegexToken( 'NNN', matchEraAbbr );
				addRegexToken( 'NNNN', matchEraName );
				addRegexToken( 'NNNNN', matchEraNarrow );

				addParseToken( [ 'N', 'NN', 'NNN', 'NNNN', 'NNNNN' ], function (
					input,
					array,
					config,
					token
				) {
					var era = config._locale.erasParse( input, token, config._strict );
					if ( era ) {
						getParsingFlags( config ).era = era;
					} else {
						getParsingFlags( config ).invalidEra = input;
					}
				} );

				addRegexToken( 'y', matchUnsigned );
				addRegexToken( 'yy', matchUnsigned );
				addRegexToken( 'yyy', matchUnsigned );
				addRegexToken( 'yyyy', matchUnsigned );
				addRegexToken( 'yo', matchEraYearOrdinal );

				addParseToken( [ 'y', 'yy', 'yyy', 'yyyy' ], YEAR );
				addParseToken( [ 'yo' ], function ( input, array, config, token ) {
					var match;
					if ( config._locale._eraYearOrdinalRegex ) {
						match = input.match( config._locale._eraYearOrdinalRegex );
					}

					if ( config._locale.eraYearOrdinalParse ) {
						array[ YEAR ] = config._locale.eraYearOrdinalParse( input, match );
					} else {
						array[ YEAR ] = parseInt( input, 10 );
					}
				} );

				function localeEras( m, format ) {
					var i,
						l,
						date,
						eras = this._eras || getLocale( 'en' )._eras;
					for ( i = 0, l = eras.length; i < l; ++i ) {
						switch ( typeof eras[ i ].since ) {
							case 'string':
								// truncate time
								date = hooks( eras[ i ].since ).startOf( 'day' );
								eras[ i ].since = date.valueOf();
								break;
						}

						switch ( typeof eras[ i ].until ) {
							case 'undefined':
								eras[ i ].until = +Infinity;
								break;
							case 'string':
								// truncate time
								date = hooks( eras[ i ].until ).startOf( 'day' ).valueOf();
								eras[ i ].until = date.valueOf();
								break;
						}
					}
					return eras;
				}

				function localeErasParse( eraName, format, strict ) {
					var i,
						l,
						eras = this.eras(),
						name,
						abbr,
						narrow;
					eraName = eraName.toUpperCase();

					for ( i = 0, l = eras.length; i < l; ++i ) {
						name = eras[ i ].name.toUpperCase();
						abbr = eras[ i ].abbr.toUpperCase();
						narrow = eras[ i ].narrow.toUpperCase();

						if ( strict ) {
							switch ( format ) {
								case 'N':
								case 'NN':
								case 'NNN':
									if ( abbr === eraName ) {
										return eras[ i ];
									}
									break;

								case 'NNNN':
									if ( name === eraName ) {
										return eras[ i ];
									}
									break;

								case 'NNNNN':
									if ( narrow === eraName ) {
										return eras[ i ];
									}
									break;
							}
						} else if ( [ name, abbr, narrow ].indexOf( eraName ) >= 0 ) {
							return eras[ i ];
						}
					}
				}

				function localeErasConvertYear( era, year ) {
					var dir = era.since <= era.until ? +1 : -1;
					if ( year === undefined ) {
						return hooks( era.since ).year();
					} else {
						return hooks( era.since ).year() + ( year - era.offset ) * dir;
					}
				}

				function getEraName() {
					var i,
						l,
						val,
						eras = this.localeData().eras();
					for ( i = 0, l = eras.length; i < l; ++i ) {
						// truncate time
						val = this.clone().startOf( 'day' ).valueOf();

						if ( eras[ i ].since <= val && val <= eras[ i ].until ) {
							return eras[ i ].name;
						}
						if ( eras[ i ].until <= val && val <= eras[ i ].since ) {
							return eras[ i ].name;
						}
					}

					return '';
				}

				function getEraNarrow() {
					var i,
						l,
						val,
						eras = this.localeData().eras();
					for ( i = 0, l = eras.length; i < l; ++i ) {
						// truncate time
						val = this.clone().startOf( 'day' ).valueOf();

						if ( eras[ i ].since <= val && val <= eras[ i ].until ) {
							return eras[ i ].narrow;
						}
						if ( eras[ i ].until <= val && val <= eras[ i ].since ) {
							return eras[ i ].narrow;
						}
					}

					return '';
				}

				function getEraAbbr() {
					var i,
						l,
						val,
						eras = this.localeData().eras();
					for ( i = 0, l = eras.length; i < l; ++i ) {
						// truncate time
						val = this.clone().startOf( 'day' ).valueOf();

						if ( eras[ i ].since <= val && val <= eras[ i ].until ) {
							return eras[ i ].abbr;
						}
						if ( eras[ i ].until <= val && val <= eras[ i ].since ) {
							return eras[ i ].abbr;
						}
					}

					return '';
				}

				function getEraYear() {
					var i,
						l,
						dir,
						val,
						eras = this.localeData().eras();
					for ( i = 0, l = eras.length; i < l; ++i ) {
						dir = eras[ i ].since <= eras[ i ].until ? +1 : -1;

						// truncate time
						val = this.clone().startOf( 'day' ).valueOf();

						if (
							( eras[ i ].since <= val && val <= eras[ i ].until ) ||
							( eras[ i ].until <= val && val <= eras[ i ].since )
						) {
							return ( this.year() - hooks( eras[ i ].since ).year() ) * dir + eras[ i ].offset;
						}
					}

					return this.year();
				}

				function erasNameRegex( isStrict ) {
					if ( ! hasOwnProp( this, '_erasNameRegex' ) ) {
						computeErasParse.call( this );
					}
					return isStrict ? this._erasNameRegex : this._erasRegex;
				}

				function erasAbbrRegex( isStrict ) {
					if ( ! hasOwnProp( this, '_erasAbbrRegex' ) ) {
						computeErasParse.call( this );
					}
					return isStrict ? this._erasAbbrRegex : this._erasRegex;
				}

				function erasNarrowRegex( isStrict ) {
					if ( ! hasOwnProp( this, '_erasNarrowRegex' ) ) {
						computeErasParse.call( this );
					}
					return isStrict ? this._erasNarrowRegex : this._erasRegex;
				}

				function matchEraAbbr( isStrict, locale ) {
					return locale.erasAbbrRegex( isStrict );
				}

				function matchEraName( isStrict, locale ) {
					return locale.erasNameRegex( isStrict );
				}

				function matchEraNarrow( isStrict, locale ) {
					return locale.erasNarrowRegex( isStrict );
				}

				function matchEraYearOrdinal( isStrict, locale ) {
					return locale._eraYearOrdinalRegex || matchUnsigned;
				}

				function computeErasParse() {
					var abbrPieces = [],
						namePieces = [],
						narrowPieces = [],
						mixedPieces = [],
						i,
						l,
						eras = this.eras();

					for ( i = 0, l = eras.length; i < l; ++i ) {
						namePieces.push( regexEscape( eras[ i ].name ) );
						abbrPieces.push( regexEscape( eras[ i ].abbr ) );
						narrowPieces.push( regexEscape( eras[ i ].narrow ) );

						mixedPieces.push( regexEscape( eras[ i ].name ) );
						mixedPieces.push( regexEscape( eras[ i ].abbr ) );
						mixedPieces.push( regexEscape( eras[ i ].narrow ) );
					}

					this._erasRegex = new RegExp( '^(' + mixedPieces.join( '|' ) + ')', 'i' );
					this._erasNameRegex = new RegExp( '^(' + namePieces.join( '|' ) + ')', 'i' );
					this._erasAbbrRegex = new RegExp( '^(' + abbrPieces.join( '|' ) + ')', 'i' );
					this._erasNarrowRegex = new RegExp( '^(' + narrowPieces.join( '|' ) + ')', 'i' );
				}

				// FORMATTING

				addFormatToken( 0, [ 'gg', 2 ], 0, function () {
					return this.weekYear() % 100;
				} );

				addFormatToken( 0, [ 'GG', 2 ], 0, function () {
					return this.isoWeekYear() % 100;
				} );

				function addWeekYearFormatToken( token, getter ) {
					addFormatToken( 0, [ token, token.length ], 0, getter );
				}

				addWeekYearFormatToken( 'gggg', 'weekYear' );
				addWeekYearFormatToken( 'ggggg', 'weekYear' );
				addWeekYearFormatToken( 'GGGG', 'isoWeekYear' );
				addWeekYearFormatToken( 'GGGGG', 'isoWeekYear' );

				// ALIASES

				addUnitAlias( 'weekYear', 'gg' );
				addUnitAlias( 'isoWeekYear', 'GG' );

				// PRIORITY

				addUnitPriority( 'weekYear', 1 );
				addUnitPriority( 'isoWeekYear', 1 );

				// PARSING

				addRegexToken( 'G', matchSigned );
				addRegexToken( 'g', matchSigned );
				addRegexToken( 'GG', match1to2, match2 );
				addRegexToken( 'gg', match1to2, match2 );
				addRegexToken( 'GGGG', match1to4, match4 );
				addRegexToken( 'gggg', match1to4, match4 );
				addRegexToken( 'GGGGG', match1to6, match6 );
				addRegexToken( 'ggggg', match1to6, match6 );

				addWeekParseToken( [ 'gggg', 'ggggg', 'GGGG', 'GGGGG' ], function (
					input,
					week,
					config,
					token
				) {
					week[ token.substr( 0, 2 ) ] = toInt( input );
				} );

				addWeekParseToken( [ 'gg', 'GG' ], function ( input, week, config, token ) {
					week[ token ] = hooks.parseTwoDigitYear( input );
				} );

				// MOMENTS

				function getSetWeekYear( input ) {
					return getSetWeekYearHelper.call(
						this,
						input,
						this.week(),
						this.weekday(),
						this.localeData()._week.dow,
						this.localeData()._week.doy
					);
				}

				function getSetISOWeekYear( input ) {
					return getSetWeekYearHelper.call( this, input, this.isoWeek(), this.isoWeekday(), 1, 4 );
				}

				function getISOWeeksInYear() {
					return weeksInYear( this.year(), 1, 4 );
				}

				function getISOWeeksInISOWeekYear() {
					return weeksInYear( this.isoWeekYear(), 1, 4 );
				}

				function getWeeksInYear() {
					var weekInfo = this.localeData()._week;
					return weeksInYear( this.year(), weekInfo.dow, weekInfo.doy );
				}

				function getWeeksInWeekYear() {
					var weekInfo = this.localeData()._week;
					return weeksInYear( this.weekYear(), weekInfo.dow, weekInfo.doy );
				}

				function getSetWeekYearHelper( input, week, weekday, dow, doy ) {
					var weeksTarget;
					if ( input == null ) {
						return weekOfYear( this, dow, doy ).year;
					} else {
						weeksTarget = weeksInYear( input, dow, doy );
						if ( week > weeksTarget ) {
							week = weeksTarget;
						}
						return setWeekAll.call( this, input, week, weekday, dow, doy );
					}
				}

				function setWeekAll( weekYear, week, weekday, dow, doy ) {
					var dayOfYearData = dayOfYearFromWeeks( weekYear, week, weekday, dow, doy ),
						date = createUTCDate( dayOfYearData.year, 0, dayOfYearData.dayOfYear );

					this.year( date.getUTCFullYear() );
					this.month( date.getUTCMonth() );
					this.date( date.getUTCDate() );
					return this;
				}

				// FORMATTING

				addFormatToken( 'Q', 0, 'Qo', 'quarter' );

				// ALIASES

				addUnitAlias( 'quarter', 'Q' );

				// PRIORITY

				addUnitPriority( 'quarter', 7 );

				// PARSING

				addRegexToken( 'Q', match1 );
				addParseToken( 'Q', function ( input, array ) {
					array[ MONTH ] = ( toInt( input ) - 1 ) * 3;
				} );

				// MOMENTS

				function getSetQuarter( input ) {
					return input == null
						? Math.ceil( ( this.month() + 1 ) / 3 )
						: this.month( ( input - 1 ) * 3 + ( this.month() % 3 ) );
				}

				// FORMATTING

				addFormatToken( 'D', [ 'DD', 2 ], 'Do', 'date' );

				// ALIASES

				addUnitAlias( 'date', 'D' );

				// PRIORITY
				addUnitPriority( 'date', 9 );

				// PARSING

				addRegexToken( 'D', match1to2 );
				addRegexToken( 'DD', match1to2, match2 );
				addRegexToken( 'Do', function ( isStrict, locale ) {
					// TODO: Remove "ordinalParse" fallback in next major release.
					return isStrict
						? locale._dayOfMonthOrdinalParse || locale._ordinalParse
						: locale._dayOfMonthOrdinalParseLenient;
				} );

				addParseToken( [ 'D', 'DD' ], DATE );
				addParseToken( 'Do', function ( input, array ) {
					array[ DATE ] = toInt( input.match( match1to2 )[ 0 ] );
				} );

				// MOMENTS

				var getSetDayOfMonth = makeGetSet( 'Date', true );

				// FORMATTING

				addFormatToken( 'DDD', [ 'DDDD', 3 ], 'DDDo', 'dayOfYear' );

				// ALIASES

				addUnitAlias( 'dayOfYear', 'DDD' );

				// PRIORITY
				addUnitPriority( 'dayOfYear', 4 );

				// PARSING

				addRegexToken( 'DDD', match1to3 );
				addRegexToken( 'DDDD', match3 );
				addParseToken( [ 'DDD', 'DDDD' ], function ( input, array, config ) {
					config._dayOfYear = toInt( input );
				} );

				// HELPERS

				// MOMENTS

				function getSetDayOfYear( input ) {
					var dayOfYear =
						Math.round(
							( this.clone().startOf( 'day' ) - this.clone().startOf( 'year' ) ) / 864e5
						) + 1;
					return input == null ? dayOfYear : this.add( input - dayOfYear, 'd' );
				}

				// FORMATTING

				addFormatToken( 'm', [ 'mm', 2 ], 0, 'minute' );

				// ALIASES

				addUnitAlias( 'minute', 'm' );

				// PRIORITY

				addUnitPriority( 'minute', 14 );

				// PARSING

				addRegexToken( 'm', match1to2 );
				addRegexToken( 'mm', match1to2, match2 );
				addParseToken( [ 'm', 'mm' ], MINUTE );

				// MOMENTS

				var getSetMinute = makeGetSet( 'Minutes', false );

				// FORMATTING

				addFormatToken( 's', [ 'ss', 2 ], 0, 'second' );

				// ALIASES

				addUnitAlias( 'second', 's' );

				// PRIORITY

				addUnitPriority( 'second', 15 );

				// PARSING

				addRegexToken( 's', match1to2 );
				addRegexToken( 'ss', match1to2, match2 );
				addParseToken( [ 's', 'ss' ], SECOND );

				// MOMENTS

				var getSetSecond = makeGetSet( 'Seconds', false );

				// FORMATTING

				addFormatToken( 'S', 0, 0, function () {
					return ~~( this.millisecond() / 100 );
				} );

				addFormatToken( 0, [ 'SS', 2 ], 0, function () {
					return ~~( this.millisecond() / 10 );
				} );

				addFormatToken( 0, [ 'SSS', 3 ], 0, 'millisecond' );
				addFormatToken( 0, [ 'SSSS', 4 ], 0, function () {
					return this.millisecond() * 10;
				} );
				addFormatToken( 0, [ 'SSSSS', 5 ], 0, function () {
					return this.millisecond() * 100;
				} );
				addFormatToken( 0, [ 'SSSSSS', 6 ], 0, function () {
					return this.millisecond() * 1000;
				} );
				addFormatToken( 0, [ 'SSSSSSS', 7 ], 0, function () {
					return this.millisecond() * 10000;
				} );
				addFormatToken( 0, [ 'SSSSSSSS', 8 ], 0, function () {
					return this.millisecond() * 100000;
				} );
				addFormatToken( 0, [ 'SSSSSSSSS', 9 ], 0, function () {
					return this.millisecond() * 1000000;
				} );

				// ALIASES

				addUnitAlias( 'millisecond', 'ms' );

				// PRIORITY

				addUnitPriority( 'millisecond', 16 );

				// PARSING

				addRegexToken( 'S', match1to3, match1 );
				addRegexToken( 'SS', match1to3, match2 );
				addRegexToken( 'SSS', match1to3, match3 );

				var token, getSetMillisecond;
				for ( token = 'SSSS'; token.length <= 9; token += 'S' ) {
					addRegexToken( token, matchUnsigned );
				}

				function parseMs( input, array ) {
					array[ MILLISECOND ] = toInt( ( '0.' + input ) * 1000 );
				}

				for ( token = 'S'; token.length <= 9; token += 'S' ) {
					addParseToken( token, parseMs );
				}

				getSetMillisecond = makeGetSet( 'Milliseconds', false );

				// FORMATTING

				addFormatToken( 'z', 0, 0, 'zoneAbbr' );
				addFormatToken( 'zz', 0, 0, 'zoneName' );

				// MOMENTS

				function getZoneAbbr() {
					return this._isUTC ? 'UTC' : '';
				}

				function getZoneName() {
					return this._isUTC ? 'Coordinated Universal Time' : '';
				}

				var proto = Moment.prototype;

				proto.add = add;
				proto.calendar = calendar$1;
				proto.clone = clone;
				proto.diff = diff;
				proto.endOf = endOf;
				proto.format = format;
				proto.from = from;
				proto.fromNow = fromNow;
				proto.to = to;
				proto.toNow = toNow;
				proto.get = stringGet;
				proto.invalidAt = invalidAt;
				proto.isAfter = isAfter;
				proto.isBefore = isBefore;
				proto.isBetween = isBetween;
				proto.isSame = isSame;
				proto.isSameOrAfter = isSameOrAfter;
				proto.isSameOrBefore = isSameOrBefore;
				proto.isValid = isValid$2;
				proto.lang = lang;
				proto.locale = locale;
				proto.localeData = localeData;
				proto.max = prototypeMax;
				proto.min = prototypeMin;
				proto.parsingFlags = parsingFlags;
				proto.set = stringSet;
				proto.startOf = startOf;
				proto.subtract = subtract;
				proto.toArray = toArray;
				proto.toObject = toObject;
				proto.toDate = toDate;
				proto.toISOString = toISOString;
				proto.inspect = inspect;
				if ( typeof Symbol !== 'undefined' && Symbol.for != null ) {
					proto[ Symbol.for( 'nodejs.util.inspect.custom' ) ] = function () {
						return 'Moment<' + this.format() + '>';
					};
				}
				proto.toJSON = toJSON;
				proto.toString = toString;
				proto.unix = unix;
				proto.valueOf = valueOf;
				proto.creationData = creationData;
				proto.eraName = getEraName;
				proto.eraNarrow = getEraNarrow;
				proto.eraAbbr = getEraAbbr;
				proto.eraYear = getEraYear;
				proto.year = getSetYear;
				proto.isLeapYear = getIsLeapYear;
				proto.weekYear = getSetWeekYear;
				proto.isoWeekYear = getSetISOWeekYear;
				proto.quarter = proto.quarters = getSetQuarter;
				proto.month = getSetMonth;
				proto.daysInMonth = getDaysInMonth;
				proto.week = proto.weeks = getSetWeek;
				proto.isoWeek = proto.isoWeeks = getSetISOWeek;
				proto.weeksInYear = getWeeksInYear;
				proto.weeksInWeekYear = getWeeksInWeekYear;
				proto.isoWeeksInYear = getISOWeeksInYear;
				proto.isoWeeksInISOWeekYear = getISOWeeksInISOWeekYear;
				proto.date = getSetDayOfMonth;
				proto.day = proto.days = getSetDayOfWeek;
				proto.weekday = getSetLocaleDayOfWeek;
				proto.isoWeekday = getSetISODayOfWeek;
				proto.dayOfYear = getSetDayOfYear;
				proto.hour = proto.hours = getSetHour;
				proto.minute = proto.minutes = getSetMinute;
				proto.second = proto.seconds = getSetSecond;
				proto.millisecond = proto.milliseconds = getSetMillisecond;
				proto.utcOffset = getSetOffset;
				proto.utc = setOffsetToUTC;
				proto.local = setOffsetToLocal;
				proto.parseZone = setOffsetToParsedOffset;
				proto.hasAlignedHourOffset = hasAlignedHourOffset;
				proto.isDST = isDaylightSavingTime;
				proto.isLocal = isLocal;
				proto.isUtcOffset = isUtcOffset;
				proto.isUtc = isUtc;
				proto.isUTC = isUtc;
				proto.zoneAbbr = getZoneAbbr;
				proto.zoneName = getZoneName;
				proto.dates = deprecate(
					'dates accessor is deprecated. Use date instead.',
					getSetDayOfMonth
				);
				proto.months = deprecate( 'months accessor is deprecated. Use month instead', getSetMonth );
				proto.years = deprecate( 'years accessor is deprecated. Use year instead', getSetYear );
				proto.zone = deprecate(
					'moment().zone is deprecated, use moment().utcOffset instead. http://momentjs.com/guides/#/warnings/zone/',
					getSetZone
				);
				proto.isDSTShifted = deprecate(
					'isDSTShifted is deprecated. See http://momentjs.com/guides/#/warnings/dst-shifted/ for more information',
					isDaylightSavingTimeShifted
				);

				function createUnix( input ) {
					return createLocal( input * 1000 );
				}

				function createInZone() {
					return createLocal.apply( null, arguments ).parseZone();
				}

				function preParsePostFormat( string ) {
					return string;
				}

				var proto$1 = Locale.prototype;

				proto$1.calendar = calendar;
				proto$1.longDateFormat = longDateFormat;
				proto$1.invalidDate = invalidDate;
				proto$1.ordinal = ordinal;
				proto$1.preparse = preParsePostFormat;
				proto$1.postformat = preParsePostFormat;
				proto$1.relativeTime = relativeTime;
				proto$1.pastFuture = pastFuture;
				proto$1.set = set;
				proto$1.eras = localeEras;
				proto$1.erasParse = localeErasParse;
				proto$1.erasConvertYear = localeErasConvertYear;
				proto$1.erasAbbrRegex = erasAbbrRegex;
				proto$1.erasNameRegex = erasNameRegex;
				proto$1.erasNarrowRegex = erasNarrowRegex;

				proto$1.months = localeMonths;
				proto$1.monthsShort = localeMonthsShort;
				proto$1.monthsParse = localeMonthsParse;
				proto$1.monthsRegex = monthsRegex;
				proto$1.monthsShortRegex = monthsShortRegex;
				proto$1.week = localeWeek;
				proto$1.firstDayOfYear = localeFirstDayOfYear;
				proto$1.firstDayOfWeek = localeFirstDayOfWeek;

				proto$1.weekdays = localeWeekdays;
				proto$1.weekdaysMin = localeWeekdaysMin;
				proto$1.weekdaysShort = localeWeekdaysShort;
				proto$1.weekdaysParse = localeWeekdaysParse;

				proto$1.weekdaysRegex = weekdaysRegex;
				proto$1.weekdaysShortRegex = weekdaysShortRegex;
				proto$1.weekdaysMinRegex = weekdaysMinRegex;

				proto$1.isPM = localeIsPM;
				proto$1.meridiem = localeMeridiem;

				function get$1( format, index, field, setter ) {
					var locale = getLocale(),
						utc = createUTC().set( setter, index );
					return locale[ field ]( utc, format );
				}

				function listMonthsImpl( format, index, field ) {
					if ( isNumber( format ) ) {
						index = format;
						format = undefined;
					}

					format = format || '';

					if ( index != null ) {
						return get$1( format, index, field, 'month' );
					}

					var i,
						out = [];
					for ( i = 0; i < 12; i++ ) {
						out[ i ] = get$1( format, i, field, 'month' );
					}
					return out;
				}

				// ()
				// (5)
				// (fmt, 5)
				// (fmt)
				// (true)
				// (true, 5)
				// (true, fmt, 5)
				// (true, fmt)
				function listWeekdaysImpl( localeSorted, format, index, field ) {
					if ( typeof localeSorted === 'boolean' ) {
						if ( isNumber( format ) ) {
							index = format;
							format = undefined;
						}

						format = format || '';
					} else {
						format = localeSorted;
						index = format;
						localeSorted = false;

						if ( isNumber( format ) ) {
							index = format;
							format = undefined;
						}

						format = format || '';
					}

					var locale = getLocale(),
						shift = localeSorted ? locale._week.dow : 0,
						i,
						out = [];

					if ( index != null ) {
						return get$1( format, ( index + shift ) % 7, field, 'day' );
					}

					for ( i = 0; i < 7; i++ ) {
						out[ i ] = get$1( format, ( i + shift ) % 7, field, 'day' );
					}
					return out;
				}

				function listMonths( format, index ) {
					return listMonthsImpl( format, index, 'months' );
				}

				function listMonthsShort( format, index ) {
					return listMonthsImpl( format, index, 'monthsShort' );
				}

				function listWeekdays( localeSorted, format, index ) {
					return listWeekdaysImpl( localeSorted, format, index, 'weekdays' );
				}

				function listWeekdaysShort( localeSorted, format, index ) {
					return listWeekdaysImpl( localeSorted, format, index, 'weekdaysShort' );
				}

				function listWeekdaysMin( localeSorted, format, index ) {
					return listWeekdaysImpl( localeSorted, format, index, 'weekdaysMin' );
				}

				getSetGlobalLocale( 'en', {
					eras: [
						{
							since: '0001-01-01',
							until: +Infinity,
							offset: 1,
							name: 'Anno Domini',
							narrow: 'AD',
							abbr: 'AD',
						},
						{
							since: '0000-12-31',
							until: -Infinity,
							offset: 1,
							name: 'Before Christ',
							narrow: 'BC',
							abbr: 'BC',
						},
					],
					dayOfMonthOrdinalParse: /\d{1,2}(th|st|nd|rd)/,
					ordinal: function ( number ) {
						var b = number % 10,
							output =
								toInt( ( number % 100 ) / 10 ) === 1
									? 'th'
									: b === 1
									? 'st'
									: b === 2
									? 'nd'
									: b === 3
									? 'rd'
									: 'th';
						return number + output;
					},
				} );

				// Side effect imports

				hooks.lang = deprecate(
					'moment.lang is deprecated. Use moment.locale instead.',
					getSetGlobalLocale
				);
				hooks.langData = deprecate(
					'moment.langData is deprecated. Use moment.localeData instead.',
					getLocale
				);

				var mathAbs = Math.abs;

				function abs() {
					var data = this._data;

					this._milliseconds = mathAbs( this._milliseconds );
					this._days = mathAbs( this._days );
					this._months = mathAbs( this._months );

					data.milliseconds = mathAbs( data.milliseconds );
					data.seconds = mathAbs( data.seconds );
					data.minutes = mathAbs( data.minutes );
					data.hours = mathAbs( data.hours );
					data.months = mathAbs( data.months );
					data.years = mathAbs( data.years );

					return this;
				}

				function addSubtract$1( duration, input, value, direction ) {
					var other = createDuration( input, value );

					duration._milliseconds += direction * other._milliseconds;
					duration._days += direction * other._days;
					duration._months += direction * other._months;

					return duration._bubble();
				}

				// supports only 2.0-style add(1, 's') or add(duration)
				function add$1( input, value ) {
					return addSubtract$1( this, input, value, 1 );
				}

				// supports only 2.0-style subtract(1, 's') or subtract(duration)
				function subtract$1( input, value ) {
					return addSubtract$1( this, input, value, -1 );
				}

				function absCeil( number ) {
					if ( number < 0 ) {
						return Math.floor( number );
					} else {
						return Math.ceil( number );
					}
				}

				function bubble() {
					var milliseconds = this._milliseconds,
						days = this._days,
						months = this._months,
						data = this._data,
						seconds,
						minutes,
						hours,
						years,
						monthsFromDays;

					// if we have a mix of positive and negative values, bubble down first
					// check: https://github.com/moment/moment/issues/2166
					if (
						! (
							( milliseconds >= 0 && days >= 0 && months >= 0 ) ||
							( milliseconds <= 0 && days <= 0 && months <= 0 )
						)
					) {
						milliseconds += absCeil( monthsToDays( months ) + days ) * 864e5;
						days = 0;
						months = 0;
					}

					// The following code bubbles up values, see the tests for
					// examples of what that means.
					data.milliseconds = milliseconds % 1000;

					seconds = absFloor( milliseconds / 1000 );
					data.seconds = seconds % 60;

					minutes = absFloor( seconds / 60 );
					data.minutes = minutes % 60;

					hours = absFloor( minutes / 60 );
					data.hours = hours % 24;

					days += absFloor( hours / 24 );

					// convert days to months
					monthsFromDays = absFloor( daysToMonths( days ) );
					months += monthsFromDays;
					days -= absCeil( monthsToDays( monthsFromDays ) );

					// 12 months -> 1 year
					years = absFloor( months / 12 );
					months %= 12;

					data.days = days;
					data.months = months;
					data.years = years;

					return this;
				}

				function daysToMonths( days ) {
					// 400 years have 146097 days (taking into account leap year rules)
					// 400 years have 12 months === 4800
					return ( days * 4800 ) / 146097;
				}

				function monthsToDays( months ) {
					// the reverse of daysToMonths
					return ( months * 146097 ) / 4800;
				}

				function as( units ) {
					if ( ! this.isValid() ) {
						return NaN;
					}
					var days,
						months,
						milliseconds = this._milliseconds;

					units = normalizeUnits( units );

					if ( units === 'month' || units === 'quarter' || units === 'year' ) {
						days = this._days + milliseconds / 864e5;
						months = this._months + daysToMonths( days );
						switch ( units ) {
							case 'month':
								return months;
							case 'quarter':
								return months / 3;
							case 'year':
								return months / 12;
						}
					} else {
						// handle milliseconds separately because of floating point math errors (issue #1867)
						days = this._days + Math.round( monthsToDays( this._months ) );
						switch ( units ) {
							case 'week':
								return days / 7 + milliseconds / 6048e5;
							case 'day':
								return days + milliseconds / 864e5;
							case 'hour':
								return days * 24 + milliseconds / 36e5;
							case 'minute':
								return days * 1440 + milliseconds / 6e4;
							case 'second':
								return days * 86400 + milliseconds / 1000;
							// Math.floor prevents floating point math errors here
							case 'millisecond':
								return Math.floor( days * 864e5 ) + milliseconds;
							default:
								throw new Error( 'Unknown unit ' + units );
						}
					}
				}

				// TODO: Use this.as('ms')?
				function valueOf$1() {
					if ( ! this.isValid() ) {
						return NaN;
					}
					return (
						this._milliseconds +
						this._days * 864e5 +
						( this._months % 12 ) * 2592e6 +
						toInt( this._months / 12 ) * 31536e6
					);
				}

				function makeAs( alias ) {
					return function () {
						return this.as( alias );
					};
				}

				var asMilliseconds = makeAs( 'ms' ),
					asSeconds = makeAs( 's' ),
					asMinutes = makeAs( 'm' ),
					asHours = makeAs( 'h' ),
					asDays = makeAs( 'd' ),
					asWeeks = makeAs( 'w' ),
					asMonths = makeAs( 'M' ),
					asQuarters = makeAs( 'Q' ),
					asYears = makeAs( 'y' );

				function clone$1() {
					return createDuration( this );
				}

				function get$2( units ) {
					units = normalizeUnits( units );
					return this.isValid() ? this[ units + 's' ]() : NaN;
				}

				function makeGetter( name ) {
					return function () {
						return this.isValid() ? this._data[ name ] : NaN;
					};
				}

				var milliseconds = makeGetter( 'milliseconds' ),
					seconds = makeGetter( 'seconds' ),
					minutes = makeGetter( 'minutes' ),
					hours = makeGetter( 'hours' ),
					days = makeGetter( 'days' ),
					months = makeGetter( 'months' ),
					years = makeGetter( 'years' );

				function weeks() {
					return absFloor( this.days() / 7 );
				}

				var round = Math.round,
					thresholds = {
						ss: 44, // a few seconds to seconds
						s: 45, // seconds to minute
						m: 45, // minutes to hour
						h: 22, // hours to day
						d: 26, // days to month/week
						w: null, // weeks to month
						M: 11, // months to year
					};

				// helper function for moment.fn.from, moment.fn.fromNow, and moment.duration.fn.humanize
				function substituteTimeAgo( string, number, withoutSuffix, isFuture, locale ) {
					return locale.relativeTime( number || 1, !! withoutSuffix, string, isFuture );
				}

				function relativeTime$1( posNegDuration, withoutSuffix, thresholds, locale ) {
					var duration = createDuration( posNegDuration ).abs(),
						seconds = round( duration.as( 's' ) ),
						minutes = round( duration.as( 'm' ) ),
						hours = round( duration.as( 'h' ) ),
						days = round( duration.as( 'd' ) ),
						months = round( duration.as( 'M' ) ),
						weeks = round( duration.as( 'w' ) ),
						years = round( duration.as( 'y' ) ),
						a =
							( seconds <= thresholds.ss && [ 's', seconds ] ) ||
							( seconds < thresholds.s && [ 'ss', seconds ] ) ||
							( minutes <= 1 && [ 'm' ] ) ||
							( minutes < thresholds.m && [ 'mm', minutes ] ) ||
							( hours <= 1 && [ 'h' ] ) ||
							( hours < thresholds.h && [ 'hh', hours ] ) ||
							( days <= 1 && [ 'd' ] ) ||
							( days < thresholds.d && [ 'dd', days ] );

					if ( thresholds.w != null ) {
						a = a || ( weeks <= 1 && [ 'w' ] ) || ( weeks < thresholds.w && [ 'ww', weeks ] );
					}
					a = a ||
						( months <= 1 && [ 'M' ] ) ||
						( months < thresholds.M && [ 'MM', months ] ) ||
						( years <= 1 && [ 'y' ] ) || [ 'yy', years ];

					a[ 2 ] = withoutSuffix;
					a[ 3 ] = +posNegDuration > 0;
					a[ 4 ] = locale;
					return substituteTimeAgo.apply( null, a );
				}

				// This function allows you to set the rounding function for relative time strings
				function getSetRelativeTimeRounding( roundingFunction ) {
					if ( roundingFunction === undefined ) {
						return round;
					}
					if ( typeof roundingFunction === 'function' ) {
						round = roundingFunction;
						return true;
					}
					return false;
				}

				// This function allows you to set a threshold for relative time strings
				function getSetRelativeTimeThreshold( threshold, limit ) {
					if ( thresholds[ threshold ] === undefined ) {
						return false;
					}
					if ( limit === undefined ) {
						return thresholds[ threshold ];
					}
					thresholds[ threshold ] = limit;
					if ( threshold === 's' ) {
						thresholds.ss = limit - 1;
					}
					return true;
				}

				function humanize( argWithSuffix, argThresholds ) {
					if ( ! this.isValid() ) {
						return this.localeData().invalidDate();
					}

					var withSuffix = false,
						th = thresholds,
						locale,
						output;

					if ( typeof argWithSuffix === 'object' ) {
						argThresholds = argWithSuffix;
						argWithSuffix = false;
					}
					if ( typeof argWithSuffix === 'boolean' ) {
						withSuffix = argWithSuffix;
					}
					if ( typeof argThresholds === 'object' ) {
						th = Object.assign( {}, thresholds, argThresholds );
						if ( argThresholds.s != null && argThresholds.ss == null ) {
							th.ss = argThresholds.s - 1;
						}
					}

					locale = this.localeData();
					output = relativeTime$1( this, ! withSuffix, th, locale );

					if ( withSuffix ) {
						output = locale.pastFuture( +this, output );
					}

					return locale.postformat( output );
				}

				var abs$1 = Math.abs;

				function sign( x ) {
					return ( x > 0 ) - ( x < 0 ) || +x;
				}

				function toISOString$1() {
					// for ISO strings we do not use the normal bubbling rules:
					//  * milliseconds bubble up until they become hours
					//  * days do not bubble at all
					//  * months bubble up until they become years
					// This is because there is no context-free conversion between hours and days
					// (think of clock changes)
					// and also not between days and months (28-31 days per month)
					if ( ! this.isValid() ) {
						return this.localeData().invalidDate();
					}

					var seconds = abs$1( this._milliseconds ) / 1000,
						days = abs$1( this._days ),
						months = abs$1( this._months ),
						minutes,
						hours,
						years,
						s,
						total = this.asSeconds(),
						totalSign,
						ymSign,
						daysSign,
						hmsSign;

					if ( ! total ) {
						// this is the same as C#'s (Noda) and python (isodate)...
						// but not other JS (goog.date)
						return 'P0D';
					}

					// 3600 seconds -> 60 minutes -> 1 hour
					minutes = absFloor( seconds / 60 );
					hours = absFloor( minutes / 60 );
					seconds %= 60;
					minutes %= 60;

					// 12 months -> 1 year
					years = absFloor( months / 12 );
					months %= 12;

					// inspired by https://github.com/dordille/moment-isoduration/blob/master/moment.isoduration.js
					s = seconds ? seconds.toFixed( 3 ).replace( /\.?0+$/, '' ) : '';

					totalSign = total < 0 ? '-' : '';
					ymSign = sign( this._months ) !== sign( total ) ? '-' : '';
					daysSign = sign( this._days ) !== sign( total ) ? '-' : '';
					hmsSign = sign( this._milliseconds ) !== sign( total ) ? '-' : '';

					return (
						totalSign +
						'P' +
						( years ? ymSign + years + 'Y' : '' ) +
						( months ? ymSign + months + 'M' : '' ) +
						( days ? daysSign + days + 'D' : '' ) +
						( hours || minutes || seconds ? 'T' : '' ) +
						( hours ? hmsSign + hours + 'H' : '' ) +
						( minutes ? hmsSign + minutes + 'M' : '' ) +
						( seconds ? hmsSign + s + 'S' : '' )
					);
				}

				var proto$2 = Duration.prototype;

				proto$2.isValid = isValid$1;
				proto$2.abs = abs;
				proto$2.add = add$1;
				proto$2.subtract = subtract$1;
				proto$2.as = as;
				proto$2.asMilliseconds = asMilliseconds;
				proto$2.asSeconds = asSeconds;
				proto$2.asMinutes = asMinutes;
				proto$2.asHours = asHours;
				proto$2.asDays = asDays;
				proto$2.asWeeks = asWeeks;
				proto$2.asMonths = asMonths;
				proto$2.asQuarters = asQuarters;
				proto$2.asYears = asYears;
				proto$2.valueOf = valueOf$1;
				proto$2._bubble = bubble;
				proto$2.clone = clone$1;
				proto$2.get = get$2;
				proto$2.milliseconds = milliseconds;
				proto$2.seconds = seconds;
				proto$2.minutes = minutes;
				proto$2.hours = hours;
				proto$2.days = days;
				proto$2.weeks = weeks;
				proto$2.months = months;
				proto$2.years = years;
				proto$2.humanize = humanize;
				proto$2.toISOString = toISOString$1;
				proto$2.toString = toISOString$1;
				proto$2.toJSON = toISOString$1;
				proto$2.locale = locale;
				proto$2.localeData = localeData;

				proto$2.toIsoString = deprecate(
					'toIsoString() is deprecated. Please use toISOString() instead (notice the capitals)',
					toISOString$1
				);
				proto$2.lang = lang;

				// FORMATTING

				addFormatToken( 'X', 0, 0, 'unix' );
				addFormatToken( 'x', 0, 0, 'valueOf' );

				// PARSING

				addRegexToken( 'x', matchSigned );
				addRegexToken( 'X', matchTimestamp );
				addParseToken( 'X', function ( input, array, config ) {
					config._d = new Date( parseFloat( input ) * 1000 );
				} );
				addParseToken( 'x', function ( input, array, config ) {
					config._d = new Date( toInt( input ) );
				} );

				//! moment.js

				hooks.version = '2.29.1';

				setHookCallback( createLocal );

				hooks.fn = proto;
				hooks.min = min;
				hooks.max = max;
				hooks.now = now;
				hooks.utc = createUTC;
				hooks.unix = createUnix;
				hooks.months = listMonths;
				hooks.isDate = isDate;
				hooks.locale = getSetGlobalLocale;
				hooks.invalid = createInvalid;
				hooks.duration = createDuration;
				hooks.isMoment = isMoment;
				hooks.weekdays = listWeekdays;
				hooks.parseZone = createInZone;
				hooks.localeData = getLocale;
				hooks.isDuration = isDuration;
				hooks.monthsShort = listMonthsShort;
				hooks.weekdaysMin = listWeekdaysMin;
				hooks.defineLocale = defineLocale;
				hooks.updateLocale = updateLocale;
				hooks.locales = listLocales;
				hooks.weekdaysShort = listWeekdaysShort;
				hooks.normalizeUnits = normalizeUnits;
				hooks.relativeTimeRounding = getSetRelativeTimeRounding;
				hooks.relativeTimeThreshold = getSetRelativeTimeThreshold;
				hooks.calendarFormat = getCalendarFormat;
				hooks.prototype = proto;

				// currently HTML5 input type only supports 24-hour formats
				hooks.HTML5_FMT = {
					DATETIME_LOCAL: 'YYYY-MM-DDTHH:mm', // <input type="datetime-local" />
					DATETIME_LOCAL_SECONDS: 'YYYY-MM-DDTHH:mm:ss', // <input type="datetime-local" step="1" />
					DATETIME_LOCAL_MS: 'YYYY-MM-DDTHH:mm:ss.SSS', // <input type="datetime-local" step="0.001" />
					DATE: 'YYYY-MM-DD', // <input type="date" />
					TIME: 'HH:mm', // <input type="time" />
					TIME_SECONDS: 'HH:mm:ss', // <input type="time" step="1" />
					TIME_MS: 'HH:mm:ss.SSS', // <input type="time" step="0.001" />
					WEEK: 'GGGG-[W]WW', // <input type="week" />
					MONTH: 'YYYY-MM', // <input type="month" />
				};

				return hooks;
			} );

			/***/
		},

		/***/ 467: /***/ ( module, exports, __nccwpck_require__ ) => {
			'use strict';

			Object.defineProperty( exports, '__esModule', { value: true } );

			function _interopDefault( ex ) {
				return ex && typeof ex === 'object' && 'default' in ex ? ex[ 'default' ] : ex;
			}

			var Stream = _interopDefault( __nccwpck_require__( 2413 ) );
			var http = _interopDefault( __nccwpck_require__( 8605 ) );
			var Url = _interopDefault( __nccwpck_require__( 8835 ) );
			var https = _interopDefault( __nccwpck_require__( 7211 ) );
			var zlib = _interopDefault( __nccwpck_require__( 8761 ) );

			// Based on https://github.com/tmpvar/jsdom/blob/aa85b2abf07766ff7bf5c1f6daafb3726f2f2db5/lib/jsdom/living/blob.js

			// fix for "Readable" isn't a named export issue
			const Readable = Stream.Readable;

			const BUFFER = Symbol( 'buffer' );
			const TYPE = Symbol( 'type' );

			class Blob {
				constructor() {
					this[ TYPE ] = '';

					const blobParts = arguments[ 0 ];
					const options = arguments[ 1 ];

					const buffers = [];
					let size = 0;

					if ( blobParts ) {
						const a = blobParts;
						const length = Number( a.length );
						for ( let i = 0; i < length; i++ ) {
							const element = a[ i ];
							let buffer;
							if ( element instanceof Buffer ) {
								buffer = element;
							} else if ( ArrayBuffer.isView( element ) ) {
								buffer = Buffer.from( element.buffer, element.byteOffset, element.byteLength );
							} else if ( element instanceof ArrayBuffer ) {
								buffer = Buffer.from( element );
							} else if ( element instanceof Blob ) {
								buffer = element[ BUFFER ];
							} else {
								buffer = Buffer.from( typeof element === 'string' ? element : String( element ) );
							}
							size += buffer.length;
							buffers.push( buffer );
						}
					}

					this[ BUFFER ] = Buffer.concat( buffers );

					let type = options && options.type !== undefined && String( options.type ).toLowerCase();
					if ( type && ! /[^\u0020-\u007E]/.test( type ) ) {
						this[ TYPE ] = type;
					}
				}
				get size() {
					return this[ BUFFER ].length;
				}
				get type() {
					return this[ TYPE ];
				}
				text() {
					return Promise.resolve( this[ BUFFER ].toString() );
				}
				arrayBuffer() {
					const buf = this[ BUFFER ];
					const ab = buf.buffer.slice( buf.byteOffset, buf.byteOffset + buf.byteLength );
					return Promise.resolve( ab );
				}
				stream() {
					const readable = new Readable();
					readable._read = function () {};
					readable.push( this[ BUFFER ] );
					readable.push( null );
					return readable;
				}
				toString() {
					return '[object Blob]';
				}
				slice() {
					const size = this.size;

					const start = arguments[ 0 ];
					const end = arguments[ 1 ];
					let relativeStart, relativeEnd;
					if ( start === undefined ) {
						relativeStart = 0;
					} else if ( start < 0 ) {
						relativeStart = Math.max( size + start, 0 );
					} else {
						relativeStart = Math.min( start, size );
					}
					if ( end === undefined ) {
						relativeEnd = size;
					} else if ( end < 0 ) {
						relativeEnd = Math.max( size + end, 0 );
					} else {
						relativeEnd = Math.min( end, size );
					}
					const span = Math.max( relativeEnd - relativeStart, 0 );

					const buffer = this[ BUFFER ];
					const slicedBuffer = buffer.slice( relativeStart, relativeStart + span );
					const blob = new Blob( [], { type: arguments[ 2 ] } );
					blob[ BUFFER ] = slicedBuffer;
					return blob;
				}
			}

			Object.defineProperties( Blob.prototype, {
				size: { enumerable: true },
				type: { enumerable: true },
				slice: { enumerable: true },
			} );

			Object.defineProperty( Blob.prototype, Symbol.toStringTag, {
				value: 'Blob',
				writable: false,
				enumerable: false,
				configurable: true,
			} );

			/**
			 * fetch-error.js
			 *
			 * FetchError interface for operational errors
			 */

			/**
			 * Create FetchError instance
			 *
			 * @param   String      message      Error message for human
			 * @param   String      type         Error type for machine
			 * @param   String      systemError  For Node.js system error
			 * @return  FetchError
			 */
			function FetchError( message, type, systemError ) {
				Error.call( this, message );

				this.message = message;
				this.type = type;

				// when err.type is `system`, err.code contains system error code
				if ( systemError ) {
					this.code = this.errno = systemError.code;
				}

				// hide custom error implementation details from end-users
				Error.captureStackTrace( this, this.constructor );
			}

			FetchError.prototype = Object.create( Error.prototype );
			FetchError.prototype.constructor = FetchError;
			FetchError.prototype.name = 'FetchError';

			let convert;
			try {
				convert = __nccwpck_require__( 2877 ).convert;
			} catch ( e ) {}

			const INTERNALS = Symbol( 'Body internals' );

			// fix an issue where "PassThrough" isn't a named export for node <10
			const PassThrough = Stream.PassThrough;

			/**
			 * Body mixin
			 *
			 * Ref: https://fetch.spec.whatwg.org/#body
			 *
			 * @param   Stream  body  Readable stream
			 * @param   Object  opts  Response options
			 * @return  Void
			 */
			function Body( body ) {
				var _this = this;

				var _ref = arguments.length > 1 && arguments[ 1 ] !== undefined ? arguments[ 1 ] : {},
					_ref$size = _ref.size;

				let size = _ref$size === undefined ? 0 : _ref$size;
				var _ref$timeout = _ref.timeout;
				let timeout = _ref$timeout === undefined ? 0 : _ref$timeout;

				if ( body == null ) {
					// body is undefined or null
					body = null;
				} else if ( isURLSearchParams( body ) ) {
					// body is a URLSearchParams
					body = Buffer.from( body.toString() );
				} else if ( isBlob( body ) );
				else if ( Buffer.isBuffer( body ) );
				else if ( Object.prototype.toString.call( body ) === '[object ArrayBuffer]' ) {
					// body is ArrayBuffer
					body = Buffer.from( body );
				} else if ( ArrayBuffer.isView( body ) ) {
					// body is ArrayBufferView
					body = Buffer.from( body.buffer, body.byteOffset, body.byteLength );
				} else if ( body instanceof Stream );
				else {
					// none of the above
					// coerce to string then buffer
					body = Buffer.from( String( body ) );
				}
				this[ INTERNALS ] = {
					body,
					disturbed: false,
					error: null,
				};
				this.size = size;
				this.timeout = timeout;

				if ( body instanceof Stream ) {
					body.on( 'error', function ( err ) {
						const error =
							err.name === 'AbortError'
								? err
								: new FetchError(
										`Invalid response body while trying to fetch ${ _this.url }: ${ err.message }`,
										'system',
										err
								  );
						_this[ INTERNALS ].error = error;
					} );
				}
			}

			Body.prototype = {
				get body() {
					return this[ INTERNALS ].body;
				},

				get bodyUsed() {
					return this[ INTERNALS ].disturbed;
				},

				/**
				 * Decode response as ArrayBuffer
				 *
				 * @return  Promise
				 */
				arrayBuffer() {
					return consumeBody.call( this ).then( function ( buf ) {
						return buf.buffer.slice( buf.byteOffset, buf.byteOffset + buf.byteLength );
					} );
				},

				/**
				 * Return raw response as Blob
				 *
				 * @return Promise
				 */
				blob() {
					let ct = ( this.headers && this.headers.get( 'content-type' ) ) || '';
					return consumeBody.call( this ).then( function ( buf ) {
						return Object.assign(
							// Prevent copying
							new Blob( [], {
								type: ct.toLowerCase(),
							} ),
							{
								[ BUFFER ]: buf,
							}
						);
					} );
				},

				/**
				 * Decode response as json
				 *
				 * @return  Promise
				 */
				json() {
					var _this2 = this;

					return consumeBody.call( this ).then( function ( buffer ) {
						try {
							return JSON.parse( buffer.toString() );
						} catch ( err ) {
							return Body.Promise.reject(
								new FetchError(
									`invalid json response body at ${ _this2.url } reason: ${ err.message }`,
									'invalid-json'
								)
							);
						}
					} );
				},

				/**
				 * Decode response as text
				 *
				 * @return  Promise
				 */
				text() {
					return consumeBody.call( this ).then( function ( buffer ) {
						return buffer.toString();
					} );
				},

				/**
				 * Decode response as buffer (non-spec api)
				 *
				 * @return  Promise
				 */
				buffer() {
					return consumeBody.call( this );
				},

				/**
				 * Decode response as text, while automatically detecting the encoding and
				 * trying to decode to UTF-8 (non-spec api)
				 *
				 * @return  Promise
				 */
				textConverted() {
					var _this3 = this;

					return consumeBody.call( this ).then( function ( buffer ) {
						return convertBody( buffer, _this3.headers );
					} );
				},
			};

			// In browsers, all properties are enumerable.
			Object.defineProperties( Body.prototype, {
				body: { enumerable: true },
				bodyUsed: { enumerable: true },
				arrayBuffer: { enumerable: true },
				blob: { enumerable: true },
				json: { enumerable: true },
				text: { enumerable: true },
			} );

			Body.mixIn = function ( proto ) {
				for ( const name of Object.getOwnPropertyNames( Body.prototype ) ) {
					// istanbul ignore else: future proof
					if ( ! ( name in proto ) ) {
						const desc = Object.getOwnPropertyDescriptor( Body.prototype, name );
						Object.defineProperty( proto, name, desc );
					}
				}
			};

			/**
			 * Consume and convert an entire Body to a Buffer.
			 *
			 * Ref: https://fetch.spec.whatwg.org/#concept-body-consume-body
			 *
			 * @return  Promise
			 */
			function consumeBody() {
				var _this4 = this;

				if ( this[ INTERNALS ].disturbed ) {
					return Body.Promise.reject( new TypeError( `body used already for: ${ this.url }` ) );
				}

				this[ INTERNALS ].disturbed = true;

				if ( this[ INTERNALS ].error ) {
					return Body.Promise.reject( this[ INTERNALS ].error );
				}

				let body = this.body;

				// body is null
				if ( body === null ) {
					return Body.Promise.resolve( Buffer.alloc( 0 ) );
				}

				// body is blob
				if ( isBlob( body ) ) {
					body = body.stream();
				}

				// body is buffer
				if ( Buffer.isBuffer( body ) ) {
					return Body.Promise.resolve( body );
				}

				// istanbul ignore if: should never happen
				if ( ! ( body instanceof Stream ) ) {
					return Body.Promise.resolve( Buffer.alloc( 0 ) );
				}

				// body is stream
				// get ready to actually consume the body
				let accum = [];
				let accumBytes = 0;
				let abort = false;

				return new Body.Promise( function ( resolve, reject ) {
					let resTimeout;

					// allow timeout on slow response body
					if ( _this4.timeout ) {
						resTimeout = setTimeout( function () {
							abort = true;
							reject(
								new FetchError(
									`Response timeout while trying to fetch ${ _this4.url } (over ${ _this4.timeout }ms)`,
									'body-timeout'
								)
							);
						}, _this4.timeout );
					}

					// handle stream errors
					body.on( 'error', function ( err ) {
						if ( err.name === 'AbortError' ) {
							// if the request was aborted, reject with this Error
							abort = true;
							reject( err );
						} else {
							// other errors, such as incorrect content-encoding
							reject(
								new FetchError(
									`Invalid response body while trying to fetch ${ _this4.url }: ${ err.message }`,
									'system',
									err
								)
							);
						}
					} );

					body.on( 'data', function ( chunk ) {
						if ( abort || chunk === null ) {
							return;
						}

						if ( _this4.size && accumBytes + chunk.length > _this4.size ) {
							abort = true;
							reject(
								new FetchError(
									`content size at ${ _this4.url } over limit: ${ _this4.size }`,
									'max-size'
								)
							);
							return;
						}

						accumBytes += chunk.length;
						accum.push( chunk );
					} );

					body.on( 'end', function () {
						if ( abort ) {
							return;
						}

						clearTimeout( resTimeout );

						try {
							resolve( Buffer.concat( accum, accumBytes ) );
						} catch ( err ) {
							// handle streams that have accumulated too much data (issue #414)
							reject(
								new FetchError(
									`Could not create Buffer from response body for ${ _this4.url }: ${ err.message }`,
									'system',
									err
								)
							);
						}
					} );
				} );
			}

			/**
			 * Detect buffer encoding and convert to target encoding
			 * ref: http://www.w3.org/TR/2011/WD-html5-20110113/parsing.html#determining-the-character-encoding
			 *
			 * @param   Buffer  buffer    Incoming buffer
			 * @param   String  encoding  Target encoding
			 * @return  String
			 */
			function convertBody( buffer, headers ) {
				if ( typeof convert !== 'function' ) {
					throw new Error(
						'The package `encoding` must be installed to use the textConverted() function'
					);
				}

				const ct = headers.get( 'content-type' );
				let charset = 'utf-8';
				let res, str;

				// header
				if ( ct ) {
					res = /charset=([^;]*)/i.exec( ct );
				}

				// no charset in content type, peek at response body for at most 1024 bytes
				str = buffer.slice( 0, 1024 ).toString();

				// html5
				if ( ! res && str ) {
					res = /<meta.+?charset=(['"])(.+?)\1/i.exec( str );
				}

				// html4
				if ( ! res && str ) {
					res = /<meta[\s]+?http-equiv=(['"])content-type\1[\s]+?content=(['"])(.+?)\2/i.exec(
						str
					);
					if ( ! res ) {
						res = /<meta[\s]+?content=(['"])(.+?)\1[\s]+?http-equiv=(['"])content-type\3/i.exec(
							str
						);
						if ( res ) {
							res.pop(); // drop last quote
						}
					}

					if ( res ) {
						res = /charset=(.*)/i.exec( res.pop() );
					}
				}

				// xml
				if ( ! res && str ) {
					res = /<\?xml.+?encoding=(['"])(.+?)\1/i.exec( str );
				}

				// found charset
				if ( res ) {
					charset = res.pop();

					// prevent decode issues when sites use incorrect encoding
					// ref: https://hsivonen.fi/encoding-menu/
					if ( charset === 'gb2312' || charset === 'gbk' ) {
						charset = 'gb18030';
					}
				}

				// turn raw buffers into a single utf-8 buffer
				return convert( buffer, 'UTF-8', charset ).toString();
			}

			/**
			 * Detect a URLSearchParams object
			 * ref: https://github.com/bitinn/node-fetch/issues/296#issuecomment-307598143
			 *
			 * @param   Object  obj     Object to detect by type or brand
			 * @return  String
			 */
			function isURLSearchParams( obj ) {
				// Duck-typing as a necessary condition.
				if (
					typeof obj !== 'object' ||
					typeof obj.append !== 'function' ||
					typeof obj.delete !== 'function' ||
					typeof obj.get !== 'function' ||
					typeof obj.getAll !== 'function' ||
					typeof obj.has !== 'function' ||
					typeof obj.set !== 'function'
				) {
					return false;
				}

				// Brand-checking and more duck-typing as optional condition.
				return (
					obj.constructor.name === 'URLSearchParams' ||
					Object.prototype.toString.call( obj ) === '[object URLSearchParams]' ||
					typeof obj.sort === 'function'
				);
			}

			/**
			 * Check if `obj` is a W3C `Blob` object (which `File` inherits from)
			 * @param  {*} obj
			 * @return {boolean}
			 */
			function isBlob( obj ) {
				return (
					typeof obj === 'object' &&
					typeof obj.arrayBuffer === 'function' &&
					typeof obj.type === 'string' &&
					typeof obj.stream === 'function' &&
					typeof obj.constructor === 'function' &&
					typeof obj.constructor.name === 'string' &&
					/^(Blob|File)$/.test( obj.constructor.name ) &&
					/^(Blob|File)$/.test( obj[ Symbol.toStringTag ] )
				);
			}

			/**
			 * Clone body given Res/Req instance
			 *
			 * @param   Mixed  instance  Response or Request instance
			 * @return  Mixed
			 */
			function clone( instance ) {
				let p1, p2;
				let body = instance.body;

				// don't allow cloning a used body
				if ( instance.bodyUsed ) {
					throw new Error( 'cannot clone body after it is used' );
				}

				// check that body is a stream and not form-data object
				// note: we can't clone the form-data object without having it as a dependency
				if ( body instanceof Stream && typeof body.getBoundary !== 'function' ) {
					// tee instance body
					p1 = new PassThrough();
					p2 = new PassThrough();
					body.pipe( p1 );
					body.pipe( p2 );
					// set instance body to teed body and return the other teed body
					instance[ INTERNALS ].body = p1;
					body = p2;
				}

				return body;
			}

			/**
			 * Performs the operation "extract a `Content-Type` value from |object|" as
			 * specified in the specification:
			 * https://fetch.spec.whatwg.org/#concept-bodyinit-extract
			 *
			 * This function assumes that instance.body is present.
			 *
			 * @param   Mixed  instance  Any options.body input
			 */
			function extractContentType( body ) {
				if ( body === null ) {
					// body is null
					return null;
				} else if ( typeof body === 'string' ) {
					// body is string
					return 'text/plain;charset=UTF-8';
				} else if ( isURLSearchParams( body ) ) {
					// body is a URLSearchParams
					return 'application/x-www-form-urlencoded;charset=UTF-8';
				} else if ( isBlob( body ) ) {
					// body is blob
					return body.type || null;
				} else if ( Buffer.isBuffer( body ) ) {
					// body is buffer
					return null;
				} else if ( Object.prototype.toString.call( body ) === '[object ArrayBuffer]' ) {
					// body is ArrayBuffer
					return null;
				} else if ( ArrayBuffer.isView( body ) ) {
					// body is ArrayBufferView
					return null;
				} else if ( typeof body.getBoundary === 'function' ) {
					// detect form data input from form-data module
					return `multipart/form-data;boundary=${ body.getBoundary() }`;
				} else if ( body instanceof Stream ) {
					// body is stream
					// can't really do much about this
					return null;
				} else {
					// Body constructor defaults other things to string
					return 'text/plain;charset=UTF-8';
				}
			}

			/**
			 * The Fetch Standard treats this as if "total bytes" is a property on the body.
			 * For us, we have to explicitly get it with a function.
			 *
			 * ref: https://fetch.spec.whatwg.org/#concept-body-total-bytes
			 *
			 * @param   Body    instance   Instance of Body
			 * @return  Number?            Number of bytes, or null if not possible
			 */
			function getTotalBytes( instance ) {
				const body = instance.body;

				if ( body === null ) {
					// body is null
					return 0;
				} else if ( isBlob( body ) ) {
					return body.size;
				} else if ( Buffer.isBuffer( body ) ) {
					// body is buffer
					return body.length;
				} else if ( body && typeof body.getLengthSync === 'function' ) {
					// detect form data input from form-data module
					if (
						( body._lengthRetrievers && body._lengthRetrievers.length == 0 ) || // 1.x
						( body.hasKnownLength && body.hasKnownLength() )
					) {
						// 2.x
						return body.getLengthSync();
					}
					return null;
				} else {
					// body is stream
					return null;
				}
			}

			/**
			 * Write a Body to a Node.js WritableStream (e.g. http.Request) object.
			 *
			 * @param   Body    instance   Instance of Body
			 * @return  Void
			 */
			function writeToStream( dest, instance ) {
				const body = instance.body;

				if ( body === null ) {
					// body is null
					dest.end();
				} else if ( isBlob( body ) ) {
					body.stream().pipe( dest );
				} else if ( Buffer.isBuffer( body ) ) {
					// body is buffer
					dest.write( body );
					dest.end();
				} else {
					// body is stream
					body.pipe( dest );
				}
			}

			// expose Promise
			Body.Promise = global.Promise;

			/**
			 * headers.js
			 *
			 * Headers class offers convenient helpers
			 */

			const invalidTokenRegex = /[^\^_`a-zA-Z\-0-9!#$%&'*+.|~]/;
			const invalidHeaderCharRegex = /[^\t\x20-\x7e\x80-\xff]/;

			function validateName( name ) {
				name = `${ name }`;
				if ( invalidTokenRegex.test( name ) || name === '' ) {
					throw new TypeError( `${ name } is not a legal HTTP header name` );
				}
			}

			function validateValue( value ) {
				value = `${ value }`;
				if ( invalidHeaderCharRegex.test( value ) ) {
					throw new TypeError( `${ value } is not a legal HTTP header value` );
				}
			}

			/**
			 * Find the key in the map object given a header name.
			 *
			 * Returns undefined if not found.
			 *
			 * @param   String  name  Header name
			 * @return  String|Undefined
			 */
			function find( map, name ) {
				name = name.toLowerCase();
				for ( const key in map ) {
					if ( key.toLowerCase() === name ) {
						return key;
					}
				}
				return undefined;
			}

			const MAP = Symbol( 'map' );
			class Headers {
				/**
				 * Headers class
				 *
				 * @param   Object  headers  Response headers
				 * @return  Void
				 */
				constructor() {
					let init =
						arguments.length > 0 && arguments[ 0 ] !== undefined ? arguments[ 0 ] : undefined;

					this[ MAP ] = Object.create( null );

					if ( init instanceof Headers ) {
						const rawHeaders = init.raw();
						const headerNames = Object.keys( rawHeaders );

						for ( const headerName of headerNames ) {
							for ( const value of rawHeaders[ headerName ] ) {
								this.append( headerName, value );
							}
						}

						return;
					}

					// We don't worry about converting prop to ByteString here as append()
					// will handle it.
					if ( init == null );
					else if ( typeof init === 'object' ) {
						const method = init[ Symbol.iterator ];
						if ( method != null ) {
							if ( typeof method !== 'function' ) {
								throw new TypeError( 'Header pairs must be iterable' );
							}

							// sequence<sequence<ByteString>>
							// Note: per spec we have to first exhaust the lists then process them
							const pairs = [];
							for ( const pair of init ) {
								if ( typeof pair !== 'object' || typeof pair[ Symbol.iterator ] !== 'function' ) {
									throw new TypeError( 'Each header pair must be iterable' );
								}
								pairs.push( Array.from( pair ) );
							}

							for ( const pair of pairs ) {
								if ( pair.length !== 2 ) {
									throw new TypeError( 'Each header pair must be a name/value tuple' );
								}
								this.append( pair[ 0 ], pair[ 1 ] );
							}
						} else {
							// record<ByteString, ByteString>
							for ( const key of Object.keys( init ) ) {
								const value = init[ key ];
								this.append( key, value );
							}
						}
					} else {
						throw new TypeError( 'Provided initializer must be an object' );
					}
				}

				/**
				 * Return combined header value given name
				 *
				 * @param   String  name  Header name
				 * @return  Mixed
				 */
				get( name ) {
					name = `${ name }`;
					validateName( name );
					const key = find( this[ MAP ], name );
					if ( key === undefined ) {
						return null;
					}

					return this[ MAP ][ key ].join( ', ' );
				}

				/**
				 * Iterate over all headers
				 *
				 * @param   Function  callback  Executed for each item with parameters (value, name, thisArg)
				 * @param   Boolean   thisArg   `this` context for callback function
				 * @return  Void
				 */
				forEach( callback ) {
					let thisArg =
						arguments.length > 1 && arguments[ 1 ] !== undefined ? arguments[ 1 ] : undefined;

					let pairs = getHeaders( this );
					let i = 0;
					while ( i < pairs.length ) {
						var _pairs$i = pairs[ i ];
						const name = _pairs$i[ 0 ],
							value = _pairs$i[ 1 ];

						callback.call( thisArg, value, name, this );
						pairs = getHeaders( this );
						i++;
					}
				}

				/**
				 * Overwrite header values given name
				 *
				 * @param   String  name   Header name
				 * @param   String  value  Header value
				 * @return  Void
				 */
				set( name, value ) {
					name = `${ name }`;
					value = `${ value }`;
					validateName( name );
					validateValue( value );
					const key = find( this[ MAP ], name );
					this[ MAP ][ key !== undefined ? key : name ] = [ value ];
				}

				/**
				 * Append a value onto existing header
				 *
				 * @param   String  name   Header name
				 * @param   String  value  Header value
				 * @return  Void
				 */
				append( name, value ) {
					name = `${ name }`;
					value = `${ value }`;
					validateName( name );
					validateValue( value );
					const key = find( this[ MAP ], name );
					if ( key !== undefined ) {
						this[ MAP ][ key ].push( value );
					} else {
						this[ MAP ][ name ] = [ value ];
					}
				}

				/**
				 * Check for header name existence
				 *
				 * @param   String   name  Header name
				 * @return  Boolean
				 */
				has( name ) {
					name = `${ name }`;
					validateName( name );
					return find( this[ MAP ], name ) !== undefined;
				}

				/**
				 * Delete all header values given name
				 *
				 * @param   String  name  Header name
				 * @return  Void
				 */
				delete( name ) {
					name = `${ name }`;
					validateName( name );
					const key = find( this[ MAP ], name );
					if ( key !== undefined ) {
						delete this[ MAP ][ key ];
					}
				}

				/**
				 * Return raw headers (non-spec api)
				 *
				 * @return  Object
				 */
				raw() {
					return this[ MAP ];
				}

				/**
				 * Get an iterator on keys.
				 *
				 * @return  Iterator
				 */
				keys() {
					return createHeadersIterator( this, 'key' );
				}

				/**
				 * Get an iterator on values.
				 *
				 * @return  Iterator
				 */
				values() {
					return createHeadersIterator( this, 'value' );
				}

				/**
				 * Get an iterator on entries.
				 *
				 * This is the default iterator of the Headers object.
				 *
				 * @return  Iterator
				 */
				[ Symbol.iterator ]() {
					return createHeadersIterator( this, 'key+value' );
				}
			}
			Headers.prototype.entries = Headers.prototype[ Symbol.iterator ];

			Object.defineProperty( Headers.prototype, Symbol.toStringTag, {
				value: 'Headers',
				writable: false,
				enumerable: false,
				configurable: true,
			} );

			Object.defineProperties( Headers.prototype, {
				get: { enumerable: true },
				forEach: { enumerable: true },
				set: { enumerable: true },
				append: { enumerable: true },
				has: { enumerable: true },
				delete: { enumerable: true },
				keys: { enumerable: true },
				values: { enumerable: true },
				entries: { enumerable: true },
			} );

			function getHeaders( headers ) {
				let kind =
					arguments.length > 1 && arguments[ 1 ] !== undefined ? arguments[ 1 ] : 'key+value';

				const keys = Object.keys( headers[ MAP ] ).sort();
				return keys.map(
					kind === 'key'
						? function ( k ) {
								return k.toLowerCase();
						  }
						: kind === 'value'
						? function ( k ) {
								return headers[ MAP ][ k ].join( ', ' );
						  }
						: function ( k ) {
								return [ k.toLowerCase(), headers[ MAP ][ k ].join( ', ' ) ];
						  }
				);
			}

			const INTERNAL = Symbol( 'internal' );

			function createHeadersIterator( target, kind ) {
				const iterator = Object.create( HeadersIteratorPrototype );
				iterator[ INTERNAL ] = {
					target,
					kind,
					index: 0,
				};
				return iterator;
			}

			const HeadersIteratorPrototype = Object.setPrototypeOf(
				{
					next() {
						// istanbul ignore if
						if ( ! this || Object.getPrototypeOf( this ) !== HeadersIteratorPrototype ) {
							throw new TypeError( 'Value of `this` is not a HeadersIterator' );
						}

						var _INTERNAL = this[ INTERNAL ];
						const target = _INTERNAL.target,
							kind = _INTERNAL.kind,
							index = _INTERNAL.index;

						const values = getHeaders( target, kind );
						const len = values.length;
						if ( index >= len ) {
							return {
								value: undefined,
								done: true,
							};
						}

						this[ INTERNAL ].index = index + 1;

						return {
							value: values[ index ],
							done: false,
						};
					},
				},
				Object.getPrototypeOf( Object.getPrototypeOf( [][ Symbol.iterator ]() ) )
			);

			Object.defineProperty( HeadersIteratorPrototype, Symbol.toStringTag, {
				value: 'HeadersIterator',
				writable: false,
				enumerable: false,
				configurable: true,
			} );

			/**
			 * Export the Headers object in a form that Node.js can consume.
			 *
			 * @param   Headers  headers
			 * @return  Object
			 */
			function exportNodeCompatibleHeaders( headers ) {
				const obj = Object.assign( { __proto__: null }, headers[ MAP ] );

				// http.request() only supports string as Host header. This hack makes
				// specifying custom Host header possible.
				const hostHeaderKey = find( headers[ MAP ], 'Host' );
				if ( hostHeaderKey !== undefined ) {
					obj[ hostHeaderKey ] = obj[ hostHeaderKey ][ 0 ];
				}

				return obj;
			}

			/**
			 * Create a Headers object from an object of headers, ignoring those that do
			 * not conform to HTTP grammar productions.
			 *
			 * @param   Object  obj  Object of headers
			 * @return  Headers
			 */
			function createHeadersLenient( obj ) {
				const headers = new Headers();
				for ( const name of Object.keys( obj ) ) {
					if ( invalidTokenRegex.test( name ) ) {
						continue;
					}
					if ( Array.isArray( obj[ name ] ) ) {
						for ( const val of obj[ name ] ) {
							if ( invalidHeaderCharRegex.test( val ) ) {
								continue;
							}
							if ( headers[ MAP ][ name ] === undefined ) {
								headers[ MAP ][ name ] = [ val ];
							} else {
								headers[ MAP ][ name ].push( val );
							}
						}
					} else if ( ! invalidHeaderCharRegex.test( obj[ name ] ) ) {
						headers[ MAP ][ name ] = [ obj[ name ] ];
					}
				}
				return headers;
			}

			const INTERNALS$1 = Symbol( 'Response internals' );

			// fix an issue where "STATUS_CODES" aren't a named export for node <10
			const STATUS_CODES = http.STATUS_CODES;

			/**
			 * Response class
			 *
			 * @param   Stream  body  Readable stream
			 * @param   Object  opts  Response options
			 * @return  Void
			 */
			class Response {
				constructor() {
					let body = arguments.length > 0 && arguments[ 0 ] !== undefined ? arguments[ 0 ] : null;
					let opts = arguments.length > 1 && arguments[ 1 ] !== undefined ? arguments[ 1 ] : {};

					Body.call( this, body, opts );

					const status = opts.status || 200;
					const headers = new Headers( opts.headers );

					if ( body != null && ! headers.has( 'Content-Type' ) ) {
						const contentType = extractContentType( body );
						if ( contentType ) {
							headers.append( 'Content-Type', contentType );
						}
					}

					this[ INTERNALS$1 ] = {
						url: opts.url,
						status,
						statusText: opts.statusText || STATUS_CODES[ status ],
						headers,
						counter: opts.counter,
					};
				}

				get url() {
					return this[ INTERNALS$1 ].url || '';
				}

				get status() {
					return this[ INTERNALS$1 ].status;
				}

				/**
				 * Convenience property representing if the request ended normally
				 */
				get ok() {
					return this[ INTERNALS$1 ].status >= 200 && this[ INTERNALS$1 ].status < 300;
				}

				get redirected() {
					return this[ INTERNALS$1 ].counter > 0;
				}

				get statusText() {
					return this[ INTERNALS$1 ].statusText;
				}

				get headers() {
					return this[ INTERNALS$1 ].headers;
				}

				/**
				 * Clone this response
				 *
				 * @return  Response
				 */
				clone() {
					return new Response( clone( this ), {
						url: this.url,
						status: this.status,
						statusText: this.statusText,
						headers: this.headers,
						ok: this.ok,
						redirected: this.redirected,
					} );
				}
			}

			Body.mixIn( Response.prototype );

			Object.defineProperties( Response.prototype, {
				url: { enumerable: true },
				status: { enumerable: true },
				ok: { enumerable: true },
				redirected: { enumerable: true },
				statusText: { enumerable: true },
				headers: { enumerable: true },
				clone: { enumerable: true },
			} );

			Object.defineProperty( Response.prototype, Symbol.toStringTag, {
				value: 'Response',
				writable: false,
				enumerable: false,
				configurable: true,
			} );

			const INTERNALS$2 = Symbol( 'Request internals' );

			// fix an issue where "format", "parse" aren't a named export for node <10
			const parse_url = Url.parse;
			const format_url = Url.format;

			const streamDestructionSupported = 'destroy' in Stream.Readable.prototype;

			/**
			 * Check if a value is an instance of Request.
			 *
			 * @param   Mixed   input
			 * @return  Boolean
			 */
			function isRequest( input ) {
				return typeof input === 'object' && typeof input[ INTERNALS$2 ] === 'object';
			}

			function isAbortSignal( signal ) {
				const proto = signal && typeof signal === 'object' && Object.getPrototypeOf( signal );
				return !! ( proto && proto.constructor.name === 'AbortSignal' );
			}

			/**
			 * Request class
			 *
			 * @param   Mixed   input  Url or Request instance
			 * @param   Object  init   Custom options
			 * @return  Void
			 */
			class Request {
				constructor( input ) {
					let init = arguments.length > 1 && arguments[ 1 ] !== undefined ? arguments[ 1 ] : {};

					let parsedURL;

					// normalize input
					if ( ! isRequest( input ) ) {
						if ( input && input.href ) {
							// in order to support Node.js' Url objects; though WHATWG's URL objects
							// will fall into this branch also (since their `toString()` will return
							// `href` property anyway)
							parsedURL = parse_url( input.href );
						} else {
							// coerce input to a string before attempting to parse
							parsedURL = parse_url( `${ input }` );
						}
						input = {};
					} else {
						parsedURL = parse_url( input.url );
					}

					let method = init.method || input.method || 'GET';
					method = method.toUpperCase();

					if (
						( init.body != null || ( isRequest( input ) && input.body !== null ) ) &&
						( method === 'GET' || method === 'HEAD' )
					) {
						throw new TypeError( 'Request with GET/HEAD method cannot have body' );
					}

					let inputBody =
						init.body != null
							? init.body
							: isRequest( input ) && input.body !== null
							? clone( input )
							: null;

					Body.call( this, inputBody, {
						timeout: init.timeout || input.timeout || 0,
						size: init.size || input.size || 0,
					} );

					const headers = new Headers( init.headers || input.headers || {} );

					if ( inputBody != null && ! headers.has( 'Content-Type' ) ) {
						const contentType = extractContentType( inputBody );
						if ( contentType ) {
							headers.append( 'Content-Type', contentType );
						}
					}

					let signal = isRequest( input ) ? input.signal : null;
					if ( 'signal' in init ) signal = init.signal;

					if ( signal != null && ! isAbortSignal( signal ) ) {
						throw new TypeError( 'Expected signal to be an instanceof AbortSignal' );
					}

					this[ INTERNALS$2 ] = {
						method,
						redirect: init.redirect || input.redirect || 'follow',
						headers,
						parsedURL,
						signal,
					};

					// node-fetch-only options
					this.follow =
						init.follow !== undefined
							? init.follow
							: input.follow !== undefined
							? input.follow
							: 20;
					this.compress =
						init.compress !== undefined
							? init.compress
							: input.compress !== undefined
							? input.compress
							: true;
					this.counter = init.counter || input.counter || 0;
					this.agent = init.agent || input.agent;
				}

				get method() {
					return this[ INTERNALS$2 ].method;
				}

				get url() {
					return format_url( this[ INTERNALS$2 ].parsedURL );
				}

				get headers() {
					return this[ INTERNALS$2 ].headers;
				}

				get redirect() {
					return this[ INTERNALS$2 ].redirect;
				}

				get signal() {
					return this[ INTERNALS$2 ].signal;
				}

				/**
				 * Clone this request
				 *
				 * @return  Request
				 */
				clone() {
					return new Request( this );
				}
			}

			Body.mixIn( Request.prototype );

			Object.defineProperty( Request.prototype, Symbol.toStringTag, {
				value: 'Request',
				writable: false,
				enumerable: false,
				configurable: true,
			} );

			Object.defineProperties( Request.prototype, {
				method: { enumerable: true },
				url: { enumerable: true },
				headers: { enumerable: true },
				redirect: { enumerable: true },
				clone: { enumerable: true },
				signal: { enumerable: true },
			} );

			/**
			 * Convert a Request to Node.js http request options.
			 *
			 * @param   Request  A Request instance
			 * @return  Object   The options object to be passed to http.request
			 */
			function getNodeRequestOptions( request ) {
				const parsedURL = request[ INTERNALS$2 ].parsedURL;
				const headers = new Headers( request[ INTERNALS$2 ].headers );

				// fetch step 1.3
				if ( ! headers.has( 'Accept' ) ) {
					headers.set( 'Accept', '*/*' );
				}

				// Basic fetch
				if ( ! parsedURL.protocol || ! parsedURL.hostname ) {
					throw new TypeError( 'Only absolute URLs are supported' );
				}

				if ( ! /^https?:$/.test( parsedURL.protocol ) ) {
					throw new TypeError( 'Only HTTP(S) protocols are supported' );
				}

				if (
					request.signal &&
					request.body instanceof Stream.Readable &&
					! streamDestructionSupported
				) {
					throw new Error(
						'Cancellation of streamed requests with AbortSignal is not supported in node < 8'
					);
				}

				// HTTP-network-or-cache fetch steps 2.4-2.7
				let contentLengthValue = null;
				if ( request.body == null && /^(POST|PUT)$/i.test( request.method ) ) {
					contentLengthValue = '0';
				}
				if ( request.body != null ) {
					const totalBytes = getTotalBytes( request );
					if ( typeof totalBytes === 'number' ) {
						contentLengthValue = String( totalBytes );
					}
				}
				if ( contentLengthValue ) {
					headers.set( 'Content-Length', contentLengthValue );
				}

				// HTTP-network-or-cache fetch step 2.11
				if ( ! headers.has( 'User-Agent' ) ) {
					headers.set( 'User-Agent', 'node-fetch/1.0 (+https://github.com/bitinn/node-fetch)' );
				}

				// HTTP-network-or-cache fetch step 2.15
				if ( request.compress && ! headers.has( 'Accept-Encoding' ) ) {
					headers.set( 'Accept-Encoding', 'gzip,deflate' );
				}

				let agent = request.agent;
				if ( typeof agent === 'function' ) {
					agent = agent( parsedURL );
				}

				if ( ! headers.has( 'Connection' ) && ! agent ) {
					headers.set( 'Connection', 'close' );
				}

				// HTTP-network fetch step 4.2
				// chunked encoding is handled by Node.js

				return Object.assign( {}, parsedURL, {
					method: request.method,
					headers: exportNodeCompatibleHeaders( headers ),
					agent,
				} );
			}

			/**
			 * abort-error.js
			 *
			 * AbortError interface for cancelled requests
			 */

			/**
			 * Create AbortError instance
			 *
			 * @param   String      message      Error message for human
			 * @return  AbortError
			 */
			function AbortError( message ) {
				Error.call( this, message );

				this.type = 'aborted';
				this.message = message;

				// hide custom error implementation details from end-users
				Error.captureStackTrace( this, this.constructor );
			}

			AbortError.prototype = Object.create( Error.prototype );
			AbortError.prototype.constructor = AbortError;
			AbortError.prototype.name = 'AbortError';

			// fix an issue where "PassThrough", "resolve" aren't a named export for node <10
			const PassThrough$1 = Stream.PassThrough;
			const resolve_url = Url.resolve;

			/**
			 * Fetch function
			 *
			 * @param   Mixed    url   Absolute url or Request instance
			 * @param   Object   opts  Fetch options
			 * @return  Promise
			 */
			function fetch( url, opts ) {
				// allow custom promise
				if ( ! fetch.Promise ) {
					throw new Error(
						'native promise missing, set fetch.Promise to your favorite alternative'
					);
				}

				Body.Promise = fetch.Promise;

				// wrap http.request into fetch
				return new fetch.Promise( function ( resolve, reject ) {
					// build request object
					const request = new Request( url, opts );
					const options = getNodeRequestOptions( request );

					const send = ( options.protocol === 'https:' ? https : http ).request;
					const signal = request.signal;

					let response = null;

					const abort = function abort() {
						let error = new AbortError( 'The user aborted a request.' );
						reject( error );
						if ( request.body && request.body instanceof Stream.Readable ) {
							request.body.destroy( error );
						}
						if ( ! response || ! response.body ) return;
						response.body.emit( 'error', error );
					};

					if ( signal && signal.aborted ) {
						abort();
						return;
					}

					const abortAndFinalize = function abortAndFinalize() {
						abort();
						finalize();
					};

					// send request
					const req = send( options );
					let reqTimeout;

					if ( signal ) {
						signal.addEventListener( 'abort', abortAndFinalize );
					}

					function finalize() {
						req.abort();
						if ( signal ) signal.removeEventListener( 'abort', abortAndFinalize );
						clearTimeout( reqTimeout );
					}

					if ( request.timeout ) {
						req.once( 'socket', function ( socket ) {
							reqTimeout = setTimeout( function () {
								reject(
									new FetchError( `network timeout at: ${ request.url }`, 'request-timeout' )
								);
								finalize();
							}, request.timeout );
						} );
					}

					req.on( 'error', function ( err ) {
						reject(
							new FetchError(
								`request to ${ request.url } failed, reason: ${ err.message }`,
								'system',
								err
							)
						);
						finalize();
					} );

					req.on( 'response', function ( res ) {
						clearTimeout( reqTimeout );

						const headers = createHeadersLenient( res.headers );

						// HTTP fetch step 5
						if ( fetch.isRedirect( res.statusCode ) ) {
							// HTTP fetch step 5.2
							const location = headers.get( 'Location' );

							// HTTP fetch step 5.3
							const locationURL = location === null ? null : resolve_url( request.url, location );

							// HTTP fetch step 5.5
							switch ( request.redirect ) {
								case 'error':
									reject(
										new FetchError(
											`uri requested responds with a redirect, redirect mode is set to error: ${ request.url }`,
											'no-redirect'
										)
									);
									finalize();
									return;
								case 'manual':
									// node-fetch-specific step: make manual redirect a bit easier to use by setting the Location header value to the resolved URL.
									if ( locationURL !== null ) {
										// handle corrupted header
										try {
											headers.set( 'Location', locationURL );
										} catch ( err ) {
											// istanbul ignore next: nodejs server prevent invalid response headers, we can't test this through normal request
											reject( err );
										}
									}
									break;
								case 'follow':
									// HTTP-redirect fetch step 2
									if ( locationURL === null ) {
										break;
									}

									// HTTP-redirect fetch step 5
									if ( request.counter >= request.follow ) {
										reject(
											new FetchError(
												`maximum redirect reached at: ${ request.url }`,
												'max-redirect'
											)
										);
										finalize();
										return;
									}

									// HTTP-redirect fetch step 6 (counter increment)
									// Create a new Request object.
									const requestOpts = {
										headers: new Headers( request.headers ),
										follow: request.follow,
										counter: request.counter + 1,
										agent: request.agent,
										compress: request.compress,
										method: request.method,
										body: request.body,
										signal: request.signal,
										timeout: request.timeout,
										size: request.size,
									};

									// HTTP-redirect fetch step 9
									if (
										res.statusCode !== 303 &&
										request.body &&
										getTotalBytes( request ) === null
									) {
										reject(
											new FetchError(
												'Cannot follow redirect with body being a readable stream',
												'unsupported-redirect'
											)
										);
										finalize();
										return;
									}

									// HTTP-redirect fetch step 11
									if (
										res.statusCode === 303 ||
										( ( res.statusCode === 301 || res.statusCode === 302 ) &&
											request.method === 'POST' )
									) {
										requestOpts.method = 'GET';
										requestOpts.body = undefined;
										requestOpts.headers.delete( 'content-length' );
									}

									// HTTP-redirect fetch step 15
									resolve( fetch( new Request( locationURL, requestOpts ) ) );
									finalize();
									return;
							}
						}

						// prepare response
						res.once( 'end', function () {
							if ( signal ) signal.removeEventListener( 'abort', abortAndFinalize );
						} );
						let body = res.pipe( new PassThrough$1() );

						const response_options = {
							url: request.url,
							status: res.statusCode,
							statusText: res.statusMessage,
							headers: headers,
							size: request.size,
							timeout: request.timeout,
							counter: request.counter,
						};

						// HTTP-network fetch step 12.1.1.3
						const codings = headers.get( 'Content-Encoding' );

						// HTTP-network fetch step 12.1.1.4: handle content codings

						// in following scenarios we ignore compression support
						// 1. compression support is disabled
						// 2. HEAD request
						// 3. no Content-Encoding header
						// 4. no content response (204)
						// 5. content not modified response (304)
						if (
							! request.compress ||
							request.method === 'HEAD' ||
							codings === null ||
							res.statusCode === 204 ||
							res.statusCode === 304
						) {
							response = new Response( body, response_options );
							resolve( response );
							return;
						}

						// For Node v6+
						// Be less strict when decoding compressed responses, since sometimes
						// servers send slightly invalid responses that are still accepted
						// by common browsers.
						// Always using Z_SYNC_FLUSH is what cURL does.
						const zlibOptions = {
							flush: zlib.Z_SYNC_FLUSH,
							finishFlush: zlib.Z_SYNC_FLUSH,
						};

						// for gzip
						if ( codings == 'gzip' || codings == 'x-gzip' ) {
							body = body.pipe( zlib.createGunzip( zlibOptions ) );
							response = new Response( body, response_options );
							resolve( response );
							return;
						}

						// for deflate
						if ( codings == 'deflate' || codings == 'x-deflate' ) {
							// handle the infamous raw deflate response from old servers
							// a hack for old IIS and Apache servers
							const raw = res.pipe( new PassThrough$1() );
							raw.once( 'data', function ( chunk ) {
								// see http://stackoverflow.com/questions/37519828
								if ( ( chunk[ 0 ] & 0x0f ) === 0x08 ) {
									body = body.pipe( zlib.createInflate() );
								} else {
									body = body.pipe( zlib.createInflateRaw() );
								}
								response = new Response( body, response_options );
								resolve( response );
							} );
							return;
						}

						// for br
						if ( codings == 'br' && typeof zlib.createBrotliDecompress === 'function' ) {
							body = body.pipe( zlib.createBrotliDecompress() );
							response = new Response( body, response_options );
							resolve( response );
							return;
						}

						// otherwise, use response as-is
						response = new Response( body, response_options );
						resolve( response );
					} );

					writeToStream( req, request );
				} );
			}
			/**
			 * Redirect code matching
			 *
			 * @param   Number   code  Status code
			 * @return  Boolean
			 */
			fetch.isRedirect = function ( code ) {
				return code === 301 || code === 302 || code === 303 || code === 307 || code === 308;
			};

			// expose Promise
			fetch.Promise = global.Promise;

			module.exports = exports = fetch;
			Object.defineProperty( exports, '__esModule', { value: true } );
			exports.default = exports;
			exports.Headers = Headers;
			exports.Request = Request;
			exports.Response = Response;
			exports.FetchError = FetchError;

			/***/
		},

		/***/ 1223: /***/ ( module, __unused_webpack_exports, __nccwpck_require__ ) => {
			var wrappy = __nccwpck_require__( 2940 );
			module.exports = wrappy( once );
			module.exports.strict = wrappy( onceStrict );

			once.proto = once( function () {
				Object.defineProperty( Function.prototype, 'once', {
					value: function () {
						return once( this );
					},
					configurable: true,
				} );

				Object.defineProperty( Function.prototype, 'onceStrict', {
					value: function () {
						return onceStrict( this );
					},
					configurable: true,
				} );
			} );

			function once( fn ) {
				var f = function () {
					if ( f.called ) return f.value;
					f.called = true;
					return ( f.value = fn.apply( this, arguments ) );
				};
				f.called = false;
				return f;
			}

			function onceStrict( fn ) {
				var f = function () {
					if ( f.called ) throw new Error( f.onceError );
					f.called = true;
					return ( f.value = fn.apply( this, arguments ) );
				};
				var name = fn.name || 'Function wrapped with `once`';
				f.onceError = name + " shouldn't be called more than once";
				f.called = false;
				return f;
			}

			/***/
		},

		/***/ 8714: /***/ module => {
			'use strict';

			function posix( path ) {
				return path.charAt( 0 ) === '/';
			}

			function win32( path ) {
				// https://github.com/nodejs/node/blob/b3fcc245fb25539909ef1d5eaa01dbf92e168633/lib/path.js#L56
				var splitDeviceRe = /^([a-zA-Z]:|[\\\/]{2}[^\\\/]+[\\\/]+[^\\\/]+)?([\\\/])?([\s\S]*?)$/;
				var result = splitDeviceRe.exec( path );
				var device = result[ 1 ] || '';
				var isUnc = Boolean( device && device.charAt( 1 ) !== ':' );

				// UNC paths are always absolute
				return Boolean( result[ 2 ] || isUnc );
			}

			module.exports = process.platform === 'win32' ? win32 : posix;
			module.exports.posix = posix;
			module.exports.win32 = win32;

			/***/
		},

		/***/ 4294: /***/ ( module, __unused_webpack_exports, __nccwpck_require__ ) => {
			module.exports = __nccwpck_require__( 4219 );

			/***/
		},

		/***/ 4219: /***/ ( __unused_webpack_module, exports, __nccwpck_require__ ) => {
			'use strict';

			var net = __nccwpck_require__( 1631 );
			var tls = __nccwpck_require__( 4016 );
			var http = __nccwpck_require__( 8605 );
			var https = __nccwpck_require__( 7211 );
			var events = __nccwpck_require__( 8614 );
			var assert = __nccwpck_require__( 2357 );
			var util = __nccwpck_require__( 1669 );

			exports.httpOverHttp = httpOverHttp;
			exports.httpsOverHttp = httpsOverHttp;
			exports.httpOverHttps = httpOverHttps;
			exports.httpsOverHttps = httpsOverHttps;

			function httpOverHttp( options ) {
				var agent = new TunnelingAgent( options );
				agent.request = http.request;
				return agent;
			}

			function httpsOverHttp( options ) {
				var agent = new TunnelingAgent( options );
				agent.request = http.request;
				agent.createSocket = createSecureSocket;
				agent.defaultPort = 443;
				return agent;
			}

			function httpOverHttps( options ) {
				var agent = new TunnelingAgent( options );
				agent.request = https.request;
				return agent;
			}

			function httpsOverHttps( options ) {
				var agent = new TunnelingAgent( options );
				agent.request = https.request;
				agent.createSocket = createSecureSocket;
				agent.defaultPort = 443;
				return agent;
			}

			function TunnelingAgent( options ) {
				var self = this;
				self.options = options || {};
				self.proxyOptions = self.options.proxy || {};
				self.maxSockets = self.options.maxSockets || http.Agent.defaultMaxSockets;
				self.requests = [];
				self.sockets = [];

				self.on( 'free', function onFree( socket, host, port, localAddress ) {
					var options = toOptions( host, port, localAddress );
					for ( var i = 0, len = self.requests.length; i < len; ++i ) {
						var pending = self.requests[ i ];
						if ( pending.host === options.host && pending.port === options.port ) {
							// Detect the request to connect same origin server,
							// reuse the connection.
							self.requests.splice( i, 1 );
							pending.request.onSocket( socket );
							return;
						}
					}
					socket.destroy();
					self.removeSocket( socket );
				} );
			}
			util.inherits( TunnelingAgent, events.EventEmitter );

			TunnelingAgent.prototype.addRequest = function addRequest( req, host, port, localAddress ) {
				var self = this;
				var options = mergeOptions(
					{ request: req },
					self.options,
					toOptions( host, port, localAddress )
				);

				if ( self.sockets.length >= this.maxSockets ) {
					// We are over limit so we'll add it to the queue.
					self.requests.push( options );
					return;
				}

				// If we are under maxSockets create a new one.
				self.createSocket( options, function ( socket ) {
					socket.on( 'free', onFree );
					socket.on( 'close', onCloseOrRemove );
					socket.on( 'agentRemove', onCloseOrRemove );
					req.onSocket( socket );

					function onFree() {
						self.emit( 'free', socket, options );
					}

					function onCloseOrRemove( err ) {
						self.removeSocket( socket );
						socket.removeListener( 'free', onFree );
						socket.removeListener( 'close', onCloseOrRemove );
						socket.removeListener( 'agentRemove', onCloseOrRemove );
					}
				} );
			};

			TunnelingAgent.prototype.createSocket = function createSocket( options, cb ) {
				var self = this;
				var placeholder = {};
				self.sockets.push( placeholder );

				var connectOptions = mergeOptions( {}, self.proxyOptions, {
					method: 'CONNECT',
					path: options.host + ':' + options.port,
					agent: false,
					headers: {
						host: options.host + ':' + options.port,
					},
				} );
				if ( options.localAddress ) {
					connectOptions.localAddress = options.localAddress;
				}
				if ( connectOptions.proxyAuth ) {
					connectOptions.headers = connectOptions.headers || {};
					connectOptions.headers[ 'Proxy-Authorization' ] =
						'Basic ' + new Buffer( connectOptions.proxyAuth ).toString( 'base64' );
				}

				debug( 'making CONNECT request' );
				var connectReq = self.request( connectOptions );
				connectReq.useChunkedEncodingByDefault = false; // for v0.6
				connectReq.once( 'response', onResponse ); // for v0.6
				connectReq.once( 'upgrade', onUpgrade ); // for v0.6
				connectReq.once( 'connect', onConnect ); // for v0.7 or later
				connectReq.once( 'error', onError );
				connectReq.end();

				function onResponse( res ) {
					// Very hacky. This is necessary to avoid http-parser leaks.
					res.upgrade = true;
				}

				function onUpgrade( res, socket, head ) {
					// Hacky.
					process.nextTick( function () {
						onConnect( res, socket, head );
					} );
				}

				function onConnect( res, socket, head ) {
					connectReq.removeAllListeners();
					socket.removeAllListeners();

					if ( res.statusCode !== 200 ) {
						debug( 'tunneling socket could not be established, statusCode=%d', res.statusCode );
						socket.destroy();
						var error = new Error(
							'tunneling socket could not be established, ' + 'statusCode=' + res.statusCode
						);
						error.code = 'ECONNRESET';
						options.request.emit( 'error', error );
						self.removeSocket( placeholder );
						return;
					}
					if ( head.length > 0 ) {
						debug( 'got illegal response body from proxy' );
						socket.destroy();
						var error = new Error( 'got illegal response body from proxy' );
						error.code = 'ECONNRESET';
						options.request.emit( 'error', error );
						self.removeSocket( placeholder );
						return;
					}
					debug( 'tunneling connection has established' );
					self.sockets[ self.sockets.indexOf( placeholder ) ] = socket;
					return cb( socket );
				}

				function onError( cause ) {
					connectReq.removeAllListeners();

					debug(
						'tunneling socket could not be established, cause=%s\n',
						cause.message,
						cause.stack
					);
					var error = new Error(
						'tunneling socket could not be established, ' + 'cause=' + cause.message
					);
					error.code = 'ECONNRESET';
					options.request.emit( 'error', error );
					self.removeSocket( placeholder );
				}
			};

			TunnelingAgent.prototype.removeSocket = function removeSocket( socket ) {
				var pos = this.sockets.indexOf( socket );
				if ( pos === -1 ) {
					return;
				}
				this.sockets.splice( pos, 1 );

				var pending = this.requests.shift();
				if ( pending ) {
					// If we have pending requests and a socket gets closed a new one
					// needs to be created to take over in the pool for the one that closed.
					this.createSocket( pending, function ( socket ) {
						pending.request.onSocket( socket );
					} );
				}
			};

			function createSecureSocket( options, cb ) {
				var self = this;
				TunnelingAgent.prototype.createSocket.call( self, options, function ( socket ) {
					var hostHeader = options.request.getHeader( 'host' );
					var tlsOptions = mergeOptions( {}, self.options, {
						socket: socket,
						servername: hostHeader ? hostHeader.replace( /:.*$/, '' ) : options.host,
					} );

					// 0 is dummy port for v0.6
					var secureSocket = tls.connect( 0, tlsOptions );
					self.sockets[ self.sockets.indexOf( socket ) ] = secureSocket;
					cb( secureSocket );
				} );
			}

			function toOptions( host, port, localAddress ) {
				if ( typeof host === 'string' ) {
					// since v0.10
					return {
						host: host,
						port: port,
						localAddress: localAddress,
					};
				}
				return host; // for v0.11 or later
			}

			function mergeOptions( target ) {
				for ( var i = 1, len = arguments.length; i < len; ++i ) {
					var overrides = arguments[ i ];
					if ( typeof overrides === 'object' ) {
						var keys = Object.keys( overrides );
						for ( var j = 0, keyLen = keys.length; j < keyLen; ++j ) {
							var k = keys[ j ];
							if ( overrides[ k ] !== undefined ) {
								target[ k ] = overrides[ k ];
							}
						}
					}
				}
				return target;
			}

			var debug;
			if ( process.env.NODE_DEBUG && /\btunnel\b/.test( process.env.NODE_DEBUG ) ) {
				debug = function () {
					var args = Array.prototype.slice.call( arguments );
					if ( typeof args[ 0 ] === 'string' ) {
						args[ 0 ] = 'TUNNEL: ' + args[ 0 ];
					} else {
						args.unshift( 'TUNNEL:' );
					}
					console.error.apply( console, args );
				};
			} else {
				debug = function () {};
			}
			exports.debug = debug; // for test

			/***/
		},

		/***/ 5030: /***/ ( __unused_webpack_module, exports ) => {
			'use strict';

			Object.defineProperty( exports, '__esModule', { value: true } );

			function getUserAgent() {
				if ( typeof navigator === 'object' && 'userAgent' in navigator ) {
					return navigator.userAgent;
				}

				if ( typeof process === 'object' && 'version' in process ) {
					return `Node.js/${ process.version.substr( 1 ) } (${ process.platform }; ${
						process.arch
					})`;
				}

				return '<environment undetectable>';
			}

			exports.getUserAgent = getUserAgent;
			//# sourceMappingURL=index.js.map

			/***/
		},

		/***/ 2940: /***/ module => {
			// Returns a wrapper function that returns a wrapped callback
			// The wrapper function should do some stuff, and return a
			// presumably different callback function.
			// This makes sure that own properties are retained, so that
			// decorations and such are not lost along the way.
			module.exports = wrappy;
			function wrappy( fn, cb ) {
				if ( fn && cb ) return wrappy( fn )( cb );

				if ( typeof fn !== 'function' ) throw new TypeError( 'need wrapper function' );

				Object.keys( fn ).forEach( function ( k ) {
					wrapper[ k ] = fn[ k ];
				} );

				return wrapper;

				function wrapper() {
					var args = new Array( arguments.length );
					for ( var i = 0; i < args.length; i++ ) {
						args[ i ] = arguments[ i ];
					}
					var ret = fn.apply( this, args );
					var cb = args[ args.length - 1 ];
					if ( typeof ret === 'function' && ret !== cb ) {
						Object.keys( cb ).forEach( function ( k ) {
							ret[ k ] = cb[ k ];
						} );
					}
					return ret;
				}
			}

			/***/
		},

		/***/ 1806: /***/ module => {
			/**
			 * Prints a debug message to STDOUT in non-testing environments.
			 *
			 * @param {string} message - The message to print.
			 */
			function debug( message ) {
				if ( process.env.NODE_ENV !== 'test' ) {
					process.stdout.write( message + '\n' );
				}
			}

			module.exports = debug;

			/***/
		},

		/***/ 30: /***/ ( module, __unused_webpack_exports, __nccwpck_require__ ) => {
			const glob = __nccwpck_require__( 1957 );
			const fs = __nccwpck_require__( 5747 );

			/**
			 * Returns a list of Projects that use changelogger package
			 *
			 * @returns {Array} list of changelogger packages
			 */
			function getChangeloggerProjects() {
				const projects = [];
				const composerFiles = glob.sync(
					process.env.GITHUB_WORKSPACE + '/projects/*/*/composer.json'
				);
				composerFiles.forEach( file => {
					const json = JSON.parse( fs.readFileSync( file ) );
					if (
						// include changelogger package and any other packages that use changelogger package.
						file.endsWith( '/projects/packages/changelogger/composer.json' ) ||
						json.require[ 'automattic/jetpack-changelogger' ] ||
						json[ 'require-dev' ][ 'automattic/jetpack-changelogger' ]
					) {
						projects.push( getProject( file ).fullName );
					}
				} );

				return projects;
			}

			/**
			 * Returns an object with project type and name
			 *
			 * @param {string} file - File path
			 * @returns {object} Project type and name
			 */
			function getProject( file ) {
				const project = file.match( /projects\/(?<ptype>[^/]*)\/(?<pname>[^/]*)\// );
				if ( project && project.groups.ptype && project.groups.pname ) {
					return {
						type: project.groups.ptype,
						name: project.groups.pname,
						fullName: `${ project.groups.ptype }/${ project.groups.pname }`,
					};
				}
				return {};
			}

			/**
			 * Returns a list of affected projects
			 *
			 * @param {Array} files - List of files
			 * @returns {Array} List of affected projects
			 */
			function getAffectedChangeloggerProjects( files ) {
				const changeloggerProjects = getChangeloggerProjects();
				const projects = files.reduce( ( acc, file ) => {
					const project = getProject( file ).fullName;
					if ( ! file.endsWith( 'CHANGELOG.md' ) && changeloggerProjects.includes( project ) ) {
						acc.add( project );
					}
					return acc;
				}, new Set() );

				return [ ...projects ];
			}

			module.exports = getAffectedChangeloggerProjects;

			/***/
		},

		/***/ 4578: /***/ module => {
			/* global WebhookPayloadPushCommit */

			/**
			 * Given a commit object, returns a promise resolving with the pull request
			 * number associated with the commit, or null if an associated pull request
			 * cannot be determined.
			 *
			 * @param {WebhookPayloadPushCommit} commit - Commit object.
			 *
			 * @returns {number?} Pull request number, or null if it cannot be determined.
			 */
			function getAssociatedPullRequest( commit ) {
				const match = commit.message.match( /\(#(\d+)\)$/m );
				return match && Number( match[ 1 ] );
			}

			module.exports = getAssociatedPullRequest;

			/***/
		},

		/***/ 7179: /***/ ( module, __unused_webpack_exports, __nccwpck_require__ ) => {
			/* global GitHub */
			const debug = __nccwpck_require__( 1806 );

			/**
			 * Get list of files modified in PR.
			 *
			 * @param {GitHub} octokit - Initialized Octokit REST client.
			 * @param {string} owner   - Repository owner.
			 * @param {string} repo    - Repository name.
			 * @param {string} number  - PR number.
			 *
			 * @returns {Promise<Array>} Promise resolving to an array of all files modified in  that PR.
			 */
			async function getFiles( octokit, owner, repo, number ) {
				const fileList = [];

				debug( 'add-labels: Get list of files modified in this PR.' );

				for await ( const response of octokit.paginate.iterator( octokit.pulls.listFiles, {
					owner,
					repo,
					pull_number: +number,
					per_page: 100,
				} ) ) {
					response.data.map( file => {
						fileList.push( file.filename );
					} );
				}

				return fileList;
			}

			module.exports = getFiles;

			/***/
		},

		/***/ 4077: /***/ module => {
			/* global GitHub */

			/**
			 * Get labels on a PR.
			 *
			 * @param {GitHub} octokit - Initialized Octokit REST client.
			 * @param {string} owner   - Repository owner.
			 * @param {string} repo    - Repository name.
			 * @param {string} number  - PR number.
			 *
			 * @returns {Promise<Array>} Promise resolving to an array of all labels for that PR.
			 */
			async function getLabels( octokit, owner, repo, number ) {
				const labelList = [];

				for await ( const response of octokit.paginate.iterator( octokit.issues.listLabelsOnIssue, {
					owner,
					repo,
					issue_number: +number,
				} ) ) {
					response.data.map( label => {
						labelList.push( label.name );
					} );
				}

				return labelList;
			}

			module.exports = getLabels;

			/***/
		},

		/***/ 1104: /***/ ( module, __unused_webpack_exports, __nccwpck_require__ ) => {
			/**
			 * External dependencies
			 */
			const moment = __nccwpck_require__( 9623 );
			const compareVersions = __nccwpck_require__( 9296 );

			/* global GitHub, OktokitIssuesListMilestonesForRepoResponseItem */

			/**
			 * Returns a promise resolving to the next valid milestone, if exists.
			 *
			 * @param {GitHub} octokit - Initialized Octokit REST client.
			 * @param {string} owner   - Repository owner.
			 * @param {string} repo    - Repository name.
			 * @param {string} plugin  - Plugin slug.
			 *
			 * @returns {Promise<OktokitIssuesListMilestonesForRepoResponseItem|void>} Promise resolving to milestone, if exists.
			 */
			async function getNextValidMilestone( octokit, owner, repo, plugin = 'jetpack' ) {
				const options = octokit.issues.listMilestones.endpoint.merge( {
					owner,
					repo,
					state: 'open',
					sort: 'due_on',
					direction: 'asc',
				} );

				const responses = octokit.paginate.iterator( options );

				for await ( const response of responses ) {
					// Find a milestone which name is a version number
					// and it's due dates is earliest in a future
					const reg = new RegExp( '^' + plugin + '\\/\\d+\\.\\d' );
					const nextMilestone = response.data
						.filter( m => m.title.match( reg ) )
						.sort( ( m1, m2 ) =>
							compareVersions( m1.title.split( '/' )[ 1 ], m2.title.split( '/' )[ 1 ] )
						)
						.find( milestone => milestone.due_on && moment( milestone.due_on ) > moment() );

					return nextMilestone;
				}
			}

			module.exports = getNextValidMilestone;

			/***/
		},

		/***/ 1749: /***/ ( module, __unused_webpack_exports, __nccwpck_require__ ) => {
			/* global GitHub */

			/**
			 * Internal dependencies
			 */
			const getLabels = __nccwpck_require__( 4077 );

			/**
			 * Get the name of the plugin concerned by this PR.
			 *
			 * @param {GitHub} octokit - Initialized Octokit REST client.
			 * @param {string} owner   - Repository owner.
			 * @param {string} repo    - Repository name.
			 * @param {string} number  - PR / Issue number.
			 *
			 * @returns {Promise<Array>} Promise resolving to an array of all the plugins touched by that PR.
			 */
			async function getPluginNames( octokit, owner, repo, number ) {
				const plugins = [];
				const labels = await getLabels( octokit, owner, repo, number );
				labels.map( label => {
					const plugin = label.match( /^\[Plugin\]\s(?<pluginName>[^/]*)$/ );
					if ( plugin && plugin.groups.pluginName ) {
						plugins.push( plugin.groups.pluginName.replace( /\s+/, '-' ).toLowerCase() );
					}
				} );

				return plugins;
			}

			module.exports = getPluginNames;

			/***/
		},

		/***/ 855: /***/ ( module, __unused_webpack_exports, __nccwpck_require__ ) => {
			/**
			 * Internal dependencies
			 */
			const debug = __nccwpck_require__( 1806 );

			/* global WPAutomationTask */

			/**
			 * Higher-order function which executes and returns the result of the given
			 * handler only if the PR is not currently closed.
			 *
			 * @param {WPAutomationTask} handler - Original task.
			 *
			 * @returns {WPAutomationTask} Enhanced task.
			 */
			function ifNotClosed( handler ) {
				const newHandler = ( payload, octokit ) => {
					if ( payload.pull_request.state !== 'closed' ) {
						return handler( payload, octokit );
					}
					debug( `main: Skipping ${ handler.name } because the PR is closed.` );
				};
				Object.defineProperty( newHandler, 'name', { value: handler.name } );
				return newHandler;
			}

			module.exports = ifNotClosed;

			/***/
		},

		/***/ 1524: /***/ ( module, __unused_webpack_exports, __nccwpck_require__ ) => {
			/**
			 * Internal dependencies
			 */
			const debug = __nccwpck_require__( 1806 );

			/* global WPAutomationTask */

			/**
			 * Higher-order function which executes and returns the result of the given
			 * handler only if the enhanced function is called with a payload indicating a
			 * pull request event which did not originate from a forked repository.
			 *
			 * @param {WPAutomationTask} handler - Original task.
			 *
			 * @returns {WPAutomationTask} Enhanced task.
			 */
			function ifNotFork( handler ) {
				const newHandler = ( payload, octokit ) => {
					if (
						payload.pull_request.head.repo.full_name === payload.pull_request.base.repo.full_name
					) {
						return handler( payload, octokit );
					}
					debug( `main: Skipping ${ handler.name } because we are in a fork.` );
				};
				Object.defineProperty( newHandler, 'name', { value: handler.name } );
				return newHandler;
			}

			module.exports = ifNotFork;

			/***/
		},

		/***/ 4351: /***/ (
			__unused_webpack_module,
			__unused_webpack_exports,
			__nccwpck_require__
		) => {
			/**
			 * External dependencies
			 */
			const { setFailed, getInput } = __nccwpck_require__( 2186 );
			const { context, getOctokit } = __nccwpck_require__( 5438 );

			/**
			 * Internal dependencies
			 */
			const assignIssues = __nccwpck_require__( 1496 );
			const addMilestone = __nccwpck_require__( 2402 );
			const addLabels = __nccwpck_require__( 3595 );
			const cleanLabels = __nccwpck_require__( 3341 );
			const checkDescription = __nccwpck_require__( 3522 );
			const wpcomCommitReminder = __nccwpck_require__( 442 );
			const notifyDesign = __nccwpck_require__( 2425 );
			const debug = __nccwpck_require__( 1806 );
			const ifNotFork = __nccwpck_require__( 1524 );
			const ifNotClosed = __nccwpck_require__( 855 );

			const automations = [
				{
					event: 'pull_request',
					action: [ 'opened', 'synchronize', 'edited' ],
					task: ifNotFork( assignIssues ),
				},
				{
					event: 'push',
					task: addMilestone,
				},
				{
					event: 'pull_request',
					action: [ 'opened', 'reopened', 'synchronize', 'edited', 'labeled' ],
					task: ifNotClosed( addLabels ),
				},
				{
					event: 'pull_request',
					action: [ 'closed' ],
					task: cleanLabels,
				},
				{
					event: 'pull_request',
					action: [ 'opened', 'reopened', 'synchronize', 'edited', 'labeled' ],
					task: ifNotClosed( checkDescription ),
				},
				{
					event: 'pull_request',
					action: [ 'labeled' ],
					task: ifNotClosed( notifyDesign ),
				},
				{
					event: 'push',
					task: wpcomCommitReminder,
				},
			];

			( async function main() {
				const token = getInput( 'github_token' );
				if ( ! token ) {
					setFailed( 'main: Input `github_token` is required' );
					return;
				}

				// eslint-disable-next-line new-cap
				const octokit = new getOctokit( token );

				// Get info about the event.
				const eventPayload = context.payload;
				const eventAction = eventPayload.action;

				debug(
					`main: Received event = '${ context.eventName }', action = '${ eventPayload.action }'`
				);

				const taskList = ( getInput( 'tasks' ) || 'all' ).split( ',' ).map( v => v.trim() );

				for ( const { event, action, task } of automations ) {
					// If the action provided a custom list of tasks to run
					// and if the task is not one of them, bail.
					if ( ! taskList.includes( 'all' ) && ! taskList.includes( task.name ) ) {
						continue;
					}

					if (
						event === context.eventName &&
						( action === undefined || action.includes( eventAction ) )
					) {
						try {
							debug( `main: Starting task ${ task.name }` );
							await task( eventPayload, octokit );
						} catch ( error ) {
							setFailed( `main: Task ${ task.name } failed with error: ${ error }` );
						}
					}
				}

				debug( 'main: All done!' );
			} )();

			/***/
		},

		/***/ 4701: /***/ ( module, __unused_webpack_exports, __nccwpck_require__ ) => {
			/**
			 * External dependencies
			 */
			const fetch = __nccwpck_require__( 467 );

			/* global WebhookPayloadPullRequest */

			/**
			 * Send a message to a Slack channel using the Slack API.
			 *
			 * @param {string}                    message - Message to post to Slack
			 * @param {string}                    channel - Slack channel ID.
			 * @param {string}                    token   - Slack token.
			 * @param {WebhookPayloadPullRequest} payload - Pull request event payload.
			 *
			 * @returns {Promise<boolean>} Promise resolving to a boolean, whether message was successfully posted or not.
			 */
			async function sendSlackMessage( message, channel, token, payload ) {
				const { pull_request, repository } = payload;
				const { html_url, title, user } = pull_request;

				const slackMessage = {
					channel,
					blocks: [
						{
							type: 'section',
							text: {
								type: 'mrkdwn',
								text: `${ message }`,
							},
						},
						{
							type: 'divider',
						},
						{
							type: 'section',
							text: {
								type: 'mrkdwn',
								text: `PR created by ${ user.login } in the <${ repository.html_url }|${ repository.full_name }> repo.`,
							},
						},
						{
							type: 'divider',
						},
						{
							type: 'section',
							text: {
								type: 'mrkdwn',
								text: `<${ html_url }|${ title }>`,
							},
							accessory: {
								type: 'button',
								text: {
									type: 'plain_text',
									text: 'Review',
									emoji: true,
								},
								value: 'click_review',
								url: `${ html_url }`,
								action_id: 'button-action',
							},
						},
					],
					text: `${ message } -- <${ html_url }|${ title }>`, // Fallback text for display in notifications.
					mrkdwn: true, // Formatting of the fallback text.
				};

				const slackRequest = await fetch( 'https://slack.com/api/chat.postMessage', {
					method: 'POST',
					body: JSON.stringify( slackMessage ),
					headers: {
						'Content-Type': 'application/json; charset=utf-8',
						'Content-Length': slackMessage.length,
						Authorization: `Bearer ${ token }`,
						Accept: 'application/json',
					},
				} );

				return !! slackRequest.ok;
			}

			module.exports = sendSlackMessage;

			/***/
		},

		/***/ 3595: /***/ ( module, __unused_webpack_exports, __nccwpck_require__ ) => {
			/**
			 * Internal dependencies
			 */
			const debug = __nccwpck_require__( 1806 );
			const getFiles = __nccwpck_require__( 7179 );

			/* global GitHub, WebhookPayloadPullRequest */

			/**
			 * Clean up a feature name:
			 * - Handle some exceptions in our codename / feature names.
			 * - Replace dashes by spaces.
			 * - Capitalize.
			 *
			 * @param {string} name - Feature name.
			 *
			 * @returns {string} Cleaned up feature name.
			 */
			function cleanName( name ) {
				// Sharedaddy is a legacy codename.
				if ( name === 'sharedaddy' ) {
					name = 'Sharing';
				}

				// Our Shortcodes feature includes shortcodes and embeds.
				if ( name === 'shortcodes' ) {
					name = 'Shortcodes / Embeds';
				}

				// We name our CPTs "Custom Content Types" to avoid confusion with WordPress's CPT.
				if ( name === 'custom-post-types' ) {
					name = 'Custom Content Types';
				}

				// Our widgets are "Extra Sidebar Widgets".
				if ( name === 'widgets' ) {
					name = 'Extra Sidebar Widgets';
				}

				// Simple Payments was renamed into "Pay With Paypal".
				if ( name === 'simple-payments' ) {
					name = 'Pay With Paypal';
				}

				// WordPress.com Block Editor lives under 'wpcom-block-editor'.
				if ( name === 'wpcom-block-editor' ) {
					name = 'WordPress.com Block Editor';
				}

				// WordAds is a codename. We name the feature just "Ad" or "Ads".
				if ( name === 'wordads' ) {
					name = 'Ad';
				}

				// Latest Instagram Posts used to be named Instagram Gallery.
				if ( name === 'instagram-gallery' ) {
					name = 'Latest Instagram Posts';
				}

				// Payments used to be called Recurring Payments.
				if ( name === 'recurring-payments' ) {
					name = 'Payments';
				}

				// Rating Star was renamed into Star Rating.
				if ( name === 'rating-star' ) {
					name = 'Star Rating';
				}

				return (
					name
						// Break up words
						.split( '-' )
						// Capitalize first letter of each word.
						.map( word => `${ word[ 0 ].toUpperCase() }${ word.slice( 1 ) }` )
						// Spaces between words.
						.join( ' ' )
				);
			}

			/**
			 * Build a list of labels to add to the issue, based off our file list.
			 *
			 * @param {GitHub} octokit - Initialized Octokit REST client.
			 * @param {string} owner   - Repository owner.
			 * @param {string} repo    - Repository name.
			 * @param {string} number  - PR number.
			 *
			 * @returns {Promise<Array>} Promise resolving to an array of keywords we'll search for.
			 */
			async function getLabelsToAdd( octokit, owner, repo, number ) {
				const keywords = new Set();

				// Get next valid milestone.
				const files = await getFiles( octokit, owner, repo, number );

				if ( ! files ) {
					throw new Error( 'No files were modified in this PR' );
				}

				debug( 'add-labels: Loop through all files modified in this PR and add matching labels.' );

				files.map( file => {
					// Projects.
					const project = file.match( /^projects\/(?<ptype>[^/]*)\/(?<pname>[^/]*)\// );
					if ( project && project.groups.ptype && project.groups.pname ) {
						const prefix = {
							'editor-extensions': 'Block',
							'github-actions': 'Action',
							packages: 'Package',
							plugins: 'Plugin',
						}[ project.groups.ptype ];
						if ( prefix === undefined ) {
							const err = new Error(
								`Cannot determine label prefix for plugin type "${ project.groups.ptype }"`
							);
							// Produce a GitHub error annotation pointing here.
							const line = err.stack.split( '\n' )[ 1 ].split( ':' )[ 1 ] - 2;
							debug( `::error file=${ __filename },line=${ line }::${ err.message }` );
							throw err;
						}
						keywords.add( `[${ prefix }] ${ cleanName( project.groups.pname ) }` );

						// Extra labels.
						if ( project.groups.ptype === 'github-actions' ) {
							keywords.add( 'Actions' );
						}
					}

					// Modules.
					const module = file.match(
						/^projects\/plugins\/jetpack\/?(?<test>tests\/php\/)?modules\/(?<module>[^/]*)\//
					);
					const moduleName = module && module.groups.module;
					if ( moduleName ) {
						keywords.add( `${ cleanName( moduleName ) }` );
					}
					if ( module && module.groups.test ) {
						keywords.add( 'Unit Tests' );
					}

					// Actions.
					const actions = file.match( /^\.github\/(actions|workflows|files)\// );
					if ( actions !== null ) {
						keywords.add( 'Actions' );
					}

					// Docker.
					const docker = file.match( /^tools\/docker\// );
					if ( docker !== null ) {
						keywords.add( 'Docker' );
					}

					const cliTools = file.match( /^tools\/cli\// );
					if ( cliTools !== null ) {
						keywords.add( '[Tools] Development CLI' );
					}

					const docs = file.match( /^docs\// );
					if ( docs !== null ) {
						keywords.add( 'Docs' );
					}

					// Existing blocks.
					const blocks = file.match(
						/^projects\/plugins\/jetpack\/extensions\/blocks\/(?<block>[^/]*)\//
					);
					const blockName = blocks && blocks.groups.block;
					if ( blockName ) {
						keywords.add( `[Block] ${ cleanName( blockName ) }` );
					}

					// React Dashboard.
					const reactAdmin = file.match( /^projects\/plugins\/jetpack\/_inc\/client\// );
					if ( reactAdmin !== null ) {
						keywords.add( 'Admin Page' );
					}

					// Instant Search.
					const instantSearch = file.match(
						/^projects\/plugins\/jetpack\/modules\/search\/instant-search\//
					);
					if ( instantSearch !== null ) {
						keywords.add( 'Instant Search' );
					}

					// WPCOM API.
					const wpcomApi = file.match( /^projects\/plugins\/jetpack\/json-endpoints\// );
					if ( wpcomApi !== null ) {
						keywords.add( 'WPCOM API' );
					}
				} );

				return [ ...keywords ];
			}

			/**
			 * Assigns any issues that are being worked to the author of the matching PR.
			 *
			 * @param {WebhookPayloadPullRequest} payload - Pull request event payload.
			 * @param {GitHub}                    octokit - Initialized Octokit REST client.
			 */
			async function addLabels( payload, octokit ) {
				const { number, repository } = payload;
				const { owner, name } = repository;

				// Get labels to add to the PR.
				const labels = await getLabelsToAdd( octokit, owner.login, name, number );

				if ( ! labels.length ) {
					debug( 'add-labels: Could not find labels to add to that PR. Aborting' );
					return;
				}

				debug( `add-labels: Adding labels to PR #${ number }` );

				await octokit.issues.addLabels( {
					owner: owner.login,
					repo: name,
					issue_number: number,
					labels,
				} );
			}

			module.exports = addLabels;

			/***/
		},

		/***/ 2402: /***/ ( module, __unused_webpack_exports, __nccwpck_require__ ) => {
			/**
			 * Internal dependencies
			 */
			const debug = __nccwpck_require__( 1806 );
			const getAssociatedPullRequest = __nccwpck_require__( 4578 );
			const getNextValidMilestone = __nccwpck_require__( 1104 );
			const getPluginNames = __nccwpck_require__( 1749 );

			/* global GitHub, WebhookPayloadPullRequest */

			/**
			 * Assigns any issues that are being worked to the author of the matching PR.
			 *
			 * @param {WebhookPayloadPullRequest} payload - Pull request event payload.
			 * @param {GitHub}                    octokit - Initialized Octokit REST client.
			 */
			async function addMilestone( payload, octokit ) {
				const { commits, ref, repository } = payload;
				const { name: repo, owner } = repository;
				const ownerLogin = owner.login;

				// We should not get to that point as the action is triggered on pushes to master, but...
				if ( ref !== 'refs/heads/master' ) {
					debug( 'add-milestone: Commit is not to `master`. Aborting' );
					return;
				}

				const prNumber = getAssociatedPullRequest( commits[ 0 ] );
				if ( ! prNumber ) {
					debug( 'add-milestone: Commit is not a squashed PR. Aborting' );
					return;
				}

				const {
					data: { milestone: pullMilestone },
				} = await octokit.issues.get( { owner: ownerLogin, repo, issue_number: prNumber } );

				if ( pullMilestone ) {
					debug( 'add-milestone: Pull request already has a milestone. Aborting' );
					return;
				}

				const plugins = await getPluginNames( octokit, ownerLogin, repo, prNumber );

				if ( plugins.length === 0 ) {
					debug( 'add-milestone: No plugins for this PR. Aborting' );
					return;
				}

				if ( plugins.length >= 2 ) {
					debug(
						`add-milestone: this PR touches multiple plugins, we cannot choose which milestone this should belong to. Aborting.`
					);
					return;
				}

				// Get next valid milestone (we can only add one).
				const nextMilestone = await getNextValidMilestone(
					octokit,
					ownerLogin,
					repo,
					plugins[ 0 ]
				);

				if ( ! nextMilestone ) {
					throw new Error( `Could not find a valid milestone for ${ plugins[ 0 ] }` );
				}

				debug( `add-milestone: Adding PR #${ prNumber } to milestone #${ nextMilestone.number }` );

				await octokit.issues.update( {
					owner: ownerLogin,
					repo,
					issue_number: prNumber,
					milestone: nextMilestone.number,
				} );
			}

			module.exports = addMilestone;

			/***/
		},

		/***/ 1496: /***/ ( module, __unused_webpack_exports, __nccwpck_require__ ) => {
			/**
			 * Internal dependencies
			 */
			const debug = __nccwpck_require__( 1806 );

			/* global GitHub, WebhookPayloadPullRequest */

			/**
			 * Assigns any issues that are being worked to the author of the matching PR.
			 *
			 * @param {WebhookPayloadPullRequest} payload - Pull request event payload.
			 * @param {GitHub}                    octokit - Initialized Octokit REST client.
			 */
			async function assignIssues( payload, octokit ) {
				const regex = /(?:close|closes|closed|fix|fixes|fixed|resolve|resolves|resolved):? +(?:#{1}|https?:\/\/github\.com\/automattic\/jetpack\/issues\/)(\d+)/gi;

				let match;
				while ( ( match = regex.exec( payload.pull_request.body ) ) ) {
					const [ , issue ] = match;

					debug(
						`assign-issues: Assigning issue #${ issue } to @${ payload.pull_request.user.login }`
					);

					await octokit.issues.addAssignees( {
						owner: payload.repository.owner.login,
						repo: payload.repository.name,
						issue_number: +issue,
						assignees: [ payload.pull_request.user.login ],
					} );

					debug( `assign-issues: Applying '[Status] In Progress' label to issue #${ issue }` );

					await octokit.issues.addLabels( {
						owner: payload.repository.owner.login,
						repo: payload.repository.name,
						issue_number: +issue,
						labels: [ '[Status] In Progress' ],
					} );
				}
			}

			module.exports = assignIssues;

			/***/
		},

		/***/ 3522: /***/ ( module, __unused_webpack_exports, __nccwpck_require__ ) => {
			/**
			 * External dependencies
			 */
			const fs = __nccwpck_require__( 5747 );
			const moment = __nccwpck_require__( 9623 );
			const path = __nccwpck_require__( 5622 );

			/**
			 * Internal dependencies
			 */
			const debug = __nccwpck_require__( 1806 );
			const getAffectedChangeloggerProjects = __nccwpck_require__( 30 );
			const getFiles = __nccwpck_require__( 7179 );
			const getLabels = __nccwpck_require__( 4077 );
			const getNextValidMilestone = __nccwpck_require__( 1104 );
			const getPluginNames = __nccwpck_require__( 1749 );

			/* global GitHub, WebhookPayloadPullRequest */

			/**
			 * Check if a PR has unverified commits.
			 *
			 * @param {GitHub} octokit - Initialized Octokit REST client.
			 * @param {string} owner   - Repository owner.
			 * @param {string} repo    - Repository name.
			 * @param {string} number  - PR number.
			 *
			 * @returns {Promise<boolean>} Promise resolving to boolean.
			 */
			async function hasUnverifiedCommit( octokit, owner, repo, number ) {
				for await ( const response of octokit.paginate.iterator( octokit.pulls.listCommits, {
					owner,
					repo,
					pull_number: +number,
				} ) ) {
					if (
						response.data.find( commit => commit.commit.message.includes( '[not verified]' ) )
					) {
						return true;
					}
				}

				return false;
			}

			/**
			 * Check for status labels on a PR.
			 *
			 * @param {GitHub} octokit - Initialized Octokit REST client.
			 * @param {string} owner   - Repository owner.
			 * @param {string} repo    - Repository name.
			 * @param {string} number  - PR number.
			 *
			 * @returns {Promise<boolean>} Promise resolving to boolean.
			 */
			async function hasStatusLabels( octokit, owner, repo, number ) {
				const labels = await getLabels( octokit, owner, repo, number );
				// We're only interested in status labels, but not the "Needs Reply" label since it can be added by the action.
				return !! labels.find( label => label.match( /^\[Status\].*(?<!Author Reply)$/ ) );
			}

			/**
			 * Check for a "Need Review" label on a PR.
			 *
			 * @param {GitHub} octokit - Initialized Octokit REST client.
			 * @param {string} owner   - Repository owner.
			 * @param {string} repo    - Repository name.
			 * @param {string} number  - PR number.
			 *
			 * @returns {Promise<boolean>} Promise resolving to boolean.
			 */
			async function hasNeedsReviewLabel( octokit, owner, repo, number ) {
				const labels = await getLabels( octokit, owner, repo, number );
				// We're really only interested in the Needs review label.
				return !! labels.find( label => label.includes( '[Status] Needs Review' ) );
			}

			/**
			 * Build some info about a specific plugin's release dates.
			 *
			 * @param {string} plugin        - Plugin name.
			 * @param {object} nextMilestone - Information about next milestone as returnde by GitHub.
			 *
			 * @returns {Promise<string>} Promise resolving to info about the release (code freeze, release date).
			 */
			async function getMilestoneDates( plugin, nextMilestone ) {
				let releaseDate;
				let codeFreezeDate;
				if ( nextMilestone ) {
					releaseDate = moment( nextMilestone.due_on ).format( 'LL' );

					// Look for a code freeze date in the milestone description.
					const dateRegex = /^Code Freeze: (\d{4}-\d{2}-\d{2})\s*$/m;
					const freezeDateDescription = nextMilestone.description.match( dateRegex );

					// If we have a date and it is valid, use it, otherwise set code freeze to a week before the release.
					if ( freezeDateDescription && moment( freezeDateDescription[ 1 ] ).isValid() ) {
						codeFreezeDate = moment( freezeDateDescription[ 1 ] ).format( 'LL' );
					} else {
						codeFreezeDate = moment( nextMilestone.due_on ).subtract( 7, 'd' ).format( 'LL' );
					}
				} else {
					// Fallback to raw math calculation
					// Calculate next release date
					const firstTuesdayOfMonth = moment().add( 1, 'months' ).startOf( 'month' );
					while ( firstTuesdayOfMonth.day() !== 2 ) {
						firstTuesdayOfMonth.add( 1, 'day' );
					}
					releaseDate = firstTuesdayOfMonth.format( 'LL' );
					// Calculate next code freeze date
					codeFreezeDate = firstTuesdayOfMonth.subtract( 8, 'd' ).format( 'LL' );
				}

				const capitalizedName = plugin
					.split( '-' )
					// Capitalize first letter of each word.
					.map( word => `${ word[ 0 ].toUpperCase() }${ word.slice( 1 ) }` )
					// Spaces between words.
					.join( ' ' );

				return `
******

**${ capitalizedName } plugin:**
- Next scheduled release: _${ releaseDate }_.
- Scheduled code freeze: _${ codeFreezeDate }_.
`;
			}

			/**
			 * Build a string with info about the next milestone.
			 *
			 * @param {GitHub} octokit - Initialized Octokit REST client.
			 * @param {string} owner   - Repository owner.
			 * @param {string} repo    - Repository name.
			 * @param {string} number  - PR number.
			 *
			 * @returns {Promise<string>} Promise resolving to info about the next release for that plugin.
			 */
			async function buildMilestoneInfo( octokit, owner, repo, number ) {
				const plugins = await getPluginNames( octokit, owner, repo, number );
				let pluginInfo = '';

				debug(
					`check-description: This PR impacts the following plugins: ${ plugins.join( ', ' ) }`
				);

				// Get next valid milestone for each plugin.
				for await ( const plugin of plugins ) {
					const nextMilestone = await getNextValidMilestone( octokit, owner, repo, plugin );
					debug( `check-description: Milestone found: ${ JSON.stringify( nextMilestone ) }` );

					debug( `check-description: getting milestone info for ${ plugin }` );
					const info = await getMilestoneDates( plugin, nextMilestone );

					pluginInfo += info;
				}

				return pluginInfo;
			}

			/**
			 * Search for a previous comment from this task in our PR.
			 *
			 * @param {GitHub} octokit - Initialized Octokit REST client.
			 * @param {string} owner   - Repository owner.
			 * @param {string} repo    - Repository name.
			 * @param {string} number  - PR number.
			 *
			 * @returns {Promise<number>} Promise resolving to boolean.
			 */
			async function getCheckComment( octokit, owner, repo, number ) {
				let commentID = 0;

				debug( `check-description: Looking for a previous comment from this task in our PR.` );

				for await ( const response of octokit.paginate.iterator( octokit.issues.listComments, {
					owner,
					repo,
					issue_number: +number,
				} ) ) {
					response.data.map( comment => {
						if (
							comment.user.login === 'github-actions[bot]' &&
							comment.body.includes( '**Thank you for your PR!**' )
						) {
							commentID = comment.id;
						}
					} );
				}

				return commentID;
			}

			/**
			 * Compose a list item with appropriate status check and passed message
			 *
			 * @param {boolean} isFailure - Boolean condition to determine if check failed.
			 * @param {string} checkMessage - Sentence describing successful check.
			 * @param {string} severity - Optional. Check severity. Could be one of `error`, `warning`, `notice`
			 *
			 * @returns {string} - List item with status emoji and a sentence describing check.
			 */
			function statusEntry( isFailure, checkMessage, severity = 'error' ) {
				const severityMap = {
					error: ':red_circle:',
					warning: ':warning:',
					notice: ':spiral_notepad:',
					ok: ':white_check_mark:',
				};
				const status = isFailure ? severityMap[ severity ] : severityMap.ok;
				return `
- ${ status } ${ checkMessage }<br>`;
			}

			/**
			 * Returns list of projects with missing changelog entries
			 *
			 * @param {GitHub} octokit - Initialized Octokit REST client.
			 * @param {string} owner   - Repository owner.
			 * @param {string} repo    - Repository name.
			 * @param {string} number  - PR number.
			 *
			 * @returns {Array} - list of affected projects without changelog entry
			 */
			async function getChangelogEntries( octokit, owner, repo, number ) {
				const files = await getFiles( octokit, owner, repo, number );
				const affectedProjects = getAffectedChangeloggerProjects( files );
				debug( `check-description: affected changelogger projects: ${ affectedProjects }` );

				return affectedProjects.reduce( ( acc, project ) => {
					const composerFile =
						process.env.GITHUB_WORKSPACE + `/projects/${ project }/composer.json`;
					const json = JSON.parse( fs.readFileSync( composerFile ) );
					// Changelog directory could customized via .extra.changelogger.changes-dir in composer.json. Lets check for it.
					const changelogDir =
						path.relative(
							process.env.GITHUB_WORKSPACE,
							path.resolve(
								process.env.GITHUB_WORKSPACE + `/projects/${ project }`,
								( json.extra &&
									json.extra.changelogger &&
									json.extra.changelogger[ 'changes-dir' ] ) ||
									'changelog'
							)
						) + '/';
					const found = files.find( file => file.startsWith( changelogDir ) );
					if ( ! found ) {
						acc.push( `projects/${ project }` );
					}
					return acc;
				}, [] );
			}

			/**
			 * Compose a list of checks for the PR
			 * Covers:
			 * - Short PR description
			 * - Unverified commits
			 * - Missing `[Status]` label
			 * - Missing "Testing instructions"
			 * - Missing Changelog entry
			 * - Privacy section
			 *
			 * Note: All the checks should be truthy to resolve as success check.
			 *
			 * @param {WebhookPayloadPullRequest} payload - Pull request event payload.
			 * @param {GitHub}                    octokit - Initialized Octokit REST client.
			 *
			 * @returns {string} List of checks with appropriate status emojis.
			 */
			async function getStatusChecks( payload, octokit ) {
				const { body, number, head, base } = payload.pull_request;
				const { name: repo, owner } = payload.repository;
				const ownerLogin = owner.login;

				const hasLongDescription = body.length > 200;
				const isClean = ! ( await hasUnverifiedCommit( octokit, ownerLogin, repo, number ) );
				const isLabeled = await hasStatusLabels( octokit, ownerLogin, repo, number );
				const hasTesting = body.includes( 'Testing instructions' );
				const hasPrivacy = body.includes( 'data or activity we track or use' );
				const projectsWithoutChangelog = await getChangelogEntries(
					octokit,
					ownerLogin,
					repo,
					number
				);
				const isFromContributor = head.repo.full_name === base.repo.full_name;

				return {
					hasLongDescription,
					isClean,
					isLabeled,
					hasTesting,
					hasPrivacy,
					projectsWithoutChangelog,
					hasChangelogEntries: projectsWithoutChangelog.length === 0,
					isFromContributor,
				};
			}

			/**
			 * Compose a list of checks for the PR
			 *
			 * @param {object} statusChecks - Map of all checks with boolean as a value
			 *
			 * @returns {string} part of the comment with list of checks
			 */
			function renderStatusChecks( statusChecks ) {
				// No PR is too small to include a description of why you made a change
				let checks = statusEntry(
					! statusChecks.hasLongDescription,
					'Include a description of your PR changes.'
				);

				// Check all commits in PR.
				// In this case, we use a different failure icon, as we do not consider this a blocker, it should not trigger label changes.
				checks += statusEntry(
					! statusChecks.isClean,
					'All commits were linted before commit.',
					'warning'
				);

				// Use labels please!
				// Only check this for PRs created by a12s. External contributors cannot add labels.
				if ( statusChecks.isFromContributor ) {
					debug( `check-description: this PR is correctly labeled: ${ statusChecks.isLabeled }` );
					checks += statusEntry(
						! statusChecks.isLabeled,
						'Add a "[Status]" label (In Progress, Needs Team Review, ...).'
					);
				}

				// Check for testing instructions.
				checks += statusEntry( ! statusChecks.hasTesting, 'Add testing instructions.' );

				// Check if the Privacy section is filled in.
				checks += statusEntry(
					! statusChecks.hasPrivacy,
					'Specify whether this PR includes any changes to data or privacy.'
				);

				debug(
					`check-description: Changelog entries missing for ${ statusChecks.projectsWithoutChangelog }`
				);
				checks += statusEntry(
					! statusChecks.hasChangelogEntries,
					'Add changelog entries to affected projects'
				);

				debug( `check-description: privacy checked. Status checks so far is ${ checks }` );

				return checks;
			}

			/**
			 * Compose a list of recommendations based on failed checks
			 *
			 * @param {object} statusChecks - Map of all checks with boolean as a value
			 *
			 * @returns {string} part of the comment with recommendations
			 */
			function renderRecommendations( statusChecks ) {
				const recommendations = {
					hasLongDescription:
						'Please edit your PR description and explain what functional changes your PR includes, and why those changes are needed.',
					hasPrivacy: `We would recommend that you add a section to the PR description to specify whether this PR includes any changes to data or privacy, like so:
~~~
#### Does this pull request change what data or activity we track or use?

My PR adds *x* and *y*.
~~~`,
					hasTesting: `Please include detailed testing steps, explaining how to test your change, like so:
~~~
#### Testing instructions:

* Go to '..'
*
~~~`,
					hasChangelogEntries: `Please add missing changelog entries for the following projects: \`${ statusChecks.projectsWithoutChangelog.join(
						'`, `'
					) }\`

Go to that project and use \`vendor/bin/changelogger add\` to add a change file.
Guidelines: [/docs/writing-a-good-changelog-entry.md](https://github.com/Automattic/jetpack/blob/master/docs/writing-a-good-changelog-entry.md)
`,
				};

				// If some of the tests are failing, display list of things that could be updated in the PR description to fix things.
				return Object.keys( statusChecks ).reduce( ( output, check ) => {
					// If some of the checks have failed, lets recommend some next steps.
					if ( ! statusChecks[ check ] && recommendations[ check ] ) {
						output += `
:red_circle: **Action required:** ${ recommendations[ check ] }

******`;
					}
					return output;
				}, '' );
			}

			/**
			 * Creates or updates a comment on PR.
			 *
			 * @param {WebhookPayloadPullRequest} payload - Pull request event payload.
			 * @param {GitHub} octokit - Initialized Octokit REST client.
			 * @param {string} comment - Comment string
			 */
			async function postComment( payload, octokit, comment ) {
				const { number } = payload.pull_request;
				const { name: repo, owner } = payload.repository;
				const ownerLogin = owner.login;
				const commentOpts = {
					owner: ownerLogin,
					repo,
					body: comment,
				};

				const existingComment = await getCheckComment( octokit, ownerLogin, repo, number );

				// If there is a comment already, update it.
				if ( existingComment !== 0 ) {
					debug( `check-description: update comment ID ${ existingComment } with our new remarks` );
					await octokit.issues.updateComment( {
						...commentOpts,
						comment_id: +existingComment,
					} );
				} else {
					// If no comment was published before, publish one now.
					debug( `check-description: Posting comment to PR #${ number }` );
					await octokit.issues.createComment( {
						...commentOpts,
						issue_number: +number,
					} );
				}
			}

			/**
			 * Update labels for PRs with failing checks
			 *
			 * @param {WebhookPayloadPullRequest} payload - Pull request event payload.
			 * @param {GitHub}                    octokit - Initialized Octokit REST client.
			 */
			async function updateLabels( payload, octokit ) {
				const { number } = payload.pull_request;
				const { name: repo, owner } = payload.repository;
				const ownerLogin = owner.login;
				const labelOpts = {
					owner: ownerLogin,
					repo,
					issue_number: +number,
				};

				debug( `check-description: some of the checks are failing. Update labels accordingly.` );

				const hasNeedsReview = await hasNeedsReviewLabel( octokit, ownerLogin, repo, number );
				if ( hasNeedsReview ) {
					debug( `check-description: remove existing Needs review label.` );
					await octokit.issues.removeLabel( {
						...labelOpts,
						name: '[Status] Needs Review',
					} );
				}

				debug( `check-description: add Needs Author Reply label.` );
				await octokit.issues.addLabels( {
					...labelOpts,
					labels: [ '[Status] Needs Author Reply' ],
				} );
			}

			/**
			 * Checks the contents of a PR description.
			 *
			 * @param {WebhookPayloadPullRequest} payload - Pull request event payload.
			 * @param {GitHub}                    octokit - Initialized Octokit REST client.
			 */
			async function checkDescription( payload, octokit ) {
				const {
					number,
					user: { login: author },
				} = payload.pull_request;
				const { name: repo, owner } = payload.repository;
				const ownerLogin = owner.login;
				const statusChecks = await getStatusChecks( payload, octokit );

				debug( `check-description: Status checks: ${ JSON.stringify( statusChecks ) }` );

				if ( author === 'renovate[bot]' ) {
					debug( `check-description: PR was created by ${ author }, skipping` );
					return;
				}

				debug( `check-description: start building our comment` );

				// We'll add any remarks we may have about the PR to that comment body.
				let comment = `**Thank you for your PR!**

When contributing to Jetpack, we have [a few suggestions](https://github.com/Automattic/jetpack/blob/master/.github/PULL_REQUEST_TEMPLATE.md) that can help us test and review your patch:<br>`;

				comment += renderStatusChecks( statusChecks );
				comment += `


This comment will be updated as you work on your PR and make changes. If you think that some of those checks are not needed for your PR, please explain why you think so. Thanks for cooperation :robot:

******`;

				comment += renderRecommendations( statusChecks );

				// Display extra info for Automatticians (who can handle labels and who created the PR without a fork).
				if ( statusChecks.isFromContributor ) {
					comment += `

Once your PR is ready for review, check one last time that all required checks (other than "Required review") appearing at the bottom of this PR are passing or skipped.
Then, add the "[Status] Needs Team review" label and ask someone from your team review the code.
Once you’ve done so, switch to the "[Status] Needs Review" label; someone from Jetpack Crew will then review this PR and merge it to be included in the next Jetpack release.`;
				}

				// Gather info about the next release for that plugin.
				const milestoneInfo = await buildMilestoneInfo( octokit, ownerLogin, repo, number );
				if ( milestoneInfo ) {
					comment += milestoneInfo;
				}

				// Look for an existing check-description task comment.
				await postComment( payload, octokit, comment );

				// If some of our checks are failing, remove any "Needs Review" labels and add an Needs Author Reply label.
				if ( comment.includes( ':red_circle:' ) ) {
					await updateLabels( payload, octokit );
				}
			}

			module.exports = checkDescription;

			/***/
		},

		/***/ 3341: /***/ ( module, __unused_webpack_exports, __nccwpck_require__ ) => {
			/**
			 * Internal dependencies
			 */
			const debug = __nccwpck_require__( 1806 );
			const getLabels = __nccwpck_require__( 4077 );

			/* global GitHub, WebhookPayloadPullRequest */

			/**
			 * Manage labels when a PR gets merged.
			 *
			 * @param {WebhookPayloadPullRequest} payload - Pull Request event payload.
			 * @param {GitHub}                    octokit - Initialized Octokit REST client.
			 */
			async function cleanLabels( payload, octokit ) {
				const { pull_request, repository, action } = payload;
				const { number } = pull_request;
				const { name: repo, owner } = repository;
				const ownerLogin = owner.login;

				// Normally this only gets triggered when PRs get closed, but let's be sure.
				if ( action !== 'closed' ) {
					debug( `clean-labels: PR #${ number } is not closed. Aborting.` );
					return;
				}

				// Get array of all labels on the PR.
				const labelsOnPr = await getLabels( octokit, ownerLogin, repo, number );

				// List of all labels we want to remove.
				const labelsToRemove = [
					'[Status] Ready to Merge',
					'[Status] Needs Review',
					'[Status] Needs Team Review',
					'[Status] In Progress',
					'[Status] Needs Author Reply',
					'[Status] Needs Design Review',
					'[Status] Needs i18n Review',
					'[Status] String Freeze',
				];

				const labelsToRemoveFromPr = labelsOnPr.filter( label => labelsToRemove.includes( label ) );

				if ( ! labelsToRemoveFromPr.length ) {
					debug( `clean-labels: no labels to remove from #${ number }. Aborting.` );
					return;
				}

				debug(
					`clean-labels: found some labels that will need to be removed from #${ number }: ${ JSON.stringify(
						labelsToRemoveFromPr
					) }`
				);
				labelsToRemoveFromPr.map( name => {
					debug( `clean-labels: removing the ${ name } label from PR #${ number }` );
					octokit.issues.removeLabel( {
						owner: ownerLogin,
						repo,
						issue_number: number,
						name,
					} );
				} );
			}

			module.exports = cleanLabels;

			/***/
		},

		/***/ 2425: /***/ ( module, __unused_webpack_exports, __nccwpck_require__ ) => {
			/**
			 * External dependencies
			 */
			const { getInput, setFailed } = __nccwpck_require__( 2186 );

			/**
			 * Internal dependencies
			 */
			const debug = __nccwpck_require__( 1806 );
			const getLabels = __nccwpck_require__( 4077 );
			const sendSlackMessage = __nccwpck_require__( 4701 );

			/* global GitHub, WebhookPayloadPullRequest */

			/**
			 * Check for a Design Review status label on a PR.
			 *
			 * @param {GitHub} octokit - Initialized Octokit REST client.
			 * @param {string} owner   - Repository owner.
			 * @param {string} repo    - Repository name.
			 * @param {string} number  - PR number.
			 *
			 * @returns {Promise<boolean>} Promise resolving to boolean.
			 */
			async function hasNeedsDesignReviewLabel( octokit, owner, repo, number ) {
				const labels = await getLabels( octokit, owner, repo, number );
				// We're only interested in the Needs Design Review label.
				return labels.includes( '[Status] Needs Design Review' );
			}

			/**
			 * Check for a Needs Design label on a PR.
			 *
			 * @param {GitHub} octokit - Initialized Octokit REST client.
			 * @param {string} owner   - Repository owner.
			 * @param {string} repo    - Repository name.
			 * @param {string} number  - PR number.
			 *
			 * @returns {Promise<boolean>} Promise resolving to boolean.
			 */
			async function hasNeedsDesignLabel( octokit, owner, repo, number ) {
				const labels = await getLabels( octokit, owner, repo, number );
				// We're only interested in the Needs Design label.
				return labels.includes( '[Status] Needs Design' );
			}

			/**
			 * Check for a Design Input Requested label on a PR.
			 *
			 * @param {GitHub} octokit - Initialized Octokit REST client.
			 * @param {string} owner   - Repository owner.
			 * @param {string} repo    - Repository name.
			 * @param {string} number  - PR number.
			 *
			 * @returns {Promise<boolean>} Promise resolving to boolean.
			 */
			async function hasDesignInputRequestedLabel( octokit, owner, repo, number ) {
				const labels = await getLabels( octokit, owner, repo, number );
				// We're only interested in the Design Input Requested label.
				return labels.includes( '[Status] Design Input Requested' );
			}

			/**
			 * Send a Slack notification about a label to the Design team.
			 *
			 * @param {WebhookPayloadPullRequest} payload - Pull request event payload.
			 * @param {GitHub}                    octokit - Initialized Octokit REST client.
			 */
			async function notifyDesign( payload, octokit ) {
				const { number, repository } = payload;
				const { owner, name: repo } = repository;
				const ownerLogin = owner.login;

				const slackToken = getInput( 'slack_token' );
				if ( ! slackToken ) {
					setFailed( `notify-design: Input slack_token is required but missing. Aborting.` );
					return;
				}

				const channel = getInput( 'slack_design_channel' );
				if ( ! channel ) {
					setFailed(
						`notify-design: Input slack_design_channel is required but missing. Aborting.`
					);
					return;
				}

				// Check if design input was already requested for that PR.
				const hasBeenRequested = await hasDesignInputRequestedLabel(
					octokit,
					ownerLogin,
					repo,
					number
				);
				if ( hasBeenRequested ) {
					debug(
						`notify-design: Design input was already requested for PR #${ number }. Aborting.`
					);
					return;
				}

				// Check for a Needs Design Review label.
				const isLabeledForDesign = await hasNeedsDesignLabel( octokit, ownerLogin, repo, number );
				if ( isLabeledForDesign ) {
					debug(
						`notify-design: Found a Needs Design label on PR #${ number }. Sending in Slack message.`
					);
					await sendSlackMessage(
						`Someone would be interested in input from the Design team on this topic.`,
						channel,
						slackToken,
						payload
					);
				}

				// Check for a Needs Design label.
				const isLabeledForReview = await hasNeedsDesignReviewLabel(
					octokit,
					ownerLogin,
					repo,
					number
				);
				if ( isLabeledForReview ) {
					debug(
						`notify-design: Found a Needs Design Review label on PR #${ number }. Sending in Slack message.`
					);
					await sendSlackMessage(
						`Someone is looking for a review from the design team.`,
						channel,
						slackToken,
						payload
					);
				}

				if ( isLabeledForDesign || isLabeledForReview ) {
					debug(
						`notify-design: Adding a label to PR #${ number } to show that design input was requested.`
					);
					await octokit.issues.addLabels( {
						owner: ownerLogin,
						repo,
						issue_number: number,
						labels: [ '[Status] Design Input Requested' ],
					} );
				}
			}

			module.exports = notifyDesign;

			/***/
		},

		/***/ 442: /***/ ( module, __unused_webpack_exports, __nccwpck_require__ ) => {
			/**
			 * Internal dependencies
			 */
			const debug = __nccwpck_require__( 1806 );
			const getAssociatedPullRequest = __nccwpck_require__( 4578 );

			/* global GitHub, WebhookPayloadPush */

			/**
			 * Search for a previous comment from this task in our PR.
			 * If we find one, return its body.
			 *
			 * @param {GitHub} octokit - Initialized Octokit REST client.
			 * @param {string} owner   - Repository owner.
			 * @param {string} repo    - Repository name.
			 * @param {string} number  - PR number.
			 *
			 * @returns {Promise<string>} Promise resolving to a string.
			 */
			async function getMatticBotComment( octokit, owner, repo, number ) {
				let commentBody = '';

				debug( `wpcom-commit-reminder: Looking for a comment from Matticbot on this PR.` );

				for await ( const response of octokit.paginate.iterator( octokit.issues.listComments, {
					owner: owner.login,
					repo,
					issue_number: +number,
				} ) ) {
					response.data.map( comment => {
						if (
							comment.user.login === 'matticbot' &&
							comment.body.includes( 'This PR has changes that must be merged to WordPress.com' )
						) {
							commentBody = comment.body;
						}
					} );
				}

				return commentBody;
			}

			/**
			 * Search for a previous comment from this task in our PR.
			 *
			 * @param {GitHub} octokit - Initialized Octokit REST client.
			 * @param {string} owner   - Repository owner.
			 * @param {string} repo    - Repository name.
			 * @param {string} number  - PR number.
			 *
			 * @returns {Promise<boolean>} Promise resolving to boolean.
			 */
			async function hasReminderComment( octokit, owner, repo, number ) {
				debug( `wpcom-commit-reminder: Looking for a previous comment from this task in our PR.` );

				for await ( const response of octokit.paginate.iterator( octokit.issues.listComments, {
					owner: owner.login,
					repo,
					issue_number: +number,
				} ) ) {
					response.data.map( comment => {
						if (
							comment.user.login === 'github-actions[bot]' &&
							comment.body.includes( 'Great news! One last step' )
						) {
							return true;
						}
					} );
				}

				return false;
			}

			/**
			 * Checks the contents of a PR description.
			 *
			 * @param {WebhookPayloadPush} payload - Push event payload.
			 * @param {GitHub}             octokit - Initialized Octokit REST client.
			 */
			async function wpcomCommitReminder( payload, octokit ) {
				const { commits, ref, repository } = payload;
				const { name: repo, owner } = repository;

				// We should not get to that point as the action is triggered on pushes to master, but...
				if ( ref !== 'refs/heads/master' ) {
					debug( 'wpcom-commit-reminder: Commit is not to `master`. Aborting' );
					return;
				}

				const prNumber = getAssociatedPullRequest( commits[ 0 ] );
				if ( ! prNumber ) {
					debug( 'wpcom-commit-reminder: Commit is not a squashed PR. Aborting' );
					return;
				}

				// Look for an existing check-description task comment.
				const matticBotComment = await getMatticBotComment( octokit, owner, repo, prNumber );

				// get diff id from comment body above.
				const diffId = matticBotComment.match( /(D\d{5}-code)/ );

				if ( ! diffId || 0 === diffId.length ) {
					debug( 'wpcom-commit-reminder: We could not find a diff ID. Aborting' );
					return;
				}
				// Build our comment body.
				const comment = `
Great news! One last step: head over to your WordPress.com diff, ${ diffId[ 0 ] }, and commit it.
Once you've done so, come back to this PR and add a comment with your changeset ID.

**Thank you!**
	`;

				// Look for an existing reminder comment.
				const hasComment = await hasReminderComment( octokit, owner, repo, prNumber );

				// If there is no comment yet, go ahead and comment.
				if ( ! hasComment ) {
					debug( `wpcom-commit-reminder: Posting comment to PR #${ prNumber }` );

					await octokit.issues.createComment( {
						owner: owner.login,
						repo,
						issue_number: +prNumber,
						body: comment,
					} );
				}
			}

			module.exports = wpcomCommitReminder;

			/***/
		},

		/***/ 2877: /***/ module => {
			module.exports = eval( 'require' )( 'encoding' );

			/***/
		},

		/***/ 2357: /***/ module => {
			'use strict';
			module.exports = require( 'assert' );

			/***/
		},

		/***/ 8614: /***/ module => {
			'use strict';
			module.exports = require( 'events' );

			/***/
		},

		/***/ 5747: /***/ module => {
			'use strict';
			module.exports = require( 'fs' );

			/***/
		},

		/***/ 8605: /***/ module => {
			'use strict';
			module.exports = require( 'http' );

			/***/
		},

		/***/ 7211: /***/ module => {
			'use strict';
			module.exports = require( 'https' );

			/***/
		},

		/***/ 1631: /***/ module => {
			'use strict';
			module.exports = require( 'net' );

			/***/
		},

		/***/ 2087: /***/ module => {
			'use strict';
			module.exports = require( 'os' );

			/***/
		},

		/***/ 5622: /***/ module => {
			'use strict';
			module.exports = require( 'path' );

			/***/
		},

		/***/ 2413: /***/ module => {
			'use strict';
			module.exports = require( 'stream' );

			/***/
		},

		/***/ 4016: /***/ module => {
			'use strict';
			module.exports = require( 'tls' );

			/***/
		},

		/***/ 8835: /***/ module => {
			'use strict';
			module.exports = require( 'url' );

			/***/
		},

		/***/ 1669: /***/ module => {
			'use strict';
			module.exports = require( 'util' );

			/***/
		},

		/***/ 8761: /***/ module => {
			'use strict';
			module.exports = require( 'zlib' );

			/***/
		},

		/******/
	}; // The module cache
	/************************************************************************/
	/******/ /******/ var __webpack_module_cache__ = {}; // The require function
	/******/

	/******/ /******/ function __nccwpck_require__( moduleId ) {
		/******/ // Check if module is in cache
		/******/ if ( __webpack_module_cache__[ moduleId ] ) {
			/******/ return __webpack_module_cache__[ moduleId ].exports;
			/******/
		} // Create a new module (and put it into the cache)
		/******/ /******/ var module = ( __webpack_module_cache__[ moduleId ] = {
			/******/ id: moduleId,
			/******/ loaded: false,
			/******/ exports: {},
			/******/
		} ); // Execute the module function
		/******/

		/******/ /******/ var threw = true;
		/******/ try {
			/******/ __webpack_modules__[ moduleId ].call(
				module.exports,
				module,
				module.exports,
				__nccwpck_require__
			);
			/******/ threw = false;
			/******/
		} finally {
			/******/ if ( threw ) delete __webpack_module_cache__[ moduleId ];
			/******/
		} // Flag the module as loaded
		/******/

		/******/ /******/ module.loaded = true; // Return the exports of the module
		/******/

		/******/ /******/ return module.exports;
		/******/
	} /* webpack/runtime/node module decorator */
	/******/

	/************************************************************************/
	/******/ /******/ ( () => {
		/******/ __nccwpck_require__.nmd = module => {
			/******/ module.paths = [];
			/******/ if ( ! module.children ) module.children = [];
			/******/ return module;
			/******/
		};
		/******/
	} )(); /* webpack/runtime/compat */
	/******/

	/******/ /******/

	/******/ __nccwpck_require__.ab =
		__dirname + '/'; /************************************************************************/ // module exports must be returned from runtime so entry inlining is disabled // startup // Load entry module and return exports
	/******/ /******/ /******/ /******/ return __nccwpck_require__( 4351 );
	/******/
} )();
//# sourceMappingURL=index.js.map
