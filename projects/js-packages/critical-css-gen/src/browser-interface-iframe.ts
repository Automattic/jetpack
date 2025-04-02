import { BrowserInterface, BrowserRunnable } from './browser-interface.js';
import {
	CrossDomainError,
	HttpError,
	LoadTimeoutError,
	RedirectError,
	UrlVerifyError,
	UnknownError,
	XFrameDenyError,
	InvalidURLError,
	UrlError,
} from './errors.js';
import { Viewport, NullableViewport } from './types.js';

const defaultLoadTimeout = 60 * 1000;

type VerifyMethod = ( rawUrl: string, contentWindow: Window, contentDocument: Document ) => boolean;

type BrowserInterfaceIframeOptions = {
	requestGetParameters?: { [ key: string ]: string };
	loadTimeout?: number;
	verifyPage: VerifyMethod;
	allowScripts?: boolean;
};

export class BrowserInterfaceIframe extends BrowserInterface {
	private requestGetParameters: { [ key: string ]: string };
	private loadTimeout: number;
	private verifyPage: VerifyMethod;

	private currentUrl: string | null;
	private currentSize: NullableViewport;

	private wrapperDiv: HTMLDivElement;
	private iframe: HTMLIFrameElement;

	constructor( {
		requestGetParameters,
		loadTimeout,
		verifyPage,
		allowScripts,
	}: BrowserInterfaceIframeOptions ) {
		super();

		this.requestGetParameters = requestGetParameters || {};
		this.loadTimeout = loadTimeout || defaultLoadTimeout;
		this.verifyPage = verifyPage;

		// Default 'allowScripts' to true if not specified.
		allowScripts = allowScripts !== false;

		this.currentUrl = null;
		this.currentSize = { width: null, height: null };

		// Create a wrapper div to keep the iframe invisible.
		this.wrapperDiv = document.createElement( 'div' );
		this.wrapperDiv.setAttribute(
			'style',
			'position:fixed; z-index: -1000; opacity: 0; top: 50px;'
		);
		document.body.append( this.wrapperDiv );

		// Create iframe itself.
		this.iframe = document.createElement( 'iframe' );
		this.iframe.setAttribute( 'style', 'max-width: none; max-height: none; border: 0px;' );
		this.iframe.setAttribute( 'aria-hidden', 'true' );
		this.iframe.setAttribute(
			'sandbox',
			'allow-same-origin ' + ( allowScripts ? 'allow-scripts' : '' )
		);
		this.wrapperDiv.append( this.iframe );
	}

	async cleanup() {
		this.iframe.remove();
		this.wrapperDiv.remove();
	}

	async fetch( url: string, options: RequestInit, _role: 'css' | 'html' ) {
		return window.fetch( url, options );
	}

	async runInPage< ReturnType >(
		pageUrl: string,
		viewport: Viewport | null,
		method: BrowserRunnable< ReturnType >,
		...args: unknown[]
	): Promise< ReturnType > {
		await this.loadPage( pageUrl );

		if ( viewport ) {
			await this.resize( viewport );
		}

		// The inner window in the iframe is separate from the main window object.
		// Pass the iframe window object to the evaluating method.
		return method( { innerWindow: this.iframe.contentWindow, args } );
	}

	addGetParameters( url: URL ): string {
		for ( const key of Object.keys( this.requestGetParameters ) ) {
			url.searchParams.append( key, this.requestGetParameters[ key ] );
		}

		return url.toString();
	}

	async diagnoseUrlError( url: string ): Promise< UrlError | null > {
		try {
			const response = await this.fetch( url, { redirect: 'manual' }, 'html' );
			const headers = response.headers;

			if ( headers.get( 'x-frame-options' ) === 'DENY' ) {
				return new XFrameDenyError( { url } );
			}

			if ( response.type === 'opaqueredirect' ) {
				return new RedirectError( {
					url,
					redirectUrl: response.url,
				} );
			}

			if ( response.status === 200 ) {
				return null;
			}

			return new HttpError( { url, code: response.status } );
		} catch ( err ) {
			return new UnknownError( { url, message: err.message } );
		}
	}

	async is404Page( url: string ): Promise< boolean > {
		const response = await this.fetch( url, { redirect: 'manual' }, 'html' );

		return response.status === 404;
	}

	sameOrigin( url: string ): boolean {
		return new URL( url ).origin === window.location.origin;
	}

	async loadPage( rawUrl: string ): Promise< void > {
		if ( rawUrl === this.currentUrl ) {
			return;
		}

		// Make sure URL is valid.
		let url;
		try {
			url = new URL( rawUrl );
		} catch ( err ) {
			this.trackUrlError( rawUrl, err );
			throw new InvalidURLError( { url: rawUrl } );
		}

		const fullUrl = this.addGetParameters( url );

		return new Promise( ( resolve, rawReject ) => {
			// Track all URL errors.
			const reject = err => {
				this.trackUrlError( rawUrl, err );
				rawReject( err );
			};

			// Catch cross-domain errors before they occur.
			if ( ! this.sameOrigin( fullUrl ) ) {
				reject( new CrossDomainError( { url: fullUrl } ) );
				return;
			}

			// Set a timeout.
			const timeoutId = setTimeout( () => {
				this.iframe.onload = null;
				reject( new LoadTimeoutError( { url: fullUrl } ) );
			}, this.loadTimeout );

			// Catch load event.
			this.iframe.onload = async () => {
				try {
					this.iframe.onload = null;
					clearTimeout( timeoutId );

					// Check HTTP status code first.
					const is404 = await this.is404Page( fullUrl );
					if ( is404 ) {
						throw new HttpError( { url: fullUrl, code: 404 } );
					}

					// Verify the inner document is readable.
					if ( ! this.iframe.contentDocument || ! this.iframe.contentWindow ) {
						throw (
							( await this.diagnoseUrlError( fullUrl ) ) || new CrossDomainError( { url: fullUrl } )
						);
					}

					if (
						! this.verifyPage( rawUrl, this.iframe.contentWindow, this.iframe.contentDocument )
					) {
						// Diagnose and throw an appropriate error.
						throw (
							( await this.diagnoseUrlError( fullUrl ) ) || new UrlVerifyError( { url: fullUrl } )
						);
					}

					this.currentUrl = rawUrl;
					resolve();
				} catch ( err ) {
					reject( err );
				}
			};

			this.iframe.src = fullUrl;
		} );
	}

	async resize( { width, height }: Viewport ) {
		if ( this.currentSize.width === width && this.currentSize.height === height ) {
			return;
		}

		return new Promise( resolve => {
			// Set iframe size.
			this.iframe.width = width.toString();
			this.iframe.height = height.toString();

			// Bounce to browser main loop to allow resize to complete.
			setTimeout( resolve, 1 );
		} );
	}
}
