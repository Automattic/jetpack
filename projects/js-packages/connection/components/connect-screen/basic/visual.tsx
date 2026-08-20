import { TermsOfService } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import ConnectScreenAction from '../action';
import ConnectScreenLayout from '../layout';
import type { Props as ConnectScreenProps } from '../basic';
import type { WithRequired } from '../types';
import type { MouseEventHandler } from 'react';
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
	handleButtonClick?: MouseEventHandler< HTMLElement >;
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

/**
 * The Connection Screen Visual component.
 *
 * @param {Props} props - The properties.
 * @return {import('react').ReactNode} The Connection Screen Visual component.
 */
function ConnectScreenVisual( {
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
}: Props ) {
	return (
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
				<ConnectScreenAction
					buttonLabel={ buttonLabel }
					handleButtonClick={ handleButtonClick }
					buttonIsLoading={ buttonIsLoading }
					displayButtonError={ displayButtonError }
					errorCode={ errorCode }
					isOfflineMode={ isOfflineMode }
				/>
				<span className="jp-connection__connect-screen__loading-message" role="status">
					{ buttonIsLoading ? loadingLabel || __( 'Loading', 'jetpack-connection-js' ) : '' }
				</span>

				{ footer && <div className="jp-connection__connect-screen__footer">{ footer }</div> }
			</div>
		</ConnectScreenLayout>
	);
}

export default ConnectScreenVisual;
