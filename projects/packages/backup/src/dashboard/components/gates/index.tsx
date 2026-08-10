import { Spinner } from '@wordpress/components';
import { useCapabilities } from '../../hooks/use-capabilities';
import { useCanQueryWpcom, useConnection } from '../../hooks/use-connection';
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
 * Top-to-bottom decision tree, first match wins:
 * not-connected → secondary-admin → loading → capabilities-error → no-plan → children
 *
 * The connection checks come first because they're synchronous — they
 * read a global PHP emitted into the page. Gating them behind the
 * capabilities spinner would make a disconnected site sit through a
 * request (and its retry) that was never going to succeed.
 *
 * @param props          - Component props.
 * @param props.children - The dashboard body to render when all gates pass.
 * @return The matching fallback screen, or `children`.
 */
export default function Gates( { children }: Props ) {
	const connection = useConnection();
	// Hooks can't be called conditionally, so the connection state gates
	// the request itself rather than the call: without a user-level WPCOM
	// connection the bridge can only answer 403.
	const capabilities = useCapabilities( { enabled: useCanQueryWpcom() } );

	if ( ! connection.isFullyConnected ) {
		return <NotConnectedScreen />;
	}

	if ( connection.isSecondaryAdminNotConnected ) {
		return <SecondaryAdminScreen />;
	}

	if ( capabilities.isLoading ) {
		return (
			<div className="jpb-gates__skeleton">
				<Spinner />
			</div>
		);
	}

	// Must precede the plan check: a failed request also leaves `data`
	// undefined, and "we couldn't ask" must not be reported as "you
	// don't have a plan".
	if ( capabilities.error ) {
		return (
			<CapabilitiesErrorScreen error={ capabilities.error } onRetry={ capabilities.refetch } />
		);
	}

	if ( ! capabilities.data?.hasBackupPlan ) {
		return <NoBackupPlanScreen />;
	}

	return <>{ children }</>;
}
