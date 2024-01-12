import { useDispatch, useSelect } from '@wordpress/data';
import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import API from '../../api';
import useThreatsList from '../../components/threats-list/use-threats-list';
import { STORE_ID } from '../../state/store';
import useProtectData from '../use-protect-data';

export const OnboardingContext = createContext( [] );

const useOnboarding = () => {
	const { completeOnboardingSteps, fetchOnboardingProgress } = API;
	const steps = useContext( OnboardingContext );
	const { numThreats, hasRequiredPlan } = useProtectData();
	const progress = useSelect( select => select( STORE_ID ).getOnboardingProgress() );
	const { setOnboardingProgress } = useDispatch( STORE_ID );
	const { list } = useThreatsList();
	const fixableList = list.filter( obj => obj.fixable );
	const selected = useSelect( select => select( STORE_ID ).getSelected() );

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
					! step.conditional_render_callback( { hasRequiredPlan, numThreats, fixableList } );

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
		// We want to re-render when selected changes
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ selected, steps, hasRequiredPlan, numThreats, fixableList, progress ] );

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
