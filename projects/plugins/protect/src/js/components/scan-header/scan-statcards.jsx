import { useBreakpointMatch, StatCard } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { Icon, shield, check } from '@wordpress/icons';
import styles from './styles.module.scss';

const ScanStatCards = () => {
	const [ isSmall ] = useBreakpointMatch( [ 'sm', 'lg' ], [ null, '<' ] );

	const criticalThreatsArgs = {
		variant: isSmall ? 'horizontal' : 'square',
		icon: (
			<span className={ styles[ 'stat-card-icon' ] }>
				<Icon className={ styles.shield } icon={ shield } />
			</span>
		),
		label: <span>{ __( 'Critical threats found', 'jetpack-protect' ) }</span>,
		value: 38, // TODO: Replace with actual value
	};

	const autoFixableThreatsArgs = {
		variant: isSmall ? 'horizontal' : 'square',
		icon: (
			<span className={ styles[ 'stat-card-icon' ] }>
				<Icon icon={ check } />
			</span>
		),
		label: <span>{ __( 'Auto-fixable threats', 'jetpack-protect' ) }</span>,
		value: 90, // TODO: Replace with actual value
	};

	return (
		<div className={ styles[ 'stat-card-wrapper' ] }>
			<StatCard { ...criticalThreatsArgs } />
			<StatCard { ...autoFixableThreatsArgs } />
		</div>
	);
};

export default ScanStatCards;
