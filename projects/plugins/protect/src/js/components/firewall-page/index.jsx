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
	const { config, isSeen: wafSeen, isEnabled: wafIsEnabled, refreshWaf } = useWafData();
	const { jetpackWafIpList, jetpackWafIpBlockList, jetpackWafIpAllowList } = config || {};
	const { setWafIsSeen } = useDispatch( STORE_ID );

	const [ settings, setSettings ] = useState( {
		jetpack_waf_ip_list: jetpackWafIpList,
		jetpack_waf_ip_block_list: jetpackWafIpBlockList,
		jetpack_waf_ip_allow_list: jetpackWafIpAllowList,
	} );
	const [ settingsAreUpdating, setSettingsAreUpdating ] = useState( false );

	const toggleWaf = useCallback( () => {
		API.toggleWaf().finally( refreshWaf );
	}, [ refreshWaf ] );

	const toggleManualRules = useCallback( () => {
		setSettingsAreUpdating( true );
		API.updateWaf( { jetpack_waf_ip_list: ! jetpackWafIpList } )
			.then( refreshWaf )
			.finally( () => setSettingsAreUpdating( false ) );
	}, [ refreshWaf, jetpackWafIpList ] );

	const saveChanges = useCallback( () => {
		setSettingsAreUpdating( true );
		API.updateWaf( settings )
			.then( refreshWaf )
			.finally( () => setSettingsAreUpdating( false ) );
	}, [ settings, refreshWaf ] );

	const handleChange = useCallback(
		event => {
			const { value, id } = event.target;

			if ( [ 'jetpack_waf_ip_list' ].indexOf( id ) >= 0 ) {
				saveChanges( { [ id ]: ! settings[ id ] } );
				return;
			}

			setSettings( { ...settings, [ id ]: value } );
		},
		[ settings, saveChanges, setSettings ]
	);

	useEffect( () => {
		setSettings( {
			jetpack_waf_ip_list: jetpackWafIpList,
			jetpack_waf_ip_block_list: jetpackWafIpBlockList,
			jetpack_waf_ip_allow_list: jetpackWafIpAllowList,
		} );
	}, [ jetpackWafIpList, jetpackWafIpBlockList, jetpackWafIpAllowList ] );

	useEffect( () => {
		if ( wafSeen ) {
			return;
		}

		// remove the "new" badge immediately
		setWafIsSeen( true );

		// update the meta value in the background
		API.wafSeen();
	}, [ wafSeen, setWafIsSeen ] );

	return (
		<AdminPage>
			<ConnectedFirewallHeader />
			<Container className={ styles.container } horizontalSpacing={ 8 }>
				<Col>
					<div className={ styles[ 'toggle-section' ] }>
						<div>
							<FormToggle
								checked={ wafIsEnabled }
								onChange={ toggleWaf }
								disabled={ settingsAreUpdating }
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
					{ wafIsEnabled && (
						<>
							<div className={ styles[ 'toggle-section' ] }>
								<div>
									<FormToggle
										id="jetpack_waf_ip_list"
										checked={ Boolean( settings.jetpack_waf_ip_list ) }
										onChange={ toggleManualRules }
										disabled={ settingsAreUpdating }
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
											disabled={ settingsAreUpdating }
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
											disabled={ settingsAreUpdating }
										/>
									</div>
									<Button onClick={ saveChanges } isLoading={ settingsAreUpdating }>
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
