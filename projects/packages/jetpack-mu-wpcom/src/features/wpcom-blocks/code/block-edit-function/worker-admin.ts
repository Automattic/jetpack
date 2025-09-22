import { BLOCK_NAME } from '../common/block';

export class WorkerAdmin {
	#worker: Worker;
	#workerPort: MessagePort;
	// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
	#outbox: Map< string, Function > = new Map();

	static async start(): Promise< WorkerAdmin > {
		const worker = await WorkerAdmin.loadWorker();
		if ( ! worker ) {
			return Promise.reject( 'failed to load worker' );
		}

		// We have to wait for the worker to load and send its initialization
		// message, because if we send one it may arrive before the worker has
		// loaded (and it will miss it).
		return new Promise( ( resolve, reject ) => {
			const waitForPort = ( event: MessageEvent ) => {
				if ( event.data !== 'init' ) {
					return;
				}

				const workerPort = event.ports[ 0 ];
				if ( ! ( workerPort instanceof MessagePort ) ) {
					reject( 'failed to initialize worker port' );
					return;
				}

				worker.removeEventListener( 'message', waitForPort );
				workerPort.postMessage( 'hi' );

				resolve( new WorkerAdmin( worker, workerPort ) );
			};

			worker.addEventListener( 'message', waitForPort );
		} );
	}

	public terminate() {
		this.#worker?.terminate();
	}

	public guessLanguage( code: string ): Promise< string > {
		return this.dispatch< string >( 'guessLanguage', { code }, ( lang: string ) =>
			lang ? [ true, lang ] : [ false, null ]
		);
	}

	private constructor( worker: Worker, workerPort: MessagePort ) {
		this.#worker = worker;
		this.#workerPort = workerPort;

		workerPort.onmessage = ( event: MessageEvent ) => {
			const ref = event.data.ref;
			if ( ! ref ) {
				return;
			}

			const responder = this.#outbox.get( ref );
			if ( ! responder ) {
				return;
			}

			responder( event.data.result );
		};
	}

	private ref() {
		return crypto.randomUUID();
	}

	private dispatch< T >(
		method: string,
		args: object,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		responder: ( ...args: any[] ) => [ true, T ] | [ false, unknown? ]
	): Promise< T > {
		return new Promise( ( resolve, reject ) => {
			const ref = this.ref();

			this.#workerPort.postMessage( { ...args, method, ref } );
			this.#outbox.set( ref, ( response: unknown ) => {
				const [ success, data ] = responder( response );
				if ( success ) {
					resolve( data );
				} else {
					reject( data );
				}

				this.#outbox.delete( ref );
			} );
		} );
	}

	/**
	 * Returns the dynamically-available URL for importing the
	 * code block worker from the page’s import map.
	 *
	 * This is a roundabout way of determining where to load
	 * the module, but because it’s being passed as a string
	 * to `new WebWorker()` it’s a bit more complicated than
	 * calling `import( './code-block-worker' );`.
	 *
	 * @return The worker URL or null if not found.
	 */
	private static getWorkerURL(): string | null {
		const dataContainer = document.getElementById(
			'wp-script-module-data-@a8cCodeBlock/block-edit-function'
		);
		if ( ! dataContainer || 'string' !== typeof dataContainer.textContent ) {
			return null;
		}

		try {
			const { workerUrl, workerVersion } = JSON.parse( dataContainer.textContent );
			const u = new URL( workerUrl );
			u.searchParams.set( 'ver', workerVersion );
			return u.href;
		} catch {
			return null;
		}
	}

	private static async loadWorker(): Promise< Worker | null > {
		const url = WorkerAdmin.getWorkerURL();
		if ( ! url ) {
			return null;
		}

		const workerSourceBlob = await fetch( url ).then( response => {
			if ( ! response.ok ) {
				throw new Error( `Failed to load worker with: ${ response.status }` );
			}
			return response.blob();
		} );
		const workerObjectURL = URL.createObjectURL( workerSourceBlob );

		const worker = new Worker( workerObjectURL, {
			type: 'module',
			name: `${ BLOCK_NAME } block`,
		} );
		URL.revokeObjectURL( workerObjectURL );
		return worker;
	}
}
