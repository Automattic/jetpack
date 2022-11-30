import {
	Button,
	Col,
	Container,
	Text,
	ContextualUpgradeTrigger,
} from '@automattic/jetpack-components';
import { useProductCheckoutWorkflow } from '@automattic/jetpack-connection';
import { ExternalLink, Popover } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Icon, arrowLeft, closeSmall } from '@wordpress/icons';
import { useCallback, useEffect, useState } from 'react';
import API from '../../api';
import { PLUGIN_SUPPORT_URL } from '../../constants';
import useAnalyticsTracks from '../../hooks/use-analytics-tracks';
import useProtectData from '../../hooks/use-protect-data';
import useWafData from '../../hooks/use-waf-data';
import { STORE_ID } from '../../state/store';
import AdminPage, { JETPACK_SCAN } from '../admin-page';
import FirewallFooter from '../firewall-footer';
import ConnectedFirewallHeader from '../firewall-header';
import FormToggle from '../form-toggle';
import Notice from '../notice';
import Textarea from '../textarea';
import styles from './styles.module.scss';

const FirewallPage = () => {
	const notice = useSelect( select => select( STORE_ID ).getNotice() );
	const {
		config,
		isSeen,
		upgradeIsSeen,
		isEnabled,
		toggleWaf,
		toggleManualRules,
		updateConfig,
	} = useWafData();
	const { jetpackWafIpList, jetpackWafIpBlockList, jetpackWafIpAllowList } = config || {};
	const { setWafIsSeen, setWafUpgradeIsSeen, setNotice } = useDispatch( STORE_ID );

	const [ settings, setSettings ] = useState( {
		module_enabled: isEnabled,
		jetpack_waf_ip_list: jetpackWafIpList,
		jetpack_waf_ip_block_list: jetpackWafIpBlockList,
		jetpack_waf_ip_allow_list: jetpackWafIpAllowList,
	} );
	const [ settingsIsUpdating, setSettingsIsUpdating ] = useState( false );

	const successNoticeDuration = 5000;

	const errorMessage = createInterpolateElement(
		__(
			'An error ocurred. Please try again or <supportLink>contact support</supportLink>.',
			'jetpack-protect'
		),
		{
			supportLink: <ExternalLink href={ PLUGIN_SUPPORT_URL } />,
		}
	);

	const saveChanges = useCallback( () => {
		setSettingsIsUpdating( true );
		updateConfig( settings )
			.then( () =>
				setNotice( {
					type: 'success',
					duration: successNoticeDuration,
					message: __( 'Changes saved.', 'jetpack-protect' ),
				} )
			)
			.catch( () => {
				setNotice( {
					type: 'error',
					message: errorMessage,
				} );
			} )
			.finally( () => setSettingsIsUpdating( false ) );
	}, [ settings, updateConfig, setNotice, errorMessage ] );

	const handleChange = useCallback(
		event => {
			const { value, id } = event.target;
			setSettings( { ...settings, [ id ]: value } );
		},
		[ settings, setSettings ]
	);

	const handleEnabledChange = useCallback( () => {
		const newWafStatus = ! settings.module_enabled;
		setSettingsIsUpdating( true );
		setSettings( { ...settings, module_enabled: newWafStatus } );
		toggleWaf()
			.then( () =>
				setNotice( {
					type: 'success',
					duration: successNoticeDuration,
					message: newWafStatus
						? __( `Firewall is active.`, 'jetpack-protect' )
						: __(
								`Firewall is disabled.`,
								'jetpack-protect',
								/* dummy arg to avoid bad minification */ 0
						  ),
				} )
			)
			.then( () => {
				if ( ! upgradeIsSeen ) {
					setWafUpgradeIsSeen( true );
					API.wafUpgradeSeen();
				}
			} )
			.catch( () => {
				setNotice( {
					type: 'error',
					message: errorMessage,
				} );
			} )
			.finally( () => setSettingsIsUpdating( false ) );
	}, [ settings, toggleWaf, setNotice, errorMessage, upgradeIsSeen, setWafUpgradeIsSeen ] );

	const handleManualRulesChange = useCallback( () => {
		const newManualRulesStatus = ! settings.jetpack_waf_ip_list;
		setSettingsIsUpdating( true );
		setSettings( { ...settings, jetpack_waf_ip_list: newManualRulesStatus } );
		toggleManualRules()
			.then( () =>
				setNotice( {
					type: 'success',
					duration: successNoticeDuration,
					message: newManualRulesStatus
						? __( 'Manual rules are active.', 'jetpack-protect' )
						: __(
								'Manual rules are disabled.',
								'jetpack-protect',
								/* dummy arg to avoid bad minification */ 0
						  ),
				} )
			)
			.catch( () => {
				setNotice( {
					type: 'error',
					message: errorMessage,
				} );
			} )
			.finally( () => setSettingsIsUpdating( false ) );
	}, [ settings, toggleManualRules, setNotice, errorMessage ] );

	/**
	 * Sync state.settings with application state WAF config
	 */
	useEffect( () => {
		setSettings( {
			module_enabled: isEnabled,
			jetpack_waf_ip_list: jetpackWafIpList,
			jetpack_waf_ip_block_list: jetpackWafIpBlockList,
			jetpack_waf_ip_allow_list: jetpackWafIpAllowList,
		} );
	}, [ isEnabled, jetpackWafIpList, jetpackWafIpBlockList, jetpackWafIpAllowList ] );

	/**
	 * "WAF Seen" useEffect()
	 */
	useEffect( () => {
		if ( isSeen ) {
			return;
		}

		// remove the "new" badge immediately
		setWafIsSeen( true );

		// update the meta value in the background
		API.wafSeen();
	}, [ isSeen, setWafIsSeen ] );

	const [ showManualRules, setShowManualRules ] = useState( false );

	const handleShowManualRulesClick = useCallback( () => {
		if ( showManualRules ) {
			return setShowManualRules( false );
		}
		setShowManualRules( true );
	}, [ showManualRules, setShowManualRules ] );

	const { adminUrl } = window.jetpackProtectInitialState || {};
	const firewallUrl = adminUrl + '#/firewall';

	const { run } = useProductCheckoutWorkflow( {
		productSlug: JETPACK_SCAN,
		redirectUrl: firewallUrl,
	} );

	const { recordEventHandler } = useAnalyticsTracks();
	const getScan = recordEventHandler( 'jetpack_protect_waf_page_get_scan_link_click', run );

	const { hasRequiredPlan } = useProtectData();

	const handleClosePopoverClick = useCallback( () => {
		setWafUpgradeIsSeen( true );
		API.wafUpgradeSeen();
	}, [ setWafUpgradeIsSeen ] );

	const [ dismissPopover, setDismissPopover ] = useState( false );

	const handleDismissPopoverClick = useCallback( () => {
		setDismissPopover( true );
	}, [] );

	return (
		<AdminPage>
			{ notice.message && <Notice floating={ true } dismissable={ true } { ...notice } /> }
			<ConnectedFirewallHeader />
			<Container className={ styles.container } horizontalSpacing={ 8 }>
				<Col>
					{ ! showManualRules ? (
						<div className={ styles[ 'toggle-wrapper' ] }>
							<div className={ styles[ 'toggle-section' ] }>
								<div>
									<FormToggle
										checked={ settings.module_enabled }
										onChange={ handleEnabledChange }
										disabled={ ! hasRequiredPlan || settingsIsUpdating }
									/>
									{ ! dismissPopover && hasRequiredPlan && upgradeIsSeen === false && (
										<Popover noArrow={ false } offset={ 8 } position={ 'top right' }>
											<div className={ styles.popover }>
												<div className={ styles[ 'popover-header' ] }>
													<Text className={ styles[ 'popover-title' ] } variant={ 'title-small' }>
														{ __( 'Thanks for upgrading!', 'jetpack-protect' ) }
													</Text>
													<Button variant={ 'icon' }>
														<Icon
															onClick={ handleDismissPopoverClick }
															icon={ closeSmall }
															size={ 24 }
															aria-label={ __( 'Close Window', 'jetpack-protect' ) }
														/>
													</Button>
												</div>
												<Text
													className={ styles[ 'popover-description' ] }
													variant={ 'body' }
													mt={ 2 }
													mb={ 3 }
												>
													{ __(
														'Turn on Jetpack Firewall to automatically protect your site with the latest security rules.',
														'jetpack-protect'
													) }
												</Text>
												<div className={ styles[ 'popover-footer' ] }>
													<Button onClick={ handleClosePopoverClick }>
														{ __( 'Got it', 'jetpack-protect' ) }
													</Button>
												</div>
											</div>
										</Popover>
									) }
								</div>
								<div>
									<div className={ styles[ 'toggle-section-title' ] }>
										<Text
											className={ ! hasRequiredPlan ? styles.disabled : null }
											variant="title-medium"
										>
											{ __( 'Enable automatic rules', 'jetpack-protect' ) }
										</Text>
										{ hasRequiredPlan && upgradeIsSeen === false && (
											<span className={ styles.badge }>
												{ __( 'NOW AVAILABLE', 'jetpack-protect' ) }
											</span>
										) }
									</div>
									<Text className={ ! hasRequiredPlan ? styles.disabled : null }>
										{ __(
											'Protect your site against untrusted traffic sources with automatic security rules.',
											'jetpack-protect'
										) }
									</Text>
								</div>
							</div>
							<div className={ styles[ 'upgrade-trigger-section' ] }>
								{ ! hasRequiredPlan && (
									<ContextualUpgradeTrigger
										className={ styles[ 'upgrade-trigger' ] }
										description={ __( 'Setup automatic rules with one click', 'jetpack-protect' ) }
										cta={ __( 'Upgrade to enable automatic rules', 'jetpack-protect' ) }
										onClick={ getScan }
									/>
								) }
							</div>
							<div className={ styles[ 'toggle-section' ] }>
								<div>
									<FormToggle
										id="jetpack_waf_ip_list"
										checked={ Boolean( settings.jetpack_waf_ip_list ) }
										onChange={ handleManualRulesChange }
										disabled={ settingsIsUpdating }
									/>
								</div>
								<div>
									<Text variant="title-medium" mb={ 2 }>
										{ __( 'Enable manual rules', 'jetpack-protect' ) }
									</Text>
									<Text>
										{ __(
											'Allows you to add manual rules to block or allow traffic from specific IPs.',
											'jetpack-protect'
										) }
									</Text>
								</div>
							</div>
							{ jetpackWafIpList && (
								<div className={ styles[ 'edit-manual-rules-section' ] }>
									<Text variant={ 'body-small' } mt={ 2 }>
										{ /* // TO DO: Update or remove until ready for this */ }
										{ '' === jetpackWafIpAllowList &&
											'' === jetpackWafIpBlockList &&
											__( 'No manual rules are being applied.', 'jetpack-protect' ) }
									</Text>
									<Button variant={ 'link' }>
										<Text variant={ 'body-small' } onClick={ handleShowManualRulesClick }>
											{ __( 'Edit manual rules', 'jetpack-protect' ) }
										</Text>
									</Button>
								</div>
							) }
						</div>
					) : (
						<div className={ styles[ 'manual-rule-wrapper' ] }>
							<Button
								className={ styles[ 'go-back-button' ] }
								variant={ 'icon' }
								icon={ arrowLeft }
								onClick={ handleShowManualRulesClick }
							>
								<Text>{ __( 'Go back', 'jetpack-protect' ) }</Text>
							</Button>
							<Text variant="title-medium" mt={ 4 } mb={ 2 }>
								{ __( 'Manual rules', 'jetpack-protect' ) }
							</Text>
							<Text mb={ 4 }>
								{ __(
									'Add manual rules for what IP traffic the Jetpack Firewall should block or allow.',
									'jetpack-protect'
								) }
							</Text>
							<div className={ styles[ 'manual-rule-section' ] }>
								<Textarea
									id="jetpack_waf_ip_block_list"
									label={ __( 'Blocked IP addresses', 'jetpack-protect' ) }
									placeholder={ __( 'Example:', 'jetpack-protect' ) + '\n12.12.12.1\n12.12.12.2' }
									rows={ 3 }
									value={ settings.jetpack_waf_ip_block_list }
									onChange={ handleChange }
									disabled={ settingsIsUpdating }
								/>
							</div>
							<div className={ styles[ 'manual-rule-section' ] }>
								<Textarea
									id="jetpack_waf_ip_allow_list"
									label={ __( 'Always allowed IP addresses', 'jetpack-protect' ) }
									placeholder={ __( 'Example:', 'jetpack-protect' ) + '\n12.12.12.1\n12.12.12.2' }
									rows={ 3 }
									value={ settings.jetpack_waf_ip_allow_list }
									onChange={ handleChange }
									disabled={ settingsIsUpdating }
								/>
							</div>
							<Button
								onClick={ saveChanges }
								isLoading={ settingsIsUpdating }
								disabled={ settingsIsUpdating }
							>
								{ __( 'Save changes', 'jetpack-protect' ) }
							</Button>
						</div>
					) }
				</Col>
			</Container>
			<FirewallFooter />
		</AdminPage>
	);
};

export default FirewallPage;
