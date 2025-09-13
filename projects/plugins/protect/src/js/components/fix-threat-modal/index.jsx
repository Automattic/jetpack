import { Button, Text } from '@automattic/jetpack-components';
import { TextControl } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { useEffect, useState } from 'react';
import useFixers from '../../hooks/use-fixers';
import useModal from '../../hooks/use-modal';
import Notice from '../notice';
import ThreatFixHeader from '../threat-fix-header';
import UserConnectionGate from '../user-connection-gate';
import styles from './styles.module.scss';

const FixThreatModal = ( { id, signature, extension, fixable, label, icon, severity } ) => {
	const { setModal } = useModal();
	const { fixThreats, isLoading: isFixersLoading } = useFixers();
	const isExtensionDeleteFixer =
		signature === 'Vulnerable.WP.Extension' && fixable && fixable.fixer === 'delete';
	const slug = extension?.slug || 'unknown-slug';
	const [ confirmationInput, setConfirmationInput ] = useState( '' );

	const handleInputChange = () => {
		return value => {
			setConfirmationInput( value );
		};
	};

	useEffect( () => {
		setConfirmationInput( '' );
	}, [ id ] );

	const handleCancelClick = () => {
		return event => {
			event.preventDefault();
			setModal( { type: null } );
		};
	};

	const handleFixClick = () => {
		return async event => {
			event.preventDefault();
			await fixThreats( [ id ] );
			setModal( { type: null } );
		};
	};

	return (
		<UserConnectionGate>
			<Text variant="title-medium" mb={ 2 }>
				{ __( 'Fix Threat', 'jetpack-protect' ) }
			</Text>
			<Text mb={ 3 }>
				{ __( 'Jetpack will be fixing the selected threat:', 'jetpack-protect' ) }
			</Text>

			<div className={ styles.list }>
				<ThreatFixHeader threat={ { id, fixable, label, icon, severity } } fixAllDialog={ false } />
			</div>

			{ isExtensionDeleteFixer && (
				<>
					{ fixable.extensionStatus === 'active' ? (
						<Notice
							type="error"
							message={
								extension?.type === 'plugin'
									? __(
											'This plugin seems to be currently active on your site. Deleting it may break your site. Please disable it first and check if your site is still working as expected, then proceed with the fix.',
											'jetpack-protect'
									  )
									: __(
											'This theme seems to be currently active on your site. Deleting it may break your site. Please disable it first and check if your site is still working as expected, then proceed with the fix.',
											'jetpack-protect',
											0 // dummy arg to avoid bad minification, See https://github.com/Automattic/i18n-check-webpack-plugin?tab=readme-ov-file#conditional-function-call-compaction
									  )
							}
						/>
					) : (
						<Notice
							type="warning"
							message={
								extension?.type === 'plugin'
									? __(
											'This plugin seems to not currently be active on your site. Please note that deleting it may still have adverse effects and this action cannot be undone.',
											'jetpack-protect'
									  )
									: __(
											'This theme seems to not currently be active on your site. Please note that deleting it may still have adverse effects and this action cannot be undone.',
											'jetpack-protect',
											0 // dummy arg to avoid bad minification
									  )
							}
						/>
					) }
					{ fixable.extras?.isDotorg === false && (
						<Text mb={ 3 } mt={ 3 }>
							{ extension?.type === 'plugin'
								? __(
										'We did not find this plugin on WordPress.org. We encourage you to create a backup of your site before fixing this threat, to keep a copy of it.',
										'jetpack-protect'
								  )
								: __(
										'We did not find this theme on WordPress.org. We encourage you to create a backup of your site before fixing this threat, to keep a copy of it.',
										'jetpack-protect',
										0 // dummy arg to avoid bad minification
								  ) }
						</Text>
					) }

					<Text mb={ 3 } mt={ 3 }>
						{ extension?.type === 'plugin'
							? createInterpolateElement(
									sprintf(
										/* translators: %s is the plugin slug itself, e.g. jetpack-protect. */
										__(
											'To confirm you have read and understood the consequences, please enter the plugin slug <code>%s</code> in the field below.',
											'jetpack-protect'
										),
										slug
									),
									{
										code: <code />,
									}
							  )
							: createInterpolateElement(
									sprintf(
										/* translators: %s is the theme slug itself, e.g. twentytwentyfive. */
										__(
											'To confirm you have read and understood the consequences, please enter the theme slug <code>%s</code> in the field below.',
											'jetpack-protect'
										),
										slug
									),
									{
										code: <code />,
									}
							  ) }
					</Text>
					<TextControl
						__nextHasNoMarginBottom
						__next40pxDefaultSize
						help=""
						label=""
						onChange={ handleInputChange() }
						value={ confirmationInput }
						className="deletion-confirmation"
						autoComplete="off"
					/>
				</>
			) }

			<div className={ styles.footer }>
				<Button variant="secondary" onClick={ handleCancelClick() }>
					{ __( 'Cancel', 'jetpack-protect' ) }
				</Button>
				{ isExtensionDeleteFixer ? (
					<Button
						variant="primary"
						isDestructive
						disabled={ confirmationInput !== slug }
						isLoading={ isFixersLoading }
						onClick={ handleFixClick() }
					>
						{ __( 'Delete now', 'jetpack-protect' ) }
					</Button>
				) : (
					<Button isLoading={ isFixersLoading } onClick={ handleFixClick() }>
						{ __( 'Fix threat', 'jetpack-protect' ) }
					</Button>
				) }
			</div>
		</UserConnectionGate>
	);
};

export default FixThreatModal;
