import { TermsOfService, getRedirectUrl } from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/ui';
import ConnectScreenLayout from '../layout';
import type { Props as ConnectScreenProps } from '../basic';
import type { WithRequired } from '../types';
import type { FC, SyntheticEvent } from 'react';
import './style.scss';

type SharedProps = Pick<
	ConnectScreenProps,
	| 'title'
	| 'children'
	| 'assetBaseUrl'
	| 'images'
	| 'logo'
	| 'footer'
	| 'buttonLabel'
	| 'loadingLabel'
>;
type OwnProps = {
	// Whether the connection status is still loading
	isLoading?: boolean;
	// Callback to be called on button click
	handleButtonClick?: ( e?: Event | SyntheticEvent ) => void;
	// Whether the error message appears or not
	displayButtonError?: boolean;
	// The connection error code
	errorCode?: string;
	// Whether the button is loading or not
	buttonIsLoading?: boolean;
	// Whether the site is in offline mode
	isOfflineMode?: boolean;
};

export type Props = WithRequired< SharedProps, 'buttonLabel' > & OwnProps;

const getErrorMessage = ( errorCode, isOfflineMode ) => {
	// Explicit error code takes precedence over the offline mode.
	switch ( errorCode ) {
		case 'fail_domain_forbidden':
		case 'fail_ip_forbidden':
		case 'fail_domain_tld':
		case 'fail_subdomain_wpcom':
		case 'siteurl_private_ip':
			return __(
				'Your site host is on a private network. Sites can connect to WordPress.com only on public sites.',
				'jetpack-connection-js'
			);
		case 'connection_disabled':
			return __( 'This site has been suspended.', 'jetpack-connection-js' );
	}

	if ( isOfflineMode ) {
		return createInterpolateElement(
			__( 'Unavailable in <a>Offline Mode</a>', 'jetpack-connection-js' ),
			{
				a: (
					<a
						href={ getRedirectUrl( 'jetpack-support-development-mode' ) }
						target="_blank"
						rel="noopener noreferrer"
					/>
				),
			}
		);
	}
};

/*
 * The Connection Screen Visual component.
 */
const ConnectScreenVisual: FC< Props > = ( {
	title,
	images,
	children,
	assetBaseUrl,
	isLoading,
	buttonLabel,
	handleButtonClick,
	displayButtonError,
	errorCode,
	buttonIsLoading,
	loadingLabel,
	footer,
	isOfflineMode,
	logo,
} ) => (
	<ConnectScreenLayout
		title={ title }
		assetBaseUrl={ assetBaseUrl }
		images={ images }
		className={
			'jp-connection__connect-screen' +
			( isLoading ? ' jp-connection__connect-screen__loading' : '' )
		}
		logo={ logo }
	>
		<div className="jp-connection__connect-screen__content">
			{ children }

			<div className="jp-connection__connect-screen__tos">
				<TermsOfService agreeButtonLabel={ buttonLabel } />
			</div>
			<Button
				className="jp-connection__connect-screen__action-button"
				onClick={ handleButtonClick }
				loading={ buttonIsLoading }
				disabled={ isOfflineMode }
			>
				{ buttonLabel }
			</Button>
			{ ( displayButtonError || isOfflineMode ) && (
				<p className="jp-connection__connect-screen__error">
					{ getErrorMessage( errorCode, isOfflineMode ) ||
						__( 'An error occurred. Please try again.', 'jetpack-connection-js' ) }
				</p>
			) }
			<span className="jp-connection__connect-screen__loading-message" role="status">
				{ buttonIsLoading ? loadingLabel || __( 'Loading', 'jetpack-connection-js' ) : '' }
			</span>

			{ footer && <div className="jp-connection__connect-screen__footer">{ footer }</div> }
		</div>
	</ConnectScreenLayout>
);

export default ConnectScreenVisual;
