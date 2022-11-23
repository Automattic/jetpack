import { Button, Col, Container, Text } from '@automattic/jetpack-components';
import apiFetch from '@wordpress/api-fetch';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import camelize from 'camelize';
import { useCallback, useEffect, useState } from 'react';
import useWafData from '../../hooks/use-waf-data';
import { STORE_ID } from '../../state/store';
import AdminPage from '../admin-page';
import FirewallFooter from '../firewall-footer';
import ConnectedFirewallHeader from '../firewall-header';
import FormToggle from '../form-toggle';
import Textarea from '../textarea';
import styles from './styles.module.scss';

const FirewallPage = () => {
	const { waf, fetchWaf } = useWafData();
	const { jetpackWafIpList, jetpackWafIpBlockList, jetpackWafIpAllowList, moduleIsEnabled } =
		waf || {};
	const wafSeen = useSelect( select => select( STORE_ID ).getWafSeen() );
	const { setWaf, setWafSeen } = useDispatch( STORE_ID );

	const [ settings, setSettings ] = useState( {
		jetpack_waf_ip_list: jetpackWafIpList,
		jetpack_waf_ip_block_list: jetpackWafIpBlockList,
		jetpack_waf_ip_allow_list: jetpackWafIpAllowList,
	} );
	const [ settingsAreUpdating, setSettingsAreUpdating ] = useState( false );

	const toggleWaf = useCallback( () => {
		apiFetch( {
			method: 'POST',
			path: 'jetpack-protect/v1/toggle-waf',
		} ).finally( fetchWaf );
	}, [ fetchWaf ] );

	const saveChanges = useCallback(
		newSettings => {
			setSettings( { ...settings, ...newSettings } );
			setSettingsAreUpdating( true );
			apiFetch( {
				method: 'POST',
				path: 'jetpack/v4/waf',
				data: { ...settings, ...newSettings },
			} )
				.then( updatedWaf => setWaf( { ...waf, ...camelize( updatedWaf ) } ) )
				.finally( () => setSettingsAreUpdating( false ) );
		},
		[ settings, setWaf, waf ]
	);

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
		setWafSeen( true );

		// update the meta value in the background
		apiFetch( {
			path: 'jetpack-protect/v1/waf-seen',
			method: 'POST',
		} );
	}, [ wafSeen, setWafSeen ] );

	return (
		<AdminPage>
			<ConnectedFirewallHeader />
			<Container className={ styles.container } horizontalSpacing={ 8 }>
				<Col>
					<div className={ styles[ 'toggle-section' ] }>
						<div>
							<FormToggle
								checked={ moduleIsEnabled }
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
					{ moduleIsEnabled && (
						<>
							<div className={ styles[ 'toggle-section' ] }>
								<div>
									<FormToggle
										id="jetpack_waf_ip_list"
										checked={ Boolean( settings.jetpack_waf_ip_list ) }
										onChange={ handleChange }
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
