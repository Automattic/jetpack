import { CardHeader, Icon } from '@wordpress/components';
import PluginActionButton from './plugin-action-button';

const IntegrationCardHeader = ( {
	title,
	description,
	icon,
	isExpanded,
	onToggle,
	cardData = {},
} ) => {
	const { isInstalled, isActive, isConnected, type } = cardData;
	const showPluginAction = type === 'plugin' && ( ! isInstalled || ! isActive );
	const showConnectedBadge = isActive && isConnected;

	return (
		<CardHeader onClick={ onToggle } className="integration-card__header">
			<div className="integration-card__header-content">
				<div className="integration-card__header-main">
					<Icon icon={ icon } className="integration-card__service-icon" size={ 30 } />
					<div className="integration-card__title-section">
						<div className="integration-card__title-row">
							<h3 className="integration-card__title">{ title }</h3>
							{ showPluginAction && <span className="integration-card__plugin-badge">Plugin</span> }
							{ showConnectedBadge && (
								<span className="integration-card__connected-badge">
									<Icon icon="yes-alt" size={ 16 } />
									Connected
								</span>
							) }
						</div>
						{ description && (
							<span className="integration-card__description">{ description }</span>
						) }
					</div>
				</div>
				<div className="integration-card__actions">
					{ showPluginAction && (
						<PluginActionButton
							slug={ cardData.slug }
							pluginFile={ cardData.pluginFile }
							isInstalled={ isInstalled }
							refreshStatus={ cardData.refreshStatus }
							trackEventName={ cardData.trackEventName }
						/>
					) }
					<Icon
						icon={ isExpanded ? 'arrow-up-alt2' : 'arrow-down-alt2' }
						className="integration-card__toggle-icon"
					/>
				</div>
			</div>
		</CardHeader>
	);
};

export default IntegrationCardHeader;
