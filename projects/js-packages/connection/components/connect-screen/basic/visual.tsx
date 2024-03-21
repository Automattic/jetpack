import { ActionButton, TermsOfService } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import React from 'react';
import ConnectScreenLayout from '../layout';
import ConnectScreenErrorMessage from './error';
import type { Props as ConnectScreenProps } from '../basic';
import type { WithRequired } from '../types';
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
	handleButtonClick?: ( e: MouseEvent ) => void;
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

/*
 * The Connection Screen Visual component.
 */
const ConnectScreenVisual: React.FC< Props > = ( {
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
			<ActionButton
				label={ buttonLabel }
				onClick={ handleButtonClick }
				displayError={ displayButtonError || isOfflineMode }
				errorMessage={
					<ConnectScreenErrorMessage errorCode={ errorCode } isOfflineMode={ isOfflineMode } />
				}
				isLoading={ buttonIsLoading }
				isDisabled={ isOfflineMode }
			/>
			<span className="jp-connection__connect-screen__loading-message" role="status">
				{ buttonIsLoading ? loadingLabel || __( 'Loading', 'jetpack' ) : '' }
			</span>

			{ footer && <div className="jp-connection__connect-screen__footer">{ footer }</div> }
		</div>
	</ConnectScreenLayout>
);

export default ConnectScreenVisual;
