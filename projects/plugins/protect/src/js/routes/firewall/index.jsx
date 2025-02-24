import {
	Button,
	Col,
	Container,
	Text,
	ToggleControl,
	ContextualUpgradeTrigger,
	useBreakpointMatch,
	Notice as JetpackNotice,
} from '@automattic/jetpack-components';
import { Popover } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Icon, closeSmall } from '@wordpress/icons';
import moment from 'moment';
import { useCallback, useEffect, useState, useMemo } from 'react';
import AdminPage from '../../components/admin-page';
import Textarea from '../../components/textarea';
import { FREE_PLUGIN_SUPPORT_URL, PAID_PLUGIN_SUPPORT_URL } from '../../constants';
import useWafUpgradeSeenMutation from '../../data/waf/use-waf-upgrade-seen-mutation';
import useAnalyticsTracks from '../../hooks/use-analytics-tracks';
import usePlan from '../../hooks/use-plan';
import useWafData from '../../hooks/use-waf-data';
import ScanFooter from '../scan/scan-footer';
import FirewallAdminSectionHero from './firewall-admin-section-hero';
import FirewallFooter from './firewall-footer';
import styles from './styles.module.scss';

const ADMIN_URL = window?.jetpackProtectInitialState?.adminUrl;

const FirewallPage = () => {
	const [ isSmall ] = useBreakpointMatch( [ 'sm', 'lg' ], [ null, '<' ] );
	const {
		config: {
			jetpackWafAutomaticRules,
			jetpackWafIpBlockListEnabled,
			jetpackWafIpAllowListEnabled,
			jetpackWafIpBlockList,
			jetpackWafIpAllowList,
			automaticRulesAvailable,
			bruteForceProtection: isBruteForceModuleEnabled,
		},
		currentIp,
		isEnabled: isWafModuleEnabled,
		upgradeIsSeen,
		displayUpgradeBadge,
		wafSupported,
		isUpdating,
		stats,
		toggleAutomaticRules,
		toggleIpAllowList,
		saveIpAllowList,
		toggleIpBlockList,
		saveIpBlockList,
		toggleBruteForceProtection,
		toggleWaf,
	} = useWafData();
	const { hasPlan } = usePlan();
	const { upgradePlan } = usePlan( { redirectUrl: `${ ADMIN_URL }#/firewall` } );
	const { recordEvent } = useAnalyticsTracks();
	const wafUpgradeSeenMutation = useWafUpgradeSeenMutation();
	const { automaticRulesLastUpdated } = stats;

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
		jetpack_waf_ip_block_list: jetpackWafIpBlockList,
		jetpack_waf_ip_allow_list: jetpackWafIpAllowList,
	} );

	const canEditFirewallSettings = isWafModuleEnabled && ! isUpdating;
	const canToggleAutomaticRules = isWafModuleEnabled && ( hasPlan || automaticRulesAvailable );
	const canEditIpAllowList = ! isUpdating && jetpackWafIpAllowListEnabled;
	const ipBlockListHasChanges = formState.jetpack_waf_ip_block_list !== jetpackWafIpBlockList;
	const ipAllowListHasChanges = formState.jetpack_waf_ip_allow_list !== jetpackWafIpAllowList;
	const ipBlockListHasContent = !! formState.jetpack_waf_ip_block_list;
	const ipAllowListHasContent = !! formState.jetpack_waf_ip_allow_list;
	const ipBlockListEnabled = isWafModuleEnabled && jetpackWafIpBlockListEnabled;

	/**
	 * Get Scan
	 *
	 * Records an event and then starts the checkout flow for Jetpack Scan
	 */
	const getScan = useCallback( () => {
		recordEvent( 'jetpack_protect_waf_page_get_scan_link_click' );
		upgradePlan();
	}, [ recordEvent, upgradePlan ] );

	/**
	 * Handle Change
	 *
	 * Syncs change events from a form element to formState.
	 *
	 * @param {Event} event - The form control's change event.
	 * @return void
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
	 * @return void
	 */
	const handleAutomaticRulesChange = useCallback( () => {
		setFormState( prevState => ( {
			...prevState,
			jetpack_waf_automatic_rules: ! prevState.jetpack_waf_automatic_rules,
		} ) );

		try {
			toggleAutomaticRules();
			setAutomaticRulesInstallationError( false );
		} catch {
			setAutomaticRulesInstallationError( true );
			setFormState( prevState => ( {
				...prevState,
				jetpack_waf_automatic_rules: ! prevState.jetpack_waf_automatic_rules,
			} ) );
		}
	}, [ toggleAutomaticRules ] );

	/**
	 * Save IP Block List Changes
	 *
	 * Updates the WAF settings with the current form state values.
	 *
	 * @return void
	 */
	const saveIpBlockListChanges = useCallback( async () => {
		await saveIpBlockList( formState.jetpack_waf_ip_block_list );
	}, [ saveIpBlockList, formState.jetpack_waf_ip_block_list ] );

	/**
	 * Save IP Allow List Changes
	 *
	 * Updates the WAF settings with the current form state values.
	 *
	 * @return void
	 */
	const saveIpAllowListChanges = useCallback( async () => {
		await saveIpAllowList( formState.jetpack_waf_ip_allow_list );
	}, [ saveIpAllowList, formState.jetpack_waf_ip_allow_list ] );

	/**
	 * Handle Close Popover Click
	 *
	 * Sets user meta for post upgrade messaging
	 *
	 * @return void
	 */
	const handleClosePopoverClick = useCallback( () => {
		wafUpgradeSeenMutation.mutate();
	}, [ wafUpgradeSeenMutation ] );

	/**
	 * Checks if the current IP address is allow listed.
	 *
	 * @return {boolean} - Indicates whether the current IP address is allow listed.
	 */
	const isCurrentIpAllowed = useMemo( () => {
		return formState.jetpack_waf_ip_allow_list?.includes( currentIp );
	}, [ formState.jetpack_waf_ip_allow_list, currentIp ] );

	/**
	 * Adds the current IP address to the IP allow list.
	 *
	 * @return {void}
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
				jetpack_waf_ip_block_list: jetpackWafIpBlockList,
				jetpack_waf_ip_allow_list: jetpackWafIpAllowList,
			} );
		}
	}, [ jetpackWafIpBlockList, jetpackWafIpAllowList, isUpdating ] );

	// Track view for Protect WAF page.
	useAnalyticsTracks( {
		pageViewEventName: 'protect_waf',
		pageViewEventProperties: {
			has_plan: hasPlan,
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
					key="enable"
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
					<ToggleControl
						checked={ canToggleAutomaticRules ? jetpackWafAutomaticRules : false }
						onChange={ handleAutomaticRulesChange }
						disabled={ ! canEditFirewallSettings || ! canToggleAutomaticRules || isUpdating }
					/>
					{ hasPlan && upgradeIsSeen === false && (
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
										'Turn on Automatic firewall protection to apply the latest security rules.',
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
							{ __( 'Automatic firewall protection', 'jetpack-protect' ) }
						</Text>
						{ ! isSmall && hasPlan && displayUpgradeBadge && (
							<span className={ styles.badge }>{ __( 'NOW AVAILABLE', 'jetpack-protect' ) }</span>
						) }
					</div>
					<Text>
						{ __(
							'Block untrusted traffic by scanning every request made to your site. Jetpack’s security rules are always up-to-date to protect against the latest threats.',
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
									{ __( 'Failed to update automatic firewall rules.', 'jetpack-protect' ) }
								</Text>
								<Button
									variant={ 'link' }
									href={ hasPlan ? PAID_PLUGIN_SUPPORT_URL : FREE_PLUGIN_SUPPORT_URL }
								>
									<Text variant={ 'body-small' }>
										{ __( 'Contact support', 'jetpack-protect' ) }
									</Text>
								</Button>
							</>
						) }
					</div>
				</div>
			</div>
			{ ! hasPlan && (
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

	const bruteForceProtectionSettings = (
		<div className={ styles[ 'toggle-section' ] }>
			<div className={ styles[ 'toggle-section__control' ] }>
				<ToggleControl
					checked={ isBruteForceModuleEnabled }
					onChange={ toggleBruteForceProtection }
					disabled={ isUpdating }
				/>
			</div>
			<div className={ styles[ 'toggle-section__content' ] }>
				<Text variant="title-medium" mb={ 2 }>
					{ __( 'Brute force protection', 'jetpack-protect' ) }
				</Text>
				<Text>
					{ __(
						'Prevent bots and hackers from attempting to log in to your website with common username and password combinations.',
						'jetpack-protect'
					) }
				</Text>
			</div>
		</div>
	);

	const ipBlockListSettings = (
		<div
			className={ `${ styles[ 'toggle-section' ] } ${
				! isWafModuleEnabled ? styles[ 'toggle-section--disabled' ] : ''
			}` }
		>
			<div className={ styles[ 'toggle-section__control' ] }>
				<ToggleControl
					checked={ ipBlockListEnabled }
					onChange={ toggleIpBlockList }
					disabled={ ! canEditFirewallSettings }
				/>
			</div>
			<div className={ styles[ 'toggle-section__content' ] }>
				<Text variant="title-medium" mb={ 2 }>
					{ __( 'Block IP addresses', 'jetpack-protect' ) }
				</Text>
				<Text mb={ 1 }>
					{ __(
						'Stop specific visitors from accessing your site by their IP address.',
						'jetpack-protect'
					) }
				</Text>
				{ ( ipBlockListEnabled || ipBlockListHasContent ) && (
					<div className={ styles[ 'manual-rules-section' ] }>
						<Textarea
							id="jetpack_waf_ip_block_list"
							placeholder={ __( 'Example:', 'jetpack-protect' ) + '\n12.12.12.1\n12.12.12.2' }
							rows={ 3 }
							value={ formState.jetpack_waf_ip_block_list }
							onChange={ handleChange }
							disabled={ ! canEditFirewallSettings || ! ipBlockListEnabled }
						/>
						{ ipBlockListEnabled && (
							<Text variant="body-extra-small" mt={ 1 }>
								{ __(
									'IPv4 and IPv6 supported. Separate IPs with commas, spaces, or new lines. To specify a range, use CIDR notation (i.e. 12.12.12.0/24) or enter the low value and high value separated by a dash (i.e. 12.12.12.0–12.12.12.255).',
									'jetpack-protect'
								) }
							</Text>
						) }
					</div>
				) }
				{ ipBlockListEnabled && (
					<div className={ styles[ 'block-list-button-container' ] }>
						<Button
							onClick={ saveIpBlockListChanges }
							isLoading={ isUpdating }
							disabled={ ! canEditFirewallSettings || ! ipBlockListHasChanges }
						>
							{ __( 'Save block list', 'jetpack-protect' ) }
						</Button>
					</div>
				) }
			</div>
		</div>
	);

	const ipAllowListSettings = (
		<>
			<div className={ styles[ 'toggle-section' ] }>
				<div className={ styles[ 'toggle-section__control' ] }>
					<ToggleControl
						checked={ jetpackWafIpAllowListEnabled }
						onChange={ toggleIpAllowList }
						disabled={ isUpdating }
					/>
				</div>
				<div className={ styles[ 'toggle-section__content' ] }>
					<Text variant="title-medium" mb={ 2 }>
						{ __( 'Trusted IP addresses', 'jetpack-protect' ) }
					</Text>
					<Text mb={ 1 }>
						{ __(
							'IP addresses added to this list are always allowed to access your site, regardless of any other Jetpack security settings.',
							'jetpack-protect'
						) }
					</Text>
					{ ( jetpackWafIpAllowListEnabled || ipAllowListHasContent ) && (
						<div className={ styles[ 'manual-rules-section' ] }>
							<Textarea
								id="jetpack_waf_ip_allow_list"
								placeholder={ __( 'Example:', 'jetpack-protect' ) + '\n12.12.12.1\n12.12.12.2' }
								rows={ 3 }
								value={ formState.jetpack_waf_ip_allow_list }
								onChange={ handleChange }
								disabled={ ! canEditIpAllowList }
							/>
							{ jetpackWafIpAllowListEnabled && (
								<Text variant="body-extra-small" mt={ 1 }>
									{ __(
										'IPv4 and IPv6 supported. Separate IPs with commas, spaces, or new lines. To specify a range, use CIDR notation (i.e. 12.12.12.0/24) or enter the low value and high value separated by a dash (i.e. 12.12.12.0–12.12.12.255).',
										'jetpack-protect'
									) }
								</Text>
							) }
						</div>
					) }
					{ jetpackWafIpAllowListEnabled && (
						<div className={ styles[ 'allow-list-button-container' ] }>
							<div>
								<Text variant="body-small" className={ styles[ 'allow-list-current-ip' ] }>
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
									disabled={ ! canEditIpAllowList || isCurrentIpAllowed || isUpdating }
								>
									{ __( '+ Add to Allow List', 'jetpack-protect' ) }
								</Button>
							</div>
							<Button
								onClick={ saveIpAllowListChanges }
								isLoading={ isUpdating }
								disabled={ isUpdating || ! ipAllowListHasChanges }
							>
								{ __( 'Save allow list', 'jetpack-protect' ) }
							</Button>
						</div>
					) }
				</div>
			</div>
		</>
	);

	/**
	 * Render
	 */
	return (
		<AdminPage>
			<FirewallAdminSectionHero />
			<Container className={ styles.container } horizontalSpacing={ 8 } horizontalGap={ 4 }>
				{ wafSupported && ! isWafModuleEnabled && <Col>{ moduleDisabledNotice } </Col> }
				<Col>
					<div className={ styles[ 'toggle-wrapper' ] }>
						{ wafSupported && automaticRulesSettings }
						{ bruteForceProtectionSettings }
						{ wafSupported && (
							<>
								{ ipBlockListSettings }
								<div className={ styles.divider }></div>
							</>
						) }
						{ ipAllowListSettings }
					</div>
				</Col>
			</Container>
			{ wafSupported ? <FirewallFooter /> : <ScanFooter /> }
		</AdminPage>
	);
};

export default FirewallPage;
