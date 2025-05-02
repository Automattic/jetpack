import { writable, derived, type Writable, type Readable } from 'svelte/store';
import { MeasurableImage } from '../MeasurableImage.ts';
import type { Dimensions, Weight } from '../MeasurableImage.ts';

/**
 * Each measurable image has its own set of Svelte stores.
 *
 * This class relies on MeasurableImage to calculate the values
 * and stores them in multiple Svelte stores,
 * so that the dimensions are easily
 * accessible in the components.
 */
export class MeasurableImageStore {
	readonly fileSize: Writable< Dimensions >;
	readonly fileWeight: Writable< Weight >;
	readonly sizeOnPage: Writable< Dimensions >;
	readonly potentialSavings: Readable< number | null >;
	readonly expectedSize: Readable< Dimensions >;
	readonly oversizedRatio: Readable< number >;
	readonly url: Writable< string >;
	readonly loading = writable( true );

	readonly image: MeasurableImage;
	readonly node: MeasurableImage[ 'node' ];

	private weightMap: Record< string, number > = {};

	private currentSrc = '';

	constructor( measurableImage: MeasurableImage ) {
		this.image = measurableImage;
		this.node = measurableImage.node;

		const initialFileSize: Dimensions = {
			width: 0,
			height: 0,
		};

		const initialSizeOnPage: Dimensions = {
			width: 0,
			height: 0,
		};

		this.url = writable( measurableImage.getURL() );
		this.fileSize = writable( initialFileSize );
		this.fileWeight = writable( { weight: -1 }, () => {
			this.maybeUpdateWeight();
		} );
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
		return derived(
			[ this.fileSize, this.fileWeight, this.sizeOnPage ],
			( [ fileSize, fileWeight, sizeOnPage ] ) => {
				return this.image.getPotentialSavings( fileSize, fileWeight, sizeOnPage );
			}
		);
	}

	public async updateDimensions() {
		const sizeOnPage = this.image.getSizeOnPage();
		this.sizeOnPage.set( sizeOnPage );
		await this.updateFileDimensions();
	}

	private async updateFileDimensions() {
		/**
		 * Current source can change when resizing screen.
		 * If the URL has changed since last update,
		 * we need to update the weight.
		 */
		if ( this.image.getURL() === this.currentSrc ) {
			return;
		}

		this.currentSrc = this.image.getURL();
		let fileSize;

		try {
			fileSize = await this.image.getFileSize( this.currentSrc );
		} catch {
			fileSize = {
				height: -1,
				width: -1,
			};
		}

		this.url.set( this.currentSrc );
		this.fileSize.set( fileSize );
	}

	private async maybeUpdateWeight() {
		const url = this.currentSrc;

		if ( this.weightMap[ url ] !== undefined ) {
			this.fileWeight.set( { weight: this.weightMap[ url ] } );
			return;
		}

		this.loading.set( true );
		try {
			const weight = await this.image.getWeight( url );
			this.weightMap[ url ] = weight;
			this.fileWeight.set( { weight } );
		} catch {
			this.fileWeight.set( { weight: -1 } );
		}
		this.loading.set( false );
	}
}
