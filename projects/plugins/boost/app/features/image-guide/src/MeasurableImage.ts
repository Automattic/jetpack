export type SourceCallbackFn = (node: HTMLElement) => string | null;

export class MeasurableImage {
	readonly node: HTMLElement | HTMLImageElement;

	private fileSize = {
		width: -1,
		height: -1,
		weight: -1,
	};

	private sizeOnPage = {
		width: -1,
		height: -1,
	};

	private getURLCallback: SourceCallbackFn;

	constructor( node: HTMLElement | HTMLImageElement, getURL: SourceCallbackFn ) {
		this.node = node;
		this.getURLCallback = getURL;
	}

	public getURL() {
		return this.getURLCallback( this.node );
	}

	public updateSizeOnPage() {
		const { width, height } = this.node.getBoundingClientRect();

		this.sizeOnPage = {
			width: Math.round( width ),
			height: Math.round( height ),
		};

		return true;
	}

	public async updateFileSize() {
		const url = this.getURL();
		if ( ! url ) {
			return false;
		}

		const [ weight, { width, height } ] = await Promise.all( [
			this.fetchFileWeight( url ),
			this.fetchFileDimensions( url ),
		] );

		this.fileSize = {
			width,
			height,
			weight,
		};

		return true;
	}

	public getPotentialSavings() {
		if ( ! this.fileSize || ! this.sizeOnPage ) {
			return -1;
		}
		const oversizedRatio = this.getOversizedRatio();
		if ( oversizedRatio <= 1 ) {
			return null;
		}
		return Math.round( this.fileSize.weight - this.fileSize.weight / oversizedRatio );
	}

	public getFileSize() {
		return this.fileSize;
	}

	public getSizeOnPage() {
		return this.sizeOnPage;
	}

	public getExpectedSize() {
		const dpr = window.devicePixelRatio || 1;
		return {
			width: Math.round( this.sizeOnPage.width * dpr ),
			height: Math.round( this.sizeOnPage.height * dpr ),
		};
	}

	public getOversizedRatio() {
		if ( ! this.fileSize || ! this.sizeOnPage ) {
			return -1;
		}
		const { width, height } = this.getExpectedSize();
		const { width: fileWidth, height: fileHeight } = this.fileSize;
		return ( fileWidth * fileHeight ) / ( width * height );
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
