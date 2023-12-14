import {
	Container,
	Col,
	Title,
	Button,
	Text,
	ActionPopover,
	getRedirectUrl,
	useBreakpointMatch,
} from '@automattic/jetpack-components';
import { useDispatch, useSelect } from '@wordpress/data';
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import React, { useCallback, useMemo, useRef, useEffect } from 'react';
import useProtectData from '../../hooks/use-protect-data';
import { STORE_ID } from '../../state/store';
import EmptyList from './empty';
import FreeList from './free-list';
import ThreatsNavigation from './navigation';
import PaidList from './paid-list';
import styles from './styles.module.scss';
import useThreatsList from './use-threats-list';

const ThreatsList = ( {
	anchors,
	setAnchors,
	onboardingStep,
	incrementOnboardingStep,
	closeOnboarding,
} ) => {
	const { siteSuffix } = window.jetpackProtectInitialState;

	const [ isSm ] = useBreakpointMatch( 'sm' );

	const { hasRequiredPlan } = useProtectData();
	const { item, list, selected, setSelected } = useThreatsList();
	const fixableList = list.filter( obj => obj.fixable );

	const { setModal } = useDispatch( STORE_ID );
	const { scan } = useDispatch( STORE_ID );
	const scanIsEnqueuing = useSelect( select => select( STORE_ID ).getScanIsEnqueuing() );

	const handleFixAllThreatsClick = threatList => {
		return event => {
			event.preventDefault();
			closeOnboarding();
			setModal( {
				type: 'FIX_ALL_THREATS',
				props: { threatList },
			} );
		};
	};

	const handleScanClick = () => {
		return event => {
			event.preventDefault();
			scan();
		};
	};

	const totalSteps = useMemo( () => {
		if ( ! hasRequiredPlan || list.length === 0 ) {
			return 2;
		} else if ( fixableList.length === 0 ) {
			return 3;
		}

		return 4;
	}, [ hasRequiredPlan, list, fixableList ] );

	const anchor1Ref = useRef( null );
	const anchor2Ref = useRef( null );
	const anchor3Ref = useRef( null );
	const anchor4Ref = useRef( null );

	useEffect( () => {
		setAnchors( prevAnchors => ( {
			...prevAnchors, // Spread the existing anchors
			anchor1: anchor1Ref.current,
			anchor2: anchor2Ref.current,
			anchor3: anchor3Ref.current,
			anchor4: anchor4Ref.current,
		} ) );
	}, [ anchor1Ref, anchor2Ref, anchor3Ref, anchor4Ref, setAnchors ] );

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
					__( '%1$s %2$s in your %3$s %4$s', 'jetpack-protect' ),
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
				{ onboardingStep === 1 && (
					<ActionPopover
						title={ __( 'Your scan results', 'jetpack-protect' ) }
						buttonContent={ __( 'Next', 'jetpack-protect' ) }
						anchor={ anchors.anchor1 }
						onClose={ closeOnboarding }
						onClick={ incrementOnboardingStep }
						noArrow={ false }
						className={ styles[ 'action-popover' ] }
						position={ 'middle top' }
						offset={ 15 }
						step={ 1 }
						totalSteps={ totalSteps }
					>
						<Text>
							{ __(
								'Navigate through the results of the scan on your WordPress installation, plugins, themes and other files',
								'jetpack-protect'
							) }
						</Text>
					</ActionPopover>
				) }
				<div ref={ anchor1Ref }>
					<ThreatsNavigation selected={ selected } onSelect={ setSelected } />
				</div>
			</Col>
			<Col lg={ 8 }>
				{ list?.length > 0 ? (
					<>
						<div className={ styles[ 'list-header' ] }>
							<Title className={ styles[ 'list-title' ] }>{ getTitle() }</Title>
							{ hasRequiredPlan && (
								<>
									{ fixableList.length > 0 && (
										<>
											{ onboardingStep === 2 && (
												<ActionPopover
													title={ __( 'Auto-fix with one click', 'jetpack-protect' ) }
													buttonContent={ __( 'Next', 'jetpack-protect' ) }
													anchor={ anchors.anchor2 }
													onClose={ closeOnboarding }
													onClick={ incrementOnboardingStep }
													noArrow={ false }
													className={ styles[ 'action-popover' ] }
													position={ isSm ? 'bottom right' : 'middle left' }
													offset={ 15 }
													step={ 2 }
													totalSteps={ 4 }
												>
													<Text>
														{ __(
															'Jetpack Protect offers one-click fixes for most threats. Press this button and be safe again.',
															'jetpack-protect'
														) }
													</Text>
													{ <br /> }
													<Text>
														{ createInterpolateElement(
															__(
																"Note that you'll have to <credentialsLink>input your server credentials</credentialsLink> first.",
																'jetpack-protect'
															),
															{
																credentialsLink: (
																	<Button
																		variant="link"
																		weight="regular"
																		href={ getRedirectUrl(
																			'jetpack-settings-security-credentials',
																			{ site: siteSuffix }
																		) }
																	/>
																),
															}
														) }
													</Text>
												</ActionPopover>
											) }
											<Button
												ref={ anchor2Ref }
												variant="primary"
												className={ styles[ 'list-header-button' ] }
												onClick={ handleFixAllThreatsClick( fixableList ) }
											>
												{ sprintf(
													/* translators: Translates to Auto fix all. $s: Number of fixable threats. */
													__( 'Auto fix all (%s)', 'jetpack-protect' ),
													fixableList.length
												) }
											</Button>
										</>
									) }
									{ hasRequiredPlan && onboardingStep === totalSteps && (
										<ActionPopover
											title={ __( 'Daily & manual scanning', 'jetpack-protect' ) }
											buttonContent={ __( 'Finish', 'jetpack-protect' ) }
											anchor={ anchors.anchor4 }
											onClose={ closeOnboarding }
											onClick={ closeOnboarding }
											noArrow={ false }
											className={ styles[ 'action-popover' ] }
											position={ isSm ? 'bottom left' : 'middle left' }
											offset={ 15 }
											step={ totalSteps }
											totalSteps={ totalSteps }
										>
											<Text>
												{ __(
													'We run daily automated scans but you can also run on-demand scans if you want to check the latest status.',
													'jetpack-protect'
												) }
											</Text>
										</ActionPopover>
									) }
									<Button
										ref={ anchor4Ref }
										variant="secondary"
										className={ styles[ 'list-header-button' ] }
										isLoading={ scanIsEnqueuing }
										onClick={ handleScanClick() }
									>
										{ __( 'Scan now', 'jetpack-protect' ) }
									</Button>
								</>
							) }
						</div>
						<>
							{ hasRequiredPlan && onboardingStep === totalSteps - 1 && (
								<ActionPopover
									title={ __( 'Understand severity', 'jetpack-protect' ) }
									buttonContent={ __( 'Next', 'jetpack-protect' ) }
									anchor={ anchors.anchor3 }
									onClose={ closeOnboarding }
									onClick={ incrementOnboardingStep }
									noArrow={ false }
									className={ styles[ 'action-popover' ] }
									position={ 'top middle' }
									offset={ 15 }
									step={ totalSteps - 1 }
									totalSteps={ totalSteps }
								>
									<Text>
										{ __(
											'Learn how critical these threats are for the security of your site by glancing at the severity labels.',
											'jetpack-protect'
										) }
									</Text>
								</ActionPopover>
							) }
							{ hasRequiredPlan ? (
								<div ref={ anchor3Ref }>
									<PaidList list={ list } />
								</div>
							) : (
								<FreeList list={ list } />
							) }
						</>
					</>
				) : (
					<EmptyList />
				) }
			</Col>
		</Container>
	);
};

export default ThreatsList;
