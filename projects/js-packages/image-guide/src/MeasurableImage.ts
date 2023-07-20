export type SourceCallbackFn = ( node: HTMLElement ) => string | null;
export type Dimensions = { width: number; height: number };
export type Weight = { weight: number };

export type FetchFn = ( input: URL | RequestInfo, init?: RequestInit ) => Promise< Response >;

/**
 * A class that represents a DOM Element that
 * has an image that should be measured and
 * provides measurement utilities.
 */
export class MeasurableImage {
	readonly node: HTMLElement | HTMLImageElement;
	private getURLCallback: SourceCallbackFn;
	private fetchPromises: { [ url: string ]: Promise< Response > } = {};

	public fetch: FetchFn;

	/**
	 * Constructor.
	 *
	 * @param {HTMLElement | HTMLImageElement} node -  The DOM Element that contains the image.
	 * @param {SourceCallbackFn} getURL             -  A function that takes in the node and returns the URL of the image.
	 * @param {FetchFn} fetchFn                     -  A function that fetches a URL and returns a Promise.
	 */
	constructor(
		node: HTMLElement | HTMLImageElement,
		getURL: SourceCallbackFn,
		fetchFn: FetchFn | null = null
	) {
		this.node = node;
		this.getURLCallback = getURL;
		this.fetch = fetchFn ?? window.fetch.bind( window );
	}

	public getURL() {
		return this.getURLCallback( this.node );
	}

	public getSizeOnPage() {
		const { width, height } = this.node.getBoundingClientRect();

		return {
			width: Math.round( width ),
			height: Math.round( height ),
		};
	}

	/**
	 * Returns the mimetype of the image file. Guesses from URL if header is unavailable.
	 *
	 * @param {string} url -  The URL of the image.
	 * @returns {string} - The mimetype of the image.
	 */
	public async getMimeType( url: string ): Promise< string > {
		const response = await this.cachedFetch( url );
		if ( ! response.ok ) {
			// Guess from URL.
			const guesses = {
				'.png': 'image/png',
				'.jpg': 'image/jpeg',
				'.jpeg': 'image/jpeg',
				'.gif': 'image/gif',
				'.webp': 'image/webp',
			};

			for ( const [ extension, guess ] of Object.entries( guesses ) ) {
				if ( url.includes( extension ) ) {
					return guess;
				}
			}

			// Can't figure it out.
			return 'unknown';
		}

		return response.headers.get( 'content-type' );
	}

	public async getFileSize( url: string ) {
		const [ weight, { width, height } ] = await Promise.all( [
			this.fetchFileWeight( url ),
			this.fetchFileDimensions( url ),
		] );

		return {
			width,
			height,
			weight,
		};
	}

	/**
	 * Guess the size (in kilobytes) of a file using the given mimetype at the given dimensions.
	 * If the mimetype is unrecognized, assume it is akin to jpeg/png (1:10 ratio).
	 *
	 * Cited sources for ratios:
	 * - GIF and JPEG: http://ist.uwaterloo.ca/~anderson/images/GIFvsJPEG/compression_rates.html
	 * - WebP: https://developers.google.com/speed/webp/docs/webp_study
	 *
	 * @param {string}     mimeType   - The mimetype of the image.
	 * @param {Dimensions} dimensions - The dimensions of the file to estimate.
	 * @returns {number} - The estimated size of the file in kilobytes.
	 */
	public guessFileSize( mimeType: string, dimensions: Dimensions ) {
		const kilobyte = 1024;
		let estimatedCompressionRatio = 1 / 10;
		let bytesPerPixel = 3;

		switch ( mimeType.toLowerCase() ) {
			case 'image/gif':
				estimatedCompressionRatio = 1 / 4;
				bytesPerPixel = 1;
				break;

			case 'image/webp':
				estimatedCompressionRatio = ( 1 / 10 ) * 0.75;
				break;

			case 'image/png':
				estimatedCompressionRatio = 1 / 10;
				bytesPerPixel = 4; // Transparency layer +1 byte per pixel.
				break;

			case 'image/jpeg':
			default:
				estimatedCompressionRatio = 1 / 10;
				break;
		}

		return (
			( dimensions.height * dimensions.width * bytesPerPixel * estimatedCompressionRatio ) /
			kilobyte
		);
	}

