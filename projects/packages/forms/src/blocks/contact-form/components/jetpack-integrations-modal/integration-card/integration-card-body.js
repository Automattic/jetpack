import { CardBody, Spinner } from '@wordpress/components';
import PluginActionButton from './plugin-action-button';

const IntegrationCardBody = ( { isExpanded, children, cardData = {} } ) => {
	if ( ! isExpanded ) {
		return null;
	}

	const {
		slug,
		pluginFile,
		refreshStatus,
		trackEventName,
		notInstalledMessage,
		notActivatedMessage,
		isInstalled,
		isActive,
		isLoading,
	} = cardData;

	const renderContent = () => {
		// Loading state
		if ( isLoading ) {
			return <Spinner />;
		}

		// Not installed state
		if ( ! isInstalled ) {
			return (
				<div>
					<p>{ notInstalledMessage }</p>
					<PluginActionButton
						slug={ slug }
						pluginFile={ pluginFile }
						isInstalled={ isInstalled }
						refreshStatus={ refreshStatus }
						trackEventName={ trackEventName }
					/>
				</div>
			);
		}

		// Not activated state
		if ( ! isActive ) {
			return (
				<div>
					<p>{ notActivatedMessage }</p>
					<PluginActionButton
						slug={ slug }
						pluginFile={ pluginFile }
						isInstalled={ isInstalled }
						refreshStatus={ refreshStatus }
						trackEventName={ trackEventName }
					/>
				</div>
			);
		}

		return children;
	};

	return <CardBody>{ renderContent() }</CardBody>;
};

export default IntegrationCardBody;
