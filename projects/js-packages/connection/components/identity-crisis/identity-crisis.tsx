import { __ } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { formatSiteAddress } from '../../helpers/format-site-address';
import { hasJetpackPlugin, hasWooPlugin } from '../../helpers/site-words';
import useIdentityCrisisActions from '../../hooks/use-identity-crisis-actions';
import IdentityCrisisAddresses from './addresses';
import IdentityCrisisErrorNotice from './error-notice';
import ChoiceStep from './flow/choice-step';
import { getConfirmedNote, getOptionCopy, getResultCopy, getStagingNote } from './flow/copy';
import Intro from './flow/intro';
import ResultStep from './flow/result-step';
import StepActions from './flow/step-actions';
import { getOptions, getPath, getResultAction, isChoiceStep } from './flow/steps';
import useIdentityCrisisFlow from './flow/use-identity-crisis-flow';
import IdentityCrisisLayout from './layout';
import IdentityCrisisMigrated from './migrated';
import { reloadPage } from './navigate';
import IdentityCrisisNonAdmin from './non-admin';
import { onIdentityCrisisActionSuccess } from './on-action-success';
import styles from './styles.module.scss';
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
 * The questions that lead to a Safe Mode action, then the migrate-done view.
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
	let finalView: 'resolved' | 'disconnected' | null = null;
	if ( actions.isResolved || state.isResolved === true ) {
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

	// Focus the new question or result when the step changes, but not on the first render.
	const legendRef = useRef< HTMLDivElement >( null );
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
		if ( ! isChoiceStep( step ) ) {
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

	if ( actions.isMigrated ) {
		return (
			<IdentityCrisisLayout
				logoUrl={ state.logoUrl }
				showHeader={ showHeader }
				hostActions={ hostActions }
			>
				{ addresses }
				<IdentityCrisisMigrated
					wpcomHomeUrl={ state.wpcomHomeUrl }
					currentUrl={ state.currentUrl }
					onDone={ onMigratedDone }
				/>
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

	let stepView: ReactNode;
	let actionCopy: ActionCopy | null;
	if ( isChoiceStep( step ) ) {
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
	} else {
		const result = getResultCopy( step, copy );
		stepView = <ResultStep copy={ result } headingRef={ headingRef } />;
		actionCopy = result;
	}

	return (
		<IdentityCrisisLayout
			logoUrl={ state.logoUrl }
			showHeader={ showHeader }
			hostActions={ hostActions }
		>
			{ addresses }
			{ flow.isFirstView && <Intro copy={ copy } plugins={ plugins } /> }
			{ flow.isFirstView && ctx.isDevelopmentSite && (
				<Text variant="body-md" render={ <p /> } className={ styles.note }>
					{ getStagingNote( copy ) }
				</Text>
			) }
			{ flow.isFirstView && state.isSafeModeConfirmed && (
				<Text variant="body-md" render={ <p /> } className={ styles.note }>
					{ getConfirmedNote() }
				</Text>
			) }
			<Stack direction="column" gap="md">
				{ stepView }
				<IdentityCrisisErrorNotice error={ actions.error } />
				<StepActions
					action={ actionCopy }
					isBusy={ isBusy }
					hasError={ actions.error !== null }
					canGoBack={ flow.state.history.length > 0 }
					onContinue={ onContinue }
					onBack={ flow.back }
				/>
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
