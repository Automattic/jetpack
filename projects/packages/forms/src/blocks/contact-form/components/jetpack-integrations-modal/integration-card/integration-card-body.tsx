/**
 * External dependencies
 */
import { CardBody, Spinner } from '@wordpress/components';
/**
 * Types
 */
import type { IntegrationCard as IntegrationCardType } from '../../../../../types/index.ts';

type IntegrationCardBodyProps = {
	isExpanded: boolean;
	children?: React.ReactNode;
	integrationCard: IntegrationCardType;
};

const IntegrationCardBody = ( {
	isExpanded,
	children,
	integrationCard,
}: IntegrationCardBodyProps ) => {
	if ( ! isExpanded ) {
		return null;
	}

	const {
		notInstalledMessage,
		notActivatedMessage,
		isInstalled,
		isActive,
		isLoading,
		type,
		__isPartial,
	} = integrationCard;

	const isPlugin = type === 'plugin';
	const isService = type === 'service';

	// Only show status messages when we have full data
	const showPluginInstallMessage = ! __isPartial && isPlugin && ! isInstalled;
	const showPluginActivateMessage = ! __isPartial && isPlugin && isInstalled && ! isActive;
	const showContent = ! __isPartial && ( ( isPlugin && isInstalled && isActive ) || isService );

	if ( isLoading ) {
		return (
			<CardBody>
				<Spinner />
			</CardBody>
		);
	}

	return (
		<CardBody>
			{ showPluginInstallMessage && (
				<p className="integration-card__description">{ notInstalledMessage }</p>
			) }
			{ showPluginActivateMessage && (
				<p className="integration-card__description">{ notActivatedMessage }</p>
			) }
			{ showContent && children }
		</CardBody>
	);
};

export default IntegrationCardBody;
