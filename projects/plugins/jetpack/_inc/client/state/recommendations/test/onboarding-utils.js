import { PLAN_JETPACK_ANTI_SPAM } from '../../../lib/plans/constants';
import {
	ONBOARDING_JETPACK_ANTI_SPAM,
	ONBOARDING_JETPACK_BACKUP,
	ONBOARDING_JETPACK_COMPLETE,
} from '../../../recommendations/constants';
import { getOnboardingNameByProductSlug, sortByOnboardingPriority } from '../onboarding-utils';

describe( 'Onboarding Utils', () => {
	describe( 'getOnboardingNameByProductSlug()', () => {
		it( 'Returns onboarding name for specific product slug', () => {
			const onboardingName = getOnboardingNameByProductSlug( PLAN_JETPACK_ANTI_SPAM );
			expect( onboardingName ).toBe( ONBOARDING_JETPACK_ANTI_SPAM );
		} );

		it( 'Returns null when no related onboarding name is found for given product slug', () => {
			const onboardingName = getOnboardingNameByProductSlug( 'FOOBAR' );
			expect( onboardingName ).toBeNull();
		} );
	} );

	describe( 'sortByOnboardingPriority()', () => {
		it( 'Puts the most important onboarding on the first position (sorts descending)', () => {
			const mostImportantOnboarding = ONBOARDING_JETPACK_COMPLETE;
			const intialOnboardings = [
				ONBOARDING_JETPACK_ANTI_SPAM,
				ONBOARDING_JETPACK_BACKUP,
				mostImportantOnboarding,
			];

			const sortedOnboardings = intialOnboardings.sort( sortByOnboardingPriority );

			expect( sortedOnboardings[ 0 ] ).toBe( mostImportantOnboarding );
		} );
	} );
} );
