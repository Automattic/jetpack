import { useDispatch, useSelect } from '@wordpress/data';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import API from '../../api';
import { STORE_ID } from '../../state/store';

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
	const { completeOnboardingSteps, fetchOnboardingProgress } = API;

	const steps = useContext( OnboardingContext );
	const { renderedSteps } = useContext( OnboardingRenderedContext );

	const progress = useSelect( select => select( STORE_ID ).getOnboardingProgress() );
	const { setOnboardingProgress } = useDispatch( STORE_ID );

	/**
	 * Current Step
	 *
	 * @returns {null|object}
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
			// Complete the step immediately in the UI
			setOnboardingProgress( [ ...progress, currentStep.id ] );
			// Save the completion in the background
			completeOnboardingSteps( [ currentStep.id ] );
		}
	}, [ currentStep, setOnboardingProgress, progress, completeOnboardingSteps ] );

	/**
	 * Complete All Current Steps
	 */
	const completeAllCurrentSteps = useCallback( () => {
		const stepIds = steps.reduce( ( carry, step ) => {
			carry.push( step.id );
			return carry;
		}, [] );

		// Complete the steps immediately in the UI
		setOnboardingProgress( stepIds );
		// Save the completions in the background
		completeOnboardingSteps( stepIds );
	}, [ steps, setOnboardingProgress, completeOnboardingSteps ] );

	useEffect( () => {
		if ( null === progress ) {
			fetchOnboardingProgress().then( latestProgress => setOnboardingProgress( latestProgress ) );
		}
	}, [ fetchOnboardingProgress, progress, setOnboardingProgress ] );

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
