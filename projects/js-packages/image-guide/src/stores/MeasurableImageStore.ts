import { commands, selectors } from './store.ts';
import { MeasurableImage } from '../MeasurableImage.ts';

/** Keep image nodes, source tracking and the weight cache outside reducer state. */
export class MeasurableImageStore {
	readonly id: string;
	private static nextId = 0;

	readonly image: MeasurableImage;
	readonly node: MeasurableImage[ 'node' ];

	private weightMap: Record< string, number > = {};

	private currentSrc = '';
	private consumers = 0;

	constructor( measurableImage: MeasurableImage ) {
		this.image = measurableImage;
		this.node = measurableImage.node;

		this.id = String( MeasurableImageStore.nextId++ );
		commands.setImage( this.id, {
			fileSize: { width: 0, height: 0 },
			sizeOnPage: { width: 0, height: 0 },
			fileWeight: { weight: -1 },
			url: measurableImage.getURL(),
			loading: true,
		} );
	}

	/** Read current image facts and derived measurements without activating fetching. */
	public getSnapshot() {
		return {
			...selectors.getImageFacts( this.id ),
			expectedSize: selectors.getExpectedSize( this.id ),
			oversizedRatio: selectors.getOversizedRatio( this.id ),
			potentialSavings: selectors.getPotentialSavings( this.id ),
		};
	}

	/** Acquire weight measurements until the returned idempotent release is called. */
	public acquire() {
		if ( this.consumers++ === 0 ) this.maybeUpdateWeight();
		let active = true;
		return () => {
			if ( ! active ) return;
			active = false;
			this.consumers--;
		};
	}

	public async updateDimensions() {
		const sizeOnPage = this.image.getSizeOnPage();
		commands.updateImage( this.id, { sizeOnPage } );
		await this.updateFileDimensions();
	}

	private async updateFileDimensions() {
		// The source can change on resize; subsequent weight activation must use the new URL.
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

		commands.updateImage( this.id, { url: this.currentSrc } );
		commands.updateImage( this.id, { fileSize } );
	}

	private async maybeUpdateWeight() {
		const url = this.currentSrc;

		if ( this.weightMap[ url ] !== undefined ) {
			commands.updateImage( this.id, { fileWeight: { weight: this.weightMap[ url ] } } );
			return;
		}

		commands.updateImage( this.id, { loading: true } );
		try {
			const weight = await this.image.getWeight( url );
			this.weightMap[ url ] = weight;
			commands.updateImage( this.id, { fileWeight: { weight } } );
		} catch {
			commands.updateImage( this.id, { fileWeight: { weight: -1 } } );
		}
		commands.updateImage( this.id, { loading: false } );
	}
}
