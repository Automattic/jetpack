import apiFetch from '@wordpress/api-fetch';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, ButtonLink, Dialog, Stack } from '@wordpress/ui';
import { tailor } from '../lib/tailor.ts';
import {
	setTracksContext,
	trackViewed,
	trackWizardBackClicked,
	trackWizardConnectAiClicked,
	trackWizardGoalClicked,
	trackWizardMcpConnectedViewed,
	trackWizardMcpGoToDashboardClicked,
	trackWizardMcpReadOnlyViewed,
	trackWizardMcpScreenViewed,
	trackWizardSetupChoiceSelected,
	trackWizardSiteDetailsChanged,
	trackWizardStepCompleted,
	trackWizardStepSkipped,
} from '../lib/tracks.ts';
import AiToolStep from './ai-tool-step.tsx';
import DetailsStep from './details-step.tsx';
import GoalsStep, { bringYourAiToolCopy } from './goals-step.tsx';
import {
	AI_TOOL_CHAT_URLS,
	buildWizardPayload,
	canContinue,
	goalsVariation,
	isLastStep,
	MCP_SETTINGS_URL,
	showsSetupChoice,
	TOTAL_STEPS,
	viewedStep,
	type AiTool,
	type WizardState,
	type WizardStep,
} from './lib.ts';
import SetupChoiceStep, { type SetupChoice } from './setup-choice-step.tsx';
import type { GoalSlug, SiteCopy, TailorResult, WizardInput } from '../lib/types.ts';

import './style.scss';

