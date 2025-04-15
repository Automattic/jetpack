import { CardHeader, Icon, ToggleControl, Tooltip } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { chevronDown, chevronUp } from '@wordpress/icons';
import PluginActionButton from './plugin-action-button';

const IntegrationCardHeader = ( {
	title,
	description,
	icon,
	isExpanded,
	onToggle,
	cardData = {},
	toggleTooltip,
} ) => {
	const {
		isInstalled,
		isActive,
		isConnected,
		type,
		showHeaderToggle,
		headerToggleValue,
		isHeaderToggleEnabled,
		onHeaderToggleChange,
	} = cardData;
	const showPluginAction = type === 'plugin' && ( ! isInstalled || ! isActive );
	const showConnectedBadge = isActive && isConnected;
	const disableFormText = __( 'Disable for this form', 'jetpack-forms' );
	const enableFormText = __( 'Enable for this form', 'jetpack-forms' );

	const getTooltipText = checked => {
		if ( toggleTooltip ) {
			return toggleTooltip;
		}

		if ( checked ) {
			return disableFormText;
		}

		return enableFormText;
	};

	const handleToggleChange = value => {
		if ( onHeaderToggleChange ) {
			onHeaderToggleChange( value );
		}
	};

	const handleHeaderClick = e => {
		// Without this, toggle click bubbles and opens/closes the card.
		if ( e.target.closest( '.components-form-toggle' ) ) {
			return;
		}
		onToggle( e );
	};

	return (
		<CardHeader onClick={ handleHeaderClick } className="integration-card__header">
			<div className="integration-card__header-content">
				<div className="integration-card__header-main">
					<div className="integration-card__service-icon-container">
						<Icon icon={ icon } className="integration-card__service-icon" size={ 30 } />
					</div>
					<div className="integration-card__title-section">
						<div className="integration-card__title-row">
							<h3 className="integration-card__title">{ title }</h3>
							{ showPluginAction && (
								<span className="integration-card__plugin-badge">
									{ __( 'Plugin', 'jetpack-forms' ) }
								</span>
							) }
							{ showConnectedBadge && (
								<span className="integration-card__connected-badge">
									<Icon icon="yes-alt" size={ 16 } />
									{ __( 'Connected', 'jetpack-forms' ) }
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
					{ ( isActive || isConnected ) && showHeaderToggle && (
						<Tooltip text={ getTooltipText( headerToggleValue ) }>
							<span className="integration-card__toggle-tooltip-wrapper">
								<ToggleControl
									checked={ headerToggleValue }
									onChange={ handleToggleChange }
									disabled={ ! isHeaderToggleEnabled }
								/>
							</span>
						</Tooltip>
					) }
					<Icon icon={ isExpanded ? chevronUp : chevronDown } />
				</div>
			</div>
		</CardHeader>
	);
};

export default IntegrationCardHeader;
