import { Title, Text, Button, ToggleControl, Container, Col } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { useCallback } from 'react';
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
		<div className={ styles[ 'standalone-mode' ] }>
			<Title mb={ 0 }>{ __( 'Standalone mode', 'jetpack-protect' ) }</Title>
			<div>
				<Text>
					{ __(
						'Learn how you can execute the firewall before WordPress initializes.',
						'jetpack-protect'
					) }
				</Text>
				<Text>{ __( 'This mode offers the most protection.', 'jetpack-protect' ) }</Text>
			</div>
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

const ShareData = () => {
	const { config, isUpdating, toggleShareData, toggleShareDebugData } = useWafData();
	const { jetpackWafShareData, jetpackWafShareDebugData } = config || {};
	const { showSuccessNotice, showErrorNotice } = useNotices();

	const handleShareDataChange = useCallback( async () => {
		try {
			await toggleShareData();
			showSuccessNotice( __( 'Changes saved.', 'jetpack-protect' ) );
		} catch ( error ) {
			showErrorNotice();
		}
	}, [ toggleShareData, showSuccessNotice, showErrorNotice ] );

	const handleShareDebugDataChange = useCallback( async () => {
		try {
			await toggleShareDebugData();
			showSuccessNotice( __( 'Changes saved.', 'jetpack-protect' ) );
		} catch ( error ) {
			showErrorNotice();
		}
	}, [ toggleShareDebugData, showSuccessNotice, showErrorNotice ] );

	return (
		<div className={ styles[ 'share-data' ] }>
			<Title mb={ 0 }>{ __( 'Share data with Jetpack', 'jetpack-protect' ) }</Title>
			<ToggleControl
				className={ styles[ 'share-data-toggle' ] }
				checked={ !! jetpackWafShareData }
				onChange={ handleShareDataChange }
				disabled={ isUpdating }
				size="small"
				label={ __( 'Share basic data', 'jetpack-protect' ) }
				help={ __(
					'Allow Jetpack to collect basic data from blocked requests to improve firewall protection and accuracy.',
					'jetpack-protect'
				) }
			/>
			<ToggleControl
				className={ styles[ 'share-data-toggle' ] }
				checked={ !! jetpackWafShareDebugData }
				onChange={ handleShareDebugDataChange }
				disabled={ isUpdating }
				size="small"
				label={ __( 'Share detailed data', 'jetpack-protect' ) }
				help={ __(
					'Allow Jetpack to collect detailed data from blocked requests to enhance firewall protection and accuracy.',
					'jetpack-protect'
				) }
			/>
		</div>
	);
};

const FirewallFooter = () => {
	const { isEnabled } = useWafData();

	return (
		<div className={ styles.footer }>
			<Container horizontalSpacing={ 8 } horizontalGap={ 7 }>
				<Col sm={ 12 } md={ 6 } lg={ 7 }>
					<StandaloneMode />
				</Col>
				{ isEnabled && (
					<Col sm={ 12 } md={ 6 } lg={ 5 }>
						<ShareData />
					</Col>
				) }
			</Container>
		</div>
	);
};

export default FirewallFooter;
