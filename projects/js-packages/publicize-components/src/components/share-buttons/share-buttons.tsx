import { SocialServiceIcon, Button, Text } from '@automattic/jetpack-components';
import { CopyToClipboard } from '@automattic/jetpack-components';
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { availableNetworks } from './available-networks';
import styles from './styles.module.scss';
import { useShareButtonText } from './useShareButtonText';
import type React from 'react';

export type ShareButtonsProps = {
	buttonStyle?: 'icon' | 'text' | 'icon-text';
	buttonVariant?: React.ComponentProps< typeof Button >[ 'variant' ];
};

/**
 * Renders share buttons
 *
 * @param {ShareButtonsProps} props - Component props
 *
 * @returns {React.JSX.Element} - Rendered component
 */
export function ShareButtons( { buttonStyle = 'icon', buttonVariant }: ShareButtonsProps ) {
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
			return function onClick( event: React.MouseEvent< HTMLAnchorElement > ) {
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
		<div className={ styles[ 'share-buttons' ] }>
			{ availableNetworks.map( ( { label, networkName, url } ) => {
				const href = prepareText( url );

				const icon =
					'text' !== buttonStyle ? <SocialServiceIcon serviceName={ networkName } /> : null;

				return (
					<div className={ styles.container } key={ networkName }>
						<Button
							icon={ icon }
							variant={ buttonVariant }
							aria-label={ label }
							href={ href }
							target="_blank"
							rel="noopener noreferrer"
							onClick={ getOnClick( href ) }
							data-network={ networkName }
							className={ styles[ networkName ] }
						>
							{ 'text' === buttonStyle ? label : null }
						</Button>
						{ 'icon-text' === buttonStyle && (
							<Text className={ styles.label }>
								{ sprintf(
									/* translators: %s is the name of a social network, e.g. Twitter. */
									__( 'Share on %s', 'jetpack' ),
									label
								) }
							</Text>
						) }
					</div>
				);
			} ) }
			<div className={ styles.container }>
				<CopyToClipboard
					buttonStyle={ 'icon-text' === buttonStyle ? 'icon' : buttonStyle }
					onCopy={ onCopy }
					textToCopy={ textToCopy }
					className={ styles.clipboard }
					variant={ buttonVariant }
				/>
				{ 'icon-text' === buttonStyle && (
					<Text className={ styles.label }>{ __( 'Copy to clipboard', 'jetpack' ) }</Text>
				) }
			</div>
		</div>
	);
}
