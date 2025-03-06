import { useBreakpointMatch, StatCard } from '@automattic/jetpack-components';
import { Tooltip } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Icon, scheduled, people, globe } from '@wordpress/icons';
import { useMemo, useCallback } from 'react';
import useSessionsQuery from '../../data/sessions/use-sessions-query';
import styles from './styles.module.scss';

const SessionsStatCard = ( { text, args } ) => (
	<Tooltip className={ styles[ 'stat-card-tooltip' ] } text={ text }>
		<div className={ styles[ 'stat-card-wrapper' ] }>
			<StatCard { ...args } />
		</div>
	</Tooltip>
);

const SessionsStatCards = () => {
	const [ isSmall ] = useBreakpointMatch( [ 'sm', 'lg' ], [ null, '<' ] );
	const { data: sessions = [], isLoading } = useSessionsQuery();

	const variant = useMemo( () => ( isSmall ? 'horizontal' : 'square' ), [ isSmall ] );

	const StatCardIcon = useCallback(
		( { icon } ) => (
			<span className={ styles[ 'stat-card-icon' ] }>
				<Icon icon={ icon } />
			</span>
		),
		[]
	);

	// Calculate unique users
	const uniqueUsers = useMemo(
		() => new Set( sessions.map( session => session.user_id ) ).size,
		[ sessions ]
	);

	// Calculate unique IPs
	const uniqueIps = useMemo(
		() => new Set( sessions.map( session => session.ip ) ).size,
		[ sessions ]
	);

	const activeSessionsArgs = useMemo(
		() => ( {
			variant,
			icon: <StatCardIcon icon={ scheduled } />,
			label: (
				<span className={ styles[ 'stat-card-label' ] }>
					{ __( 'Active sessions', 'jetpack-protect' ) }
				</span>
			),
			value: sessions.length,
			hideValue: isLoading,
		} ),
		[ variant, sessions.length, isLoading, StatCardIcon ]
	);

	const uniqueUsersArgs = useMemo(
		() => ( {
			variant,
			icon: <StatCardIcon icon={ people } />,
			label: (
				<span className={ styles[ 'stat-card-label' ] }>
					{ __( 'Unique users', 'jetpack-protect' ) }
				</span>
			),
			value: uniqueUsers,
			hideValue: isLoading,
		} ),
		[ variant, uniqueUsers, isLoading, StatCardIcon ]
	);

	const uniqueIpsArgs = useMemo(
		() => ( {
			variant,
			icon: <StatCardIcon icon={ globe } />,
			label: (
				<span className={ styles[ 'stat-card-label' ] }>
					{ __( 'Unique IPs', 'jetpack-protect' ) }
				</span>
			),
			value: uniqueIps,
			hideValue: isLoading,
		} ),
		[ variant, uniqueIps, isLoading, StatCardIcon ]
	);

	return (
		<div className={ styles[ 'stat-cards-wrapper' ] }>
			<SessionsStatCard args={ activeSessionsArgs } />
			<SessionsStatCard args={ uniqueUsersArgs } />
			<SessionsStatCard args={ uniqueIpsArgs } />
		</div>
	);
};

export default SessionsStatCards;
