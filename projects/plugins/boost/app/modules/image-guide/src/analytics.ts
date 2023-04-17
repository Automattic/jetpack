import { get } from 'svelte/store';
import { recordBoostEvent } from '../../../assets/src/js/utils/analytics';
import { guideState } from './stores/GuideState';
import { MeasurableImageStore } from './stores/MeasurableImageStore';

/**
 * Image properties sent to tracks.
 */
type ImageProperties = {
	severity: 'red' | 'yellow' | 'green';
	oversized_ratio: number;
	file_weight: number;
	file_width: number;
	file_height: number;
	size_on_page_width: number;
	size_on_page_height: number;
	expected_width: number;
	expected_height: number;
	potential_savings: number | null;
	image_url: string;
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
						oversized_ratio: oversizedRatio,
						file_weight: fileSize.weight,
						file_width: fileSize.width,
						file_height: fileSize.height,
						size_on_page_width: sizeOnPage.width,
						size_on_page_height: sizeOnPage.height,
						expected_width: expectedSize.width,
						expected_height: expectedSize.height,
						potential_savings: potentialSavings,
						image_url: imageURL,
					};

					recordBoostEvent( 'image_guide_image_outcome', {
						...props,
						window_width: window.innerWidth,
						window_height: window.innerHeight,
						device_pixel_ratio: window.devicePixelRatio,
					} );

					resolve( props );
				}
			} );
		} );
	}

	/**
	 * Track events to record the outcome of the image guide for the current page.
	 *
	 * @param imageStores
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
			return total + ( result.potential_savings || 0 );
		}, 0 );

		recordBoostEvent( 'image_guide_page_outcome', {
			total_potential_savings: totalPotentialSavings,
			red_severity_count: results.filter( result => result.severity === 'red' ).length,
			yellow_severity_count: results.filter( result => result.severity === 'yellow' ).length,
			green_severity_count: results.filter( result => result.severity === 'green' ).length,
			window_width: window.innerWidth,
			window_height: window.innerHeight,
			device_pixel_ratio: window.devicePixelRatio,
		} );
	}

	/**
	 * Track the state of the UI when the user loads a page.
	 */
	public static trackInitialState() {
		recordBoostEvent( 'image_guide_initial_ui_state', {
			image_guide_state: get( guideState ),
		} );
	}

	/**
	 * Track the state of the UI when the user changes it.
	 */
	public static trackUIStateChange() {
		recordBoostEvent( 'image_guide_ui_state_change', {
			image_guide_state: get( guideState ),
		} );
	}
}
