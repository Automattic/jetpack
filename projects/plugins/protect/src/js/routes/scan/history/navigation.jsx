import { useBreakpointMatch } from '@automattic/jetpack-components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { warning as warningIcon, check, border } from '@wordpress/icons';
import { useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navigation, { NavigationItem } from '../../../components/navigation';
import { ThreatsCountBadge } from '../../../components/threats-list/navigation';
import useAnalyticsTracks from '../../../hooks/use-analytics-tracks';
import { STORE_ID } from '../../../state/store';

const HistoryNavigation = () => {
	const { numThreats, numFixedThreats, numIgnoredThreats } = useSelect( select =>
		select( STORE_ID ).getScanHistory()
	);

	const navigate = useNavigate();
	const { filter = 'all' } = useParams();
	const { recordEvent } = useAnalyticsTracks();
	const [ isSmallOrLarge ] = useBreakpointMatch( 'lg', '<' );

	const onSelect = useCallback(
		selectedFilter => {
			navigate( `/scan/history/${ selectedFilter }`, { replace: true, preventScrollReset: true } );
		},
		[ navigate ]
	);

	const trackNavigationClickAll = useCallback( () => {
		recordEvent( 'jetpack_protect_history_navigation_all_click' );
	}, [ recordEvent ] );

	const trackNavigationClickFixed = useCallback( () => {
		recordEvent( 'jetpack_protect_history_navigation_fixed_click' );
	}, [ recordEvent ] );

	const trackNavigationClickIgnored = useCallback( () => {
		recordEvent( 'jetpack_protect_history_navigation_ignored_click' );
	}, [ recordEvent ] );

	return (
		<Navigation
			selected={ filter }
			onSelect={ onSelect }
			mode={ isSmallOrLarge ? 'dropdown' : 'list' }
		>
			<NavigationItem
				initial
				id="all"
				label={ __( 'All previous threats', 'jetpack-protect' ) }
				icon={ warningIcon }
				badgeElement={
					numThreats ? (
						<ThreatsCountBadge count={ numThreats } selected={ filter === 'all' } />
					) : undefined
				}
				disabled={ numThreats <= 0 }
				onClick={ trackNavigationClickAll }
			/>
			<NavigationItem
				id="fixed"
				label={ __( 'Fixed', 'jetpack-protect' ) }
				icon={ check }
				badgeElement={
					numFixedThreats ? (
						<ThreatsCountBadge count={ numFixedThreats } selected={ filter === 'fixed' } />
					) : undefined
				}
				disabled={ numFixedThreats <= 0 }
				onClick={ trackNavigationClickFixed }
			/>
			<NavigationItem
				id="ignored"
				label={ __( 'Ignored', 'jetpack-protect' ) }
				icon={ border }
				badgeElement={
					numIgnoredThreats ? (
						<ThreatsCountBadge count={ numIgnoredThreats } selected={ filter === 'ignored' } />
					) : undefined
				}
				disabled={ numIgnoredThreats <= 0 }
				onClick={ trackNavigationClickIgnored }
			/>
		</Navigation>
	);
};

export default HistoryNavigation;
