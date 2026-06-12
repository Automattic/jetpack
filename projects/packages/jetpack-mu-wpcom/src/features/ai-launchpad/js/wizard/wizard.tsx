import apiFetch from '@wordpress/api-fetch';
import { Modal, Button } from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { getPrewarmedTailor, usePrewarm } from '../lib/prewarm.ts';
import { trackViewed, trackWizardCompleted } from '../lib/tracks.ts';
import DetailsStep from './details-step.tsx';
import GoalsStep from './goals-step.tsx';
import {
	buildWizardPayload,
	canContinue,
	isLastStep,
	toPrewarmInput,
	TOTAL_STEPS,
	type WizardState,
	type WizardStep,
} from './lib.ts';
import type { GoalSlug, WizardInput } from '../lib/types.ts';

import './style.scss';

interface Props {
	// Existing site title. Pre-fills the Name input so users don't retype it.
	initialSiteName?: string;
	// User locale, forwarded to the wizard payload and the AI call.
	locale?: string;
	// Fired with the persisted wizard input once Finish completes, so the host
	// can swap the wizard for the tailored list.
	onComplete?: ( input: WizardInput ) => void;
}

/**
 * The two-step AI Launchpad onboarding wizard: pick a goal, then describe the
 * site. Persists the input via PUT /wizard on Finish.
 *
 * @param props                 - Component props.
 * @param props.initialSiteName - Existing site title used to pre-fill Name.
 * @param props.locale          - User locale forwarded to the payload.
 * @param props.onComplete      - Called with the persisted input on Finish.
 * @return The wizard element.
 */
export function Wizard( { initialSiteName = '', locale = 'en', onComplete }: Props ) {
	const [ step, setStep ] = useState< WizardStep >( 0 );
	const [ goal, setGoal ] = useState< GoalSlug | null >( null );
	const [ siteName, setSiteName ] = useState< string >( initialSiteName );
	const [ intent, setIntent ] = useState< string >( '' );

	const state: WizardState = { goal, siteName, intent, locale };

	useEffect( () => {
		trackViewed();
	}, [] );

	// Background-tailor on Step-2 typing pauses; Finish reuses the prewarmed
	// promise via getPrewarmedTailor.
	usePrewarm( step === 1 ? toPrewarmInput( state ) : {} );

	const handleNext = () => {
		if ( ! isLastStep( step ) ) {
			setStep( ( step + 1 ) as WizardStep );
			return;
		}
		if ( ! goal ) {
			return;
		}
		const payload = buildWizardPayload( goal, state );
		apiFetch( {
			path: '/wpcom/v2/ai-launchpad/wizard',
			method: 'PUT',
			data: payload,
		} );
		getPrewarmedTailor( payload );
		trackWizardCompleted();
		onComplete?.( payload );
	};

	const handleBack = () => {
		if ( step > 0 ) {
			setStep( ( step - 1 ) as WizardStep );
		}
	};

	return (
		<Modal
			title=""
			onRequestClose={ () => undefined }
			className="ai-launchpad-wizard"
			shouldCloseOnClickOutside={ false }
			__experimentalHideHeader
			size="medium"
		>
			<div className="ai-launchpad-wizard__progress" aria-hidden="true">
				<div
					className="ai-launchpad-wizard__progress-bar"
					style={ { width: `${ ( ( step + 1 ) / TOTAL_STEPS ) * 100 }%` } }
				/>
			</div>

			{ step === 0 && <GoalsStep value={ goal } onChange={ setGoal } /> }
			{ step === 1 && (
				<DetailsStep
					goal={ goal }
					siteName={ siteName }
					intent={ intent }
					onSiteNameChange={ setSiteName }
					onIntentChange={ setIntent }
				/>
			) }

			<footer className="ai-launchpad-wizard__footer">
				<div className="ai-launchpad-wizard__footer-right">
					{ step > 0 && (
						<Button variant="secondary" onClick={ handleBack }>
							{ __( 'Back', 'jetpack-mu-wpcom' ) }
						</Button>
					) }
					<Button
						variant="primary"
						onClick={ handleNext }
						disabled={ ! canContinue( step, state ) }
					>
						{ isLastStep( step )
							? __( 'Finish', 'jetpack-mu-wpcom' )
							: __( 'Continue', 'jetpack-mu-wpcom' ) }
					</Button>
				</div>
			</footer>
		</Modal>
	);
}
