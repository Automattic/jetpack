import {
	AdminSectionHero,
	Container,
	Col,
	Text,
	H3,
	Button,
	// useBreakpointMatch,
} from '@automattic/jetpack-components';
import { Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import {
	Icon,
	// shield,
	// chartBar,
	help,
} from '@wordpress/icons';
import classnames from 'classnames';
// import StatCard from '../stat-card';
import styles from './styles.module.scss';

const FirewallHeader = () => {
	// TODO: Update placeholder with actual WAF data
	const status = 'off';
	const hasRequiredPlan = false;

	// const [ isSmall ] = useBreakpointMatch( [ 'sm', 'lg' ], [ null, '<' ] );

	// const lastThirtyArgs = {
	// 	icon: <Icon icon={ shield } />,
	// 	label: __( 'Blocked requests', 'jetpack-protect' ),
	// 	period: __( 'Last 30 days', 'jetpack-protect' ),
	// 	value: 0, // TODO: Update with actual WAF data when on
	// 	variant: isSmall ? 'horizontal' : 'square',
	// 	disabled: hasRequiredPlan ? false : true,
	// };

	// const allTimeArgs = {
	// 	icon: <Icon icon={ chartBar } />,
	// 	label: __( 'Blocked requests', 'jetpack-protect' ),
	// 	period: __( 'All time', 'jetpack-protect' ),
	// 	value: 0, // TODO: Update with actual WAF data when on
	// 	variant: isSmall ? 'horizontal' : 'square',
	// 	disabled: hasRequiredPlan ? false : true,
	// };

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
						<div className={ styles[ 'stat-card-wrapper' ] }>
							{ /* <StatCard { ...lastThirtyArgs } /> */ }
							{ /* <StatCard { ...allTimeArgs } /> */ }
						</div>
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
						<div className={ styles[ 'stat-card-wrapper' ] }>
							{ /* <StatCard { ...lastThirtyArgs } /> */ }
							{ /* <StatCard { ...allTimeArgs } /> */ }
						</div>
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
					<div className={ styles[ 'stat-card-wrapper' ] }>
						{ /* <StatCard { ...lastThirtyArgs } /> */ }
						{ /* <StatCard { ...allTimeArgs } /> */ }
					</div>
				</Col>
			</Container>
		</AdminSectionHero>
	);
};

export default FirewallHeader;
