import { Button, getRedirectUrl, Text } from '@automattic/jetpack-components';
import { useDispatch, useSelect } from '@wordpress/data';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Icon } from '@wordpress/icons';
import { STORE_ID } from '../../state/store';
import styles from './styles.module.scss';

const IgnoreThreatModal = ( { id, title, label, icon, severity } ) => {
	const { setModal, ignoreThreat } = useDispatch( STORE_ID );
	const threatsUpdating = useSelect( select => select( STORE_ID ).getThreatsUpdating() );
	const codeableURL = getRedirectUrl( 'jetpack-protect-codeable-referral' );

	const handleCancelClick = () => {
		return event => {
			event.preventDefault();
			setModal( { type: null } );
		};
	};

	const handleIgnoreClick = () => {
		return async event => {
			event.preventDefault();
			ignoreThreat( id, () => {
				setModal( { type: null } );
			} );
		};
	};

	return (
		<>
			<Text variant="title-medium" mb={ 2 }>
				{ __( 'Do you really want to ignore this threat?', 'jetpack-protect' ) }
			</Text>
			<Text mb={ 3 }>{ __( 'Jetpack will ignore the threat:', 'jetpack-protect' ) }</Text>

			<div className={ styles.threat }>
				<Icon icon={ icon } className={ styles.threat__icon } />
				<div className={ styles.threat__summary }>
					<Text className={ styles.threat__summary__label } mb={ 1 }>
						{ label }
					</Text>
					<Text className={ styles.threat__summary__title }>{ title }</Text>
				</div>
				<div className={ styles.threat__severity }>
					{ /* to do: implement severity badge component once available */ }
					{ severity }
				</div>
			</div>

			<Text mb={ 4 }>
				{ createInterpolateElement(
					__(
						'By ignoring this threat you confirm that you have reviewed the detected code and assume the risks of keeping a potentially malicious or vulnerable file on your site. If you are unsure please request an estimate with <codeableLink>Codeable</codeableLink>.',
						'jetpack-protect'
					),
					{
						codeableLink: <Button variant="link" isExternalLink={ true } href={ codeableURL } />,
					}
				) }
			</Text>
			<div className={ styles.footer }>
				<Button variant="secondary" onClick={ handleCancelClick() }>
					{ __( 'Cancel', 'jetpack-protect' ) }
				</Button>
				<Button
					isDestructive={ true }
					isLoading={ Boolean( threatsUpdating && threatsUpdating[ id ] ) }
					onClick={ handleIgnoreClick() }
				>
					{ __( 'Ignore threat', 'jetpack-protect' ) }
				</Button>
			</div>
		</>
	);
};

export default IgnoreThreatModal;
