import { Button, Text, useBreakpointMatch, getRedirectUrl } from '@automattic/jetpack-components';
import { ExternalLink } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import React, { useCallback } from 'react';
import { STORE_ID } from '../../store';
import ToggleSection from '../toggle-section';
import { SocialStoreSelectors } from '../types/types';
import styles from './styles.module.scss';
import { BlazeModuleToggleProps } from './types';

const BlazeModuleToggle: React.FC< BlazeModuleToggleProps > = ( { adminUrl = null } ) => {
	const { isModuleEnabled, isUpdating } = useSelect( select => {
		const store = select( STORE_ID ) as SocialStoreSelectors;
		return {
			isModuleEnabled: store.isModuleEnabled(),
			isUpdating: store.isUpdatingJetpackSettings(),
		};
	}, [] );

	const updateOptions = useDispatch( STORE_ID ).updateJetpackSettings;

	const toggleModule = useCallback( () => {
		const newOption = {
			blaze_active: ! isModuleEnabled,
		};
		updateOptions( newOption );
	}, [ isModuleEnabled, updateOptions ] );

	const [ isSmall ] = useBreakpointMatch( 'sm' );

	return (
		<ToggleSection
			title={ __( 'Attract high-quality traffic to your site using Blaze', 'jetpack-social' ) }
			disabled={ isUpdating }
			checked={ isModuleEnabled }
			onChange={ toggleModule }
		>
			<Text className={ styles.text }>
				{ __(
					'When enabled, you’ll be able to grow your audience by promoting your content across Tumblr and WordPress.com.',
					'jetpack-social'
				) }
				&nbsp;
				<ExternalLink href={ getRedirectUrl( 'jetpack-blaze-landing' ) }>
					{ __( 'Learn more', 'jetpack-social' ) }
				</ExternalLink>
			</Text>
			<Button
				fullWidth={ isSmall }
				className={ styles.button }
				variant="secondary"
				href={ `${ adminUrl }tools.php?page=advertising` }
				disabled={ isUpdating || ! isModuleEnabled }
			>
				{ __(
					'Manage your campaigns and view your earnings in the Blaze dashboard',
					'jetpack-social'
				) }
			</Button>
		</ToggleSection>
	);
};

export default BlazeModuleToggle;
