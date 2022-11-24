import { Button, Col, Container, Text } from '@automattic/jetpack-components';
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { useCallback, useEffect, useState } from 'react';
import API from '../../api';
import useWafData from '../../hooks/use-waf-data';
import { STORE_ID } from '../../state/store';
import AdminPage from '../admin-page';
import FirewallFooter from '../firewall-footer';
import ConnectedFirewallHeader from '../firewall-header';
import FormToggle from '../form-toggle';
import Textarea from '../textarea';
import styles from './styles.module.scss';

const FirewallPage = () => {
	const {
		config,
		isSeen,
		isEnabled,
		isLoading,
		toggleWaf,
		toggleManualRules,
		updateConfig,
	} = useWafData();
	const { jetpackWafIpList, jetpackWafIpBlockList, jetpackWafIpAllowList } = config || {};
	const { setWafIsSeen } = useDispatch( STORE_ID );

	const [ settings, setSettings ] = useState( {
		module_enabled: isEnabled,
		jetpack_waf_ip_list: jetpackWafIpList,
		jetpack_waf_ip_block_list: jetpackWafIpBlockList,
		jetpack_waf_ip_allow_list: jetpackWafIpAllowList,
	} );

	const saveChanges = useCallback( () => {
		updateConfig( settings );
	}, [ settings, updateConfig ] );

	const handleChange = useCallback(
		event => {
			const { value, id } = event.target;
			setSettings( { ...settings, [ id ]: value } );
		},
		[ settings, setSettings ]
	);

	const handleEnabledChange = useCallback( () => {
		setSettings( { ...settings, module_enabled: ! settings.module_enabled } );
		toggleWaf();
	}, [ settings, toggleWaf ] );

	const handleManualRulesChange = useCallback( () => {
		setSettings( { ...settings, jetpack_waf_ip_list: ! settings.jetpack_waf_ip_list } );
		toggleManualRules();
	}, [ settings, toggleManualRules ] );

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
			<ConnectedFirewallHeader />
			<Container className={ styles.container } horizontalSpacing={ 8 }>
				<Col>
					<div className={ styles[ 'toggle-section' ] }>
						<div>
							<FormToggle
								checked={ settings.module_enabled }
								onChange={ handleEnabledChange }
								disabled={ isLoading }
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
										disabled={ isLoading }
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
											disabled={ isLoading }
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
											disabled={ isLoading }
										/>
									</div>
									<Button onClick={ saveChanges } isLoading={ isLoading } disabled={ isLoading }>
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
