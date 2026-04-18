import {
	SocialServiceIcon,
	Button,
	Text,
	ClipboardIcon,
	CheckmarkIcon,
} from '@automattic/jetpack-components';
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { useCopyToClipboard } from '@wordpress/compose';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import clsx from 'clsx';
import { availableNetworks } from './available-networks';
import styles from './styles.module.scss';
import { useShareButtonText } from './useShareButtonText';
import type { ComponentProps, JSX, MouseEvent } from 'react';

export type ShareButtonsProps = {
	buttonStyle?: 'icon' | 'text' | 'icon-text';
	buttonVariant?: ComponentProps< typeof Button >[ 'variant' ];
};

/**
 * Renders share buttons
 *
 * @param {ShareButtonsProps} props - Component props
 *
 * @return {JSX.Element} - Rendered component
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

				const icon =
					'icon' === buttonStyle ? <SocialServiceIcon serviceName={ networkName } /> : null;

				const text = sprintf(
					/* translators: %s is the name of a social network, e.g. Twitter. */
					__( 'Share on %s', 'jetpack-publicize-pkg' ),
					label
				);

				return (
					<div className={ styles.container } key={ networkName }>
						<Button
							icon={ icon }
							variant={ buttonVariant }
							aria-label={ text }
							href={ href }
							target="_blank"
							rel="noopener noreferrer"
							onClick={ getOnClick( href, { network: networkName } ) }
							className={ 'icon' === buttonStyle ? styles[ networkName ] : 'has-text' }
						>
							{ 'icon' === buttonStyle ? null : (
								<>
									{ 'icon-text' === buttonStyle && (
										<SocialServiceIcon
											className={ styles[ networkName ] }
											serviceName={ networkName }
										/>
									) }
									<Text className={ styles.label } component="span">
										{ text }
									</Text>
								</>
							) }
						</Button>
					</div>
				);
			} ) }
			<div className={ styles.container }>
				<ShareCopyButton
					buttonStyle={ buttonStyle }
					buttonVariant={ buttonVariant }
					onCopy={ onCopy }
					textToCopy={ textToCopy }
				/>
			</div>
		</div>
	);
}

type ShareCopyButtonProps = {
	buttonStyle: NonNullable< ShareButtonsProps[ 'buttonStyle' ] >;
	buttonVariant: ShareButtonsProps[ 'buttonVariant' ];
	onCopy: () => void;
	textToCopy: () => string;
};

/**
 * Copy-to-clipboard share button with a checkmark/clipboard icon swap.
 *
 * @param {ShareCopyButtonProps} props - Component props.
 * @return {JSX.Element} Rendered copy button.
 */
function ShareCopyButton( {
	buttonStyle,
	buttonVariant,
	onCopy,
	textToCopy,
}: ShareCopyButtonProps ) {
	const [ hasCopied, setHasCopied ] = useState( false );
	const copyTimer = useRef< ReturnType< typeof setTimeout > | undefined >( undefined );

	const copyRef = useCopyToClipboard< HTMLElement >( textToCopy, () => {
		if ( copyTimer.current ) {
			clearTimeout( copyTimer.current );
		}
		setHasCopied( true );
		onCopy();
		copyTimer.current = setTimeout( () => {
			setHasCopied( false );
			copyTimer.current = undefined;
		}, 3000 );
	} );

	useEffect(
		() => () => {
			if ( copyTimer.current ) {
				clearTimeout( copyTimer.current );
			}
		},
		[]
	);

	const label = __( 'Copy to clipboard', 'jetpack-publicize-pkg' );

	let icon: JSX.Element | null = null;
	if ( 'text' !== buttonStyle ) {
		icon = hasCopied ? <CheckmarkIcon /> : <ClipboardIcon />;
	}

	return (
		<Button
			ref={ copyRef }
			aria-label={ label }
			icon={ icon }
			variant={ buttonVariant }
			className={ 'icon' === buttonStyle ? styles.clipboard : ' has-text' }
		>
			{ 'icon' === buttonStyle ? null : (
				<Text className={ styles.label } component="span">
					{ label }
				</Text>
			) }
		</Button>
	);
}
