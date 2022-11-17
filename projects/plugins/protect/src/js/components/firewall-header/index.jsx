import { AdminSectionHero, Container, Col, Text, H3, Button } from '@automattic/jetpack-components';
import { useProductCheckoutWorkflow } from '@automattic/jetpack-connection';
import { Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Icon, help } from '@wordpress/icons';
import classnames from 'classnames';
import useAnalyticsTracks from '../../hooks/use-analytics-tracks';
import { JETPACK_SCAN } from '../admin-page';
import styles from './styles.module.scss';

const FirewallHeader = ( { status, hasRequiredPlan } ) => {
	const { adminUrl } = window.jetpackProtectInitialState || {};

	const { run } = useProductCheckoutWorkflow( {
		productSlug: JETPACK_SCAN,
		redirectUrl: adminUrl,
	} );

	const { recordEventHandler } = useAnalyticsTracks();
	const getScan = recordEventHandler( 'jetpack_protect_waf_header_get_scan_link_click', run );

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
								<Button onClick={ getScan }>
									{ __( 'Upgrade to enable automatic rules', 'jetpack-protect' ) }
								</Button>
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
						{ __( 'Automatic firewall is being set up', 'jetpack-protect' ) }
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
