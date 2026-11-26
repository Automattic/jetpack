import { __ } from '@wordpress/i18n';
import { Notice, Stack } from '@wordpress/ui';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { formatSiteAddress, getSiteUrl } from '../../helpers/format-site-address';
import { hasJetpackPlugin, hasWooPlugin } from '../../helpers/site-words';
import useIdentityCrisisActions from '../../hooks/use-identity-crisis-actions';
import IdentityCrisisAddresses from './addresses';
import IdentityCrisisErrorNotice from './error-notice';
import ChoiceStep from './flow/choice-step';
import {
	getConclusionCopy,
	getConfirmedNote,
	getGuideFactLines,
	getOptionCopy,
	getResultCopy,
	getStagingGuideText,
	getStagingNote,
} from './flow/copy';
import GuideStep from './flow/guide-step';
import GuideTrail from './flow/guide-trail';
import Intro from './flow/intro';
import ResultStep from './flow/result-step';
import StepActions from './flow/step-actions';
import StepFooter from './flow/step-footer';
import {
	getGuideTrail,
	getOptions,
	getPath,
	getResultAction,
	isConcluded,
	isGuideStep,
	isResultStep,
} from './flow/steps';
import TextButton from './flow/text-button';
import useIdentityCrisisFlow from './flow/use-identity-crisis-flow';
import IdentityCrisisLayout from './layout';
import IdentityCrisisMigrated from './migrated';
import { reloadPage } from './navigate';
import IdentityCrisisNonAdmin from './non-admin';
import { onIdentityCrisisActionSuccess } from './on-action-success';
import useIdentityCrisisState from './use-identity-crisis-state';
import type { ActionCopy, CopyContext } from './flow/copy';
import type { FlowContext } from './flow/steps';
import type { IdentityCrisisProps } from './types';
import type { ConnectedPlugin } from '../../helpers/site-words';
import type {
	IdentityCrisisAction,
	IdentityCrisisActionPath,
	IdentityCrisisError,
} from '../../hooks/use-identity-crisis-actions/types';
import type { IdentityCrisisState } from '../../types';
import type { ReactNode } from 'react';

type ResolvableState = Extract< IdentityCrisisState, { canResolve: true } >;

interface ResolverProps extends IdentityCrisisProps {
	state: ResolvableState;
	plugins: ConnectedPlugin[];
}

const DISCONNECTED_ERROR: IdentityCrisisError = { action: 'start-fresh', cause: 'disconnected' };
const RESOLVED_ERROR: IdentityCrisisError = { action: 'start-fresh', cause: 'resolved' };

/**
 * The questions, or the step-by-step guide, that lead to a Safe Mode action, then the migrate-done view.
 *
 * @param {ResolverProps} props - Component props.
 * @return {ReactNode} The view.
 */
