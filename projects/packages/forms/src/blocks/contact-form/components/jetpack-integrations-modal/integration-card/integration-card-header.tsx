/**
 * External dependencies
 */
import jetpackAnalytics from '@automattic/jetpack-analytics';
/**
 * Internal dependencies
 */
import {
	CardHeader,
	Icon,
	ToggleControl,
	Tooltip,
	__experimentalHStack as HStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { chevronDown, chevronUp } from '@wordpress/icons';
import PluginActionButton from './plugin-action-button';
/**
 * Types
 */
import type { IntegrationCardProps } from './index';

const IntegrationCardHeader = ( {
	title,
	description,
	icon,
	isExpanded,
	onToggle,
	cardData = {},
	toggleTooltip,
}: IntegrationCardProps ) => {
	const {
		isInstalled,
		isActive,
		isConnected,
		needsConnection,
		type,
		showHeaderToggle,
		headerToggleValue,
		isHeaderToggleEnabled,
		onHeaderToggleChange,
		toggleDisabledTooltip,
		setupBadge,
	} = cardData;
	const showPluginAction = type === 'plugin' && ( ! isInstalled || ! isActive );
	const showConnectedBadge = isConnected || ( isActive && ! needsConnection );
	const disableFormText = __( 'Disable for this form', 'jetpack-forms' );
	const enableFormText = __( 'Enable for this form', 'jetpack-forms' );

	const showPendingBadge = ! showPluginAction && ! isConnected && needsConnection;
	const pendingBadge = setupBadge || (
		<span className="integration-card__plugin-badge">
			{ __( 'Needs connection', 'jetpack-forms' ) }
		</span>
	);
	const installPluginActionLabel = __( 'Plugin needs install', 'jetpack-forms' );
	const activatePluginActionLabel = __( 'Plugin needs activation', 'jetpack-forms' );

	const getTooltipText = checked => {
		if ( toggleTooltip ) {
			return toggleTooltip;
		}

		if ( checked ) {
			return disableFormText;
		}

		return enableFormText;
	};

	const handleToggleChange = ( value: boolean ) => {
		jetpackAnalytics.tracks.recordEvent( 'jetpack_forms_integrations_card_toggle', {
			card: cardData.id,
			origin: 'block-editor',
			enabled: value,
		} );

		if ( onHeaderToggleChange ) {
			onHeaderToggleChange( value );
		}
	};

	const handleHeaderClick = ( e: React.MouseEvent< HTMLDivElement > ) => {
		// Without this, toggle click bubbles and opens/closes the card.
		if ( ( e.target as HTMLElement ).closest( '.components-form-toggle' ) ) {
			return;
		}

		onToggle();
	};

	return (
		<CardHeader onClick={ handleHeaderClick } className="integration-card__header">
			<div className="integration-card__header-content">
				<div className="integration-card__header-main">
					<div className="integration-card__service-icon-container">
						<Icon
							icon={ icon }
							className={ `integration-card__service-icon ${
								cardData.slug ? `integration-card__service-icon--${ cardData.slug }` : ''
							}` }
							size={ 30 }
						/>
					</div>
					<div className="integration-card__title-section">
						<div className="integration-card__title-row">
							<h3 className="integration-card__title">{ title }</h3>
							{ showPluginAction && (
								<span className="integration-card__plugin-badge">
									{ ! isInstalled && installPluginActionLabel }
									{ isInstalled && ! isActive && activatePluginActionLabel }
								</span>
							) }
							{ showConnectedBadge && (
								<span className="integration-card__connected-badge">
									<Icon icon="yes-alt" size={ 12 } />
									{ __( 'Enabled', 'jetpack-forms' ) }
								</span>
							) }
							{ showPendingBadge && <>{ pendingBadge }</> }
						</div>
						{ description && (
							<span className="integration-card__description">{ description }</span>
						) }
					</div>
				</div>
				<HStack spacing="3" alignment="center" justify="end" expanded={ false }>
					{ showPluginAction && (
						<PluginActionButton
							slug={ cardData.slug }
							pluginFile={ cardData.pluginFile }
							isInstalled={ isInstalled }
							refreshStatus={ cardData.refreshStatus }
							trackEventName={ cardData.trackEventName }
						/>
					) }
					{ ! showPluginAction && showHeaderToggle && (
						<Tooltip
							text={
								! isHeaderToggleEnabled && toggleDisabledTooltip
									? toggleDisabledTooltip
									: getTooltipText( headerToggleValue )
							}
						>
							<span className="integration-card__toggle-tooltip-wrapper">
								<ToggleControl
									checked={ headerToggleValue && ( isActive || isConnected ) }
									onChange={ handleToggleChange }
									disabled={ ! isHeaderToggleEnabled || ! ( isActive || isConnected ) }
									__nextHasNoMarginBottom={ true }
								/>
							</span>
						</Tooltip>
					) }
					<Icon icon={ isExpanded ? chevronUp : chevronDown } />
				</HStack>
			</div>
		</CardHeader>
	);
};

export default IntegrationCardHeader;
