import { Alert } from '@automattic/jetpack-components';
import { ExternalLink } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { createInterpolateElement, useId } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { store } from '../../social-store';
import { SupportedService } from '../services/use-supported-services';
import styles from './style.module.scss';

type CustomInputsProps = {
	service: SupportedService;
};

/**
 * Custom inputs component
 * @param {CustomInputsProps} props - Component props
 *
 * @return {import('react').ReactNode} Custom inputs component
 */
export function CustomInputs( { service }: CustomInputsProps ) {
	const id = useId();

	const reconnectingAccount = useSelect( select => select( store ).getReconnectingAccount(), [] );

	if ( 'mastodon' === service.ID ) {
		return (
			<div className={ styles[ 'fields-item' ] }>
				<label htmlFor={ `${ id }-handle` }>
					{ _x(
						'Handle',
						'The handle of a social media account.',
						'jetpack-publicize-components'
					) }
				</label>
				<input
					id={ `${ id }-handle` }
					required
					type="text"
					name="instance"
					autoComplete="off"
					autoCapitalize="off"
					autoCorrect="off"
					spellCheck="false"
					aria-label={ __( 'Mastodon handle', 'jetpack-publicize-components' ) }
					aria-describedby={ `${ id }-handle-description` }
					placeholder={ '@mastodon@mastodon.social' }
				/>
				<p className="description" id={ `${ id }-handle-description` }>
					{ __(
						'You can find the handle in your Mastodon profile.',
						'jetpack-publicize-components'
					) }
				</p>
			</div>
		);
	}

	if ( 'bluesky' === service.ID ) {
		return (
			<>
				<div className={ styles[ 'fields-item' ] }>
					<label htmlFor={ `${ id }-handle` }>
						{ _x(
							'Handle',
							'The handle of a social media account.',
							'jetpack-publicize-components'
						) }
					</label>
					<input
						id={ `${ id }-handle` }
						required
						type="text"
						name="handle"
						defaultValue={
							reconnectingAccount?.service_name === 'bluesky'
								? reconnectingAccount?.external_handle
								: undefined
						}
						autoComplete="off"
						autoCapitalize="off"
						autoCorrect="off"
						spellCheck="false"
						aria-label={ __( 'Bluesky handle', 'jetpack-publicize-components' ) }
						aria-describedby={ `${ id }-handle-description` }
						placeholder={ 'username.bsky.social' }
					/>
					<p className="description" id={ `${ id }-handle-description` }>
						{ __(
							'You can find the handle in your Bluesky profile.',
							'jetpack-publicize-components'
						) }
					</p>
				</div>
				<div className={ styles[ 'fields-item' ] }>
					<label htmlFor={ `${ id }-password` }>
						{ __( 'App password', 'jetpack-publicize-components' ) }
					</label>
					<input
						id={ `${ id }-password` }
						required
						type="password"
						name="app_password"
						autoComplete="off"
						autoCapitalize="off"
						autoCorrect="off"
						spellCheck="false"
						aria-label={ __( 'App password', 'jetpack-publicize-components' ) }
						aria-describedby={ `${ id }-password-description` }
						placeholder={ 'xxxx-xxxx-xxxx-xxxx' }
					/>
					<p className="description" id={ `${ id }-password-description` }>
						{ createInterpolateElement(
							__(
								'App password is needed to safely connect your account. App password is different from your account password. You can <link>generate it in Bluesky</link>.',
								'jetpack-publicize-components'
							),
							{
								link: <ExternalLink href="https://bsky.app/settings/app-passwords" />,
							}
						) }
					</p>
					{ reconnectingAccount?.service_name === 'bluesky' && (
						<Alert level="error" showIcon={ false }>
							{ __(
								'Please provide an app password to fix the connection.',
								'jetpack-publicize-components'
							) }
						</Alert>
					) }
				</div>
			</>
		);
	}

	return null;
}
