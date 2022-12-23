import { get } from 'svelte/store';
import { recordBoostEvent } from '../../../assets/src/js/utils/analytics';
import { guideState } from './stores/GuideState';
import { MeasurableImageStore } from './stores/MeasurableImageStore';

type ImageProperties = {
	severity: 'red' | 'yellow' | 'green';
	oversizedRatio: number;
	fileWeight: number;
	fileWidth: number;
	fileHeight: number;
	sizeOnPageWidth: number;
	sizeOnPageHeight: number;
	expectedWidth: number;
	expectedHeight: number;
	potentialSavings: number | null;
	imageURL: string;
};

export default class ImageGuideAnalytics {
	static trackingComplete = false;

	/**
	 * Track the image guide analytics for a single image.
	 *
	 * @param { MeasurableImageStore } imageStore
	 */
	public static async trackImageOutcome(
		imageStore: MeasurableImageStore
	): Promise< ImageProperties > {
		return new Promise( resolve => {
			// Wait until the image is loaded and then track the state.
			imageStore.loading.subscribe( loading => {
				if ( ! loading ) {
					const oversizedRatio = get( imageStore.oversizedRatio );
					const severity = oversizedRatio > 4 ? 'red' : oversizedRatio > 2.5 ? 'yellow' : 'green';
					const fileSize = get( imageStore.fileSize );
					const sizeOnPage = get( imageStore.sizeOnPage );
					const expectedSize = get( imageStore.expectedSize );
					const potentialSavings = get( imageStore.potentialSavings );
					const imageURL = get( imageStore.url );

					const props: ImageProperties = {
						severity,
						oversizedRatio,
						fileWeight: fileSize.weight,
						fileWidth: fileSize.width,
						fileHeight: fileSize.height,
						sizeOnPageWidth: sizeOnPage.width,
						sizeOnPageHeight: sizeOnPage.height,
						expectedWidth: expectedSize.width,
						expectedHeight: expectedSize.height,
						potentialSavings,
						imageURL,
					};

					recordBoostEvent( 'image_guide_image_outcome', {
						...props,
						windowWidth: window.innerWidth,
						windowHeight: window.innerHeight,
						devicePixelRatio: window.devicePixelRatio,
					} );

					resolve( props );
				}
			} );
		} );
	}

	/**
	 * Track events to record the outcome of the image guide for the current page.
	 *
	 * @param  imageStores
	 */
	public static async trackPage( imageStores: MeasurableImageStore[] ) {
		if ( ! imageStores.length || ImageGuideAnalytics.trackingComplete ) {
			return;
		}

		// Flag to indicate that tracking has already ran for the current page load
		ImageGuideAnalytics.trackingComplete = true;

		// Record events for each image and collect promises with properties of image that will resolve when the image is loaded.
		const promises: Promise< ImageProperties >[] = imageStores.map(
			ImageGuideAnalytics.trackImageOutcome
		);

		// Wait for all images to be loaded and then track the overall outcome.
		const results = await Promise.all( promises );
		const totalPotentialSavings = results.reduce( ( total, result ) => {
			return total + ( result.potentialSavings || 0 );
		}, 0 );

		recordBoostEvent( 'image_guide_page_outcome', {
			totalPotentialSavings,
			redSeverityCount: results.filter( result => result.severity === 'red' ).length,
			yellowSeverityCount: results.filter( result => result.severity === 'yellow' ).length,
			greenSeverityCount: results.filter( result => result.severity === 'green' ).length,
			windowWidth: window.innerWidth,
			windowHeight: window.innerHeight,
			devicePixelRatio: window.devicePixelRatio,
		} );
	}

	/**
	 * Track the state of the UI when the user loads a page.
	 */
	public static trackInitialState() {
		recordBoostEvent( 'image_guide_initial_ui_state', {
			imageGuideState: get( guideState ),
		} );
	}

	/**
	 * Track the state of the UI when the user changes it.
	 */
	public static trackUIStateChange() {
		recordBoostEvent( 'image_guide_ui_state_change', {
			imageGuideState: get( guideState ),
		} );
	}
}
