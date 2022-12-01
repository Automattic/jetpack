import { type Writable, writable } from 'svelte/store';
import { MeasurableImage } from '../MeasurableImage';

export class MeasurableImageStore {
	readonly fileSize: Writable<ReturnType<MeasurableImage['getFileSize']>>;
	readonly sizeOnPage: Writable<ReturnType<MeasurableImage['getSizeOnPage']>>;
	readonly potentialSavings: Writable<ReturnType<MeasurableImage['getPotentialSavings']>>;
	readonly expectedSize: Writable<ReturnType<MeasurableImage['getExpectedSize']>>;
	readonly oversizedRatio: Writable<ReturnType<MeasurableImage['getOversizedRatio']>>;
	readonly loading = writable(true);
	readonly url: Writable<string>;

	readonly image: MeasurableImage;
	readonly node: MeasurableImage['element']['node'];

	private currentSrc = '';

	constructor(measurableImage: MeasurableImage) {
		this.image = measurableImage;
		this.node = measurableImage.element.node;

		this.fileSize = writable(measurableImage.getFileSize());
		this.sizeOnPage = writable(measurableImage.getSizeOnPage());
		this.potentialSavings = writable(measurableImage.getPotentialSavings());
		this.oversizedRatio = writable(measurableImage.getOversizedRatio());
		this.expectedSize = writable(measurableImage.getExpectedSize());
		this.url = writable(measurableImage.getURL());
	}

	public async updateDimensions() {
		this.image.updateSizeOnPage();
		this.sizeOnPage.set(this.image.getSizeOnPage());

		/**
		 * Current source can change when resizing screen.
		 * If the URL has changed since last update,
		 * we need to update the weight.
		 */
		if (this.image.getURL() !== this.currentSrc) {
			this.currentSrc = this.image.getURL();
			this.url.set(this.currentSrc);
			await this.updateWeight();
		} else {
			// This is a micro-optimization
			// These methods are already called in updateWeight()
			this.oversizedRatio.set(this.image.getOversizedRatio());
			this.potentialSavings.set(this.image.getPotentialSavings());
		}

		this.expectedSize.set(this.image.getExpectedSize());

	}

	public async updateWeight() {
		this.loading.set(true);
		await this.image.updateFileSize();
		this.fileSize.set(this.image.getFileSize());
		this.oversizedRatio.set(this.image.getOversizedRatio());
		this.potentialSavings.set(this.image.getPotentialSavings());
		this.loading.set(false);
	}
}
