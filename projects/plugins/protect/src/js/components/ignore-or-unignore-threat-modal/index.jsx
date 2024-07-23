import { Button, getRedirectUrl, Text } from '@automattic/jetpack-components';
import { useDispatch, useSelect } from '@wordpress/data';
import { createInterpolateElement } from '@wordpress/element';
import { sprintf, __ } from '@wordpress/i18n';
import { Icon } from '@wordpress/icons';
import { STORE_ID } from '../../state/store';
import ThreatSeverityBadge from '../severity';
import UserConnectionGate from '../user-connection-gate';
import styles from './styles.module.scss';

const IgnoreOrUnignoreThreatModal = ( { id, title, label, icon, severity } ) => {
	const { setModal, ignoreThreat, unignoreThreat } = useDispatch( STORE_ID );
	const threatsUpdating = useSelect( select => select( STORE_ID ).getThreatsUpdating() );
	const codeableURL = getRedirectUrl( 'jetpack-protect-codeable-referral' );

	const handleCancelClick = () => {
		return event => {
			event.preventDefault();
			setModal( { type: null } );
		};
	};

	const test = true;
	const handleIgnoreOrUnigoreClick = () => {
		return async event => {
			event.preventDefault();
			if ( test ) {
				// todo: use status context here?
				unignoreThreat( id, () => {
					setModal( { type: null } );
				} );
			} else {
				ignoreThreat( id, () => {
					setModal( { type: null } );
				} );
			}
		};
	};

	const context = viewingScanHistory
		? __( 'unignore', 'jetpack-protect' )
		: __( 'ignore', 'jetpack-protect' );

	return (
		<UserConnectionGate>
			<Text variant="title-medium" mb={ 2 }>
				{ sprintf(
					// translators: %s is the threat context, like "ignore" or "unignore"
					__( 'Do you really want to %s this threat?', 'jetpack-protect' ),
					context
				) }
			</Text>
			<Text mb={ 3 }>
				{ sprintf(
					// translators: %s is the threat context, like "ignore" or "unignore"
					__( 'Jetpack will %s the threat:', 'jetpack-protect' ),
					context
				) }
			</Text>

			<div className={ styles.threat }>
				<Icon icon={ icon } className={ styles.threat__icon } />
				<div className={ styles.threat__summary }>
					<Text className={ styles.threat__summary__label } mb={ 1 }>
						{ label }
					</Text>
					<Text className={ styles.threat__summary__title }>{ title }</Text>
				</div>
				<div className={ styles.threat__severity }>
					<ThreatSeverityBadge severity={ severity } />
				</div>
			</div>

			<Text mb={ 4 }>
				{ createInterpolateElement(
					sprintf(
						// translators: %s is the threat context, like "ignore" or "unignore"
						__(
							'By choosing to %s this threat, you acknowledgge that you have reviewed the detected code. You are accepting the risks of maintaining a potentially malicious or vulnerable file on your site. If you are unsure please request an estimate with <codeableLink>Codeable</codeableLink>.',
							'jetpack-protect'
						),
						context
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
					onClick={ handleIgnoreOrUnigoreClick() }
				>
					{ sprintf(
						// translators: %s is the threat context, like "ignore" or "unignore"
						__( '%s threat', 'jetpack-protect' ),
						viewingScanHistory
							? __( 'Unignore', 'jetpack-protect' )
							: __( 'Ignore', 'jetpack-protect' )
					) }
				</Button>
			</div>
		</UserConnectionGate>
	);
};

export default IgnoreOrUnignoreThreatModal;
