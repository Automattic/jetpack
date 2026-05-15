import { Spinner } from '@wordpress/components';
import { useCapabilities } from '../../hooks/use-capabilities';
import { useConnection } from '../../hooks/use-connection';
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
 * loading → not-connected → secondary-admin → no-plan → children
 *
 * @param props          - Component props.
 * @param props.children - The dashboard body to render when all gates pass.
 * @return The matching fallback screen, or `children`.
 */
export default function Gates( { children }: Props ) {
	const connection = useConnection();
	const capabilities = useCapabilities();

	if ( ! connection.isLoaded || capabilities.isLoading ) {
		return (
			<div className="jpb-gates__skeleton">
				<Spinner />
			</div>
		);
	}

	if ( ! connection.isFullyConnected ) {
		return <NotConnectedScreen />;
	}

	if ( connection.isSecondaryAdminNotConnected ) {
		return <SecondaryAdminScreen />;
	}

	if ( ! capabilities.data?.hasBackupPlan ) {
		return <NoBackupPlanScreen />;
	}

	return <>{ children }</>;
}
