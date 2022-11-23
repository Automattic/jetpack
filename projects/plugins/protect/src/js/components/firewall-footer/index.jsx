import { AdminSectionHero, Title, Text, Button } from '@automattic/jetpack-components';
import { CheckboxControl } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
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

const ShareData = () => {
	const { wafShareData } = window.jetpackProtectInitialState || false;
	let shareDataEnabled = false;
	if ( '1' === wafShareData ) {
		shareDataEnabled = true;
	}

	const onChange = checked => {
		if ( checked ) {
			console.log( "Set jetpack_waf_share_data option to '1' - ON" );
		} else {
			console.log( "Set jetpack_waf_share_data option to '' - OFF" );
		}
	};

	return (
		<div className={ styles[ 'share-data-section' ] }>
			<Title mb={ 2 }>{ __( ' Share data with Jetpack', 'jetpack-protect' ) }</Title>
			<div className={ styles[ 'footer-checkbox' ] }>
				<CheckboxControl checked={ wafShareData } onChange={ toggleShareData } />
				<Text>
					{ __(
						'Allow Jetpack to collect data to improve firewall protection and rules. Collected data is also used to display advanced usage metrics.',
						'jetpack-protect'
					) }
				</Text>
			</div>
		</div>
	);
};

const FirewallFooter = () => {
	console.log( window.jetpackProtectInitialState );
	return (
		<AdminSectionHero>
			<SeventyFiveLayout
				main={ <StandaloneMode /> }
				secondary={ <ShareData /> }
				preserveSecondaryOnMobile={ true }
			/>
		</AdminSectionHero>
	);
};

export default FirewallFooter;
