import { Card, CardHeader, CardBody, Icon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import PluginActionButton from './plugin-action-button';
import './integration-card.scss';

const IntegrationCard = ( {
	title,
	description,
	icon = 'admin-plugins', // Default to admin-plugins icon if none provided
	isExpanded,
	onToggle,
	children,
	pluginInfo,
} ) => {
	const showPluginAction = pluginInfo && ( ! pluginInfo.isInstalled || ! pluginInfo.isActive );

	return (
		<Card className="integration-card">
			<CardHeader onClick={ onToggle } className="integration-card__header">
				<div className="integration-card__header-content">
					<div className="integration-card__header-main">
						<Icon icon={ icon } className="integration-card__service-icon" size={ 30 } />
						<div className="integration-card__title-section">
							<div className="integration-card__title-row">
								<h3 className="integration-card__title">{ title }</h3>
								{ showPluginAction && (
									<span className="integration-card__plugin-badge">
										{ __( 'Plugin', 'jetpack-forms' ) }
									</span>
								) }
							</div>
							{ description && (
								<span className="integration-card__description">{ description }</span>
							) }
						</div>
					</div>
					<div className="integration-card__header-actions">
						{ showPluginAction && (
							<div className="integration-card__button-container">
								<PluginActionButton
									pluginSlug={ pluginInfo.pluginSlug }
									pluginFile={ pluginInfo.pluginFile }
									isInstalled={ pluginInfo.isInstalled }
									onComplete={ pluginInfo.onComplete }
									trackingId={ pluginInfo.trackingId }
								/>
							</div>
						) }
						<Icon
							icon={ isExpanded ? 'arrow-up-alt2' : 'arrow-down-alt2' }
							className="integration-card__toggle-icon"
						/>
					</div>
				</div>
			</CardHeader>
			{ isExpanded && <CardBody>{ children }</CardBody> }
		</Card>
	);
};

export default IntegrationCard;
