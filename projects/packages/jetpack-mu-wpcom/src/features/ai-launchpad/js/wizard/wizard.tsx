import apiFetch from '@wordpress/api-fetch';
import { Modal, Button } from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { getPrewarmedTailor, usePrewarm } from '../lib/prewarm.ts';
import { trackViewed, trackWizardCompleted, trackWizardSkipped } from '../lib/tracks.ts';
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
import type { GoalSlug, TailorResult, WizardInput } from '../lib/types.ts';

import './style.scss';

interface Props {
	// Existing site title. Pre-fills the Name input so users don't retype it.
	initialSiteName?: string;
	// Existing site tagline (blogdescription). Pre-fills the Brief description.
	initialIntent?: string;
	// The site's front-end URL, used to key the Calypso My Home URL on Skip.
	siteUrl?: string;
	// User locale, forwarded to the wizard payload and the AI call.
	locale?: string;
	// Fired once Finish completes, with the persisted input and the in-flight
	// tailor promise, so the host can swap to the tailored list.
	onComplete?: ( input: WizardInput, tailoring: Promise< TailorResult > ) => void;
}

/**
 * The two-step AI Launchpad onboarding wizard: pick a goal, then describe the
 * site. Persists the input via PUT /wizard on Finish.
 *
 * @param props                 - Component props.
 * @param props.initialSiteName - Existing site title used to pre-fill Name.
 * @param props.initialIntent   - Existing site tagline used to pre-fill the description.
 * @param props.siteUrl         - The site's front-end URL (for the Skip redirect).
 * @param props.locale          - User locale forwarded to the payload.
 * @param props.onComplete      - Called with the input and tailor promise on Finish.
 * @return The wizard element.
 */
export function Wizard( {
	initialSiteName = '',
	initialIntent = '',
	siteUrl,
	locale = 'en',
	onComplete,
}: Props ) {
	const [ step, setStep ] = useState< WizardStep >( 0 );
	const [ goal, setGoal ] = useState< GoalSlug | null >( null );
	const [ siteName, setSiteName ] = useState< string >( initialSiteName );
	const [ intent, setIntent ] = useState< string >( initialIntent );
	const [ skipping, setSkipping ] = useState( false );

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
		// Persist in the background, best-effort so a failed save isn't an unhandled rejection.
		// Once it lands, reflect the new title in the server-rendered admin bar in place —
		// a reload instead would re-show the wizard (the tailored output isn't persisted yet).
		// Mirrors the server's guard: an empty/whitespace Name never writes blogname.
		apiFetch( {
			path: '/wpcom/v2/ai-launchpad/wizard',
			method: 'PUT',
			data: payload,
		} )
			.then( () => {
				const adminBarSiteName = document.querySelector( '#wp-admin-bar-site-name > a' );
				const savedName = payload.site_name.trim();
				if ( adminBarSiteName && savedName ) {
					adminBarSiteName.textContent = savedName;
				}
			} )
			.catch( () => {} );

		const tailoring = getPrewarmedTailor( payload );
		trackWizardCompleted();
		onComplete?.( payload, tailoring );
	};

	const handleBack = () => {
		if ( step > 0 ) {
			setStep( ( step - 1 ) as WizardStep );
		}
	};

	// Skipping opts out of the AI Launchpad entirely: dismiss it server-side (which reverts
	// the site to the regular launchpad surfaces) and leave for Calypso My Home. Calypso keys
	// sites by their front-end host, so prefer the site URL over the wp-admin request host.
	const handleSkip = async () => {
		setSkipping( true );
		trackWizardSkipped();
		try {
			await apiFetch( { path: '/wpcom/v2/ai-launchpad', method: 'DELETE' } );
		} catch {
			// Still navigate away: a failed dismiss write must not trap the user in the wizard.
		}
		let siteHost = window.location.hostname;
		try {
			siteHost = siteUrl ? new URL( siteUrl ).hostname : siteHost;
		} catch {
			// Malformed site URL: keep the request host.
		}
		window.location.href = 'https://wordpress.com/home/' + siteHost;
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
				<Button variant="link" onClick={ handleSkip } disabled={ skipping }>
					{ __( 'Skip', 'jetpack-mu-wpcom' ) }
				</Button>
				<div className="ai-launchpad-wizard__footer-right">
					{ step > 0 && (
						<Button variant="secondary" onClick={ handleBack } disabled={ skipping }>
							{ __( 'Back', 'jetpack-mu-wpcom' ) }
						</Button>
					) }
					<Button
						variant="primary"
						onClick={ handleNext }
						disabled={ skipping || ! canContinue( step, state ) }
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