	/**
	 * Guess at the potential savings of an image if it was reduced to sizeOnPage dimensions.
	 *
	 * @param {string} mimeType - Mimetype to use during guessing potential savings. Use 'unknonwn' if unknown.
	 * @param {Dimensions & Weight} fileSize - The size of the image file - both in disk space and dimensions.
	 * @param {Dimensions} sizeOnPage - The size of the image on the page.
	 * @returns {number} - The potential savings of the image, if reduced the sizeOnPage dimensions.
	 */
	public getPotentialSavings(
		mimeType: string,
		fileSize: Dimensions & Weight,
		sizeOnPage: Dimensions
	) {
		// Make a file-size guess based on size and mimetype.
		const mimeTypeGuess = this.guessFileSize( mimeType, sizeOnPage );

		// Make a file-size guess based on an optimistic ratio reduction.
		const oversizedRatio = this.getOversizedRatio( fileSize, sizeOnPage );
		const ratioGuess = oversizedRatio <= 1 ? 0 : fileSize.weight / oversizedRatio;

		// Take the more pessimistic number.
		const expectedSize = Math.max( mimeTypeGuess, ratioGuess );
		return Math.max( 0, Math.round( fileSize.weight - expectedSize ) );
	}

	/**
	 * To get the expected size of the image,
	 * the image size on page has to be multiplied by the device pixel ratio.
	 *
	 * @param {Dimensions} sizeOnPage - The size of the image on the page.
	 * @returns {object} - The expected size of the image.
	 */
	public getExpectedSize( sizeOnPage: Dimensions ) {
		const dpr = window.devicePixelRatio || 1;
		return {
			width: Math.round( sizeOnPage.width * dpr ),
			height: Math.round( sizeOnPage.height * dpr ),
		};
	}

	public getOversizedRatio( fileSize: Dimensions, sizeOnPage: Dimensions ) {
		const { width, height } = this.getExpectedSize( sizeOnPage );
		return ( fileSize.width * fileSize.height ) / ( width * height );
	}

	/**
	 * Wrapper for fetch which caches the result.
	 *
	 * @param {string} url - The URL to fetch.
	 */
	private async cachedFetch( url: string ): Promise< Response > {
		if ( ! this.fetchPromises[ url ] ) {
			this.fetchPromises[ url ] = this.fetch( url );
		}

		return this.fetchPromises[ url ];
	}

	/**
	 * Fetches the weight of the image at the given URL,
	 * by reading the Content-Length header.
	 *
	 * @param {string} url -  string The URL of the image.
	 */
	private async fetchFileWeight( url: string ) {
		const response = await this.cachedFetch( url );
		if ( ! response.ok ) {
			// eslint-disable-next-line no-console
			console.log( `Can't get image size for ${ url } likely due to a CORS error.` );
			return -1;
		}

		return parseInt( response.headers.get( 'content-length' ), 10 ) / 1024;
	}

	/**
	 * Fetches the dimensions of the image at the given URL,
	 * This creates a new image element and loads the image.
	 *
	 * @param {string} url -  image url
	 */
	private async fetchFileDimensions( url: string ) {
		const img = new Image();
		img.src = url;
		return new Promise< { width: number; height: number } >( ( resolve, reject ) => {
			img.onload = () => {
				resolve( { width: Math.round( img.width ), height: Math.round( img.height ) } );
			};
			img.onerror = () => {
				reject( 'Unable to load image.' );
			};
		} );
	}

	/**
	 * Checks if the image is too small and should be ignored. Will return false on images
	 * that don't load at all - we can't establish they're tiny!
	 *
	 * @returns {boolean} - if the image is smaller than 65 pixels width and height return true
	 */
	public async isImageTiny(): Promise< boolean > {
		try {
			const minSize = 65;
			const dimensions = await this.fetchFileDimensions( this.getURL() );
			return dimensions.width < minSize || dimensions.height < minSize;
		} catch ( err ) {
			return false;
		}
	}
}
