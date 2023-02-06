import { MeasurableImage } from '@automattic/jetpack-image-guide';
import { Writable, Readable, writable, derived } from 'svelte/store';
import type { Dimensions, Weight } from '@automattic/jetpack-image-guide';

/**
 * Each measurable image has its own set of Svelte stores.
 *
 * This class relies on MeasurableImage to calculate the values
 * and stores them in multiple Svelte stores,
 * so that the dimensions are easily
 * accessible in the components.
 */
export class MeasurableImageStore {
	readonly fileSize: Writable< Dimensions & Weight >;
	readonly sizeOnPage: Writable< Dimensions >;
	readonly potentialSavings: Readable< number | null >;
	readonly expectedSize: Readable< Dimensions >;
	readonly oversizedRatio: Readable< number >;
	readonly url: Writable< string >;
	readonly loading = writable( true );

	readonly image: MeasurableImage;
	readonly node: MeasurableImage[ 'node' ];

	private currentSrc = '';

	constructor( measurableImage: MeasurableImage ) {
		this.image = measurableImage;
		this.node = measurableImage.node;

		const initialFileSize: Dimensions & Weight = {
			width: 0,
			height: 0,
			weight: 0,
		};

		const initialSizeOnPage: Dimensions = {
			width: 0,
			height: 0,
		};

		this.url = writable( measurableImage.getURL() );
		this.fileSize = writable( initialFileSize );
		this.sizeOnPage = writable( initialSizeOnPage );
		this.potentialSavings = this.derivePotentialSavings();
		this.oversizedRatio = this.deriveOversizedRatio();
		this.expectedSize = this.deriveExpectedSize();
	}

	private deriveOversizedRatio() {
		return derived( [ this.fileSize, this.sizeOnPage ], ( [ fileSize, sizeOnPage ] ) => {
			return this.image.getOversizedRatio( fileSize, sizeOnPage );
		} );
	}

	private deriveExpectedSize() {
		return derived( this.sizeOnPage, sizeOnPage => {
			return this.image.getExpectedSize( sizeOnPage );
		} );
	}

	private derivePotentialSavings() {
		return derived( [ this.fileSize, this.sizeOnPage ], ( [ fileSize, sizeOnPage ] ) => {
			return this.image.getPotentialSavings( fileSize, sizeOnPage );
		} );
	}

	public async updateDimensions() {
		const sizeOnPage = this.image.getSizeOnPage();
		this.sizeOnPage.set( sizeOnPage );
		await this.maybeUpdateWeight();
	}

	private async maybeUpdateWeight() {
		/**
		 * Current source can change when resizing screen.
		 * If the URL has changed since last update,
		 * we need to update the weight.
		 */
		if ( this.image.getURL() === this.currentSrc ) {
			return;
		}
		this.loading.set( true );

		this.currentSrc = this.image.getURL();
		const fileSize = await this.image.getFileSize( this.currentSrc );

		this.url.set( this.currentSrc );
		this.fileSize.set( fileSize );
		this.loading.set( false );
	}
}
