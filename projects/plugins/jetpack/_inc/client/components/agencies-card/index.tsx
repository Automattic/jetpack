import { __ } from '@wordpress/i18n';
import classNames from 'classnames';
import Button from 'components/button';
import Card from 'components/card';
import analytics from 'lib/analytics';
import { FC, useCallback } from 'react';
import { connect } from 'react-redux';
import { isCurrentUserLinked, isConnectionOwner, connectUser } from 'state/connection';
import { agenciesLearnMoreDismissed, updateSettings } from 'state/settings';
import { isFetchingSiteData } from 'state/site';

interface Props {
	isDismissed: boolean;
	dismiss: () => void;
	path: string;
	isUserLinked: boolean;
	isOwner: boolean;
	isFetchingData: boolean;
	className?: string;
}

const AgenciesCard: FC< Props > = ( {
	isDismissed,
	dismiss,
	path,
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
				<Button borderless compact className="jp-agencies-card__dismiss" onClick={ handleDismiss }>
					<span className="dashicons dashicons-no" />
				</Button>
				<div className="jp-agencies-card__contact">
					<h3 className="jp-agencies-card__header">
						{ __( "Manage your clients' sites with ease", 'jetpack' ) }
					</h3>
					<p className="jp-agencies-card__description">
						{
							/* Disabling translator comments eslint error because eslint is incorrectly assuming the % sign is a placeholder */
							/* eslint-disable-next-line @wordpress/i18n-translator-comments */
							__(
								'Monitor site and product activity, manage licenses, and get a 25% discount in our agency portal.',
								'jetpack'
							)
						}
					</p>
					<p className="jp-agencies-card__description">
						<Button
							onClick={ trackEvent( 'learn-more-click' ) }
							href="https://jetpack.com/for/agencies"
							target="_blank"
							rel="noreferrer"
						>
							{ __( 'Learn More', 'jetpack' ) }
						</Button>
					</p>
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
