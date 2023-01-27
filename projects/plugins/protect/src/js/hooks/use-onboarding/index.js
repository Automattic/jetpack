import { Button } from '@automattic/jetpack-components';
import { useDispatch, useSelect } from '@wordpress/data';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useCallback, useEffect, useMemo } from 'react';
import API from '../../api';
import { STORE_ID } from '../../state/store';
import useProtectData from '../use-protect-data';

const onboardingSteps = [
	{
		id: 'your-scan-results',
		title: __( 'Your scan results', 'jetpack-protect' ),
		description: __(
			'Navigate through the results of the scan on your WordPress installation, plugins, themes and other files.',
			'jetpack-protect'
		),
	},
	{
		id: 'auto-fixers',
		title: __( 'Auto-fix with one click', 'jetpack-protect' ),
		description: createInterpolateElement(
			__(
				"Jetpack Protect offers one-click fixes for most threats. Press this button and be safe again. Note that you'll have to <credentialsLink>input your server credentials first</credentialsLink>.",
				'jetpack-protect'
			),
			{
				credentialsLink: <Button variant="link" isExternalLink={ true } href="#" />,
			}
		),
		conditional: args => args.numberOfThreats > 0 && args.isPaidPlan,
	},
	{
		id: 'severity',
		title: __( 'Understand severity', 'jetpack-protect' ),
		description: createInterpolateElement(
			__(
				'Learn how critical these threats are for the security of your site by glancing at the <severityLink>severity labels</severityLink>.',
				'jetpack-protect'
			),
			{
				severityLink: <Button variant="link" isExternalLink={ true } href="#" />,
			}
		),
		conditional: args => args.numberOfThreats > 0 && args.isPaidPlan,
	},
	{
		id: 'daily-scans',
		title: __( 'Daily automated scans', 'jetpack-protect' ),
		description: createInterpolateElement(
			__(
				'We run daily automated scans. Do you want to be able to scan manually? <upgradeLink>Upgrade</upgradeLink>',
				'jetpack-protect'
			),
			{
				upgradeLink: <Button variant="link" href="#" />,
			}
		),
		conditional: args => ! args.isPaidPlan,
	},
	{
		id: 'manual-scans',
		title: __( 'Daily & manual scanning', 'jetpack-protect' ),
		description: __(
			'We run daily automated scans but also you can run on-demand scans if you want to check the latest status.',
			'jetpack-protect'
		),
		conditional: args => Boolean( args.isPaidPlan ),
	},
];

const useOnboarding = () => {
	const { completeOnboardingSteps, fetchOnboardingProgress } = API;
	const { numThreats } = useProtectData();
	const { hasRequiredPlan } = useSelect( select => select( STORE_ID ).getSecurityBundle() );
	const progress = useSelect( select => select( STORE_ID ).getOnboardingProgress() );
	const { onboardingStepsCompleted, setOnboardingProgress } = useDispatch( STORE_ID );

	/**
	 * Should Show Step
	 *
	 * @param {string} step - The step object
	 * @returns {boolean}
	 */
	const shouldShowStep = useCallback(
		step => {
			if (
				typeof step.conditional === 'function' &&
				! step?.conditional( { hasRequiredPlan, numThreats } )
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
	const { currentStep, currentStepCount } = useMemo( () => {
		for ( let i = 0; i < onboardingSteps.length; i++ ) {
			const step = onboardingSteps[ i ];
			if ( shouldShowStep( step ) ) {
				return {
					currentStep: step,
					currentStepCount: i + 1,
				};
			}
		}

		return {
			currentStep: null,
			currentStepCount: null,
		};
	}, [ shouldShowStep ] );

	/**
	 * Steps Count
	 *
	 * @returns {number} - The total amount of steps the user is eligible to complete.
	 */
	const stepsCount = useMemo( () => {
		return onboardingSteps.reduce( ( carry, current ) => {
			if ( shouldShowStep( current ) ) {
				carry += 1;
			}

			return carry;
		}, 0 );
	}, [ shouldShowStep ] );

	/**
	 * Complete All Current Steps
	 */
	const completeAllCurrentSteps = () => {
		const stepIds = onboardingSteps.reduce(
			( steps, step ) => ( shouldShowStep( step ) ? [ ...steps, step.id ] : steps ),
			[]
		);
		completeOnboardingSteps( stepIds ).then( () => onboardingStepsCompleted( stepIds ) );
	};

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
		completeAllCurrentSteps,
	};
};

export default useOnboarding;
