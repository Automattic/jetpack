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
import { border, drafts, published, wordpress } from '@wordpress/icons';
import { ThemeProvider } from '@wordpress/theme';
import { Button, Icon, LinkButton, Stack, Text, Tooltip, VisuallyHidden } from '@wordpress/ui';
import clsx from 'clsx';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Slide01Gradient } from '../../testimonials/slide-01-gradient';
import { assignLocation } from './assign-location';
import { ConnectedNotice } from './connected-notice';
import {
	canContinue,
	isLastStep,
	featuresDescription,
	openingStep,
	siteTypeAnswer,
	settleOnboarding,
	TOTAL_STEPS,
	wizardSteps,
} from './lib';
import { PanelArt } from './panel-art';
import { PANEL_LINES } from './panel-type';
import { ChoiceStep } from './steps/choice-step';
import { FeaturesStep } from './steps/features-step';
import { FinishStep } from './steps/finish-step';
import { StartStep } from './steps/start-step';
import styles from './styles.module.scss';
import { useJustConnected } from './use-just-connected';
import { useApplySetupModules, useSetupModules } from './use-setup-modules';
import type { SettleOutcome, WizardState, WizardStep } from './lib';
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

/*
 * Söhne Breit's own metrics, in font units: the hhea ascent, and the line box
 * the generator measured every ratio against. Font coordinates are y-up, so the
 * box starts at -ascent and the glyphs are flipped back with scale(1, -1).
 */
const TYPE_ASCENT = 1037;
const TYPE_BOX = 1326;

