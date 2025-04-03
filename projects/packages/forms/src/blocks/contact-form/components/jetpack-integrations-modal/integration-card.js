import { Card, CardHeader, CardBody, Icon, Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import PluginActionButton from './plugin-action-button';
import './integration-card.scss';

const IntegrationCard = ( {
	title,
	description,
	icon = 'admin-plugins',
	isExpanded,
	onToggle,
	children,
	data,
	installDescription,
	activateDescription,
} ) => {
	const showPluginAction = data && ( ! data.isInstalled || ! data.isActive );

	const renderContent = () => {
		if ( ! data ) {
			return <Spinner />;
		}

		if ( ! data.isInstalled ) {
			return (
				<div>
					<p>{ installDescription }</p>
					<PluginActionButton { ...data } />
				</div>
			);
		}

		if ( ! data.isActive ) {
			return (
				<div>
					<p>{ activateDescription }</p>
					<PluginActionButton { ...data } />
				</div>
			);
		}

		return children;
	};

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
								<PluginActionButton { ...data } />
							</div>
						) }
						<Icon
							icon={ isExpanded ? 'arrow-up-alt2' : 'arrow-down-alt2' }
							className="integration-card__toggle-icon"
						/>
					</div>
				</div>
			</CardHeader>
			{ isExpanded && <CardBody>{ renderContent() }</CardBody> }
		</Card>
	);
};

export default IntegrationCard;
