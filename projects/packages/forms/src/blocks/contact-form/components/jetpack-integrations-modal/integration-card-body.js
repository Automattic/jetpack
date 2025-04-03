import { CardBody, Spinner } from '@wordpress/components';
import PluginActionButton from './plugin-action-button';

const IntegrationCardBody = ( { isExpanded, children, cardData = {} } ) => {
	if ( ! isExpanded ) {
		return null;
	}

	const {
		pluginSlug = '',
		pluginFile = '',
		refreshStatus = () => {},
		trackEventName = '',
		notInstalledMessage = '',
		notActivatedMessage = '',
		isInstalled,
		isActive,
		isLoading = false,
	} = cardData;

	const renderContent = () => {
		// Loading state
		if ( isLoading ) {
			return <Spinner />;
		}

		// Not installed state
		if ( ! isInstalled && pluginSlug && pluginFile ) {
			return (
				<div>
					<p>{ notInstalledMessage }</p>
					<PluginActionButton
						pluginSlug={ pluginSlug }
						pluginFile={ pluginFile }
						isInstalled={ isInstalled }
						refreshStatus={ refreshStatus }
						trackEventName={ trackEventName }
					/>
				</div>
			);
		}

		// Not activated state
		if ( ! isActive && pluginSlug && pluginFile ) {
			return (
				<div>
					<p>{ notActivatedMessage }</p>
					<PluginActionButton
						pluginSlug={ pluginSlug }
						pluginFile={ pluginFile }
						isInstalled={ isInstalled }
						refreshStatus={ refreshStatus }
						trackEventName={ trackEventName }
					/>
				</div>
			);
		}

		// Default content when plugin is active
		if ( isInstalled && isActive ) {
			return children;
		}

		return null;
	};

	return <CardBody>{ renderContent() }</CardBody>;
};

export default IntegrationCardBody;
