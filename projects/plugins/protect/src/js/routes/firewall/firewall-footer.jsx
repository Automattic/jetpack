import { Title, Text, Button, ToggleControl } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { useState, useEffect, useCallback } from 'react';
import AdminSectionHero from '../../components/admin-section-hero';
import useModal from '../../hooks/use-modal';
import useNotices from '../../hooks/use-notices';
import useWafData from '../../hooks/use-waf-data';
import styles from './styles.module.scss';

const StandaloneMode = () => {
	const { setModal } = useModal();

	const handleClick = () => {
		return event => {
			event.preventDefault();
			setModal( {
				type: 'STANDALONE_MODE',
			} );
		};
	};

	return (
		<div>
			<Title>{ __( 'Standalone mode', 'jetpack-protect' ) }</Title>
			<Text className={ styles[ 'standalone-mode-content' ] }>
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
	const { showSuccessNotice, showErrorNotice } = useNotices();

	const [ settings, setSettings ] = useState( {
		jetpack_waf_share_debug_data: jetpackWafShareDebugData,
	} );

	const handleShareDebugDataChange = useCallback( () => {
		setSettings( {
			...settings,
			jetpack_waf_share_debug_data: ! settings.jetpack_waf_share_debug_data,
		} );
		toggleShareDebugData()
			.then( () => showSuccessNotice( __( 'Changes saved.', 'jetpack-protect' ) ) )
			.catch( () => {
				showErrorNotice();
			} );
	}, [ settings, toggleShareDebugData, showSuccessNotice, showErrorNotice ] );

	useEffect( () => {
		setSettings( {
			jetpack_waf_share_debug_data: jetpackWafShareDebugData,
		} );
	}, [ jetpackWafShareDebugData ] );

	return (
		<div>
			<Title>{ __( 'Share detailed data with Jetpack', 'jetpack-protect' ) }</Title>
			<div className={ styles[ 'share-data-section' ] }>
				<ToggleControl
					className={ styles[ 'share-data-toggle' ] }
					checked={ Boolean( settings.jetpack_waf_share_debug_data ) }
					onChange={ handleShareDebugDataChange }
					disabled={ isUpdating }
					size="small"
				/>
				<Text className={ styles[ 'share-data-content' ] }>
					{ __(
						'Allow Jetpack to collect detailed data from blocked requests to enhance firewall protection and accuracy.',
						'jetpack-protect'
					) }
				</Text>
			</div>
		</div>
	);
};

const ShareData = () => {
	const { config, isUpdating, toggleShareData } = useWafData();
	const { jetpackWafShareData } = config || {};
	const { showSuccessNotice, showErrorNotice } = useNotices();

	const [ settings, setSettings ] = useState( {
		jetpack_waf_share_data: jetpackWafShareData,
	} );

	const handleShareDataChange = useCallback( () => {
		setSettings( { ...settings, jetpack_waf_share_data: ! settings.jetpack_waf_share_data } );
		toggleShareData()
			.then( () => showSuccessNotice( __( 'Changes saved.', 'jetpack-protect' ) ) )
			.catch( () => {
				showErrorNotice();
			} );
	}, [ settings, toggleShareData, showSuccessNotice, showErrorNotice ] );

	useEffect( () => {
		setSettings( {
			jetpack_waf_share_data: jetpackWafShareData,
		} );
	}, [ jetpackWafShareData ] );

	return (
		<div>
			<Title>{ __( 'Share basic data with Jetpack', 'jetpack-protect' ) }</Title>
			<div className={ styles[ 'share-data-section' ] }>
				<ToggleControl
					className={ styles[ 'share-data-toggle' ] }
					checked={ Boolean( settings.jetpack_waf_share_data ) }
					onChange={ handleShareDataChange }
					disabled={ isUpdating }
					size="small"
				/>
				<Text className={ styles[ 'share-data-content' ] }>
					{ __(
						'Allow Jetpack to collect basic data from blocked requests to improve firewall protection and accuracy.',
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
		<AdminSectionHero
			main={
				<div className={ styles[ 'footer-main' ] }>
					<StandaloneMode />
				</div>
			}
			secondary={
				isEnabled && (
					<div className={ styles[ 'footer-secondary' ] }>
						<ShareData />
						<ShareDebugData />
					</div>
				)
			}
			preserveSecondaryOnMobile={ true }
		/>
	);
};

export default FirewallFooter;
