export type SourceCallbackFn = ( node: HTMLElement ) => string | null;
export type Dimensions = { width: number; height: number };
export type Weight = { weight: number };

export type FetchFn = ( url: string ) => Promise< Response >;

/**
 * A class that represents a DOM Element that
 * has an image that should be measured and
 * provides measurement utilities.
 */
export class MeasurableImage {
	readonly node: HTMLElement | HTMLImageElement;
	private getURLCallback: SourceCallbackFn;

	public fetch: FetchFn;

	/**
	 * Constructor.
	 *
	 * @param {HTMLElement | HTMLImageElement} node    - The DOM Element that contains the image.
	 * @param {SourceCallbackFn}               getURL  - A function that takes in the node and returns the URL of the image.
	 * @param {FetchFn}                        fetchFn - A function that fetches a URL and returns a Promise.
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

	public getPotentialSavings( fileSize: Dimensions & Weight, sizeOnPage: Dimensions ) {
		const oversizedRatio = this.getOversizedRatio( fileSize, sizeOnPage );
		if ( oversizedRatio <= 1 ) {
			return null;
		}
		return Math.round( fileSize.weight - fileSize.weight / oversizedRatio );
	}

	/**
	 * To get the expected size of the image,
	 * the image size on page has to be multiplied by the device pixel ratio.
	 *
	 * @param {Dimensions} sizeOnPage - The size of the image on the page.
	 * @return {object} - The expected size of the image.
	 */
	public getExpectedSize( sizeOnPage: Dimensions ) {
		const dpr = window.devicePixelRatio || 1;
		return {
			width: Math.round( sizeOnPage.width * dpr ),
			height: Math.round( sizeOnPage.height * dpr ),
		};
	}

	public getOversizedRatio( fileSize: Dimensions, sizeOnPage: Dimensions ) {
		// The image is not loaded, we can't calculate the ratio
		if ( fileSize.width === 0 || fileSize.height === 0 ) {
			return 1;
		}

		const { width, height } = this.getExpectedSize( sizeOnPage );

		// The image is not visible on screen, we can't calculate the ratio
		if ( width === 0 || height === 0 ) {
			return 1;
		}

		return ( fileSize.width * fileSize.height ) / ( width * height );
	}

	/**
	 * Fetches the weight of the image at the given URL,
	 * by reading the Content-Length header.
	 *
	 * @param {string} url - string The URL of the image.
	 * @return {number} Weight.
	 */
	private async fetchFileWeight( url: string ) {
		const response = await this.fetch( url );
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
	 * @param {string} url - image url
	 * @return {object} dimensions File dimensions.
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
	 * Checks if the image is too small and should be ignored. Will return true on images
	 * that don't load at all - we can't establish they're tiny!
	 *
	 * @return {boolean} - if the image is smaller than 65 pixels width and height return true
	 */
	public async isImageTiny(): Promise< boolean > {
		try {
			const minSize = 65;
			const dimensions = await this.fetchFileDimensions( this.getURL() );
			return dimensions.width < minSize || dimensions.height < minSize;
		} catch ( err ) {
			return true;
		}
	}
}
