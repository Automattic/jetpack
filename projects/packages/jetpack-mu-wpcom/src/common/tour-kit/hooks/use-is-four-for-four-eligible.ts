import { useSelect } from '@wordpress/data';
import { getQueryArg } from '@wordpress/url';

type WelcomeGuideSelect = {
	isFourForFourEligible: () => boolean;
};

/**
 * Whether the editor was opened with `?four-for-four=preview`, which forces
 * the prompt for testing regardless of the site's eligibility.
 * @return {boolean} True when the preview override is present.
 */
export const isFourForFourPreview = (): boolean =>
	getQueryArg( window.location.href, 'four-for-four' ) === 'preview';

/**
 * Whether the current site and user should be offered the 4 for 4 program on
 * this editor session. The store resolver fetches the answer on first use.
 * @return {boolean} True when the prompt may be shown.
 */
const useIsFourForFourEligible = (): boolean => {
	const isEligible = useSelect(
		select =>
			( select( 'automattic/wpcom-welcome-guide' ) as WelcomeGuideSelect ).isFourForFourEligible(),
		[]
	);
	return isEligible || isFourForFourPreview();
};

export default useIsFourForFourEligible;
