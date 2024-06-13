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

const StandaloneMode = ( { handleStandaloneIconClick } ) => {
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
				onClick={ handleStandaloneIconClick }
			>
				{ __( 'Learn more', 'jetpack-protect' ) }
			</Button>
		</div>
	);
};

const ShareDebugData = ( { shareDebugData, handleShareDebugDataChange, isUpdating } ) => {
	return (
		<div className={ styles[ 'share-data-section' ] }>
			<Title mb={ 2 }>{ __( ' Share detailed data with Jetpack', 'jetpack-protect' ) }</Title>
			<div className={ styles[ 'footer-checkbox' ] }>
				<CheckboxControl
					checked={ Boolean( shareDebugData ) }
					onChange={ handleShareDebugDataChange }
					disabled={ isUpdating }
				/>
				<Text>
					{ __(
						'Allow Jetpack to collect detailed data from blocked requests to enhance firewall protection and accuracy.',
						'jetpack-protect'
					) }
				</Text>
			</div>
		</div>
	);
};

const ShareData = ( { shareData, handleShareDataChange, isUpdating } ) => {
	return (
		<div className={ styles[ 'share-data-section' ] }>
			<Title mb={ 2 }>{ __( ' Share basic data with Jetpack', 'jetpack-protect' ) }</Title>
			<div className={ styles[ 'footer-checkbox' ] }>
				<CheckboxControl
					checked={ Boolean( shareData ) }
					onChange={ handleShareDataChange }
					disabled={ isUpdating }
				/>
				<Text>
					{ __(
						'Allow Jetpack to collect basic data from blocked requests to improve firewall protection and accuracy.',
						'jetpack-protect'
					) }
				</Text>
			</div>
		</div>
	);
};

export const FirewallFooter = ( {
	shareData,
	shareDebugData,
	handleShareDataChange,
	handleShareDebugDataChange,
	handleStandaloneIconClick,
	isUpdating,
	isEnabled,
} ) => {
	return (
		<AdminSectionHero>
			<SeventyFiveLayout
				main={ <StandaloneMode handleStandaloneIconClick={ handleStandaloneIconClick } /> }
				secondary={
					isEnabled && (
						<>
							<ShareData
								shareData={ shareData }
								handleShareDataChange={ handleShareDataChange }
								isUpdating={ isUpdating }
							/>
							<ShareDebugData
								shareDebugData={ shareDebugData }
								handleShareDebugDataChange={ handleShareDebugDataChange }
								isUpdating={ isUpdating }
							/>
						</>
					)
				}
				preserveSecondaryOnMobile={ true }
			/>
		</AdminSectionHero>
	);
};

const ConnectedFirewallFooter = () => {
	const { setNotice, setModal } = useDispatch( STORE_ID );
	const { config, isEnabled, isUpdating, toggleShareData, toggleShareDebugData } = useWafData();
	const { jetpackWafShareData, jetpackWafShareDebugData } = config || {};
	const [ settings, setSettings ] = useState( {
		jetpack_waf_share_data: jetpackWafShareData,
		jetpack_waf_share_debug_data: jetpackWafShareDebugData,
	} );

	const handleStandaloneIconClick = useCallback(
		event => {
			event.preventDefault();
			setModal( {
				type: 'STANDALONE_MODE',
			} );
		},
		[ setModal ]
	);

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

	useEffect( () => {
		setSettings( {
			jetpack_waf_share_data: jetpackWafShareData,
		} );
	}, [ jetpackWafShareData ] );

	return (
		<FirewallFooter
			isEnabled={ isEnabled }
			isUpdating={ isUpdating }
			shareData={ settings.jetpack_waf_share_data }
			shareDebugData={ settings.jetpack_waf_share_debug_data }
			handleShareDataChange={ handleShareDataChange }
			handleShareDebugDataChange={ handleShareDebugDataChange }
			handleStandaloneIconClick={ handleStandaloneIconClick }
		/>
	);
};

export default ConnectedFirewallFooter;