function IdentityCrisisResolver( {
	state,
	plugins,
	showHeader = true,
	redirectUri,
	from,
	hostActions,
	onActionSuccess = onIdentityCrisisActionSuccess,
	onMigratedDone = reloadPage,
}: ResolverProps ): ReactNode {
	const actions = useIdentityCrisisActions( { redirectUri, from } );
	const ctx: FlowContext = useMemo(
		() => ( {
			isDevelopmentSite: state.isDevelopmentSite,
			possibleDynamicSiteUrlDetected: state.possibleDynamicSiteUrlDetected,
			isStore: hasWooPlugin( plugins ),
			hasJetpackPlugin: hasJetpackPlugin( plugins ),
		} ),
		[ state.isDevelopmentSite, state.possibleDynamicSiteUrlDetected, plugins ]
	);
	const copy: CopyContext = {
		isStore: ctx.isStore,
		hasJetpackPlugin: ctx.hasJetpackPlugin,
		isDynamicAddress: state.possibleDynamicSiteUrlDetected,
		x: formatSiteAddress( state.currentUrl ),
		z: formatSiteAddress( state.wpcomHomeUrl ),
	};
	const flow = useIdentityCrisisFlow( ctx, actions.clearError );
	// The site is no longer in Safe Mode, so the questions no longer apply. Resolved wins: the site is connected again.
	let finalView: 'migrated' | 'resolved' | 'disconnected' | null = null;
	if ( actions.isMigrated ) {
		finalView = 'migrated';
	} else if ( actions.isResolved || state.isResolved === true ) {
		finalView = 'resolved';
	} else if ( actions.isDisconnected || state.isDisconnected === true ) {
		finalView = 'disconnected';
	}
	// The view replaces the focused button, so move focus to its own.
	const finalViewRef = useRef< HTMLDivElement >( null );
	const previousFinalView = useRef( finalView );
	useEffect( () => {
		if ( finalView && finalView !== previousFinalView.current ) {
			finalViewRef.current?.querySelector( 'button' )?.focus();
		}
		previousFinalView.current = finalView;
	}, [ finalView ] );

	// Focus the new question, statement or result when the step changes, but not on the first render.
	const legendRef = useRef< HTMLLegendElement >( null );
	const headingRef = useRef< HTMLHeadingElement >( null );
	const stepKey = `${ flow.state.step }:${ flow.state.history.length }`;
	const previousStepKey = useRef( stepKey );
	useEffect( () => {
		if ( previousStepKey.current !== stepKey ) {
			previousStepKey.current = stepKey;
			( legendRef.current ?? headingRef.current )?.focus();
		}
	}, [ stepKey ] );

	const runAction = useCallback(
		async ( action: IdentityCrisisAction ) => {
			const path: IdentityCrisisActionPath = {
				entry: flow.state.entry,
				path: getPath( flow.state, ctx ),
			};
			switch ( action ) {
				case 'migrate':
					if ( await actions.migrate( path ) ) {
						onActionSuccess( { action: 'migrate' } );
					}
					return;
				case 'start-fresh': {
					const connectUrl = await actions.startFresh( path );
					if ( connectUrl ) {
						onActionSuccess( { action: 'start-fresh', connectUrl } );
					}
					return;
				}
				case 'confirm-safe-mode':
					if ( await actions.confirmSafeMode( path ) ) {
						onActionSuccess( { action: 'confirm-safe-mode' } );
					}
					return;
				default: {
					const unhandled: never = action;
					return unhandled;
				}
			}
		},
		[ flow.state, ctx, actions, onActionSuccess ]
	);

	const retryStartFresh = useCallback( () => runAction( 'start-fresh' ), [ runAction ] );

	const step = flow.state.step;
	const onContinue = useCallback( async () => {
		if ( isResultStep( step ) ) {
			await runAction( getResultAction( step ) );
			return;
		}
		const option = flow.selected;
		if ( ! option ) {
			return;
		}
		if ( 'next' in option ) {
			flow.next();
			return;
		}
		await runAction( option.action );
	}, [ step, flow, runAction ] );

	const addresses = (
		<IdentityCrisisAddresses
			wpcomHomeUrl={ state.wpcomHomeUrl }
			currentUrl={ state.currentUrl }
			isStore={ ctx.isStore }
		/>
	);

	if ( finalView === 'migrated' ) {
		return (
			<IdentityCrisisLayout
				logoUrl={ state.logoUrl }
				showHeader={ showHeader }
				hostActions={ hostActions }
			>
				{ addresses }
				<div ref={ finalViewRef }>
					<IdentityCrisisMigrated
						wpcomHomeUrl={ state.wpcomHomeUrl }
						currentUrl={ state.currentUrl }
						onDone={ onMigratedDone }
					/>
				</div>
			</IdentityCrisisLayout>
		);
	}

	const isBusy = actions.busyAction !== null;

	if ( finalView === 'resolved' ) {
		return (
			<IdentityCrisisLayout
				logoUrl={ state.logoUrl }
				showHeader={ showHeader }
				heading={ __( 'Jetpack Connection is no longer in Safe Mode', 'jetpack-connection-js' ) }
			>
				<Stack direction="column" gap="md" ref={ finalViewRef }>
					<IdentityCrisisErrorNotice error={ RESOLVED_ERROR } />
					<StepActions
						action={ { button: __( 'Reload', 'jetpack-connection-js' ) } }
						isBusy={ false }
						hasError={ false }
						canGoBack={ false }
						onContinue={ reloadPage }
						onBack={ flow.back }
					/>
				</Stack>
			</IdentityCrisisLayout>
		);
	}

	if ( finalView === 'disconnected' ) {
		return (
			// No host actions: Disconnect and the like no longer apply.
			<IdentityCrisisLayout
				logoUrl={ state.logoUrl }
				showHeader={ showHeader }
				heading={ __( 'Jetpack Connection is disconnected', 'jetpack-connection-js' ) }
			>
				<Stack direction="column" gap="md" ref={ finalViewRef }>
					{ /* Hidden while retrying, so a repeated failure is announced again. */ }
					{ ! isBusy && (
						<IdentityCrisisErrorNotice error={ actions.error ?? DISCONNECTED_ERROR } />
					) }
					<StepActions
						action={ getOptionCopy( 'fresh', copy ) }
						isBusy={ isBusy }
						hasError
						canGoBack={ false }
						onContinue={ retryStartFresh }
						onBack={ flow.back }
					/>
				</Stack>
			</IdentityCrisisLayout>
		);
	}

	const trail = (
		<GuideTrail
			items={ getGuideTrail( flow.state ) }
			copy={ copy }
			disabled={ isBusy }
			onBackTo={ flow.backTo }
		/>
	);
	const isStagingHome = flow.isFirstView && ctx.isDevelopmentSite;
	const footer = (
		<StepFooter
			entry={ flow.state.entry }
			offerGuide={ ! isStagingHome }
			disabled={ isBusy }
			onOpenGuide={ flow.openGuide }
			onLater={ flow.later }
		/>
	);

	let stepView: ReactNode;
	let actionCopy: ActionCopy | null;
	if ( isGuideStep( step ) ) {
		stepView = (
			<GuideStep
				step={ step }
				copy={ copy }
				facts={ getGuideFactLines( copy, ctx.isDevelopmentSite ) }
				openUrl={ getSiteUrl( state.wpcomHomeUrl ) }
				trail={ trail }
				onAnswer={ flow.answer }
				isBackToStart={ flow.state.history.length === 1 }
				onBack={ flow.back }
				headingRef={ headingRef }
			/>
		);
		actionCopy = null;
	} else if ( isResultStep( step ) ) {
		const result = getResultCopy( step, copy );
		stepView = <ResultStep result={ result } copy={ copy } headingRef={ headingRef } />;
		actionCopy = result;
	} else if ( isConcluded( flow.state ) && flow.selected ) {
		const conclusion = getConclusionCopy( flow.selected.id, copy );
		stepView = <ResultStep result={ conclusion } copy={ copy } headingRef={ headingRef } />;
		actionCopy = conclusion;
	} else {
		stepView = (
			<ChoiceStep
				step={ step }
				options={ getOptions( step, ctx ) }
				pick={ flow.state.pick }
				copy={ copy }
				disabled={ isBusy }
				onPick={ flow.pick }
				legendRef={ legendRef }
			/>
		);
		actionCopy = flow.selected ? getOptionCopy( flow.selected.id, copy ) : null;
	}

	return (
		<IdentityCrisisLayout
			logoUrl={ state.logoUrl }
			showHeader={ showHeader }
			hostActions={ hostActions }
			isBusy={ isBusy }
		>
			{ addresses }
			{ flow.isFirstView && (
				<Intro copy={ copy } plugins={ plugins } logos={ state.pluginLogos } />
			) }
			{ isStagingHome && (
				<Notice.Root intent="info">
					<Notice.Description>{ getStagingNote( copy ) }</Notice.Description>
					<Notice.Actions>
						<TextButton onClick={ flow.openGuide } disabled={ isBusy }>
							{ getStagingGuideText() }
						</TextButton>
					</Notice.Actions>
				</Notice.Root>
			) }
			{ flow.isFirstView && state.isSafeModeConfirmed && (
				<Notice.Root>
					<Notice.Description>{ getConfirmedNote() }</Notice.Description>
				</Notice.Root>
			) }
			<Stack direction="column" gap="md">
				{ ! isGuideStep( step ) && trail }
				{ stepView }
				{ isGuideStep( step ) ? (
					footer
				) : (
					<>
						<IdentityCrisisErrorNotice error={ actions.error } />
						<StepActions
							action={ actionCopy }
							isBusy={ isBusy }
							hasError={ actions.error !== null }
							canGoBack={ flow.state.history.length > 0 }
							onContinue={ onContinue }
							onBack={ flow.back }
							// A result ends the path, so it offers no way into or out of the guide.
							footer={ isResultStep( step ) ? null : footer }
						/>
					</>
				) }
			</Stack>
		</IdentityCrisisLayout>
	);
}

/**
 * The Safe Mode screen: questions that lead to the right fix, or a note for users who cannot fix it.
 * Reads the Safe Mode state from the connection store; renders nothing outside Safe Mode.
 *
 * @param {IdentityCrisisProps} props - Component props.
 * @return {ReactNode} The screen.
 */
export default function IdentityCrisis( props: IdentityCrisisProps ): ReactNode {
	const { state, plugins } = useIdentityCrisisState();
	if ( ! state ) {
		return null;
	}

	if ( ! state.canResolve ) {
		return (
			<IdentityCrisisLayout showHeader={ props.showHeader ?? true }>
				<IdentityCrisisNonAdmin isStore={ hasWooPlugin( plugins ) } onDismiss={ props.onDismiss } />
			</IdentityCrisisLayout>
		);
	}

	return <IdentityCrisisResolver { ...props } state={ state } plugins={ plugins } />;
}
