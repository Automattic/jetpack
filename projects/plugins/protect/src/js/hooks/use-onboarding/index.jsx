import { useDispatch, useSelect } from '@wordpress/data';
import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import API from '../../api';
import { STORE_ID } from '../../state/store';
import useProtectData from '../use-protect-data';

export const OnboardingContext = createContext( [] );

const useOnboarding = () => {
	const { completeOnboardingSteps, fetchOnboardingProgress } = API;
	const steps = useContext( OnboardingContext );
	const { numThreats, hasRequiredPlan } = useProtectData();
	const progress = useSelect( select => select( STORE_ID ).getOnboardingProgress() );
	const { setOnboardingProgress } = useDispatch( STORE_ID );

	/**
	 * Should Show Step
	 *
	 * @param {string} step - The step object
	 * @returns {boolean}
	 */
	const shouldShowStep = useCallback(
		step => {
			if (
				typeof step.conditional_render_callback === 'function' &&
				! step?.conditional_render_callback( { hasRequiredPlan, numThreats } )
			) {
				// do not show step - conditional requirements failed
				return false;
			}

			if ( ! progress || progress.indexOf( step.id ) >= 0 ) {
				// do not show step - already completed
				return false;
			}

			return true;
		},
		[ progress, hasRequiredPlan, numThreats ]
	);

	/**
	 * Current Step
	 *
	 * @returns {null|object}
	 */
	const { currentStep, currentStepCount, stepsCount } = useMemo( () => {
		return steps.reduce(
			( carry, step ) => {
				const stepConditionallyDisabled =
					typeof step.conditional_render_callback === 'function' &&
					! step.conditional_render_callback( { hasRequiredPlan, numThreats } );

				if ( ! stepConditionallyDisabled ) {
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
	}, [ steps, hasRequiredPlan, numThreats, progress ] );

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
		const stepIds = steps.reduce(
			( carry, step ) => ( shouldShowStep( step ) ? [ ...carry, step.id ] : steps ),
			[]
		);
		// Complete the steps immediately in the UI
		setOnboardingProgress( [ ...progress, ...stepIds ] );
		// Save the completions in the background
		completeOnboardingSteps( stepIds );
	}, [ steps, setOnboardingProgress, progress, completeOnboardingSteps, shouldShowStep ] );

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
