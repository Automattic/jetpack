import { Button, Col, Container, FormToggle, Text } from '@automattic/jetpack-components';
import apiFetch from '@wordpress/api-fetch';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { useEffect } from 'react';
import { STORE_ID } from '../../state/store';
import AdminPage from '../admin-page';
import FirewallFooter from '../firewall-footer';
import ConnectedFirewallHeader from '../firewall-header';
import Textarea from '../textarea';
import styles from './styles.module.scss';

const FirewallPage = () => {
	const wafSeen = useSelect( select => select( STORE_ID ).getWafSeen() );
	const { setWafSeen } = useDispatch( STORE_ID );

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
							<FormToggle />
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
					<div className={ styles[ 'toggle-section' ] }>
						<div>
							<FormToggle />
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
					<div className={ styles[ 'manual-rule-section' ] }>
						<Textarea
							label={ __( 'Blocked IP addresses', 'jetpack-protect' ) }
							placeholder={ __( 'Example:', 'jetpack-protect' ) + '\n12.12.12.1\n12.12.12.2' }
							rows={ 3 }
						/>
					</div>
					<div className={ styles[ 'manual-rule-section' ] }>
						<Textarea
							label={ __( 'Always allowed IP addresses', 'jetpack-protect' ) }
							placeholder={ __( 'Example:', 'jetpack-protect' ) + '\n12.12.12.1\n12.12.12.2' }
							rows={ 3 }
						/>
					</div>
					<Button>{ __( 'Save changes', 'jetpack-protect' ) }</Button>
				</Col>
			</Container>
			<FirewallFooter />
		</AdminPage>
	);
};

export default FirewallPage;
