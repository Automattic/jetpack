import { getRedirectUrl } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import classNames from 'classnames';
import Button from 'components/button';
import Card from 'components/card';
import analytics from 'lib/analytics';
import { FC, useCallback } from 'react';
import { connect } from 'react-redux';
import { isCurrentUserLinked, isConnectionOwner, connectUser } from 'state/connection';
import { newsletterLearnMoreDismissed, updateSettings } from 'state/settings';
import { isFetchingSiteData } from 'state/site';
import Gridicon from '../gridicon';

interface Props {
	isDismissed: boolean;
	dismiss: () => void;
	path: string;
	isUserLinked: boolean;
	isOwner: boolean;
	isFetchingData: boolean;
	className?: string;
}

const NewsletterCard: FC< Props > = ( {
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
				feature: 'newsletter',
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

	const classes = classNames( className, 'jp-newsletter-card' );

	return (
		<div className={ classes }>
			<Card className="jp-newsletter-card__wrapper">
				<div className="jp-newsletter-card__contact">
					<div className="jp-newsletter-card__content">
						<div className="jp-newsletter-card-text">
							<h3 className="jp-newsletter-card__header">
								{ __( 'Get started with Jetpack Newsletter', 'jetpack' ) }
							</h3>
							<p className="jp-newsletter-card__description">
								{ __(
									'Ready to grow your subscribers? Begin by adding a subscribe form to your site.',
									'jetpack'
								) }
							</p>
						</div>
						<div className="jp-newsletter-card__link-button">
							<Button
								onClick={ handleClick }
								primary
								href={ getRedirectUrl( 'jetpack-support-subscriptions' ) }
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
						className="jp-newsletter-card__dismiss"
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
		isDismissed: newsletterLearnMoreDismissed( state ),
	} ),
	dispatch => ( {
		dismiss: () =>
			dispatch(
				updateSettings( {
					dismiss_dash_newsletter_learn_more: true,
				} )
			),
		connectUser: () => dispatch( connectUser() ),
	} )
)( NewsletterCard );
