import { PricingCard, TermsOfService } from '@automattic/jetpack-components';
import { Spinner } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, Stack } from '@wordpress/ui';
import clsx from 'clsx';
import debugFactory from 'debug';
import ConnectScreenAction from '../action';
import ConnectScreenLayout from '../layout';
import type { Props as ConnectScreenRequiredPlanProps } from './types';
import type { MouseEvent } from 'react';
import './style.scss';

const debug = debugFactory( 'jetpack:connection:ConnectScreenRequiredPlanVisual' );

type SharedProps = Pick<
	ConnectScreenRequiredPlanProps,
	| 'title'
	| 'buttonLabel'
	| 'children'
	| 'priceBefore'
	| 'priceAfter'
	| 'pricingIcon'
	| 'pricingTitle'
	| 'pricingCurrencyCode'
	| 'logo'
	| 'rna'
>;
type OwnProps = {
	// Whether the connection status is still loading
	isLoading?: boolean;
	// Callback that is applied into click for all buttons
	handleButtonClick?: ( e?: MouseEvent< HTMLElement > ) => void;
	// Whether the button error is active or not
	displayButtonError?: boolean;
	// The connection error code
	errorCode?: string;
	// Whether the button loading state is active or not
	buttonIsLoading?: boolean;
	// Whether the site is in offline mode
	isOfflineMode?: boolean;
};

export type Props = SharedProps & OwnProps;

/**
 * The Connection Screen Visual component for consumers that require a Plan.
 *
 * @param {Props} props - The properties.
 * @return {import('react').ReactNode} The `ConnectScreenRequiredPlanVisual` component.
 */
function ConnectScreenRequiredPlanVisual( props: Props ) {
	const {
		title,
		buttonLabel,
		children,
		priceBefore,
		priceAfter,
		pricingIcon,
		pricingTitle,
		pricingCurrencyCode = 'USD',
		isLoading = false,
		handleButtonClick = () => {},
		displayButtonError = false,
		errorCode,
		buttonIsLoading = false,
		logo,
		isOfflineMode,
		rna = false,
	} = props;

	debug( 'props are %o', props );

	const withSubscription = createInterpolateElement(
		__( 'Already have a subscription? <connectButton/>', 'jetpack-connection-js' ),
		{
			connectButton: (
				<Button
					variant="unstyled"
					className="jp-connection__connect-screen__inline-action"
					onClick={ handleButtonClick }
					disabled={ buttonIsLoading }
					aria-busy={ buttonIsLoading }
				>
					{ buttonIsLoading ? <Spinner /> : __( 'Log in to get started', 'jetpack-connection-js' ) }
				</Button>
			),
		}
	);

	return (
		<ConnectScreenLayout
			title={ title }
			className={ clsx(
				'jp-connection__connect-screen-required-plan',
				isLoading ? 'jp-connection__connect-screen-required-plan__loading' : '',
				rna ? 'rna' : ''
			) }
			logo={ logo }
			rna={ rna }
		>
			<div className="jp-connection__connect-screen-required-plan__content">
				{ children }

				<div className="jp-connection__connect-screen-required-plan__pricing-card">
					<PricingCard
						title={ pricingTitle }
						icon={ pricingIcon }
						priceBefore={ priceBefore }
						currencyCode={ pricingCurrencyCode }
						priceAfter={ priceAfter }
					>
						<TermsOfService agreeButtonLabel={ buttonLabel } />
						<ConnectScreenAction
							buttonLabel={ buttonLabel }
							handleButtonClick={ handleButtonClick }
							buttonIsLoading={ buttonIsLoading }
							displayButtonError={ displayButtonError }
							errorCode={ errorCode }
							isOfflineMode={ isOfflineMode }
						/>
					</PricingCard>
				</div>

				{ ! isOfflineMode && (
					<Stack
						className="jp-connection__connect-screen-required-plan__with-subscription"
						direction="row"
						justify="flex-start"
						wrap="wrap"
					>
						{ withSubscription }
					</Stack>
				) }
			</div>
		</ConnectScreenLayout>
	);
}

export default ConnectScreenRequiredPlanVisual;
