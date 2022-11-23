import {
	AdminSectionHero,
	Container,
	Col,
	Text,
	H3,
	Button,
	useBreakpointMatch,
} from '@automattic/jetpack-components';
import { useProductCheckoutWorkflow } from '@automattic/jetpack-connection';
import { Spinner, Popover } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Icon, shield, chartBar, help } from '@wordpress/icons';
import classnames from 'classnames';
import React, { useState, useCallback } from 'react';
import useAnalyticsTracks from '../../hooks/use-analytics-tracks';
import useProtectData from '../../hooks/use-protect-data';
import useWafData from '../../hooks/use-waf-data';
import { JETPACK_SCAN } from '../admin-page';
import StatCard from '../stat-card';
import styles from './styles.module.scss';

const FirewallHeader = ( { status, hasRequiredPlan } ) => {
	const { adminUrl } = window.jetpackProtectInitialState || {};
	const firewallUrl = adminUrl + '#/firewall';

	const { run } = useProductCheckoutWorkflow( {
		productSlug: JETPACK_SCAN,
		redirectUrl: firewallUrl,
	} );

	const { recordEventHandler } = useAnalyticsTracks();
	const getScan = recordEventHandler( 'jetpack_protect_waf_header_get_scan_link_click', run );

	const [ showPopover, setShowPopover ] = useState( false );

	const handleEnter = useCallback( () => {
		setShowPopover( true );
	}, [] );

	const handleOut = useCallback( () => {
		setShowPopover( false );
	}, [] );

	const [ isSmall ] = useBreakpointMatch( [ 'sm', 'lg' ], [ null, '<' ] );

	const lastThirtyArgs = {
		icon: <Icon icon={ shield } />,
		label: __( 'Blocked requests', 'jetpack-protect' ),
		period: __( 'Last 30 days', 'jetpack-protect' ),
		value: 0, // TODO: Update with actual WAF data when on
		variant: isSmall ? 'horizontal' : 'square',
		disabled: hasRequiredPlan ? false : true,
	};

	const allTimeArgs = {
		icon: <Icon icon={ chartBar } />,
		label: __( 'Blocked requests', 'jetpack-protect' ),
		period: __( 'All time', 'jetpack-protect' ),
		value: 0, // TODO: Update with actual WAF data when on
		variant: isSmall ? 'horizontal' : 'square',
		disabled: hasRequiredPlan ? false : true,
	};

	return (
		<AdminSectionHero>
			<Container
				className={ styles[ 'firewall-header' ] }
				horizontalSpacing={ 7 }
				horizontalGap={ 0 }
			>
				<Col>
					{ 'on' === status && (
						<>
							<Text className={ classnames( styles.status, styles.active ) } variant={ 'label' }>
								{ __( 'Active', 'jetpack-protect' ) }
							</Text>
							<H3 className={ styles[ 'firewall-heading' ] } mb={ 1 } mt={ 2 }>
								{ __( 'Automatic firewall is on', 'jetpack-protect' ) }
							</H3>
						</>
					) }
					{ 'off' === status && (
						<>
							<Text className={ styles.status } variant={ 'label' }>
								{ __( 'Inactive', 'jetpack-protect' ) }
							</Text>
							<H3 className={ styles[ 'firewall-heading' ] } mb={ 2 } mt={ 2 }>
								{ __( 'Automatic firewall is off', 'jetpack-protect' ) }
							</H3>
							{ ! hasRequiredPlan && (
								<>
									<div className={ styles[ 'manual-rules-notice' ] }>
										<Text weight={ 600 }>
											{ __( 'Only manual rules will be applied', 'jetpack-protect' ) }
										</Text>
										<div
											className={ styles[ 'icon-popover' ] }
											onMouseLeave={ handleOut }
											onMouseEnter={ handleEnter }
											onClick={ handleEnter }
											onFocus={ handleEnter }
											onBlur={ handleOut }
											role="presentation"
										>
											<Icon icon={ help } />
											{ showPopover && (
												<Popover noArrow={ false } offset={ 5 }>
													<Text className={ styles[ 'popover-text' ] } variant={ 'body-small' }>
														{ __(
															'The free version of the firewall only allows for use of manual rules.',
															'jetpack-protect'
														) }
													</Text>
												</Popover>
											) }
										</div>
									</div>
									<Button onClick={ getScan }>
										{ __( 'Upgrade to enable automatic rules', 'jetpack-protect' ) }
									</Button>
								</>
							) }
						</>
					) }
					{ 'loading' === status && (
						<>
							<Spinner className={ styles.spinner } />
							<H3 className={ styles[ 'firewall-heading' ] } mb={ 2 } mt={ 2 }>
								{ __( 'Automatic firewall is being set up', 'jetpack-protect' ) }
							</H3>
							<Text className={ styles[ 'loading-text' ] } weight={ 600 }>
								{ __( 'Please wait…', 'jetpack-protect' ) }
							</Text>
						</>
					) }
				</Col>
				<Col>
					<div className={ styles[ 'stat-card-wrapper' ] }>
						<StatCard { ...lastThirtyArgs } />
						<StatCard { ...allTimeArgs } />
					</div>
				</Col>
			</Container>
		</AdminSectionHero>
	);
};

const ConnectedFirewallHeader = () => {
	const { waf } = useWafData();

	// To Do: Add loading status
	let currentWafStatus;
	if ( waf ) {
		currentWafStatus = 'on';
	} else {
		currentWafStatus = 'off';
	}

	const { hasRequiredPlan } = useProtectData();

	return <FirewallHeader status={ currentWafStatus } hasRequiredPlan={ hasRequiredPlan } />;
};

export default ConnectedFirewallHeader;
