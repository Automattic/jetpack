import { getRedirectUrl } from '@automattic/jetpack-components';
import { __, sprintf } from '@wordpress/i18n';
import classNames from 'classnames';
import Button from 'components/button';
import Card from 'components/card';
import analytics from 'lib/analytics';
import { FC, useCallback } from 'react';
import { connect } from 'react-redux';
import { isCurrentUserLinked, isConnectionOwner, connectUser } from 'state/connection';
import { agenciesLearnMoreDismissed, updateSettings } from 'state/settings';
import { isFetchingSiteData } from 'state/site';
import Gridicon from '../gridicon';

interface Props {
	isDismissed: boolean;
	dismiss: () => void;
	path: string;
	discountPercentage: number;
	isUserLinked: boolean;
	isOwner: boolean;
	isFetchingData: boolean;
	className?: string;
}

const AgenciesCard: FC< Props > = ( {
	isDismissed,
	dismiss,
	path,
	discountPercentage,
	isUserLinked,
	isOwner,
	isFetchingData,
	className,
} ) => {
	const trackEvent = useCallback(
		( target: string ) => {
			analytics.tracks.recordJetpackClick( {
				target: target,
				feature: 'agencies',
				page: path,
				is_user_wpcom_connected: isUserLinked ? 'yes' : 'no',
				is_connection_owner: isOwner ? 'yes' : 'no',
			} );
		},
		[ path, isUserLinked, isOwner ]
	);

	const handleClick = useCallback( () => {
		trackEvent( 'learn-more-click' );
	}, [ trackEvent ] );

	const handleDismiss = useCallback( () => {
		dismiss();
		trackEvent( 'learn-more-dismiss' );
	}, [ dismiss, trackEvent ] );

	if ( isDismissed ) {
		return null;
	} else if ( isFetchingData ) {
		return <div />;
	}

	const classes = classNames( className, 'jp-agecies-card' );

	return (
		<div className={ classes }>
			<Card className="jp-agencies-card__wrapper">
				<div className="jp-agencies-card__contact">
					<div className="jp-agencies-card__content">
						<div className="jp-agencies-card-text">
							<h3 className="jp-agencies-card__header">
								{ __( 'Manage your clients’ sites with ease', 'jetpack' ) }
							</h3>
							<p className="jp-agencies-card__description">
								{ sprintf(
									/* translators: %s is the percentage discount the users get in the agencies portal */
									__(
										'Manage your clients’ sites with ease and get a %s discount with the Jetpack licensing platform.',
										'jetpack'
									),
									`${ discountPercentage }%`
								) }
							</p>
						</div>
						<div className="jp-agencies-card__link-button">
							<Button
								onClick={ handleClick }
								primary
								href={ getRedirectUrl( 'jitm-jetpack_agencies_ad' ) }
								target="_blank"
								rel="noreferrer"
							>
								{ __( 'Learn More', 'jetpack' ) }
								<Gridicon className="dops-card__link-indicator" icon="external" />
							</Button>
						</div>
					</div>
					<Button
						borderless
						compact
						className="jp-agencies-card__dismiss"
						onClick={ handleDismiss }
					>
						<span className="dashicons dashicons-no" />
					</Button>
				</div>
			</Card>
		</div>
	);
};

export default connect(
	state => ( {
		isFetchingData: isFetchingSiteData( state ),
		isUserLinked: isCurrentUserLinked( state ),
		isOwner: isConnectionOwner( state ),
		isDismissed: agenciesLearnMoreDismissed( state ),
	} ),
	dispatch => ( {
		dismiss: () =>
			dispatch(
				updateSettings( {
					dismiss_dash_agencies_learn_more: true,
				} )
			),
		connectUser: () => dispatch( connectUser() ),
	} )
)( AgenciesCard );
