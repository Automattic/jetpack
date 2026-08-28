import { Spinner } from '@wordpress/components';
import { useGateState } from '../../hooks/use-gate-state';
import CapabilitiesErrorScreen from './capabilities-error';
import NoBackupPlanScreen from './no-backup-plan';
import NotConnectedScreen from './not-connected';
import SecondaryAdminScreen from './secondary-admin';
import './style.scss';
import type { ReactNode } from 'react';

type Props = {
	children: ReactNode;
};

/**
 * Capability + connection gate that wraps the modernized dashboard body.
 *
 * One screen per non-ready verdict from `useGateState`, which owns the
 * decision itself — and which `<BackupNowButton>` also reads, because it
 * renders above this gate rather than inside it.
 *
 * @param props          - Component props.
 * @param props.children - The dashboard body to render when all gates pass.
 * @return The matching fallback screen, or `children`.
 */
export default function Gates( { children }: Props ) {
	const gate = useGateState();

	if ( gate.status === 'not-connected' ) {
		return <NotConnectedScreen />;
	}

	if ( gate.status === 'secondary-admin' ) {
		return <SecondaryAdminScreen />;
	}

	if ( gate.status === 'loading' ) {
		return (
			<div className="jpb-gates__skeleton">
				<Spinner />
			</div>
		);
	}

	if ( gate.status === 'error' ) {
		return (
			<CapabilitiesErrorScreen
				error={ gate.error }
				onRetry={ gate.onRetry }
				isRetrying={ gate.isRetrying }
			/>
		);
	}

	if ( gate.status === 'no-plan' ) {
		return <NoBackupPlanScreen />;
	}

	return <>{ children }</>;
}
