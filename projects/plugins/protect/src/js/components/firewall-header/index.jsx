import { AdminSectionHero, Container, Col, Text, H3, Button } from '@automattic/jetpack-components';
import { Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Icon, help } from '@wordpress/icons';
import classnames from 'classnames';
import useProtectData from '../../hooks/use-protect-data';
import styles from './styles.module.scss';

const FirewallHeader = () => {
	// TODO: Update placeholder with actual WAF data
	const status = 'off';

	const { jetpackScan } = useProtectData();
	const { hasRequiredPlan } = jetpackScan;

	if ( 'on' === status ) {
		return (
			<AdminSectionHero>
				<Container
					className={ styles[ 'firewall-header' ] }
					horizontalSpacing={ 6 }
					horizontalGap={ 0 }
				>
					<Col>
						<Text className={ classnames( styles.status, styles.active ) } variant={ 'label' }>
							{ __( 'Active', 'jetpack-protect' ) }
						</Text>
						<H3 className={ styles[ 'firewall-heading' ] } mb={ 2 } mt={ 2 }>
							{ __( 'Automatic firewall is on', 'jetpack-protect' ) }
						</H3>
					</Col>
					<Col>
						<div className={ styles[ 'stat-card-wrapper' ] }></div>
					</Col>
				</Container>
			</AdminSectionHero>
		);
	}

	if ( 'off' === status ) {
		return (
			<AdminSectionHero>
				<Container
					className={ styles[ 'firewall-header' ] }
					horizontalSpacing={ 6 }
					horizontalGap={ 0 }
				>
					<Col>
						<Text className={ styles.status } variant={ 'label' }>
							{ __( 'Inactive', 'jetpack-protect' ) }
						</Text>
						<H3 className={ styles[ 'firewall-heading' ] } mb={ 2 } mt={ 2 }>
							{ __( 'Automatic firewall is off', 'jetpack-protect' ) }
						</H3>
						{ ! hasRequiredPlan && (
							<>
								<div className={ styles[ 'manual-rules-notice' ] }>
									<Text variant={ 'body-small' } weight={ 600 }>
										{ __( 'Only manual rules will be applied', 'jetpack-protect' ) }
									</Text>
									<Icon icon={ help } />
								</div>
								<Button>{ __( 'Upgrade to enable automatic rules', 'jetpack-protect' ) }</Button>
							</>
						) }
					</Col>
					<Col>
						<div className={ styles[ 'stat-card-wrapper' ] }></div>
					</Col>
				</Container>
			</AdminSectionHero>
		);
	}

	return (
		<AdminSectionHero>
			<Container
				className={ styles[ 'firewall-header' ] }
				horizontalSpacing={ 6 }
				horizontalGap={ 0 }
			>
				<Col>
					<Spinner className={ styles.spinner } />
					<H3 className={ styles[ 'firewall-heading' ] } mb={ 2 } mt={ 2 }>
						{ __( 'Automattic firewall is being set up', 'jetpack-protect' ) }
					</H3>
					<Text variant={ 'body-small' } weight={ 600 }>
						{ __( 'Please wait…', 'jetpack-protect' ) }
					</Text>
				</Col>
				<Col>
					<div className={ styles[ 'stat-card-wrapper' ] }></div>
				</Col>
			</Container>
		</AdminSectionHero>
	);
};

export default FirewallHeader;
