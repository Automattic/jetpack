import { useSelect } from '@wordpress/data';

type WelcomeGuideSelect = {
	isFourForFourEligible: () => boolean;
};

/**
 * Whether the current site and user should be offered the 4 for 4 program on
 * this editor session. The store resolver fetches the answer on first use.
 * @return {boolean} True when the prompt may be shown.
 */
const useIsFourForFourEligible = (): boolean =>
	useSelect(
		select =>
			( select( 'automattic/wpcom-welcome-guide' ) as WelcomeGuideSelect ).isFourForFourEligible(),
		[]
	);

export default useIsFourForFourEligible;
