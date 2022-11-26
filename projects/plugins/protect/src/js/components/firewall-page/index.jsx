import { Button, Col, Container, Text } from '@automattic/jetpack-components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { useCallback, useEffect, useState } from 'react';
import API from '../../api';
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
	const { jetpackWafIpList, jetpackWafIpBlockList, jetpackWafIpAllowList } = config || {};
	const { setWafIsSeen, setNotice } = useDispatch( STORE_ID );

	const [ settings, setSettings ] = useState( {
		module_enabled: isEnabled,
		jetpack_waf_ip_list: jetpackWafIpList,
		jetpack_waf_ip_block_list: jetpackWafIpBlockList,
		jetpack_waf_ip_allow_list: jetpackWafIpAllowList,
	} );
	const [ settingsIsUpdating, setSettingsIsUpdating ] = useState( false );

	const successNoticeDuration = 5000;

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
					message: __(
						'An error ocurred. Please try again or contact support.',
						'jetpack-protect'
					),
				} );
			} )
			.finally( () => setSettingsIsUpdating( false ) );
	}, [ settings, updateConfig, setNotice ] );

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
						: __( `Firewall is disabled.`, 'jetpack-protect' ),
				} )
			)
			.catch( () => {
				setNotice( {
					type: 'error',
					message: __(
						'An error ocurred. Please try again or contact support.',
						'jetpack-protect'
					),
				} );
			} )
			.finally( () => setSettingsIsUpdating( false ) );
	}, [ settings, toggleWaf, setNotice ] );

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
						: __( 'Manual rules are disabled.', 'jetpack-protect' ),
				} )
			)
			.catch( () => {
				setNotice( {
					type: 'error',
					message: __(
						'An error ocurred. Please try again or contact support.',
						'jetpack-protect'
					),
				} );
			} )
			.finally( () => setSettingsIsUpdating( false ) );
	}, [ settings, toggleManualRules, setNotice ] );

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

	return (
		<AdminPage>
			{ notice.message && <Notice floating={ true } dismissable={ true } { ...notice } /> }
			<ConnectedFirewallHeader />
			<Container className={ styles.container } horizontalSpacing={ 8 }>
				<Col>
					<div className={ styles[ 'toggle-section' ] }>
						<div>
							<FormToggle
								checked={ settings.module_enabled }
								onChange={ handleEnabledChange }
								disabled={ settingsIsUpdating }
							/>
						</div>
						<div>
							<Text variant="title-medium" mb={ 2 }>
								{ __(
									"Protect your site with Jetpack's Web Application Firewall",
									'jetpack-protect'
								) }
							</Text>
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
											'Allows you to manually block or allow traffic from specific IPs.',
											'jetpack-protect'
										) }
									</Text>
								</div>
							</div>
							{ jetpackWafIpList && (
								<>
									<div className={ styles[ 'manual-rule-section' ] }>
										<Textarea
											id="jetpack_waf_ip_block_list"
											label={ __( 'Blocked IP addresses', 'jetpack-protect' ) }
											placeholder={
												__( 'Example:', 'jetpack-protect' ) + '\n12.12.12.1\n12.12.12.2'
											}
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
											placeholder={
												__( 'Example:', 'jetpack-protect' ) + '\n12.12.12.1\n12.12.12.2'
											}
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
								</>
							) }
						</>
					) }
				</Col>
			</Container>
			<FirewallFooter />
		</AdminPage>
	);
};

export default FirewallPage;
