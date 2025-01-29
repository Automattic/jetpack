import {
	Col,
	Container,
	Text,
	ToggleControl,
	AdminSectionHero,
} from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Icon, warning } from '@wordpress/icons';
import React, { useCallback } from 'react';
import AdminPage from '../../components/admin-page';
import useAccountProtectionQuery from '../../data/account-protection/use-account-protection-query';
import useToggleAccountProtectionMutation from '../../data/account-protection/use-toggle-account-protection-module-mutation';
import useAnalyticsTracks from '../../hooks/use-analytics-tracks';
import usePlan from '../../hooks/use-plan';
import styles from './styles.module.scss';

const SettingsPage = () => {
	const { hasPlan } = usePlan();
	const { data: accountProtectionIsEnabled } = useAccountProtectionQuery();
	const toggleAccountProtectionMutation = useToggleAccountProtectionMutation();

	/**
	 * Toggle Account Protect Module
	 *
	 * Flips the switch on the Account Protection module, and then refreshes the data.
	 */
	const toggleAccountProtection = useCallback( async () => {
		toggleAccountProtectionMutation.mutate();
	}, [ toggleAccountProtectionMutation ] );

	// Track view for Protect Account Protection page.
	useAnalyticsTracks( {
		pageViewEventName: 'protect_account_protection',
		pageViewEventProperties: {
			has_plan: hasPlan,
		},
	} );

	const accountProtectionSettings = (
		<div className={ styles[ 'toggle-section' ] }>
			<div className={ styles[ 'toggle-section__control' ] }>
				<ToggleControl
					checked={ accountProtectionIsEnabled }
					onChange={ toggleAccountProtection }
					disabled={ toggleAccountProtectionMutation.isPending }
				/>
			</div>
			<div className={ styles[ 'toggle-section__content' ] }>
				<Text variant="title-medium" mb={ 2 }>
					{ __( 'Account protection', 'jetpack-protect' ) }
				</Text>
				<Text mb={ 2 } className={ styles[ 'toggle-section__description' ] }>
					{ __(
						'Enabling this setting enhances account security by detecting compromised passwords and enforcing additional verification when needed.',
						'jetpack-protect'
					) }
				</Text>
				{ ! accountProtectionIsEnabled && (
					<Text className={ styles[ 'toggle-section__warning' ] }>
						<Icon icon={ warning } />
						{ createInterpolateElement(
							__(
								'Jetpack recommends activating this setting. Please be <link>mindful of the risks.</link>',
								'jetpack-protect'
							),
							{
								link: <a href={ '#' } />, // TODO: Update this redirect URL once document exists
							}
						) }
					</Text>
				) }
			</div>
		</div>
	);

	/**
	 * Render
	 */
	return (
		<AdminPage>
			<AdminSectionHero>
				<Container className={ styles.container } horizontalSpacing={ 8 } horizontalGap={ 4 }>
					<Col>
						<div className={ styles[ 'toggle-wrapper' ] }>{ accountProtectionSettings }</div>
					</Col>
				</Container>
			</AdminSectionHero>
		</AdminPage>
	);
};

export default SettingsPage;
