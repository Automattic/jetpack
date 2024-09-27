import { ExternalLink } from '@wordpress/components';
import { createInterpolateElement, useId } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
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

	if ( 'mastodon' === service.ID ) {
		return (
			<div className={ styles[ 'fields-item' ] }>
				<label htmlFor={ `${ id }-handle` }>
					{ __(
						/* translators: The handle of a social media account. */
						'Handle',
						'jetpack'
					) }
				</label>
				<p className="description" id={ `${ id }-handle-description` }>
					{ __( 'You can find the handle in your Mastodon profile.', 'jetpack' ) }
				</p>
				<input
					id={ `${ id }-handle` }
					required
					type="text"
					name="instance"
					autoComplete="off"
					autoCapitalize="off"
					autoCorrect="off"
					spellCheck="false"
					aria-label={ __( 'Mastodon handle', 'jetpack' ) }
					aria-describedby={ `${ id }-handle-description` }
					placeholder={ '@mastodon@mastodon.social' }
				/>
			</div>
		);
	}

	if ( 'bluesky' === service.ID ) {
		return (
			<>
				<div className={ styles[ 'fields-item' ] }>
					<label htmlFor={ `${ id }-handle` }>
						{ __(
							/* translators: The handle of a social media account. */
							'Handle',
							'jetpack'
						) }
					</label>
					<p className="description" id={ `${ id }-handle-description` }>
						{ __( 'You can find the handle in your Bluesky profile.', 'jetpack' ) }
					</p>
					<input
						id={ `${ id }-handle` }
						required
						type="text"
						name="handle"
						autoComplete="off"
						autoCapitalize="off"
						autoCorrect="off"
						spellCheck="false"
						aria-label={ __( 'Bluesky handle', 'jetpack' ) }
						aria-describedby={ `${ id }-handle-description` }
						placeholder={ 'username.bsky.social' }
					/>
				</div>
				<div className={ styles[ 'fields-item' ] }>
					<label htmlFor={ `${ id }-password` }>{ __( 'App password', 'jetpack' ) }</label>
					<p className="description" id={ `${ id }-password-description` }>
						{ createInterpolateElement(
							__(
								'App password is needed to safely connect your account. App password is different from your account password. You can <link>generate it in Bluesky</link>.',
								'jetpack'
							),
							{
								link: <ExternalLink href="https://bsky.app/settings/app-passwords" />,
							}
						) }
					</p>
					<input
						id={ `${ id }-password` }
						required
						type="password"
						name="app_password"
						autoComplete="off"
						autoCapitalize="off"
						autoCorrect="off"
						spellCheck="false"
						aria-label={ __( 'App password', 'jetpack' ) }
						aria-describedby={ `${ id }-password-description` }
						placeholder={ 'xxxx-xxxx-xxxx-xxxx' }
					/>
				</div>
			</>
		);
	}

	return null;
}
