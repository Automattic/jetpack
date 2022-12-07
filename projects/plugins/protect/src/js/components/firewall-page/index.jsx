import { Button, Col, Container, Text } from '@automattic/jetpack-components';
import { ExternalLink } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { arrowLeft } from '@wordpress/icons';
import { useCallback, useEffect, useState } from 'react';
import API from '../../api';
import { PLUGIN_SUPPORT_URL } from '../../constants';
import useAnalyticsTracks from '../../hooks/use-analytics-tracks';
import useProtectData from '../../hooks/use-protect-data';
import useWafData from '../../hooks/use-waf-data';
import { STORE_ID } from '../../state/store';
import AdminPage from '../admin-page';
import FirewallFooter from '../firewall-footer';
import ConnectedFirewallHeader from '../firewall-header';
import FormToggle from '../form-toggle';
import Notice from '../notice';
import Textarea from '../textarea';
import styles from './styles.module.scss';

const FirewallPage = () => {
	const notice = useSelect( select => select( STORE_ID ).getNotice() );
	const { config, isSeen, isEnabled, toggleWaf, toggleManualRules, updateConfig } = useWafData();
	const { hasRequiredPlan } = useProtectData();
	const { jetpackWafIpList, jetpackWafIpBlockList, jetpackWafIpAllowList } = config || {};
	const { setWafIsSeen, setNotice } = useDispatch( STORE_ID );

	const [ settings, setSettings ] = useState( {
		module_enabled: isEnabled,
		jetpack_waf_ip_list: jetpackWafIpList,
		jetpack_waf_ip_block_list: jetpackWafIpBlockList,
		jetpack_waf_ip_allow_list: jetpackWafIpAllowList,
	} );
	const [ settingsIsUpdating, setSettingsIsUpdating ] = useState( false );

	// Track view for Protect WAF page.
	useAnalyticsTracks( {
		pageViewEventName: 'protect_waf',
		pageViewEventProperties: {
			has_plan: hasRequiredPlan,
		},
	} );

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
			.catch( () => {
				setNotice( {
					type: 'error',
					message: errorMessage,
				} );
			} )
			.finally( () => setSettingsIsUpdating( false ) );
	}, [ settings, toggleWaf, setNotice, errorMessage ] );

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
										disabled={ settingsIsUpdating }
									/>
								</div>
								<div>
									<div className={ styles[ 'toggle-section-title' ] }>
										<Text variant="title-medium">
											{ __(
												"Protect your site with Jetpack's Web Application Firewall",
												'jetpack-protect'
											) }
										</Text>
									</div>
									<Text>
										{ __(
											'The Jetpack Firewall is a web application firewall designed to protect your WordPress site from malicious requests.',
											'jetpack-protect'
										) }
									</Text>
								</div>
							</div>
							{ isEnabled && (
								<>
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
								</>
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
