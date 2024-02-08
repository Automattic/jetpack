import { AdminSectionHero, Title, Text, Button } from '@automattic/jetpack-components';
import { CheckboxControl, ExternalLink } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useState, useEffect, useCallback } from 'react';
import { PLUGIN_SUPPORT_URL } from '../../constants';
import useWafData from '../../hooks/use-waf-data';
import { STORE_ID } from '../../state/store';
import SeventyFiveLayout from '../seventy-five-layout';
import styles from './styles.module.scss';

const StandaloneMode = () => {
	const { setModal } = useDispatch( STORE_ID );

	const handleClick = () => {
		return event => {
			event.preventDefault();
			setModal( {
				type: 'STANDALONE_MODE',
			} );
		};
	};

	return (
		<div className={ styles[ 'standalone-mode-section' ] }>
			<Title>{ __( 'Standalone mode', 'jetpack-protect' ) }</Title>
			<Text mb={ 2 }>
				{ __(
					'Learn how you can execute the firewall before WordPress initializes. This mode offers the most protection.',
					'jetpack-protect'
				) }
			</Text>
			<Button
				variant={ 'link' }
				isExternalLink={ true }
				weight={ 'regular' }
				onClick={ handleClick() }
			>
				{ __( 'Learn more', 'jetpack-protect' ) }
			</Button>
		</div>
	);
};

const ShareDebugData = () => {
	const { config, isUpdating, toggleShareDebugData } = useWafData();
	const { jetpackWafShareDebugData } = config || {};
	const { setNotice } = useDispatch( STORE_ID );

	const [ settings, setSettings ] = useState( {
		jetpack_waf_share_debug_data: jetpackWafShareDebugData,
	} );

	const handleShareDebugDataChange = useCallback( () => {
		setSettings( {
			...settings,
			jetpack_waf_share_debug_data: ! settings.jetpack_waf_share_debug_data,
		} );
		toggleShareDebugData()
			.then( () =>
				setNotice( {
					type: 'success',
					duration: 5000,
					dismissable: true,
					message: __( 'Changes saved.', 'jetpack-protect' ),
				} )
			)
			.catch( () => {
				setNotice( {
					type: 'error',
					dismissable: true,
					message: createInterpolateElement(
						__(
							'An error ocurred. Please try again or <supportLink>contact support</supportLink>.',
							'jetpack-protect'
						),
						{
							supportLink: <ExternalLink href={ PLUGIN_SUPPORT_URL } />,
						}
					),
				} );
			} );
	}, [ settings, toggleShareDebugData, setNotice ] );

	useEffect( () => {
		setSettings( {
			jetpack_waf_share_debug_data: jetpackWafShareDebugData,
		} );
	}, [ jetpackWafShareDebugData ] );

	return (
		<div className={ styles[ 'share-data-section' ] }>
			<Title mb={ 2 }>{ __( ' Share detailed data with Jetpack', 'jetpack-protect' ) }</Title>
			<div className={ styles[ 'footer-checkbox' ] }>
				<CheckboxControl
					checked={ Boolean( settings.jetpack_waf_share_debug_data ) }
					onChange={ handleShareDebugDataChange }
					disabled={ isUpdating }
				/>
				<Text>{ __( 'Allow Jetpack to collect detailed data.', 'jetpack-protect' ) }</Text>
			</div>
		</div>
	);
};

const ShareData = () => {
	const { config, isUpdating, toggleShareData } = useWafData();
	const { jetpackWafShareData } = config || {};
	const { setNotice } = useDispatch( STORE_ID );

	const [ settings, setSettings ] = useState( {
		jetpack_waf_share_data: jetpackWafShareData,
	} );

	const handleShareDataChange = useCallback( () => {
		setSettings( { ...settings, jetpack_waf_share_data: ! settings.jetpack_waf_share_data } );
		toggleShareData()
			.then( () =>
				setNotice( {
					type: 'success',
					duration: 5000,
					dismissable: true,
					message: __( 'Changes saved.', 'jetpack-protect' ),
				} )
			)
			.catch( () => {
				setNotice( {
					type: 'error',
					dismissable: true,
					message: createInterpolateElement(
						__(
							'An error ocurred. Please try again or <supportLink>contact support</supportLink>.',
							'jetpack-protect'
						),
						{
							supportLink: <ExternalLink href={ PLUGIN_SUPPORT_URL } />,
						}
					),
				} );
			} );
	}, [ settings, toggleShareData, setNotice ] );

	useEffect( () => {
		setSettings( {
			jetpack_waf_share_data: jetpackWafShareData,
		} );
	}, [ jetpackWafShareData ] );

	return (
		<div className={ styles[ 'share-data-section' ] }>
			<Title mb={ 2 }>{ __( ' Share basic data with Jetpack', 'jetpack-protect' ) }</Title>
			<div className={ styles[ 'footer-checkbox' ] }>
				<CheckboxControl
					checked={ Boolean( settings.jetpack_waf_share_data ) }
					onChange={ handleShareDataChange }
					disabled={ isUpdating }
				/>
				<Text>
					{ __(
						'Allow Jetpack to collect basic data to improve firewall protection and rules. Collected data is also used to display advanced usage metrics.',
						'jetpack-protect'
					) }
				</Text>
			</div>
		</div>
	);
};

const FirewallFooter = () => {
	const { isEnabled } = useWafData();

	return (
		<AdminSectionHero>
			<SeventyFiveLayout
				main={ <StandaloneMode /> }
				secondary={
					isEnabled && (
						<>
							<ShareData />
							<ShareDebugData />
						</>
					)
				}
				preserveSecondaryOnMobile={ true }
			/>
		</AdminSectionHero>
	);
};

export default FirewallFooter;
