import { useConnection } from '@automattic/jetpack-connection';
import { NavigableRegion } from '@wordpress/admin-ui';
import {
	FlexBlock,
	// The Site Editor's own rail is built from these three; there is no stable alias.
	__experimentalHeading as Heading, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalItem as Item, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalItemGroup as ItemGroup, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { border, chevronLeft, chevronRight, drafts, published, wordpress } from '@wordpress/icons';
import { ThemeProvider } from '@wordpress/theme';
import { Button, ButtonLink, Icon, Stack, Text } from '@wordpress/ui';
import clsx from 'clsx';
import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { assignLocation } from '../../../hooks/use-notification-watcher/assignLocation';
import { Slide01Gradient } from '../../testimonials/slide-01-gradient';
import { ConnectedNotice } from './connected-notice';
import { DataInArt } from './data-in';
import { EverywhereArt } from './everywhere';
import {
	BRAND_COLOR,
	canContinue,
	clampStep,
	featuresDescription,
	openingStep,
	SITE_TYPE_OTHER,
	siteTypeAnswer,
	settleOnboarding,
	tallyResults,
	TOTAL_STEPS,
	wizardSteps,
	type SettleOutcome,
	type WizardState,
	type WizardStep,
	type WizardStepKind,
} from './lib';
import { PanelArt } from './panel-art';
import { ChoiceStep } from './steps/choice-step';
import { FeaturesStep } from './steps/features-step';
import { FinishStep } from './steps/finish-step';
import { StartStep } from './steps/start-step';
import styles from './styles.module.scss';
import { WIZARD_EVENTS, forgetFlowId, lengthBucket, useWizardTracks } from './telemetry';
import { useConnectionKnown } from './use-connection-known';
import { useJustConnected } from './use-just-connected';
import { readSavedRun, useSavedRun } from './use-saved-run';
import { useApplySetupModules, useSetupModules } from './use-setup-modules';
import type { SetupModuleResult } from './use-setup-modules';
import type { MouseEvent } from 'react';

/*
 * Seeds for the two colour ramps, not colours in their own right: ThemeProvider
 * regenerates the whole --wpds-* set from them, so every rule below keeps using
 * the same token names and the shell's tokens come back dark on their own.
 *
 * The shell seed is what the Site Editor's own shell is built on, measured on
 * `.edit-site-layout`.
 */
const SHELL_BACKGROUND = '#1e1e1e';

/*
 * The design system's own default background seed. Passed explicitly because a
 * nested provider inherits the shell's dark seed otherwise, and the content
 * frame and the brand panel both have to stay on the light ramp.
 */
const CONTENT_BACKGROUND = '#fcfcfc';

/**
 * WordPress's own post-status icons: done = published, current = drafts,
 * upcoming = border. Read off the current step, never the furthest one reached,
 * so a step stepped back from is ahead of the user again.
 *
 * @param index   - The step the row stands for.
 * @param current - The step the user is on.
 * @return The icon for that row's state.
 */
function stepGlyph( index: number, current: number ) {
	if ( index < current ) {
		return published;
	}

	return index === current ? drafts : border;
}

/**
 * The artwork that belongs beside a step.
 *
 * The panel takes the subject of the step it is next to: a site being run on the
 * step that asks what the site is for, the plugins feeding the screen on the step
 * that asks which to switch on, and the mark everywhere else.
 *
 * @param props      - The component props.
 * @param props.kind - The kind of step the panel is beside.
 * @return The artwork for that step.
 */
function PanelArtwork( { kind }: { kind: WizardStepKind } ) {
	if ( kind === 'question' ) {
		return <EverywhereArt />;
	}

	if ( kind === 'features' ) {
		return <DataInArt />;
	}

	return <PanelArt />;
}

type WizardProps = {
	// Where skipping the wizard lands. The admin menu is hidden here, so leaving is never
	// more than one click.
	exitUrl: string;
	// Where the rail's control lands: out of Jetpack entirely, back to wp-admin.
	dashboardUrl: string;
};

/**
 * The onboarding wizard's shell: the step rail, the questions, and the brand panel.
 *
 * The rail is built from the components the Site Editor's own sidebar uses:
 * `NavigableRegion`, `ItemGroup`/`Item`, `Stack`, `Icon`, and `FlexBlock`, inside
 * a `ThemeProvider` seeded dark.
 *
 * @param props              - The component props.
 * @param props.exitUrl      - The My Jetpack URL the footer's skip leads to.
 * @param props.dashboardUrl - The wp-admin URL the rail's control leads to.
 * @return The rendered wizard.
 */
export function Wizard( { exitUrl, dashboardUrl }: WizardProps ) {
	const steps = wizardSteps();

	// Connecting leaves wp-admin for WordPress.com and comes back to a fresh page,
	// so the opening step is read off the connection rather than remembered.
	const { isRegistered, isUserConnected } = useConnection();
	/*
	 * The floor, not just the starting point. Connecting is done and cannot be
	 * undone here, so a connected user must not be able to walk back onto a screen
	 * whose only button would register the site a second time.
	 */
	const firstStep = openingStep( isUserConnected );

	/*
	 * Read once, at the top of the page load. A reload used to drop every answer
	 * and put the user back at the first step, which on a flow this short is
	 * doing it all again.
	 */
	const [ saved ] = useState( readSavedRun );
	const { save: saveRun, forget: forgetRun } = useSavedRun();

	/*
	 * Kept as asked for, and held to what is reachable on every render: a connected user
	 * is kept past the connect screen, whose only button would register the site again,
	 * and a saved run that outlived the connection is kept on it.
	 */
	const connectionKnown = useConnectionKnown();
	const lastReachable =
		connectionKnown && ! isUserConnected ? firstStep : clampStep( TOTAL_STEPS - 1 );
	const reachable = ( index: number ) =>
		clampStep( Math.min( Math.max( index, firstStep ), lastReachable ) );

	const [ askedStep, setStep ] = useState< WizardStep >( saved?.step ?? firstStep );
	// The rail only lets the user back into ground already covered.
	const [ askedFurthest, setFurthestStep ] = useState< WizardStep >(
		saved?.furthestStep ?? firstStep
	);
	const step = reachable( askedStep );
	const furthestStep = reachable( askedFurthest );
	const [ choices, setChoices ] = useState< WizardState[ 'choices' ] >( saved?.choices ?? {} );
	/*
	 * Held apart from `choices`, which is a set of fixed values the wizard will
	 * report. This is the user's own words and stays on this screen.
	 */
	const [ siteTypeDetail, setSiteTypeDetail ] = useState( saved?.freeText ?? '' );

	// Ordered by what the site is for: the same six, with the ones that matter to
	// this kind of site at the top.
	const siteType = siteTypeAnswer( { choices, freeText: siteTypeDetail } );
	const { modules, isLoading: modulesLoading } = useSetupModules( siteType, isUserConnected );
	const { apply, isApplying } = useApplySetupModules();

	/*
	 * Busy while modules apply or the wizard is on its way out, so every control waits:
	 * nothing settles twice, and no step moves after the exit has been recorded.
	 */
	const [ isLeaving, setIsLeaving ] = useState( false );
	// Catches a second click in the same tick, before `isLeaving` has rendered.
	const leaving = useRef( false );
	const busy = isApplying || isLeaving;
	// Missing entries mean "leave it as the site has it", which for five of the six
	// is already on. Written only when the user moves a switch.
	const [ wantedModules, setWantedModules ] = useState< Record< string, boolean > >(
		saved?.wanted ?? {}
	);
	const [ moduleResults, setModuleResults ] = useState< SetupModuleResult[] >( [] );

	// Bound to the step's slug, which is what every event carries; see telemetry.ts.
	const meta = steps[ step ];
	const slug = meta.id;
	const track = useWizardTracks( slug );

	const handleModuleChange = useCallback(
		( moduleSlug: string, want: boolean ) => {
			setWantedModules( current => ( { ...current, [ moduleSlug ]: want } ) );
			track( WIZARD_EVENTS.moduleToggle, { module: moduleSlug, enabled: want } );
		},
		[ track ]
	);

	const justConnected = useJustConnected();
	const arrivedOn = useRef< WizardStep | null >( null );

	const titleId = useId();
	const panelRef = useRef< HTMLElement >( null );
	const hasChangedStep = useRef( false );

	/*
	 * Opts the page into the wizard's window-sized takeover styles, before the first paint.
	 * Set here, not by the server, so a fallback showing the single screen never gets them.
	 */
	useLayoutEffect( () => {
		document.body.classList.add( 'jetpack-onboarding-wizard' );
		return () => document.body.classList.remove( 'jetpack-onboarding-wizard' );
	}, [] );

	// Send focus to the new step, so the keyboard carries on from the questions rather
	// than from the top of the page. Skipped on the first render, which would steal focus.
	useEffect( () => {
		if ( hasChangedStep.current ) {
			panelRef.current?.focus();
		}
		hasChangedStep.current = true;
	}, [ step ] );

	// Written on every change rather than on the way out, because a reload is not
	// something the wizard gets told about.
	useEffect( () => {
		saveRun( {
			step,
			furthestStep,
			choices,
			freeText: siteTypeDetail,
			wanted: wantedModules,
		} );
	}, [ saveRun, step, furthestStep, choices, siteTypeDetail, wantedModules ] );

	// Keyed on the slug rather than the index, so the step a connected user opens on
	// is reported once and the same screen is never two different numbers.
	useEffect( () => {
		track( WIZARD_EVENTS.stepView );
	}, [ track ] );

	const handleChoice = useCallback(
		( value: string ) => {
			setChoices( current => ( { ...current, [ step ]: value } ) );
			track( WIZARD_EVENTS.siteTypeSelect, { site_type: value } );
		},
		[ step, track ]
	);

	/*
	 * Leaving is recorded before it happens, so the takeover does not interrupt this
	 * person again. A failed write records nothing and My Jetpack sends a
	 * disconnected user straight back in, so only that case leaves by wp-admin.
	 */
	const handleExit = useCallback(
		( outcome: SettleOutcome ) => ( event: MouseEvent< HTMLElement > ) => {
			/*
			 * A modified click opens the link somewhere else and leaves this tab on
			 * the wizard, so nothing is recorded and the run is kept. A middle click
			 * and the context menu fire no `click` at all, so they arrive here never.
			 */
			if (
				event.button !== 0 ||
				event.metaKey ||
				event.ctrlKey ||
				event.shiftKey ||
				event.altKey
			) {
				return;
			}

			event.preventDefault();

			if ( busy || leaving.current ) {
				return;
			}
			leaving.current = true;
			setIsLeaving( true );

			const destination = event.currentTarget.getAttribute( 'href' ) || exitUrl;

			// The run is over, so it must not be waiting on the next visit.
			forgetRun();
			forgetFlowId();

			// Reported before the navigation, not after: the page is about to go.
			track(
				outcome === 'skipped' ? WIZARD_EVENTS.skip : WIZARD_EVENTS.complete,
				outcome === 'skipped' ? {} : { site_type: siteType ?? 'none' }
			);

			// Nothing settles before the site is connected, so leaving then is only leaving.
			if ( ! isRegistered ) {
				assignLocation( destination );
				return;
			}

			settleOnboarding( outcome ).then(
				() => assignLocation( destination ),
				() => assignLocation( isUserConnected ? destination : dashboardUrl )
			);
		},
		[ exitUrl, dashboardUrl, forgetRun, busy, isRegistered, isUserConnected, track, siteType ]
	);

	const handleBack = useCallback( () => setStep( clampStep( step - 1 ) ), [ step ] );

	const handleNext = useCallback( () => {
		track( WIZARD_EVENTS.stepComplete );

		/*
		 * On Continue rather than from an effect, so restoring a run on reload cannot send
		 * it again. Never the words, which could carry a name or an address: a length
		 * bucket answers whether the field gets used. Continue needs text, so it always has some.
		 */
		if ( slug === 'site-type' && siteType === SITE_TYPE_OTHER ) {
			track( WIZARD_EVENTS.siteTypeDetail, { length_bucket: lengthBucket( siteTypeDetail ) } );
		}

		const next = clampStep( step + 1 );
		setStep( next );
		setFurthestStep( current => ( next > current ? next : current ) );
	}, [ step, track, slug, siteType, siteTypeDetail ] );

	/*
	 * Leaving the feature step is what switches the modules; the switches above only
	 * record what was asked for. The step advances whatever came back, because the
	 * finish screen's job is to report the failures rather than hide them here.
	 */
	const handleApplyAndContinue = useCallback( () => {
		/*
		 * Focus moves off the button before it goes busy. Whatever the control does
		 * under `loading`, the keyboard was measured landing on <body> for the whole
		 * of the request, which on a slow site is a long time nowhere.
		 */
		panelRef.current?.focus();

		apply( modules, wantedModules )
			.then( results => {
				setModuleResults( results );
				// Counts, not a list, because a property holding a list cannot be grouped on.
				const { on, failed } = tallyResults( results );
				track( WIZARD_EVENTS.applyResult, {
					offered: results.length,
					switched_on: on,
					failed,
				} );
			} )
			/*
			 * apply() reports each switch's failure itself and does not reject. This only
			 * keeps an unexpected throw from leaving the step on a spinner for ever.
			 */
			.catch( () => setModuleResults( [] ) )
			.finally( handleNext );
	}, [ apply, modules, wantedModules, handleNext, track ] );

	// The rail's rows are aria-disabled rather than disabled, so they stay focusable
	// and keep announcing themselves. That makes swallowing the click our job.
	const handleRailClick = useCallback(
		( event: MouseEvent< HTMLElement > ) => {
			const index = clampStep( Number( ( event.currentTarget as HTMLButtonElement ).value ) );
			if ( ! busy && index <= furthestStep && index >= firstStep ) {
				setStep( index );
			}
		},
		[ furthestStep, firstStep, busy ]
	);

	const isStart = meta.kind === 'start';

	/*
	 * The step the connection round trip landed on, and only that one. The flag
	 * behind it is read once and then cached for the page, so without pinning it
	 * to a step the notice comes back on every step change — and because the
	 * column is keyed by step it is re-inserted each time, which a live region
	 * announces again. Three times, the last on the finish screen.
	 */
	if ( justConnected && ! isStart && arrivedOn.current === null ) {
		arrivedOn.current = step;
	}
	const showConnected = justConnected && arrivedOn.current === step;
	const isFeatures = meta.kind === 'features';
	const isFinish = meta.kind === 'finish';

	/*
	 * Continue sits in the same place on every step, so the second half of a
	 * double click landed on the NEXT step's and skipped the one between. `detail`
	 * is the count inside the browser's own double-click window, so this refuses
	 * that press alone: a deliberate second click is 1, and Enter is 0.
	 */
	const handleContinue = useCallback(
		( event: MouseEvent< HTMLElement > ) => {
			if ( event.detail > 1 ) {
				return;
			}

			if ( isFeatures ) {
				handleApplyAndContinue();
				return;
			}

			handleNext();
		},
		[ isFeatures, handleApplyAndContinue, handleNext ]
	);

	const state: WizardState = useMemo(
		() => ( { choices, freeText: siteTypeDetail } ),
		[ choices, siteTypeDetail ]
	);
	const canAdvance = canContinue( step, state );

	const wizardTitle = __( 'Set up Jetpack', 'jetpack-my-jetpack' );

	const stepBody = {
		start: <StartStep titleId={ titleId } title={ meta.title } description={ meta.description } />,
		features: (
			<FeaturesStep
				titleId={ titleId }
				title={ meta.title }
				description={ featuresDescription( siteType, meta.description ) }
				modules={ modules }
				isLoading={ modulesLoading }
				wanted={ wantedModules }
				onChange={ handleModuleChange }
			/>
		),
		finish: (
			<FinishStep
				titleId={ titleId }
				results={ moduleResults }
				dashboardUrl={ dashboardUrl }
				exitUrl={ exitUrl }
				onLeave={ handleExit( 'completed' ) }
				isLeaving={ isLeaving }
			/>
		),
		question: (
			<ChoiceStep
				titleId={ titleId }
				title={ meta.title }
				description={ meta.description }
				options={ meta.options }
				value={ choices[ step ] }
				onChange={ handleChoice }
				freeText={ siteTypeDetail }
				onFreeTextChange={ setSiteTypeDetail }
				onCommit={ canAdvance && ! busy ? handleNext : undefined }
			/>
		),
	}[ meta.kind ];

	/*
	 * Counted from the step this person actually starts on. A connected site never
	 * sees the connect screen, so telling them they are on step 2 of 4 counts a
	 * step that was never theirs and leaves the last one reading 4 of 4 after
	 * three.
	 */
	const stepCount = sprintf(
		/* translators: 1: number of the current step. 2: total number of steps. */
		__( 'Step %1$d of %2$d', 'jetpack-my-jetpack' ),
		step - firstStep + 1,
		TOTAL_STEPS - firstStep
	);

	return (
		<ThemeProvider color={ { background: SHELL_BACKGROUND } }>
			<div
				className={ clsx(
					styles.layout,
					isStart && styles[ 'layout--start' ],
					isFinish && styles[ 'layout--finish' ]
				) }
			>
				{ /*
				 * The sidebar region, as the Site Editor builds it: a NavigableRegion
				 * holding the screen's exit control, title, and navigation.
				 */ }
				{ ! isFinish && (
					<NavigableRegion ariaLabel={ wizardTitle } className={ styles.rail }>
						<Stack
							direction="column"
							align="flex-start"
							gap="xs"
							className={ styles[ 'rail-head' ] }
						>
							{ /*
							 * The words are on the control rather than in a tooltip. The mark
							 * alone says nothing, and a tooltip is the one affordance a touch
							 * user never gets — on the screen that takes over their admin, the
							 * way back has to be readable without hovering it.
							 */ }
							<ButtonLink
								variant="minimal"
								tone="neutral"
								size="compact"
								href={ dashboardUrl }
								onClick={ handleExit( 'skipped' ) }
								aria-disabled={ busy || undefined }
								className={ styles.exit }
							>
								<ButtonLink.Icon icon={ wordpress } />
								{ __( 'Back to your WordPress site', 'jetpack-my-jetpack' ) }
							</ButtonLink>

							<Heading level={ 2 } size="title" className={ styles[ 'rail-title' ] }>
								{ wizardTitle }
							</Heading>
							<Text variant="body-md" className={ styles[ 'rail-count' ] }>
								{ stepCount }
							</Text>
						</Stack>

						{ /*
						 * The <nav> itself is hidden below the rail breakpoint, so the collapsed
						 * rail leaves no empty landmark behind, only its header.
						 */ }
						<nav
							className={ styles[ 'rail-nav' ] }
							aria-label={ __( 'Setup steps', 'jetpack-my-jetpack' ) }
						>
							{ /* ItemGroup carries role="list", so each Item is a listitem. */ }
							<ItemGroup className={ styles[ 'rail-steps' ] }>
								{ steps.map( ( item, index ) => (
									<Item
										key={ item.id }
										as="button"
										type="button"
										value={ index }
										aria-current={ index === step ? 'true' : undefined }
										aria-disabled={ index > furthestStep || index < firstStep || busy || undefined }
										className={ styles[ 'rail-step' ] }
										onClick={ handleRailClick }
									>
										<Stack direction="row" gap="sm" align="center" justify="start">
											<Icon icon={ stepGlyph( index, step ) } aria-hidden="true" />
											<FlexBlock>{ item.label }</FlexBlock>
										</Stack>
									</Item>
								) ) }
							</ItemGroup>
						</nav>
					</NavigableRegion>
				) }

				<div className={ styles.canvas }>
					{ /* Back to the light ramp: the questions are a white sheet on the dark shell. */ }
					<ThemeProvider color={ { background: CONTENT_BACKGROUND } }>
						<div className={ styles.frame }>
							<section
								ref={ panelRef }
								tabIndex={ -1 }
								aria-labelledby={ titleId }
								className={ styles[ 'panel-body' ] }
							>
								{ /* Keyed by step so the entrance replays as the content is swapped. */ }
								<div key={ meta.id } className={ styles[ 'panel-content' ] }>
									{ showConnected && <ConnectedNotice /> }
									{ stepBody }
								</div>
							</section>

							{ ! isFinish && (
								<Stack
									className={ styles.footer }
									align="center"
									justify="space-between"
									gap="md"
									wrap="wrap"
								>
									{ /* My Jetpack needs the site connection accepting the terms creates. */ }
									{ isRegistered && (
										<ButtonLink
											variant="minimal"
											tone="neutral"
											href={ exitUrl }
											onClick={ handleExit( 'skipped' ) }
											aria-disabled={ busy || undefined }
										>
											{ __( 'Skip setup', 'jetpack-my-jetpack' ) }
										</ButtonLink>
									) }

									{ /* The start screen carries its own primary, so the footer keeps only the exit. */ }
									{ ! isStart && (
										<Stack gap="sm">
											{ step > firstStep && (
												<Button
													variant="minimal"
													tone="neutral"
													onClick={ handleBack }
													disabled={ busy }
												>
													<Button.Icon icon={ chevronLeft } />
													{ __( 'Back', 'jetpack-my-jetpack' ) }
												</Button>
											) }
											<ThemeProvider color={ BRAND_COLOR }>
												<Button
													variant="solid"
													className={ styles[ 'readable-disabled' ] }
													onClick={ handleContinue }
													// The features step offers no options, so it is the list arriving that it waits on.
													disabled={ ! canAdvance || busy || ( isFeatures && modulesLoading ) }
													loading={ isApplying }
													loadingAnnouncement={ __(
														'Setting up your site…',
														'jetpack-my-jetpack'
													) }
												>
													{ __( 'Continue', 'jetpack-my-jetpack' ) }
													<Button.Icon icon={ chevronRight } />
												</Button>
											</ThemeProvider>
										</Stack>
									) }
								</Stack>
							) }
						</div>
					</ThemeProvider>
				</div>

				{ /*
				 * Kept off the shell's dark ramp, so the gradient panel's own colours are
				 * exactly what they were before the shell went dark.
				 */ }
				{ ! isFinish && (
					<ThemeProvider color={ { background: CONTENT_BACKGROUND } }>
						<div className={ styles[ 'brand-panel' ] }>
							<div className={ styles[ 'brand-panel__inner' ] }>
								{ /* Under the glow, which is why it comes first and carries z-index 0. */ }
								<div className={ styles[ 'brand-panel__mesh' ] } aria-hidden="true">
									<span
										className={ clsx(
											styles[ 'brand-panel__blob' ],
											styles[ 'brand-panel__blob--1' ]
										) }
									/>
									<span
										className={ clsx(
											styles[ 'brand-panel__blob' ],
											styles[ 'brand-panel__blob--2' ]
										) }
									/>
									<span
										className={ clsx(
											styles[ 'brand-panel__blob' ],
											styles[ 'brand-panel__blob--3' ]
										) }
									/>
									<span
										className={ clsx(
											styles[ 'brand-panel__blob' ],
											styles[ 'brand-panel__blob--4' ]
										) }
									/>
								</div>

								<Slide01Gradient
									className={ styles[ 'brand-panel__glow' ] }
									preserveAspectRatio="none"
								/>

								{ /*
								 * Deliberately NOT keyed by step. The mark is the same object on the
								 * start and finish steps, and keying would remount it on every
								 * Continue and replay its draw, saying something changed when
								 * nothing had. The two compositions do still mount and unmount as
								 * their own step comes and goes, so returning to a step replays it,
								 * which is what returning to a step should look like.
								 */ }
								<PanelArtwork kind={ meta.kind } />
							</div>
						</div>
					</ThemeProvider>
				) }
			</div>
		</ThemeProvider>
	);
}
