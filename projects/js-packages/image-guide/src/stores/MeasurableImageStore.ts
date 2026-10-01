import { readable, writable, type Writable, type Readable } from './facade.ts';
import { commands, selectors, type ImageFacts } from './store.ts';
import { MeasurableImage } from '../MeasurableImage.ts';
import type { Dimensions, Weight } from '../MeasurableImage.ts';

export class MeasurableImageStore {
	readonly fileSize: Writable< Dimensions >;
	readonly fileWeight: Writable< Weight >;
	readonly sizeOnPage: Writable< Dimensions >;
	readonly potentialSavings: Readable< number | null >;
	readonly expectedSize: Readable< Dimensions >;
	readonly oversizedRatio: Readable< number >;
	readonly url: Writable< string >;
	readonly loading: Writable< boolean >;
	readonly id: string;
	private static nextId = 0;

	readonly image: MeasurableImage;
	readonly node: MeasurableImage[ 'node' ];

	private weightMap: Record< string, number > = {};

	private currentSrc = '';

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
		this.url = this.fact( 'url' );
		this.fileSize = this.fact( 'fileSize' );
		this.sizeOnPage = this.fact( 'sizeOnPage' );
		this.loading = this.fact( 'loading' );
		// Facade weight and savings subscribers activate fetching; analytics snapshots do not.
		this.fileWeight = this.fact( 'fileWeight', () => this.activate() );
		this.potentialSavings = readable(
			() => selectors.getPotentialSavings( this.id ),
			() => this.fileWeight.subscribe( () => {} ),
			undefined,
			this.id
		);
		this.oversizedRatio = readable(
			() => selectors.getOversizedRatio( this.id ),
			undefined,
			undefined,
			this.id
		);
		this.expectedSize = readable(
			() => selectors.getExpectedSize( this.id ),
			undefined,
			undefined,
			this.id
		);
	}

	private fact< K extends keyof ImageFacts >( key: K, start?: () => void ) {
		return writable(
			() => selectors.getImageFacts( this.id )[ key ],
			value => commands.updateImage( this.id, { [ key ]: value } ),
			start,
			() => selectors.getImageRevision( this.id, key ),
			this.id
		);
	}

	public getSnapshot() {
		return {
			...selectors.getImageFacts( this.id ),
			expectedSize: selectors.getExpectedSize( this.id ),
			oversizedRatio: selectors.getOversizedRatio( this.id ),
			potentialSavings: selectors.getPotentialSavings( this.id ),
		};
	}

	public activate() {
		this.maybeUpdateWeight();
	}

	public async updateDimensions() {
		const sizeOnPage = this.image.getSizeOnPage();
		this.sizeOnPage.set( sizeOnPage );
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
