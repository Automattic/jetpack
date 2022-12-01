export type SourceCallbackFn = ( node: HTMLElement ) => string | null;
export type Dimensions = { width: number; height: number };
export type Weight = { weight: number };

/**
 * A class that represents a DOM Element that
 * has an image that should be measured and
 * provides measurement utilities.
 */
export class MeasurableImage {
	readonly node: HTMLElement | HTMLImageElement;
	private getURLCallback: SourceCallbackFn;

	/**
	 * @param  node   The DOM Element that contains the image.
	 * @param  getURL A function that takes in the node and returns the URL of the image.
	 */
	constructor( node: HTMLElement | HTMLImageElement, getURL: SourceCallbackFn ) {
		this.node = node;
		this.getURLCallback = getURL;
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
	 * Fetches the weight of the image at the given URL,
	 * by reading the Content-Length header.
	 *
	 * @param  url string The URL of the image.
	 */
	private async fetchFileWeight( url: string ) {
		const response = await fetch( url, { method: 'HEAD', mode: 'no-cors' } );
		if ( ! response.url ) {
			// eslint-disable-next-line no-console
			console.log( `Can't get image size for ${ url } likely due to a CORS error.` );
			return -1;
		}

		const size = response.headers.get( 'content-length' );
		if ( size ) {
			return parseInt( size, 10 ) / 1024;
		}

		return -1;
	}

	/**
	 * Fetches the dimensions of the image at the given URL,
	 * This creates a new image element and loads the image.
	 *
	 * @param  url image url
	 */
	private async fetchFileDimensions( url: string ) {
		const img = new Image();
		img.src = url;
		return new Promise< { width: number; height: number } >( resolve => {
			img.onload = () => {
				resolve( { width: Math.round( img.width ), height: Math.round( img.height ) } );
			};
			img.onerror = () => {
				resolve( { width: -1, height: -1 } );
			};
		} );
	}
}
