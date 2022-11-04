import { AdminSectionHero, Container, Col, Text, Button } from '@automattic/jetpack-components';
import { CheckboxControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import styles from './styles.module.scss';

const FirewallFooter = () => (
	<AdminSectionHero>
		<Container
			className={ styles[ 'firewall-footer' ] }
			horizontalSpacing={ 6 }
			horizontalGap={ 0 }
		>
			<Col>
				<Text variant={ 'title-medium-semi-bold' } mb={ 2 }>
					{ __( 'Standalone mode', 'jetpack-protect' ) }
				</Text>
				<Text mb={ 2 }>
					{ __(
						'Learn how you can execute the firewall before WordPress initializes. This mode offers the most protection.',
						'jetpack-protect'
					) }
				</Text>
				<Button variant={ 'link' } isExternalLink={ true } weight={ 'regular' }>
					{ __( 'Learn more', 'jetpack-protect' ) }
				</Button>
			</Col>
			<Col>
				<Text variant={ 'title-medium-semi-bold' } mb={ 2 }>
					{ __( ' Share data with Jetpack', 'jetpack-protect' ) }
				</Text>
				<div className={ styles[ 'footer-checkbox' ] }>
					<CheckboxControl checked={ true } />
					<Text>
						{ __(
							'Allow Jetpack to collect data to improve firewall protection and rules. Collected data is also used to display advanced usage metrics.',
							'jetpack-protect'
						) }
					</Text>
				</div>
			</Col>
		</Container>
	</AdminSectionHero>
);

export default FirewallFooter;