interface Props {
	// Existing site title. Pre-fills the Name input so users don't retype it.
	initialSiteName?: string;
	// Existing site tagline (blogdescription). Pre-fills the Brief description.
	initialIntent?: string;
	// The site language, forwarded to the wizard payload and the AI call, which writes the drafts in it.
	locale?: string;
	// The account language, which the AI writes the task subtitles in.
	uiLocale?: string;
	// The site-language copy the fallback drafts are written from.
	copy: SiteCopy;
	// Whether the site was built with AI, which changes the fallback list.
	aiBuilt?: boolean;
	// The goals step's ExPlat variation from the server; anything else renders control.
	goalsVariation?: string | null;
	// Whether the AI tool view can detect a new connection; without it, Set up only opens the tool.
	mcpDetection?: boolean;
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
 * @param props.locale          - Site language forwarded to the payload.
 * @param props.uiLocale        - Account language the task subtitles are written in.
 * @param props.copy            - Site-language copy for the fallback drafts.
 * @param props.aiBuilt         - Whether the site was built with AI, which changes the fallback list.
 * @param props.goalsVariation  - The goals step's ExPlat variation from the server.
 * @param props.mcpDetection    - Whether the AI tool view can detect a new connection.
 * @param props.onComplete      - Called with the input and tailor promise on Finish.
 * @return The wizard element.
 */
export function Wizard( {
	initialSiteName = '',
	initialIntent = '',
	locale = 'en',
	uiLocale = locale,
	copy,
	aiBuilt = false,
	goalsVariation: assignedVariation = null,
	mcpDetection = false,
	onComplete,
}: Props ) {
	const [ step, setStep ] = useState< WizardStep >( 0 );
	const [ goal, setGoal ] = useState< GoalSlug | null >( null );
	const variation = goalsVariation( assignedVariation );
	const [ siteName, setSiteName ] = useState< string >( initialSiteName );
	const [ intent, setIntent ] = useState< string >( initialIntent );
	const [ skipping, setSkipping ] = useState( false );
	// Whether the "Which AI do you use?" view replaces the goals step. It is not a numbered step.
	const [ showAiTool, setShowAiTool ] = useState( false );
	const goalsTitleRef = useRef< HTMLHeadingElement >( null );
	const aiToolTitleRef = useRef< HTMLHeadingElement >( null );
	// The AI tools connected from the AI tool view, in the order they connected.
	const [ connectedTools, setConnectedTools ] = useState< AiTool[] >( [] );
	// Whether the account's MCP access was read only at the AI tool view's last check. It applies to every tool.
	const [ readOnlyAccess, setReadOnlyAccess ] = useState( false );
	const [ promptCopied, setPromptCopied ] = useState( false );
	const readOnly = readOnlyAccess && connectedTools.length > 0;
	// The treatment opens on "Guide me" or "Build with my AI" before the goals.
	const [ choosing, setChoosing ] = useState( showsSetupChoice( variation ) );
	const [ setupChoice, setSetupChoice ] = useState< SetupChoice | null >( null );
	const choiceTitleRef = useRef< HTMLHeadingElement >( null );

	const state: WizardState = { goal, siteName, intent, locale, uiLocale };
	const aiCopy = bringYourAiToolCopy();
	// The analytics name of the current step, shared by every event that reports one.
	const stepName = 0 === step ? 'goal' : 'site_details';

	const viewed = viewedStep( step, choosing, showAiTool );

	// One viewed event per screen shown, re-firing when Back re-shows the setup choice or goal step.
	useEffect( () => {
		if ( viewed ) {
			trackViewed( { step: viewed } );
		}
	}, [ viewed ] );

	// Back unmounts its own button, so move focus to the goals title instead of losing it to the page.
	useEffect( () => {
		if ( choosing ) {
			choiceTitleRef.current?.focus();
		} else if ( showAiTool ) {
			aiToolTitleRef.current?.focus();
		} else if ( step === 0 ) {
			goalsTitleRef.current?.focus();
		}
	}, [ step, showAiTool, choosing ] );

	useEffect( () => {
		if ( showAiTool ) {
			trackWizardMcpScreenViewed( { goals_variation: variation } );
		}
	}, [ showAiTool, variation ] );

	const handleConnected = useCallback(
		( tool: AiTool ) => {
			trackWizardMcpConnectedViewed( { goals_variation: variation, integration: tool } );
			setConnectedTools( current => [ ...current, tool ] );
		},
		[ variation ]
	);

	useEffect( () => {
		if ( readOnly ) {
			trackWizardMcpReadOnlyViewed( {
				goals_variation: variation,
				integration: connectedTools[ connectedTools.length - 1 ],
			} );
		}
	}, [ readOnly, connectedTools, variation ] );

	const handleGoToDashboard = () => {
		trackWizardMcpGoToDashboardClicked( {
			goals_variation: variation,
			integration: connectedTools[ connectedTools.length - 1 ] ?? 'other',
		} );
		window.location.assign( 'index.php' );
	};

	const handleNext = () => {
		if ( choosing ) {
			if ( setupChoice ) {
				trackWizardSetupChoiceSelected( { choice: setupChoice, goals_variation: variation } );
			}
			if ( setupChoice === 'ai' ) {
				trackWizardConnectAiClicked( { goals_variation: variation } );
				setShowAiTool( true );
			}
			setChoosing( false );
			return;
		}
		if ( ! isLastStep( step ) ) {
			trackWizardStepCompleted( { step: stepName } );
			// The goal is confirmed from here on; earlier funnel events carry null.
			if ( goal ) {
				setTracksContext( { goal } );
			}
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

		const tailoring = tailor( payload, copy, aiBuilt );
		trackWizardStepCompleted( { step: stepName } );
		// One event per field the user actually modified, vs the pre-filled values.
		if ( siteName.trim() !== initialSiteName.trim() ) {
			trackWizardSiteDetailsChanged( { field: 'title' } );
		}
		if ( intent.trim() !== initialIntent.trim() ) {
			trackWizardSiteDetailsChanged( { field: 'description' } );
		}
		// wizard_completed fires when the tailored list first lands (with the
		// inferred context populated), not here — see TailoredList.
		onComplete?.( payload, tailoring );
	};

	const handleBack = () => {
		if ( showAiTool || step === 0 ) {
			setShowAiTool( false );
			setPromptCopied( false );
			setChoosing( true );
			return;
		}
		if ( step > 0 ) {
			trackWizardBackClicked( { step: 'site_details' } );
			setStep( ( step - 1 ) as WizardStep );
		}
	};

	// Skipping opts out of the AI Launchpad entirely: dismiss it server-side (which leaves the
	// site with no setup guidance) and leave for the wp-admin dashboard.
	const handleSkip = async () => {
		setSkipping( true );
		trackWizardStepSkipped( { step: stepName } );
		try {
			await apiFetch( { path: '/wpcom/v2/ai-launchpad', method: 'DELETE' } );
		} catch {
			// Still navigate away: a failed dismiss write must not trap the user in the wizard.
		}
		// Relative to the wizard's own admin.php?page=site-setup-wp-admin URL, so this resolves to the dashboard.
		window.location.href = 'index.php';
	};

	// In the treatment, every view after the setup choice leads back towards it instead of skipping.
	const backReplacesSkip = showAiTool || ( showsSetupChoice( variation ) && ! choosing );

	return (
		// The wizard cannot be dismissed: Escape and backdrop clicks are ignored, and
		// "Skip" is the only way out, apart from "Go to my dashboard" once an AI tool is connected.
		<Dialog.Root open onOpenChange={ () => undefined } disablePointerDismissal>
			<Dialog.Popup
				size="medium"
				className="ai-launchpad-wizard"
				initialFocus={ choosing ? choiceTitleRef : goalsTitleRef }
				portal={ <Dialog.Portal className="ai-launchpad-wizard__portal" /> }
			>
				<Dialog.Content>
					<div className="ai-launchpad-wizard__progress" aria-hidden="true">
						<div
							className="ai-launchpad-wizard__progress-bar"
							// The AI tool view ends its path, so it fills the bar.
							style={ {
								width: `${ ( showAiTool ? 1 : ( step + 1 ) / TOTAL_STEPS ) * 100 }%`,
							} }
						/>
					</div>

					{ choosing && (
						<SetupChoiceStep
							titleRef={ choiceTitleRef }
							value={ setupChoice }
							onChange={ setSetupChoice }
						/>
					) }
					{ showAiTool && (
						<AiToolStep
							titleRef={ aiToolTitleRef }
							variation={ variation }
							detectsConnections={ mcpDetection }
							connected={ connectedTools }
							onConnected={ handleConnected }
							readOnly={ readOnly }
							onReadOnlyChange={ setReadOnlyAccess }
							onPromptCopied={ () => setPromptCopied( true ) }
						/>
					) }
					{ step === 0 && ! showAiTool && ! choosing && (
						<GoalsStep
							titleRef={ goalsTitleRef }
							value={ goal }
							onChange={ nextGoal => {
								trackWizardGoalClicked( {
									goal_clicked: nextGoal,
									goals_variation: assignedVariation,
								} );
								setGoal( nextGoal );
							} }
						/>
					) }
					{ step === 1 && (
						<DetailsStep
							goal={ goal }
							siteName={ siteName }
							intent={ intent }
							onSiteNameChange={ setSiteName }
							onIntentChange={ setIntent }
						/>
					) }
				</Dialog.Content>
				{ showAiTool && connectedTools.length > 0 ? (
					// With read-only access, allowing full access leads; with one AI connected, opening it does; with
					// both, the dashboard does.
					<Stack
						render={ <Dialog.Footer /> }
						align="center"
						justify={ readOnly || connectedTools.length === 1 ? 'space-between' : 'flex-end' }
						gap="md"
					>
						{ readOnly || connectedTools.length === 1 ? (
							<>
								<Button variant="minimal" onClick={ handleGoToDashboard }>
									{ aiCopy.goToDashboard }
								</Button>
								<ButtonLink
									variant="solid"
									href={ readOnly ? MCP_SETTINGS_URL : AI_TOOL_CHAT_URLS[ connectedTools[ 0 ] ] }
									target="_blank"
									rel="noopener noreferrer"
								>
									{ readOnly ? aiCopy.allowFullAccess : aiCopy.openTool( connectedTools[ 0 ] ) }
								</ButtonLink>
							</>
						) : (
							<Button variant="solid" onClick={ handleGoToDashboard }>
								{ aiCopy.goToDashboard }
							</Button>
						) }
					</Stack>
				) : (
					<Stack render={ <Dialog.Footer /> } align="center" justify="space-between" gap="md">
						{ backReplacesSkip ? (
							<Button variant="minimal" onClick={ handleBack }>
								{ __( 'Back', 'jetpack-mu-wpcom' ) }
							</Button>
						) : (
							<Button variant="minimal" onClick={ handleSkip } disabled={ skipping }>
								{ __( 'Skip', 'jetpack-mu-wpcom' ) }
							</Button>
						) }
						<Stack gap="sm">
							{ step > 0 && ! backReplacesSkip && (
								<Button variant="outline" onClick={ handleBack } disabled={ skipping }>
									{ __( 'Back', 'jetpack-mu-wpcom' ) }
								</Button>
							) }
							{ showAiTool && promptCopied && (
								<Button variant="solid" onClick={ handleGoToDashboard }>
									{ aiCopy.goToDashboard }
								</Button>
							) }
							{ ! showAiTool && (
								<Button
									variant="solid"
									onClick={ handleNext }
									disabled={
										skipping || ( choosing ? ! setupChoice : ! canContinue( step, state ) )
									}
								>
									{ isLastStep( step )
										? __( 'Finish', 'jetpack-mu-wpcom' )
										: __( 'Continue', 'jetpack-mu-wpcom' ) }
								</Button>
							) }
						</Stack>
					</Stack>
				) }
			</Dialog.Popup>
		</Dialog.Root>
	);
}
