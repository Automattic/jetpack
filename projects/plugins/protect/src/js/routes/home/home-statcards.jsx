import { useBreakpointMatch, StatCard } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { useMemo } from 'react';
import Alert from '../../components/alert-icon';
import ProtectCheck from '../../components/protect-check-icon';
import useProtectData from '../../hooks/use-protect-data';
import useWafData from '../../hooks/use-waf-data';
import styles from './styles.module.scss';

const HomeStatCards = () => {
	const [ isSmall ] = useBreakpointMatch( [ 'sm', 'lg' ], [ null, '<' ] );

	const {
		counts: {
			current: { threats: numThreats },
		},
	} = useProtectData();

	const {
		config: { bruteForceProtection: isBruteForceModuleEnabled },
		isEnabled: isWafModuleEnabled,
		wafSupported,
		stats,
	} = useWafData();

	const { allTime: allTimeBlockCount } = stats ? stats.blockedRequests : { allTime: 0 };

	const { blockedLogins: blockedLoginsCount } = stats;

	const defaultArgs = useMemo(
		() => ( {
			variant: isSmall ? 'horizontal' : 'square',
		} ),
		[ isSmall ]
	);

	const scanArgs = useMemo(
		() => ( {
			...defaultArgs,
			icon: (
				<span className={ styles[ 'stat-card-icon' ] }>
					<ProtectCheck
						width={ '16' }
						height={ '19.14' }
						color={ numThreats ? '#F0B849' : '#069E08' }
					/>
				</span>
			),
			label: (
				<span className={ styles[ 'stat-card-label' ] }>
					{ __( 'Threats found', 'jetpack-protect' ) }
				</span>
			),
			value: numThreats,
		} ),
		[ defaultArgs, numThreats ]
	);

	const wafArgs = useMemo(
		() => ( {
			...defaultArgs,
			className: isWafModuleEnabled ? styles.active : styles.disabled,
			icon: (
				<span className={ styles[ 'stat-card-icon' ] }>
					{ isWafModuleEnabled ? (
						<ProtectCheck width={ '16' } height={ '19.14' } />
					) : (
						<Alert width={ '16' } height={ '19.14' } color={ '#A7AAAD' } />
					) }
				</span>
			),
			label: (
				<span className={ styles[ 'stat-card-label' ] }>
					{ __( 'Blocked requests', 'jetpack-protect' ) }
				</span>
			),
			value: allTimeBlockCount,
		} ),
		[ defaultArgs, isWafModuleEnabled, allTimeBlockCount ]
	);

	const bruteForceArgs = useMemo(
		() => ( {
			...defaultArgs,
			className: isBruteForceModuleEnabled ? styles.active : styles.disabled,
			icon: (
				<span className={ styles[ 'stat-card-icon' ] }>
					<span className={ styles[ 'stat-card-icon' ] }>
						{ isBruteForceModuleEnabled ? (
							<ProtectCheck width={ '16' } height={ '19.14' } />
						) : (
							<Alert width={ '16' } height={ '19.14' } color={ '#A7AAAD' } />
						) }
					</span>
				</span>
			),
			label: (
				<span className={ styles[ 'stat-card-label' ] }>
					{ __( 'Blocked logins', 'jetpack-protect' ) }
				</span>
			),
			value: blockedLoginsCount,
		} ),
		[ defaultArgs, isBruteForceModuleEnabled, blockedLoginsCount ]
	);

	return (
		<div className={ styles[ 'stat-card-wrapper' ] }>
			<StatCard { ...scanArgs } />
			{ wafSupported && <StatCard { ...wafArgs } /> }
			<StatCard { ...bruteForceArgs } />
		</div>
	);
};

export default HomeStatCards;
