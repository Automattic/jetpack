import { Stack, Text } from '@wordpress/ui';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { formatSiteAddress } from '../../helpers/format-site-address';
import { hasJetpackPlugin, hasWooPlugin } from '../../helpers/site-words';
import useIdentityCrisisActions from '../../hooks/use-identity-crisis-actions';
import IdentityCrisisAddresses from './addresses';
import IdentityCrisisErrorNotice from './error-notice';
import ChoiceStep from './flow/choice-step';
import { getOptionCopy, getStagingNote } from './flow/copy';
import Intro from './flow/intro';
import StepActions from './flow/step-actions';
import { getOptions, getPath } from './flow/steps';
import useIdentityCrisisFlow from './flow/use-identity-crisis-flow';
import IdentityCrisisLayout from './layout';
import IdentityCrisisMigrated from './migrated';
import IdentityCrisisNonAdmin from './non-admin';
import styles from './styles.module.scss';
import useIdentityCrisisState from './use-identity-crisis-state';
import type { CopyContext } from './flow/copy';
import type { FlowContext } from './flow/steps';
import type { IdentityCrisisProps } from './types';
import type { ConnectedPlugin } from '../../helpers/site-words';
import type { IdentityCrisisActionPath } from '../../hooks/use-identity-crisis-actions/types';
import type { IdentityCrisisState } from '../../types';
import type { ReactNode } from 'react';

type ResolvableState = Extract< IdentityCrisisState, { canResolve: true } >;

interface ResolverProps extends IdentityCrisisProps {
	state: ResolvableState;
	plugins: ConnectedPlugin[];
}

/**
 * The questions that lead to a Safe Mode action, then the migrate-done view.
 *
 * @param {ResolverProps} props - Component props.
 * @return {ReactNode} The view.
 */
function IdentityCrisisResolver( {
	state,
	plugins,
	context,
	redirectUri,
	from,
	hostActions,
	onActionSuccess,
	onMigratedDone,
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
		x: formatSiteAddress( state.currentUrl ),
		z: formatSiteAddress( state.wpcomHomeUrl ),
	};
	const flow = useIdentityCrisisFlow( ctx, actions.clearError );

	// Focus the new question when the step changes, but not on the first render.
	const legendRef = useRef< HTMLDivElement >( null );
	const stepKey = `${ flow.state.step }:${ flow.state.history.length }`;
	const previousStepKey = useRef( stepKey );
	useEffect( () => {
		if ( previousStepKey.current !== stepKey ) {
			previousStepKey.current = stepKey;
			legendRef.current?.focus();
		}
	}, [ stepKey ] );

	const onContinue = useCallback( async () => {
		const option = flow.selected;
		if ( ! option ) {
			return;
		}
		if ( 'next' in option ) {
			flow.next();
			return;
		}
		const path: IdentityCrisisActionPath = {
			entry: flow.state.entry,
			path: getPath( flow.state, ctx ),
		};
		switch ( option.action ) {
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
				const unhandled: never = option.action;
				return unhandled;
			}
		}
	}, [ flow, ctx, actions, onActionSuccess ] );

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
				showHeader={ context !== 'connectors' }
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

	return (
		<IdentityCrisisLayout
			logoUrl={ state.logoUrl }
			showHeader={ context !== 'connectors' }
			hostActions={ hostActions }
		>
			{ addresses }
			{ flow.isFirstView && <Intro copy={ copy } plugins={ plugins } /> }
			{ flow.isFirstView && ctx.isDevelopmentSite && (
				<Text variant="body-md" render={ <p /> } className={ styles.note }>
					{ getStagingNote( copy ) }
				</Text>
			) }
			<Stack direction="column" gap="md">
				<ChoiceStep
					step={ flow.state.step }
					options={ getOptions( flow.state.step, ctx ) }
					pick={ flow.state.pick }
					copy={ copy }
					disabled={ isBusy }
					onPick={ flow.pick }
					legendRef={ legendRef }
				/>
				<IdentityCrisisErrorNotice error={ actions.error } />
				<StepActions
					selected={ flow.selected ? getOptionCopy( flow.selected.id, copy ) : null }
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
			<IdentityCrisisLayout showHeader={ props.context !== 'connectors' }>
				<IdentityCrisisNonAdmin isStore={ hasWooPlugin( plugins ) } onDismiss={ props.onDismiss } />
			</IdentityCrisisLayout>
		);
	}

	return <IdentityCrisisResolver { ...props } state={ state } plugins={ plugins } />;
}
