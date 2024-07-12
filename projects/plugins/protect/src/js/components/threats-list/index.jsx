import { Container, Col, Title, Button, useBreakpointMatch } from '@automattic/jetpack-components';
import { useDispatch } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import React, { useCallback, useState } from 'react';
import useProtectData from '../../hooks/use-protect-data';
import { STORE_ID } from '../../state/store';
import OnboardingPopover from '../onboarding-popover';
import ScanButton from '../scan-button';
import EmptyList from './empty';
import FreeList from './free-list';
import ThreatsNavigation from './navigation';
import PaidList from './paid-list';
import styles from './styles.module.scss';
import useThreatsList from './use-threats-list';

const ThreatsList = () => {
	const { hasRequiredPlan } = useProtectData();
	const { item, list, selected, setSelected } = useThreatsList();
	const fixableList = list.filter( obj => obj.fixable );
	const [ isSm ] = useBreakpointMatch( 'sm' );

	// Popover anchors
	const [ yourScanResultsPopoverAnchor, setYourScanResultsPopoverAnchor ] = useState( null );
	const [ understandSeverityPopoverAnchor, setUnderstandSeverityPopoverAnchor ] = useState( null );

	const { setModal } = useDispatch( STORE_ID );

	const [ fixAllThreatsPopoverAnchor, setFixAllThreatsPopoverAnchor ] = useState( null );
	const [ dailyAndManualScansPopoverAnchor, setDailyAndManualScansPopoverAnchor ] =
		useState( null );

	const handleFixAllThreatsClick = threatList => {
		return event => {
			event.preventDefault();
			setModal( {
				type: 'FIX_ALL_THREATS',
				props: { threatList },
			} );
		};
	};

	const getTitle = useCallback( () => {
		switch ( selected ) {
			case 'all':
				if ( list.length === 1 ) {
					return __( 'All threats', 'jetpack-protect' );
				}
				return sprintf(
					/* translators: placeholder is the amount of threats found on the site. */
					__( 'All %s threats', 'jetpack-protect' ),
					list.length
				);
			case 'wordpress':
				return sprintf(
					/* translators: placeholder is the amount of WordPress threats found on the site. */
					__( '%1$s WordPress %2$s', 'jetpack-protect' ),
					list.length,
					list.length === 1 ? 'threat' : 'threats'
				);
			case 'files':
				return sprintf(
					/* translators: placeholder is the amount of file threats found on the site. */
					__( '%1$s file %2$s', 'jetpack-protect' ),
					list.length,
					list.length === 1 ? 'threat' : 'threats'
				);
			case 'database':
				return sprintf(
					/* translators: placeholder is the amount of database threats found on the site. */
					__( '%1$s database %2$s', 'jetpack-protect' ),
					list.length,
					list.length === 1 ? 'threat' : 'threats'
				);
			default:
				return sprintf(
					/* translators: Translates to Update to. %1$s: Name. %2$s: Fixed version */
					__( '%1$s %2$s in %3$s %4$s', 'jetpack-protect' ),
					list.length,
					list.length === 1 ? 'threat' : 'threats',
					item?.name,
					item?.version
				);
		}
	}, [ selected, list, item ] );

	return (
		<Container fluid horizontalSpacing={ 0 } horizontalGap={ 3 }>
			<Col lg={ 4 }>
				<div ref={ setYourScanResultsPopoverAnchor }>
					<ThreatsNavigation selected={ selected } onSelect={ setSelected } />
				</div>
				<OnboardingPopover
					id={ hasRequiredPlan ? 'paid-scan-results' : 'free-scan-results' }
					position="top"
					anchor={ yourScanResultsPopoverAnchor }
				/>
			</Col>
			<Col lg={ 8 }>
				{ list?.length > 0 ? (
					<>
						<div className={ styles[ 'list-header' ] }>
							<Title className={ styles[ 'list-title' ] }>{ getTitle() }</Title>
							{ hasRequiredPlan && (
								<div className={ styles[ 'list-header__controls' ] }>
									{ fixableList.length > 0 && (
										<>
											<Button
												ref={ setFixAllThreatsPopoverAnchor }
												variant="primary"
												onClick={ handleFixAllThreatsClick( fixableList ) }
											>
												{ sprintf(
													/* translators: Translates to Show auto fixers $s: Number of fixable threats. */
													__( 'Show auto fixers (%s)', 'jetpack-protect' ),
													fixableList.length
												) }
											</Button>
											<OnboardingPopover
												id="paid-fix-all-threats"
												position={ isSm ? 'bottom right' : 'middle left' }
												anchor={ fixAllThreatsPopoverAnchor }
											/>
										</>
									) }
									<ScanButton ref={ setDailyAndManualScansPopoverAnchor } />
									<OnboardingPopover
										id="paid-daily-and-manual-scans"
										position={ isSm ? 'bottom left' : 'middle left' }
										anchor={ dailyAndManualScansPopoverAnchor }
									/>
								</div>
							) }
						</div>
						{ hasRequiredPlan ? (
							<>
								<div ref={ setUnderstandSeverityPopoverAnchor }>
									<PaidList list={ list } />
								</div>
								<OnboardingPopover
									id="paid-understand-severity"
									position="top"
									anchor={ understandSeverityPopoverAnchor }
								/>
							</>
						) : (
							<FreeList list={ list } />
						) }
					</>
				) : (
					<EmptyList />
				) }
			</Col>
		</Container>
	);
};

export default ThreatsList;
