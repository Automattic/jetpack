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
import { useDispatch } from '@wordpress/data';
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Icon, closeSmall } from '@wordpress/icons';
import moment from 'moment';
import { useCallback, useEffect, useState, useMemo } from 'react';
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
import ScanFooter from '../scan-footer';
import Textarea from '../textarea';
import styles from './styles.module.scss';

const ADMIN_URL = window?.jetpackProtectInitialState?.adminUrl;
const SUCCESS_NOTICE_DURATION = 5000;

const FirewallPage = () => {
	const [ isSmall ] = useBreakpointMatch( [ 'sm', 'lg' ], [ null, '<' ] );
	const { setWafIsSeen, setWafUpgradeIsSeen, setNotice } = useDispatch( STORE_ID );
	const {
		config: {
			jetpackWafAutomaticRules,
			jetpackWafIpBlockListEnabled,
			jetpackWafIpAllowListEnabled,
			jetpackWafIpBlockList,
			jetpackWafIpAllowList,
			automaticRulesAvailable,
			bruteForceProtection,
		},
		currentIp,
		isEnabled,
		isSeen,
		upgradeIsSeen,
		displayUpgradeBadge,
		wafSupported,
		isUpdating,
		stats: { automaticRulesLastUpdated },
		toggleAutomaticRules,
		toggleIpAllowList,
		toggleIpBlockList,
		toggleBruteForceProtection,
		toggleWaf,
		updateConfig,
	} = useWafData();
	const { hasRequiredPlan } = useProtectData();
	const { run: runCheckoutWorkflow } = useProductCheckoutWorkflow( {
		productSlug: JETPACK_SCAN_SLUG,
		redirectUrl: `${ ADMIN_URL }#/firewall`,
		useBlogIdSuffix: true,
	} );
	const { recordEventHandler, recordEvent } = useAnalyticsTracks();

	const canToggleAutomaticRules = isEnabled && ( hasRequiredPlan || automaticRulesAvailable );

	/**
	 * Automatic Rules Installation Error State
	 *
	 * @member {boolean} automaticRulesInstallationError - Whether or not automatic rules installation failed.
	 */
	const [ automaticRulesInstallationError, setAutomaticRulesInstallationError ] = useState( false );

	/**
	 * Form State
	 *
	 * @member {object} formState - Current form values.
	 */
	const [ formState, setFormState ] = useState( {
		jetpack_waf_automatic_rules: jetpackWafAutomaticRules,
		jetpack_waf_ip_block_list_enabled: jetpackWafIpBlockListEnabled,
		jetpack_waf_ip_allow_list_enabled: jetpackWafIpAllowListEnabled,
		jetpack_waf_ip_block_list: jetpackWafIpBlockList,
		jetpack_waf_ip_allow_list: jetpackWafIpAllowList,
		brute_force_protection: bruteForceProtection,
	} );

	const [ formIsSubmitting, setFormIsSubmitting ] = useState( false );
	const [ ipAllowListIsUpdating, setIpAllowListIsUpdating ] = useState( false );
	const [ ipBlockListIsUpdating, setIpBlockListIsUpdating ] = useState( false );

	const ipAllowListHasChanges = formState.jetpack_waf_ip_allow_list !== jetpackWafIpAllowList;
	const ipBlockListHasChanges = formState.jetpack_waf_ip_block_list !== jetpackWafIpBlockList;

	/**
	 * Get a custom error message based on the error code.
	 *
	 * @param {object} error - Error object.
	 * @returns string|bool Custom error message or false if no custom message exists.
	 */
	const getCustomErrorMessage = useCallback( error => {
		switch ( error.code ) {
			case 'file_system_error':
				return __( 'A filesystem error occurred.', 'jetpack-protect' );
			case 'rules_api_error':
				return __(
					'An error occurred retrieving the latest firewall rules from Jetpack.',
					'jetpack-protect'
				);
			default:
				return false;
		}
	}, [] );

	/**
	 * Handle errors returned by the API.
	 */
	const handleApiError = useCallback(
		error => {
			const errorMessage =
				getCustomErrorMessage( error ) || __( 'An error occurred.', 'jetpack-protect' );
			const supportMessage = createInterpolateElement(
				__( 'Please try again or <supportLink>contact support</supportLink>.', 'jetpack-protect' ),
				{
					supportLink: <ExternalLink href={ PLUGIN_SUPPORT_URL } />,
				}
			);

			setNotice( {
				type: 'error',
				message: (
					<>
						{ errorMessage } { supportMessage }
					</>
				),
			} );
		},
		[ getCustomErrorMessage, setNotice ]
	);

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
	 * Save IP Allow List Changes
	 *
	 * Updates the WAF settings with the current form state values.
	 *
	 * @returns void
	 */
	const saveIpAllowListChanges = useCallback( () => {
		setFormIsSubmitting( true );
		setIpAllowListIsUpdating( true );
		updateConfig( formState )
			.then( () =>
				setNotice( {
					type: 'success',
					duration: SUCCESS_NOTICE_DURATION,
					message: __( 'Allow list changes saved.', 'jetpack-protect' ),
				} )
			)
			.catch( handleApiError )
			.finally( () => {
				setFormIsSubmitting( false );
				setIpAllowListIsUpdating( false );
			} );
	}, [ updateConfig, formState, handleApiError, setNotice ] );

	/**
	 * Save IP Block List Changes
	 *
	 * Updates the WAF settings with the current form state values.
	 *
	 * @returns void
	 */
	const saveIpBlockListChanges = useCallback( () => {
		setFormIsSubmitting( true );
		setIpBlockListIsUpdating( true );
		updateConfig( formState )
			.then( () =>
				setNotice( {
					type: 'success',
					duration: SUCCESS_NOTICE_DURATION,
					message: __( 'Block list changes saved.', 'jetpack-protect' ),
				} )
			)
			.catch( handleApiError )
			.finally( () => {
				setFormIsSubmitting( false );
				setIpBlockListIsUpdating( false );
			} );
	}, [ updateConfig, formState, handleApiError, setNotice ] );

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
			.then( () => {
				setAutomaticRulesInstallationError( false );
				setNotice( {
					type: 'success',
					duration: SUCCESS_NOTICE_DURATION,
					message: newValue
						? __( `Automatic firewall protection is enabled.`, 'jetpack-protect' )
						: __(
								`Automatic firewall protection is disabled.`,
								'jetpack-protect',
								/* dummy arg to avoid bad minification */ 0
						  ),
				} );
				recordEvent(
					newValue
						? 'jetpack_protect_automatic_rules_enabled'
						: 'jetpack_protect_automatic_rules_disabled'
				);
			} )
			.then( () => {
				if ( ! upgradeIsSeen ) {
					setWafUpgradeIsSeen( true );
					API.wafUpgradeSeen();
				}
			} )
			.catch( error => {
				setAutomaticRulesInstallationError( true );
				handleApiError( error );
			} )
			.finally( () => setFormIsSubmitting( false ) );
	}, [
		formState,
		toggleAutomaticRules,
		setNotice,
		recordEvent,
		upgradeIsSeen,
		setWafUpgradeIsSeen,
		handleApiError,
	] );

	/**
	 * Handle Brute Force Protection Change
	 *
	 * Toggles the brute force protection module.
	 *
	 * @returns void
	 */
	const handleBruteForceProtectionChange = useCallback( () => {
		setFormIsSubmitting( true );
		const newValue = ! formState.brute_force_protection;
		setFormState( {
			...formState,
			brute_force_protection: newValue,
		} );
		toggleBruteForceProtection()
			.then( () => {
				setNotice( {
					type: 'success',
					duration: SUCCESS_NOTICE_DURATION,
					message: newValue
						? __( `Brute force protection is enabled.`, 'jetpack-protect' )
						: __(
								`Brute force protection is disabled.`,
								'jetpack-protect',
								/* dummy arg to avoid bad minification */ 0
						  ),
				} );
				recordEvent(
					newValue
						? 'jetpack_protect_brute_force_protection_enabled'
						: 'jetpack_protect_brute_force_protection_disabled'
				);
			} )
			.catch( handleApiError )
			.finally( () => setFormIsSubmitting( false ) );
	}, [ formState, toggleBruteForceProtection, handleApiError, setNotice, recordEvent ] );

	/**
	 * Handle IP Allow List Change
	 *
	 * Toggles the WAF's IP allow list option.
	 *
	 * @returns void
	 */
	const handleIpAllowListChange = useCallback( () => {
		const newIpAllowListStatus = ! formState.jetpack_waf_ip_allow_list_enabled;
		setFormIsSubmitting( true );
		setIpAllowListIsUpdating( true );
		setFormState( { ...formState, jetpack_waf_ip_allow_list_enabled: newIpAllowListStatus } );
		toggleIpAllowList()
			.then( () => {
				setNotice( {
					type: 'success',
					duration: SUCCESS_NOTICE_DURATION,
					message: newIpAllowListStatus
						? __( 'Allow list active.', 'jetpack-protect' )
						: __(
								'Allow list is disabled.',
								'jetpack-protect',
								/* dummy arg to avoid bad minification */ 0
						  ),
				} );
				recordEvent(
					newIpAllowListStatus
						? 'jetpack_protect_ip_allow_list_enabled'
						: 'jetpack_protect_ip_allow_list_disabled'
				);
			} )
			.catch( handleApiError )
			.finally( () => {
				setFormIsSubmitting( false );
				setIpAllowListIsUpdating( false );
			} );
	}, [ formState, toggleIpAllowList, handleApiError, setNotice, recordEvent ] );

	/**
	 * Handle IP Block List Change
	 *
	 * Toggles the WAF's IP block list option.
	 *
	 * @returns void
	 */
	const handleIpBlockListChange = useCallback( () => {
		const newIpBlockListStatus = ! formState.jetpack_waf_ip_block_list_enabled;
		setFormIsSubmitting( true );
		setIpBlockListIsUpdating( true );
		setFormState( { ...formState, jetpack_waf_ip_block_list_enabled: newIpBlockListStatus } );
		toggleIpBlockList()
			.then( () => {
				setNotice( {
					type: 'success',
					duration: SUCCESS_NOTICE_DURATION,
					message: newIpBlockListStatus
						? __( 'Block list is active.', 'jetpack-protect' )
						: __(
								'Block list is disabled.',
								'jetpack-protect',
								/* dummy arg to avoid bad minification */ 0
						  ),
				} );
				recordEvent(
					newIpBlockListStatus
						? 'jetpack_protect_ip_block_list_enabled'
						: 'jetpack_protect_ip_block_list_disabled'
				);
			} )
			.catch( handleApiError )
			.finally( () => {
				setFormIsSubmitting( false );
				setIpBlockListIsUpdating( false );
			} );
	}, [ formState, toggleIpBlockList, handleApiError, setNotice, recordEvent ] );

	/**
	 * Handle Close Popover Click
	 *
	 * Sets user meta for post upgrade messaging
	 *
	 * @returns void
	 */
	const handleClosePopoverClick = useCallback( () => {
		setWafUpgradeIsSeen( true );
		API.wafUpgradeSeen();
	}, [ setWafUpgradeIsSeen ] );

	/**
	 * Checks if the current IP address is allow listed.
	 *
	 * @returns {boolean} - Indicates whether the current IP address is allow listed.
	 */
	const isCurrentIpAllowed = useMemo( () => {
		return formState.jetpack_waf_ip_allow_list.includes( currentIp );
	}, [ formState.jetpack_waf_ip_allow_list, currentIp ] );

	/**
	 * Adds the current IP address to the IP allow list.
	 *
	 * @returns {void}
	 */
	const addCurrentIpToAllowList = useCallback( () => {
		const updatedList =
			formState.jetpack_waf_ip_allow_list.length > 0
				? `${ formState.jetpack_waf_ip_allow_list }\n${ currentIp }`
				: currentIp;

		setFormState( prevState => ( {
			...prevState,
			jetpack_waf_ip_allow_list: updatedList,
		} ) );
	}, [ formState.jetpack_waf_ip_allow_list, currentIp ] );

	/**
	 * Sync formState with application state WAF config
	 */
	useEffect( () => {
		if ( ! isUpdating ) {
			setFormState( {
				jetpack_waf_automatic_rules: jetpackWafAutomaticRules,
				jetpack_waf_ip_block_list_enabled: jetpackWafIpBlockListEnabled,
				jetpack_waf_ip_allow_list_enabled: jetpackWafIpAllowListEnabled,
				jetpack_waf_ip_block_list: jetpackWafIpBlockList,
				jetpack_waf_ip_allow_list: jetpackWafIpAllowList,
				brute_force_protection: bruteForceProtection,
			} );
		}
	}, [
		jetpackWafIpBlockListEnabled,
		jetpackWafIpAllowListEnabled,
		jetpackWafIpBlockList,
		jetpackWafIpAllowList,
		jetpackWafAutomaticRules,
		bruteForceProtection,
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

	/**
	 * Disable block list if WAF is disabled
	 */
	useEffect( () => {
		if ( ! isEnabled && jetpackWafIpBlockListEnabled ) {
			toggleIpBlockList();
		}
	}, [ isEnabled, jetpackWafIpBlockListEnabled, toggleIpBlockList ] );

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

	/**
	 * Automatic Firewall Rules Settings
	 */
	const automaticRulesSettings = (
		<>
			<div
				className={ `${ styles[ 'toggle-section' ] } ${
					! canToggleAutomaticRules ? styles[ 'toggle-section--disabled' ] : ''
				}` }
			>
				<div className={ styles[ 'toggle-section__control' ] }>
					<FormToggle
						checked={ canToggleAutomaticRules ? formState.jetpack_waf_automatic_rules : false }
						onChange={ handleAutomaticRulesChange }
						disabled={ ! isEnabled || formIsSubmitting || ! canToggleAutomaticRules }
					/>
					{ hasRequiredPlan && upgradeIsSeen === false && (
						<Popover noArrow={ false } offset={ 8 } position={ 'top right' } inline={ true }>
							<div className={ styles.popover }>
								<div className={ styles.popover__header }>
									<Text className={ styles.popover__title } variant={ 'title-small' }>
										{ __( 'Thanks for upgrading!', 'jetpack-protect' ) }
									</Text>
									<Button className={ styles.popover__button } variant={ 'icon' }>
										<Icon
											onClick={ handleClosePopoverClick }
											icon={ closeSmall }
											size={ 24 }
											aria-label={ __( 'Close Window', 'jetpack-protect' ) }
										/>
									</Button>
								</div>
								<Text
									className={ styles.popover__description }
									variant={ 'body' }
									mt={ 2 }
									mb={ 3 }
								>
									{ __(
										'Turn on Jetpack Firewall to automatically protect your site with the latest security rules.',
										'jetpack-protect'
									) }
								</Text>
								<div className={ styles.popover__footer }>
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
							{ __( 'Enable automatic firewall protection', 'jetpack-protect' ) }
						</Text>
						{ ! isSmall && hasRequiredPlan && displayUpgradeBadge && (
							<span className={ styles.badge }>{ __( 'NOW AVAILABLE', 'jetpack-protect' ) }</span>
						) }
					</div>
					<Text>
						{ __(
							'Block untrusted traffic sources by scanning every request made to your site. Jetpack’s advanced security rules are automatically kept up-to-date to protect your site from the latest threats.',
							'jetpack-protect'
						) }
					</Text>
					<div className={ styles[ 'toggle-section__details' ] }>
						{ jetpackWafAutomaticRules &&
							automaticRulesLastUpdated &&
							! automaticRulesInstallationError && (
								<div className={ styles[ 'automatic-rules-stats' ] }>
									<Text
										className={ styles[ 'automatic-rules-stats__version' ] }
										variant={ 'body-small' }
									>
										{ __( 'Automatic security rules installed.', 'jetpack-protect' ) }
									</Text>
									<Text
										className={ styles[ 'automatic-rules-stats__last-updated' ] }
										variant={ 'body-small' }
									>
										{ sprintf(
											// translators: placeholder is the date latest rules were updated i.e. "September 23, 2022".
											__( 'Last updated on %s.', 'jetpack-protect' ),
											moment.unix( automaticRulesLastUpdated ).format( 'MMMM D, YYYY' )
										) }
									</Text>
								</div>
							) }
						{ automaticRulesInstallationError && (
							<>
								<Text
									className={ styles[ 'automatic-rules-stats__failed-install' ] }
									variant={ 'body-small' }
									mt={ 2 }
								>
									{ __( 'Failed to update automatic firewall rules.', 'jetpack-protect' ) }{ ' ' }
									{ getCustomErrorMessage( automaticRulesInstallationError ) }
								</Text>
								<Button variant={ 'link' } href={ PLUGIN_SUPPORT_URL }>
									<Text variant={ 'body-small' }>
										{ __( 'Contact support', 'jetpack-protect' ) }
									</Text>
								</Button>
							</>
						) }
					</div>
				</div>
			</div>
			{ ! hasRequiredPlan && (
				<div className={ styles[ 'upgrade-trigger-section' ] }>
					<ContextualUpgradeTrigger
						className={ styles[ 'upgrade-trigger' ] }
						description={
							! canToggleAutomaticRules
								? __( 'Set up automatic rules with one click', 'jetpack-protect' )
								: __(
										'Your site is not receiving the latest updates to automatic rules',
										'jetpack-protect',
										/* dummy arg to avoid bad minification */ 0
								  )
						}
						cta={
							! canToggleAutomaticRules
								? __( 'Upgrade to enable automatic firewall protection', 'jetpack-protect' )
								: __(
										'Upgrade to keep your site secure with up-to-date firewall rules',
										'jetpack-protect',
										/* dummy arg to avoid bad minification */ 0
								  )
						}
						onClick={ getScan }
					/>
				</div>
			) }
		</>
	);

	const bruteForceAllowListSettings = (
		<>
			<div className={ styles[ 'brute-force-rules-section' ] }>
				<Textarea
					id="jetpack_waf_ip_allow_list"
					label={ __( 'Always allowed IP addresses', 'jetpack-protect' ) }
					description={
						<>
							<Text mb={ 1 }>
								{ __(
									"IP addresses added to this list will never be blocked by Jetpack's brute force protection.",
									'jetpack-protect'
								) }
							</Text>
							<div className={ styles[ 'current-ip-text' ] }>
								<Text variant="body-small" mb={ 1 }>
									{ createInterpolateElement(
										sprintf(
											// translators: placeholder is the user's current IP address.
											__( 'Your current IP: <strong>%s</strong>', 'jetpack-protect' ),
											currentIp
										),
										{
											strong: <strong />,
										}
									) }
								</Text>
								<Button
									variant={ 'secondary' }
									size={ 'small' }
									onClick={ addCurrentIpToAllowList }
									disabled={ formIsSubmitting || isCurrentIpAllowed }
								>
									{ __( '+ Add to Allow List', 'jetpack-protect' ) }
								</Button>
							</div>
						</>
					}
					placeholder={ __( 'Example:', 'jetpack-protect' ) + '\n12.12.12.1\n12.12.12.2' }
					rows={ 3 }
					value={ formState.jetpack_waf_ip_allow_list }
					onChange={ handleChange }
					disabled={ formIsSubmitting }
				/>
			</div>
			<div className={ styles[ 'button-container' ] }>
				<Button
					onClick={ saveIpAllowListChanges }
					size={ 'small' }
					isLoading={ ipAllowListIsUpdating }
					disabled={ formIsSubmitting || ! ipAllowListHasChanges }
				>
					{ __( 'Save allow list', 'jetpack-protect' ) }
				</Button>
			</div>
		</>
	);

	const bruteForceProtectionSettings = (
		<>
			<div className={ styles[ 'toggle-section' ] }>
				<div className={ styles[ 'toggle-section__control' ] }>
					<FormToggle
						id="brute_force_protection"
						checked={ formState.brute_force_protection }
						onChange={ handleBruteForceProtectionChange }
						disabled={ formIsSubmitting }
					/>
				</div>
				<div className={ styles[ 'toggle-section__content' ] }>
					<Text variant="title-medium" mb={ 2 }>
						{ __( 'Enable brute force protection', 'jetpack-protect' ) }
					</Text>
					<Text>
						{ __(
							'Prevent bots and hackers from attempting to log in to your website with common username and password combinations.',
							'jetpack-protect'
						) }
					</Text>
				</div>
			</div>
			{ ! wafSupported && formState.brute_force_protection && bruteForceAllowListSettings }
		</>
	);

	const manualRulesSettings = (
		<>
			<div
				className={ `${ styles[ 'toggle-section' ] } ${
					! bruteForceProtection && ! isEnabled ? styles[ 'toggle-section--disabled' ] : ''
				}` }
			>
				<div className={ styles[ 'toggle-section__control' ] }>
					<FormToggle
						id="jetpack_waf_ip_allow_list_enabled"
						checked={
							( isEnabled || bruteForceProtection ) && formState.jetpack_waf_ip_allow_list_enabled
						}
						onChange={ handleIpAllowListChange }
						disabled={ formIsSubmitting || ( ! isEnabled && ! bruteForceProtection ) }
					/>
				</div>
				<div className={ styles[ 'toggle-section__content' ] }>
					<Text variant="title-medium" mb={ 2 }>
						{ __( 'Always allow specific IP addresses', 'jetpack-protect' ) }
					</Text>
					<div className={ styles[ 'manual-rules-section' ] }>
						<Textarea
							id="jetpack_waf_ip_allow_list"
							description={
								<div className={ styles[ 'current-ip-text' ] }>
									<Text variant="body-small" mb={ 1 }>
										{ createInterpolateElement(
											sprintf(
												// translators: placeholder is the user's current IP address.
												__( 'Your current IP: <strong>%s</strong>', 'jetpack-protect' ),
												currentIp
											),
											{
												strong: <strong />,
											}
										) }
									</Text>
									<Button
										variant={ 'secondary' }
										size={ 'small' }
										onClick={ addCurrentIpToAllowList }
										disabled={
											formIsSubmitting ||
											isCurrentIpAllowed ||
											! formState.jetpack_waf_ip_allow_list_enabled
										}
									>
										{ __( '+ Add to Allow List', 'jetpack-protect' ) }
									</Button>
								</div>
							}
							placeholder={ __( 'Example:', 'jetpack-protect' ) + '\n12.12.12.1\n12.12.12.2' }
							rows={ 3 }
							value={ formState.jetpack_waf_ip_allow_list }
							onChange={ handleChange }
							disabled={ formIsSubmitting || ! formState.jetpack_waf_ip_allow_list_enabled }
						/>
					</div>
					<div className={ styles[ 'button-container' ] }>
						<Button
							onClick={ saveIpAllowListChanges }
							size={ 'small' }
							isLoading={ ipAllowListIsUpdating }
							disabled={ formIsSubmitting || ! ipAllowListHasChanges }
						>
							{ __( 'Save allow list', 'jetpack-protect' ) }
						</Button>
					</div>
				</div>
			</div>
			<div
				className={ `${ styles[ 'toggle-section' ] } ${
					! isEnabled ? styles[ 'toggle-section--disabled' ] : ''
				}` }
			>
				<div className={ styles[ 'toggle-section__control' ] }>
					<FormToggle
						id="jetpack_waf_ip_block_list_enabled"
						checked={ isEnabled && formState.jetpack_waf_ip_block_list_enabled }
						onChange={ handleIpBlockListChange }
						disabled={ formIsSubmitting || ! isEnabled }
					/>
				</div>
				<div className={ styles[ 'toggle-section__content' ] }>
					<Text variant="title-medium" mb={ 2 }>
						{ __( 'Block specific IP addresses from accessing your site', 'jetpack-protect' ) }
					</Text>
					<div className={ styles[ 'manual-rules-section' ] }>
						<Textarea
							id="jetpack_waf_ip_block_list"
							placeholder={ __( 'Example:', 'jetpack-protect' ) + '\n12.12.12.1\n12.12.12.2' }
							rows={ 3 }
							value={ formState.jetpack_waf_ip_block_list }
							onChange={ handleChange }
							disabled={
								formIsSubmitting || ! isEnabled || ! formState.jetpack_waf_ip_block_list_enabled
							}
						/>
					</div>
					<div className={ styles[ 'button-container' ] }>
						<Button
							onClick={ saveIpBlockListChanges }
							size={ 'small' }
							isLoading={ ipBlockListIsUpdating }
							disabled={ formIsSubmitting || ! ipBlockListHasChanges }
						>
							{ __( 'Save block list', 'jetpack-protect' ) }
						</Button>
					</div>
				</div>
			</div>
		</>
	);

	/**
	 * Render
	 */
	return (
		<AdminPage>
			<ConnectedFirewallHeader />
			<Container className={ styles.container } horizontalSpacing={ 8 } horizontalGap={ 4 }>
				{ wafSupported && ! isEnabled && <Col>{ moduleDisabledNotice } </Col> }
				<Col>
					<div className={ styles[ 'toggle-wrapper' ] }>
						{ wafSupported && automaticRulesSettings }
						{ bruteForceProtectionSettings }
						{ wafSupported && manualRulesSettings }
					</div>
				</Col>
			</Container>
			{ wafSupported ? <FirewallFooter /> : <ScanFooter /> }
		</AdminPage>
	);
};

export default FirewallPage;
