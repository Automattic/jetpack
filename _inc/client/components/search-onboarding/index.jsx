/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import Button from 'components/button';
import Card from 'components/card';
import { translate as __ } from 'i18n-calypso';
import { decode } from 'qss';
import analytics from 'lib/analytics';

/**
 * Internal dependencies
 */
import { imagePath } from 'constants/urls';
import { updateSettings, searchOnboardingDismissed } from 'state/settings';

export class SearchOnboarding extends React.Component {
	dismissCard = () => {
		this.props.dismissSearchOnboardingCard();
		analytics.tracks.recordJetpackClick( {
			target: 'search-onboarding',
			button: 'dismiss',
			page: this.props.path,
		} );
	};

	render() {
		const query = decode( window.location.search.substring( 1 ) );

		if ( ! ( 'search-thank-you' in query ) || this.props.isSearchOnboardingDismissed ) {
			return null;
		}

		return (
			<Card title={ __( 'Thank you for your purchase!' ) } className="jp-search-onboarding">
				<Button
					borderless
					compact
					className="jp-search-onboarding__dismiss"
					href="javascript:void(0)"
					onClick={ this.dismissCard }
				>
					<span className="dashicons dashicons-no" />
				</Button>
				<img
					src={ imagePath + 'jetpack-search.svg' }
					alt={ __( 'Welcome to Jetpack Search' ) }
					className="jp-search-onboarding__image"
				/>
				<p>
					{ __( 'We are currently indexing your site and will notify you when it is complete.' ) }
				</p>
				<p>
					{ __(
						'In the meantime, we have added some common filtering widgets to your site that you should try customizing.'
					) }
				</p>
				<Button primary compact={ true } href="customize.php?autofocus[section]=jetpack_search">
					{ __( 'Customize Search Now' ) }
				</Button>
				<Button
					primary={ false }
					compact={ true }
					href="customize.php?autofocus[section]=jetpack_search"
				>
					{ __( "I'll do it later" ) }
				</Button>
			</Card>
		);
	}
}

export default connect(
	state => {
		return {
			isSearchOnboardingDismissed: searchOnboardingDismissed( state ),
		};
	},
	dispatch => {
		return {
			dismissSearchOnboardingCard: () => {
				return dispatch( updateSettings( { dismiss_search_onboarding_card: true } ) );
			},
		};
	}
)( SearchOnboarding );
