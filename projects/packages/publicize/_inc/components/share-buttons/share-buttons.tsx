import { SocialServiceIcon, Text, CopyToClipboard } from '@automattic/jetpack-components';
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Button } from '@wordpress/ui';
import clsx from 'clsx';
import { availableNetworks } from './available-networks';
import styles from './styles.module.scss';
import { useShareButtonText } from './useShareButtonText';
import type { JSX, MouseEvent } from 'react';

export type ShareButtonsProps = {
	buttonStyle?: 'icon' | 'text' | 'icon-text';
};

/**
 * Renders share buttons
 *
 * @param {ShareButtonsProps} props - Component props
 *
 * @return {JSX.Element} - Rendered component
 */
export function ShareButtons( { buttonStyle = 'icon' }: ShareButtonsProps ) {
	const prepareText = useShareButtonText();

	const { recordEvent } = useAnalytics();

	const onCopy = useCallback( () => {
		recordEvent( 'jetpack_social_share_button_clicked', { network: 'clipboard' } );
	}, [ recordEvent ] );

	const textToCopy = useCallback(
		() => prepareText( '{{text}}\n{{url}}', false ),
		[ prepareText ]
	);

	const getOnClick = useCallback(
		function ( url: string, data?: unknown ) {
			return function onClick( event: MouseEvent< HTMLAnchorElement > ) {
				event.preventDefault();

				recordEvent( 'jetpack_social_share_button_clicked', data );

				window.open(
					url,
					'',
					'menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=600,width=600'
				);
			};
		},
		[ recordEvent ]
	);

	return (
		<div
			className={ clsx(
				styles[ 'share-buttons' ],
				// If we are showing the text, we will show the buttons vertically.
				{ [ styles.vertical ]: buttonStyle.includes( 'text' ) }
			) }
		>
			{ availableNetworks.map( ( { label, networkName, url } ) => {
				const href = prepareText( url );

				const text = sprintf(
					/* translators: %s is the name of a social network, e.g. Twitter. */
					__( 'Share on %s', 'jetpack-publicize-pkg' ),
					label
				);

				const linkProps = {
					href,
					target: '_blank',
					rel: 'noopener noreferrer',
					onClick: getOnClick( href, { network: networkName } ),
				};

				return (
					<div className={ styles.container } key={ networkName }>
						{ 'icon' === buttonStyle ? (
							<Button
								render={ <a /> }
								nativeButton={ false }
								role="link"
								aria-label={ text }
								className={ clsx( styles[ 'icon-button' ], styles[ networkName ] ) }
								{ ...linkProps }
							>
								<SocialServiceIcon serviceName={ networkName } />
							</Button>
						) : (
							<Button
								render={ <a /> }
								nativeButton={ false }
								role="link"
								aria-label={ text }
								className="has-text"
								{ ...linkProps }
							>
								{ 'icon-text' === buttonStyle && (
									<SocialServiceIcon
										className={ styles[ networkName ] }
										serviceName={ networkName }
									/>
								) }
								<Text className={ styles.label } component="span">
									{ text }
								</Text>
							</Button>
						) }
					</div>
				);
			} ) }
			<div className={ styles.container }>
				<CopyToClipboard
					buttonStyle={ buttonStyle }
					onCopy={ onCopy }
					textToCopy={ textToCopy }
					className={ 'icon' === buttonStyle ? styles.clipboard : ' has-text' }
				>
					{ 'icon' === buttonStyle ? null : (
						<Text className={ styles.label } component="span">
							{ __( 'Copy to clipboard', 'jetpack-publicize-pkg' ) }
						</Text>
					) }
				</CopyToClipboard>
			</div>
		</div>
	);
}
