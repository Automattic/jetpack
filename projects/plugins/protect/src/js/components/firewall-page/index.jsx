import {
	Button,
	Col,
	Container,
	Text,
	ContextualUpgradeTrigger,
	useBreakpointMatch,
	Notice as JetpackNotice,
} from '@automattic/jetpack-components';
import { useProductCheckoutWorkflow } from '@automattic/jetpack-connection';
import { ExternalLink, Popover } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Icon, arrowLeft, closeSmall } from '@wordpress/icons';
import { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import API from '../../api';
import { JETPACK_SCAN_SLUG, PLUGIN_SUPPORT_URL } from '../../constants';
import useAnalyticsTracks from '../../hooks/use-analytics-tracks';
import useProtectData from '../../hooks/use-protect-data';
import useWafData from '../../hooks/use-waf-data';
import { STORE_ID } from '../../state/store';
import AdminPage from '../admin-page';
import FirewallFooter from '../firewall-footer';
import ConnectedFirewallHeader from '../firewall-header';
import FormToggle from '../form-toggle';
import Notice from '../notice';
import Textarea from '../textarea';
import styles from './styles.module.scss';

const ADMIN_URL = window?.jetpackProtectInitialState?.adminUrl;
const SUCCESS_NOTICE_DURATION = 5000;

const errorMessage = createInterpolateElement(
	__(
		'An error ocurred. Please try again or <supportLink>contact support</supportLink>.',
		'jetpack-protect'
	),
	{
		supportLink: <ExternalLink href={ PLUGIN_SUPPORT_URL } />,
	}
);

const FirewallPage = () => {
	const [ isSmall ] = useBreakpointMatch( [ 'sm', 'lg' ], [ null, '<' ] );
	const notice = useSelect( select => select( STORE_ID ).getNotice() );
	const { setWafIsSeen, setWafUpgradeIsSeen, setNotice } = useDispatch( STORE_ID );
	const {
		config: {
			jetpackWafAutomaticRules,
			jetpackWafIpList,
			jetpackWafIpBlockList,
			jetpackWafIpAllowList,
		},
		isEnabled,
		isSeen,
		upgradeIsSeen,
		isSupported,
		isUpdating,
		toggleAutomaticRules,
		toggleManualRules,
		toggleWaf,
		updateConfig,
	} = useWafData();
	const { hasRequiredPlan } = useProtectData();
	const { run: runCheckoutWorkflow } = useProductCheckoutWorkflow( {
		productSlug: JETPACK_SCAN_SLUG,
		redirectUrl: `${ ADMIN_URL }#/firewall`,
	} );
	const { recordEventHandler } = useAnalyticsTracks();

	/**
	 * Form State
	 *
	 * @member {object} formState - Current form values.
	 */
	const [ formState, setFormState ] = useState( {
		jetpack_waf_automatic_rules: jetpackWafAutomaticRules,
		jetpack_waf_ip_list: jetpackWafIpList,
		jetpack_waf_ip_block_list: jetpackWafIpBlockList,
		jetpack_waf_ip_allow_list: jetpackWafIpAllowList,
	} );

	/**
	 * Form Is Submitting State
	 *
	 * @member {boolean} formIsSubmitting - Whether or not the form is submitting.
	 */
	const [ formIsSubmitting, setFormIsSubmitting ] = useState( false );

	/**
	 * Show Manual Rules State
	 *
	 * @member {boolean} showManualRules Whether or not to display the manual rules sub-section.
	 */
	const [ showManualRules, setShowManualRules ] = useState( false );

	/**
	 * Get Scan
	 *
	 * Records an event and then starts the checkout flow for Jetpack Scan
	 */
	const getScan = recordEventHandler(
		'jetpack_protect_waf_page_get_scan_link_click',
		runCheckoutWorkflow
	);

	/**
	 * Save Changes
	 *
	 * Updates the WAF settings with the current form state values.
	 *
	 * @returns void
	 */
	const saveChanges = useCallback( () => {
		setFormIsSubmitting( true );
		updateConfig( formState )
			.then( () =>
				setNotice( {
					type: 'success',
					duration: SUCCESS_NOTICE_DURATION,
					message: __( 'Changes saved.', 'jetpack-protect' ),
				} )
			)
			.catch( () => {
				setNotice( {
					type: 'error',
					message: errorMessage,
				} );
			} )
			.finally( () => setFormIsSubmitting( false ) );
	}, [ formState, updateConfig, setNotice ] );

	/**
	 * Handle Change
	 *
	 * Syncs change events from a form element to formState.
	 *
	 * @param {Event} event - The form control's change event.
	 * @returns void
	 */
	const handleChange = useCallback(
		event => {
			const { value, id } = event.target;
			setFormState( { ...formState, [ id ]: value } );
		},
		[ formState ]
	);

	/**
	 * Handle Automatic Rules Change
	 *
	 * Toggles the WAF's automatic rules option.
	 *
	 * @returns void
	 */
	const handleAutomaticRulesChange = useCallback( () => {
		setFormIsSubmitting( true );
		const newValue = ! formState.jetpack_waf_automatic_rules;
		setFormState( {
			...formState,
			jetpack_waf_automatic_rules: newValue,
		} );
		toggleAutomaticRules()
			.then( () =>
				setNotice( {
					type: 'success',
					duration: SUCCESS_NOTICE_DURATION,
					message: newValue
						? __( `Automatic rules are enabled.`, 'jetpack-protect' )
						: __(
								`Automatic rules are disabled.`,
								'jetpack-protect',
								/* dummy arg to avoid bad minification */ 0
						  ),
				} )
			)
			.then( () => {
				if ( ! upgradeIsSeen ) {
					setWafUpgradeIsSeen( true );
					API.wafUpgradeSeen();
				}
			} )
			.catch( () => {
				setNotice( {
					type: 'error',
					message: errorMessage,
				} );
			} )
			.finally( () => setFormIsSubmitting( false ) );
	}, [ formState, toggleAutomaticRules, setNotice, upgradeIsSeen, setWafUpgradeIsSeen ] );

	/**
	 * Handle Manual Rules Change
	 *
	 * Toggles the WAF's manual rules option.
	 *
	 * @returns void
	 */
	const handleManualRulesChange = useCallback( () => {
		const newManualRulesStatus = ! formState.jetpack_waf_ip_list;
		setFormIsSubmitting( true );
		setFormState( { ...formState, jetpack_waf_ip_list: newManualRulesStatus } );
		toggleManualRules()
			.then( () =>
				setNotice( {
					type: 'success',
					duration: SUCCESS_NOTICE_DURATION,
					message: newManualRulesStatus
						? __( 'Manual rules are active.', 'jetpack-protect' )
						: __(
								'Manual rules are disabled.',
								'jetpack-protect',
								/* dummy arg to avoid bad minification */ 0
						  ),
				} )
			)
			.catch( () => {
				setNotice( {
					type: 'error',
					message: errorMessage,
				} );
			} )
			.finally( () => setFormIsSubmitting( false ) );
	}, [ formState, toggleManualRules, setNotice ] );

	/**
	 * Handle Show Manual Rules Click
	 *
	 * Toggles showManualRules.
	 *
	 * @returns void
	 */
	const handleShowManualRulesClick = useCallback( () => {
		setShowManualRules( ! showManualRules );
	}, [ showManualRules, setShowManualRules ] );

	/**
	 * Sync formState with application state WAF config
	 */
	useEffect( () => {
		if ( ! isUpdating ) {
			setFormState( {
				jetpack_waf_automatic_rules: jetpackWafAutomaticRules,
				jetpack_waf_ip_list: jetpackWafIpList,
				jetpack_waf_ip_block_list: jetpackWafIpBlockList,
				jetpack_waf_ip_allow_list: jetpackWafIpAllowList,
			} );
		}
	}, [
		jetpackWafIpList,
		jetpackWafIpBlockList,
		jetpackWafIpAllowList,
		jetpackWafAutomaticRules,
		isUpdating,
	] );

	/**
	 * "WAF Seen" useEffect()
	 */
	useEffect( () => {
		if ( isSeen ) {
			return;
		}

		// remove the "new" badge immediately
		setWafIsSeen( true );

		// update the meta value in the background
		API.wafSeen();
	}, [ isSeen, setWafIsSeen ] );

	// Track view for Protect WAF page.
	useAnalyticsTracks( {
		pageViewEventName: 'protect_waf',
		pageViewEventProperties: {
			has_plan: hasRequiredPlan,
		},
	} );

	/**
	 * Module Disabled Notice
	 */
	const moduleDisabledNotice = (
		<JetpackNotice
			level="error"
			title="Jetpack Firewall is currently disabled."
			children={ <Text>{ __( 'Re-enable the Firewall to continue.', 'jetpack-protect' ) }</Text> }
			actions={ [
				<Button
					variant="link"
					onClick={ toggleWaf }
					isLoading={ isUpdating }
					disabled={ isUpdating }
				>
					{ __( 'Enable Firewall', 'jetpack-protect' ) }
				</Button>,
			] }
			hideCloseButton={ true }
		/>
	);

	const handleClosePopoverClick = useCallback( () => {
		setWafUpgradeIsSeen( true );
		API.wafUpgradeSeen();
	}, [ setWafUpgradeIsSeen ] );

	const { waf } = window.jetpackProtectInitialState;
	const { displayUpgradeBadge } = waf;

	/**
	 * Main Settings
	 */
	const mainSettings = (
		<div className={ styles[ 'toggle-wrapper' ] }>
			<div
				className={ `${ styles[ 'toggle-section' ] } ${
					! hasRequiredPlan || ! isEnabled ? styles[ 'toggle-section--disabled' ] : ''
				}` }
			>
				<div className={ styles[ 'toggle-section__control' ] }>
					<FormToggle
						checked={ hasRequiredPlan && isEnabled ? formState.jetpack_waf_automatic_rules : false }
						onChange={ handleAutomaticRulesChange }
						disabled={ ! hasRequiredPlan || formIsSubmitting || ! isEnabled }
					/>
					{ hasRequiredPlan && upgradeIsSeen === false && (
						<Popover noArrow={ false } offset={ 8 } position={ 'top right' }>
							<div className={ styles.popover }>
								<div className={ styles[ 'popover-header' ] }>
									<Text className={ styles[ 'popover-title' ] } variant={ 'title-small' }>
										{ __( 'Thanks for upgrading!', 'jetpack-protect' ) }
									</Text>
									<Button variant={ 'icon' }>
										<Icon
											onClick={ handleClosePopoverClick }
											icon={ closeSmall }
											size={ 24 }
											aria-label={ __( 'Close Window', 'jetpack-protect' ) }
										/>
									</Button>
								</div>
								<Text
									className={ styles[ 'popover-description' ] }
									variant={ 'body' }
									mt={ 2 }
									mb={ 3 }
								>
									{ __(
										'Turn on Jetpack Firewall to automatically protect your site with the latest security rules.',
										'jetpack-protect'
									) }
								</Text>
								<div className={ styles[ 'popover-footer' ] }>
									<Button onClick={ handleClosePopoverClick }>
										{ __( 'Got it', 'jetpack-protect' ) }
									</Button>
								</div>
							</div>
						</Popover>
					) }
				</div>
				<div className={ styles[ 'toggle-section__content' ] }>
					<div className={ styles[ 'toggle-section__title' ] }>
						<Text variant="title-medium" mb={ 2 }>
							{ __( 'Enable automatic rules', 'jetpack-protect' ) }
						</Text>
						{ ! isSmall && hasRequiredPlan && displayUpgradeBadge && (
							<span className={ styles.badge }>{ __( 'NOW AVAILABLE', 'jetpack-protect' ) }</span>
						) }
					</div>
					<Text>
						{ __(
							'Protect your site against untrusted traffic sources with automatic security rules.',
							'jetpack-protect'
						) }
					</Text>
				</div>
			</div>
			{ ! hasRequiredPlan && (
				<div className={ styles[ 'upgrade-trigger-section' ] }>
					<ContextualUpgradeTrigger
						className={ styles[ 'upgrade-trigger' ] }
						description={ __( 'Setup automatic rules with one click', 'jetpack-protect' ) }
						cta={ __( 'Upgrade to enable automatic rules', 'jetpack-protect' ) }
						onClick={ getScan }
					/>
				</div>
			) }
			<div
				className={ `${ styles[ 'toggle-section' ] } ${
					! isEnabled ? styles[ 'toggle-section--disabled' ] : ''
				}` }
			>
				<div className={ styles[ 'toggle-section__control' ] }>
					<FormToggle
						id="jetpack_waf_ip_list"
						checked={ isEnabled && formState.jetpack_waf_ip_list }
						onChange={ handleManualRulesChange }
						disabled={ formIsSubmitting || ! isEnabled }
					/>
				</div>
				<div className={ styles[ 'toggle-section__content' ] }>
					<Text variant="title-medium" mb={ 2 }>
						{ __( 'Enable manual rules', 'jetpack-protect' ) }
					</Text>
					<Text>
						{ __(
							'Allows you to add manual rules to block or allow traffic from specific IPs.',
							'jetpack-protect'
						) }
					</Text>
					{ jetpackWafIpList && (
						<div className={ styles[ 'edit-manual-rules-section' ] }>
							<Text variant={ 'body-small' } mt={ 2 }>
								{ '' === jetpackWafIpAllowList &&
									'' === jetpackWafIpBlockList &&
									__( 'No manual rules are being applied.', 'jetpack-protect' ) }
							</Text>
							<Button variant={ 'link' } disabled={ ! isEnabled }>
								<Text variant={ 'body-small' } onClick={ handleShowManualRulesClick }>
									{ __( 'Edit manual rules', 'jetpack-protect' ) }
								</Text>
							</Button>
						</div>
					) }
				</div>
			</div>
		</div>
	);

	/**
	 * Manual Rules Settings
	 */
	const manualRulesSettings = (
		<div className={ styles[ 'manual-rule-wrapper' ] }>
			<Button
				className={ styles[ 'go-back-button' ] }
				variant={ 'icon' }
				icon={ arrowLeft }
				onClick={ handleShowManualRulesClick }
			>
				<Text>{ __( 'Go back', 'jetpack-protect' ) }</Text>
			</Button>
			<Text variant="title-medium" mt={ 4 } mb={ 2 }>
				{ __( 'Manual rules', 'jetpack-protect' ) }
			</Text>
			<Text mb={ 4 }>
				{ __(
					'Add manual rules for what IP traffic the Jetpack Firewall should block or allow.',
					'jetpack-protect'
				) }
			</Text>
			<div className={ styles[ 'manual-rule-section' ] }>
				<Textarea
					id="jetpack_waf_ip_block_list"
					label={ __( 'Blocked IP addresses', 'jetpack-protect' ) }
					placeholder={ __( 'Example:', 'jetpack-protect' ) + '\n12.12.12.1\n12.12.12.2' }
					rows={ 3 }
					value={ formState.jetpack_waf_ip_block_list }
					onChange={ handleChange }
					disabled={ formIsSubmitting }
				/>
			</div>
			<div className={ styles[ 'manual-rule-section' ] }>
				<Textarea
					id="jetpack_waf_ip_allow_list"
					label={ __( 'Always allowed IP addresses', 'jetpack-protect' ) }
					placeholder={ __( 'Example:', 'jetpack-protect' ) + '\n12.12.12.1\n12.12.12.2' }
					rows={ 3 }
					value={ formState.jetpack_waf_ip_allow_list }
					onChange={ handleChange }
					disabled={ formIsSubmitting }
				/>
			</div>
			<Button onClick={ saveChanges } isLoading={ formIsSubmitting } disabled={ formIsSubmitting }>
				{ __( 'Save changes', 'jetpack-protect' ) }
			</Button>
		</div>
	);

	/**
	 * Do not allow this page to be accessed on unsupported platforms.
	 */
	if ( ! isSupported ) {
		return <Navigate replace to="/" />;
	}

	/**
	 * Render
	 */
	return (
		<AdminPage>
			{ notice.message && <Notice floating={ true } dismissable={ true } { ...notice } /> }
			<ConnectedFirewallHeader />
			<Container className={ styles.container } horizontalSpacing={ 8 } horizontalGap={ 4 }>
				{ ! isEnabled && <Col>{ moduleDisabledNotice } </Col> }
				<Col>{ ! showManualRules ? mainSettings : manualRulesSettings }</Col>
			</Container>
			<FirewallFooter />
		</AdminPage>
	);
};

export default FirewallPage;
