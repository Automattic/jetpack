import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import useOnboardingProgressMutation from '../../data/onboarding/use-onboarding-progress-mutator';
import useOnboardingProgressQuery from '../../data/onboarding/use-onboarding-progress-query';

export const OnboardingContext = createContext( [] );
export const OnboardingRenderedContext = createContext( [] );

export const OnboardingRenderedContextProvider = ( { children } ) => {
	const [ renderedSteps, setRenderedSteps ] = useState( [] );

	return (
		<OnboardingRenderedContext.Provider value={ { renderedSteps, setRenderedSteps } }>
			{ children }
		</OnboardingRenderedContext.Provider>
	);
};

const useOnboarding = () => {
	const steps = useContext( OnboardingContext );
	const { renderedSteps } = useContext( OnboardingRenderedContext );

	const { data: progress } = useOnboardingProgressQuery();
	const onboardingProgressMutation = useOnboardingProgressMutation();

	/**
	 * Current Step
	 *
	 * @return {null|object}
	 */
	const { currentStep, currentStepCount, stepsCount } = useMemo( () => {
		return steps.reduce(
			( carry, step ) => {
				if ( renderedSteps.includes( step.id ) ) {
					carry.stepsCount++;
					if ( ! carry.currentStep && ( progress || [] ).indexOf( step.id ) === -1 ) {
						carry.currentStep = step;
						carry.currentStepCount = carry.stepsCount;
					}
				}
				return carry;
			},
			{
				currentStep: null,
				currentStepCount: null,
				stepsCount: 0,
			}
		);
	}, [ progress, renderedSteps, steps ] );

	const completeCurrentStep = useCallback( () => {
		if ( currentStep ) {
			onboardingProgressMutation.mutate( [ currentStep.id ] );
		}
	}, [ currentStep, onboardingProgressMutation ] );

	/**
	 * Complete All Free Steps
	 */
	const completeAllFreeSteps = useCallback( () => {
		const freeStepIds = steps.reduce( ( carry, step ) => {
			if ( step.id.startsWith( 'free-' ) ) {
				carry.push( step.id );
			}
			return carry;
		}, [] );

		onboardingProgressMutation.mutate( freeStepIds );
	}, [ steps, onboardingProgressMutation ] );

	/**
	 * Complete All Paid Steps
	 */
	const completeAllPaidSteps = useCallback( () => {
		const paidStepIds = steps.reduce( ( carry, step ) => {
			if ( step.id.startsWith( 'paid-' ) ) {
				carry.push( step.id );
			}
			return carry;
		}, [] );

		onboardingProgressMutation.mutate( paidStepIds );
	}, [ steps, onboardingProgressMutation ] );

	/**
	 * Complete All Current Steps
	 */
	const completeAllCurrentSteps = useCallback( () => {
		// Check if currentStep is a paid step and run the appropriate function
		if ( currentStep.id.startsWith( 'paid-' ) ) {
			completeAllPaidSteps();
		} else {
			completeAllFreeSteps();
		}
	}, [ completeAllFreeSteps, completeAllPaidSteps, currentStep ] );

	return {
		progress,
		stepsCount,
		currentStep,
		currentStepCount,
		completeCurrentStep,
		completeAllCurrentSteps,
	};
};

export default useOnboarding;