/**
 * WordPress's own post-status icons: done = published (the ring with a tick),
 * current = drafts (the half-filled ring), upcoming = border (the dashed ring).
 * The glyph reports where the user is, not what the step is about.
 *
 * Read off the current step, never off the furthest one reached: a step the user
 * reached and then stepped back from is ahead of them again, so it is upcoming,
 * and a step never visited can never take the tick.
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
 * Stage 1 owns the frame and the step machine only — no connection, and placeholder steps.
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
	const { isUserConnected } = useConnection();
	/*
	 * The floor, not just the starting point. Connecting is done and cannot be
	 * undone here, so a connected user must not be able to walk back onto a screen
	 * whose only button would register the site a second time.
	 */
	const firstStep = openingStep( isUserConnected );
	const [ step, setStep ] = useState< WizardStep >( firstStep );
	// The rail only lets the user back into ground already covered.
	const [ furthestStep, setFurthestStep ] = useState< WizardStep >( firstStep );
	const [ choices, setChoices ] = useState< WizardState[ 'choices' ] >( {} );
	/*
	 * Held apart from `choices`, which is a set of fixed values the wizard will
	 * report. This is the user's own words and stays on this screen.
	 */
	const [ siteTypeDetail, setSiteTypeDetail ] = useState( '' );

	// Ordered by what the site is for: the same six, with the ones that matter to
	// this kind of site at the top.
	const siteType = siteTypeAnswer( { choices, freeText: siteTypeDetail } );
	const { modules, isLoading: modulesLoading } = useSetupModules( siteType );
	const { apply, isApplying } = useApplySetupModules();
	// Missing entries mean "leave it as the site has it", which for five of the six
	// is already on. Written only when the user moves a switch.
	const [ wantedModules, setWantedModules ] = useState< Record< string, boolean > >( {} );
	const [ moduleResults, setModuleResults ] = useState< SetupModuleResult[] | null >( null );

	const handleModuleChange = useCallback(
		( slug: string, want: boolean ) =>
			setWantedModules( current => ( { ...current, [ slug ]: want } ) ),
		[]
	);

	const titleId = useId();
	const panelRef = useRef< HTMLElement >( null );
	const hasChangedStep = useRef( false );

	// Send focus to the new step, so the keyboard carries on from the questions rather
	// than from the top of the page. Skipped on the first render, which would steal focus.
	useEffect( () => {
		if ( hasChangedStep.current ) {
			panelRef.current?.focus();
		}
		hasChangedStep.current = true;
	}, [ step ] );

	const handleChoice = useCallback(
		( value: string ) => setChoices( current => ( { ...current, [ step ]: value } ) ),
		[ step ]
	);

	/*
	 * Leaving is recorded before it happens, so the takeover does not interrupt this
	 * person again. The navigation is in `finally`: a failed write only costs them
	 * being offered setup once more, and holding them on a screen they asked to
	 * leave would cost a great deal more.
	 */
	const handleExit = useCallback(
		( outcome: SettleOutcome ) => ( event: MouseEvent< HTMLElement > ) => {
			event.preventDefault();
			settleOnboarding( outcome )
				.catch( () => {} )
				.finally( () => assignLocation( exitUrl ) );
		},
		[ exitUrl ]
	);

	const handleBack = useCallback(
		() => setStep( Math.max( step - 1, firstStep ) as WizardStep ),
		[ step, firstStep ]
	);

	const handleNext = useCallback( () => {
		const next = ( step + 1 ) as WizardStep;
		setStep( next );
		setFurthestStep( current => ( next > current ? next : current ) );
	}, [ step ] );

	/*
	 * Leaving the feature step is what switches the modules; the switches above only
	 * record what was asked for. The step advances whatever came back, because the
	 * finish screen's job is to report the failures rather than hide them here.
	 */
	const handleApplyAndContinue = useCallback( () => {
		apply( modules, wantedModules )
			.then( setModuleResults )
			/*
			 * Every switch already reports its own success or failure, so a rejection
			 * here is the request layer itself giving out. The finish screen says
			 * nothing changed rather than the step sitting on a spinner for ever.
			 */
			.catch( () => setModuleResults( [] ) )
			.finally( handleNext );
	}, [ apply, modules, wantedModules, handleNext ] );

	// The rail's rows are aria-disabled rather than disabled, so they stay focusable
	// and keep announcing themselves. That makes swallowing the click our job.
	const handleRailClick = useCallback(
		( event: MouseEvent< HTMLElement > ) => {
			const index = Number( ( event.currentTarget as HTMLButtonElement ).value ) as WizardStep;
			if ( index <= furthestStep && index >= firstStep ) {
				setStep( index );
			}
		},
		[ furthestStep, firstStep ]
	);

	const meta = steps[ step ];
	const isStart = meta.kind === 'start';
	const isFeatures = meta.kind === 'features';
	const isFinish = meta.kind === 'finish';
	const panelLines = PANEL_LINES[ step ];
	const state: WizardState = { choices, freeText: siteTypeDetail };
	const wizardTitle = __( 'Set up Jetpack', 'jetpack-my-jetpack' );

	// True once, on the step the connection round trip lands on.
	const justConnected = useJustConnected();

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
			/>
		),
	}[ meta.kind ];

	const stepCount = sprintf(
		/* translators: 1: number of the current step. 2: total number of steps. */
		__( 'Step %1$d of %2$d', 'jetpack-my-jetpack' ),
		step + 1,
		TOTAL_STEPS
	);

	return (
		<ThemeProvider color={ { background: SHELL_BACKGROUND } }>
			<div className={ clsx( styles.layout, isFinish && styles[ 'layout--finish' ] ) }>
				{ /*
				 * The sidebar region, as the Site Editor builds it: a NavigableRegion
				 * holding the screen's exit control, title, and navigation.
				 */ }
				{ ! isFinish && (
					<NavigableRegion ariaLabel={ wizardTitle } className={ styles.rail }>
						<div className={ styles[ 'rail-head' ] }>
							{ /*
							 * Icon plus tooltip, as the Site Editor's own back control does it:
							 * the aria-label is what a screen reader reads, and the popup is the
							 * only thing a mouse user gets, since the mark alone says nothing.
							 * Rendered AS the link rather than around it, or the trigger would
							 * wrap one control in another.
							 */ }
							<Tooltip.Root>
								<Tooltip.Trigger
									render={
										<LinkButton
											variant="minimal"
											tone="neutral"
											size="compact"
											href={ dashboardUrl }
											aria-label={ __( 'Back to WordPress', 'jetpack-my-jetpack' ) }
											className={ styles.exit }
										>
											<LinkButton.Icon icon={ wordpress } />
										</LinkButton>
									}
								/>
								{ /*
								 * Beside the mark, not under it: the rail title sits directly
								 * below and a popup on that side lands on top of the words.
								 */ }
								<Tooltip.Popup positioner={ <Tooltip.Positioner side="right" sideOffset={ 4 } /> }>
									{ __( 'Back to WordPress', 'jetpack-my-jetpack' ) }
								</Tooltip.Popup>
							</Tooltip.Root>

							<Heading level={ 2 } size="title" className={ styles[ 'rail-title' ] }>
								{ wizardTitle }
							</Heading>
							<Text variant="body-md" className={ styles[ 'rail-count' ] }>
								{ stepCount }
							</Text>
						</div>

						{ /*
						 * The <nav> itself is hidden below the panel breakpoint, so the collapsed
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
										aria-disabled={ index > furthestStep || index < firstStep || undefined }
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
									{ justConnected && ! isStart && <ConnectedNotice /> }
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
									{ /*
									 * Gone on the last step, where the work is already done and Finish
									 * is the way out. Skipping there would record this person as having
									 * declined setup and never write the site-wide completion, so the
									 * next admin would be offered it again on a configured site.
									 */ }
									{ isLastStep( step ) ? (
										<span />
									) : (
										<LinkButton
											variant="minimal"
											tone="neutral"
											href={ exitUrl }
											onClick={ handleExit( 'skipped' ) }
										>
											{ __( 'Skip setup', 'jetpack-my-jetpack' ) }
										</LinkButton>
									) }

									{ /* The start screen carries its own primary, so the footer keeps only the exit. */ }
									{ ! isStart && (
										<Stack gap="sm">
											{ step > firstStep && (
												<Button
													variant="minimal"
													tone="neutral"
													onClick={ handleBack }
													disabled={ isApplying }
												>
													{ __( 'Back', 'jetpack-my-jetpack' ) }
												</Button>
											) }
											{ isLastStep( step ) ? (
												// Nothing else is saved yet, so finishing records that it
												// happened and leaves.
												<LinkButton
													variant="solid"
													className={ styles[ 'primary-green' ] }
													href={ exitUrl }
													onClick={ handleExit( 'completed' ) }
												>
													{ __( 'Finish', 'jetpack-my-jetpack' ) }
												</LinkButton>
											) : (
												<Button
													variant="solid"
													className={ styles[ 'primary-green' ] }
													onClick={ isFeatures ? handleApplyAndContinue : handleNext }
													disabled={ ! canContinue( step, state ) || isApplying }
													loading={ isApplying }
													loadingAnnouncement={ __(
														'Setting up your site…',
														'jetpack-my-jetpack'
													) }
												>
													{ __( 'Continue', 'jetpack-my-jetpack' ) }
												</Button>
											) }
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

								{ /* Drawn in on the start step only; the prototype's other panels are static. */ }
								<PanelArt animate={ isStart } />
								{ /* Keyed by step so each line rises again when the copy is swapped. */ }
								<p key={ meta.id } className={ styles[ 'brand-panel__copy' ] }>
									{ /*
									 * The lines are drawn as outlines, so the words themselves are
									 * carried here — one sentence per step, not one per line.
									 */ }
									<VisuallyHidden render={ <span /> }>
										{ panelLines.map( line => line.text ).join( ' ' ) }
									</VisuallyHidden>

									{ panelLines.map( line => (
										<span key={ line.text } className={ styles[ 'brand-panel__line' ] }>
											<svg
												viewBox={ `0 ${ -TYPE_ASCENT } ${ line.ratio * TYPE_BOX } ${ TYPE_BOX }` }
												style={ { inlineSize: `${ line.ratio }em`, blockSize: '1em' } }
												fill="currentColor"
												aria-hidden="true"
												focusable="false"
											>
												<g
													transform="scale(1, -1)"
													// eslint-disable-next-line react/no-danger -- Generated by tools/generate-panel-type.py from the font's outlines; no user input reaches it.
													dangerouslySetInnerHTML={ { __html: line.path } }
												/>
											</svg>
										</span>
									) ) }
								</p>
							</div>
						</div>
					</ThemeProvider>
				) }
			</div>
		</ThemeProvider>
	);
}
