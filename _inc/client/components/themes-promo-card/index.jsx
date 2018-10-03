/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';
import { translate as __ } from 'i18n-calypso';
import Card from 'components/card';
import Button from 'components/button';
import analytics from 'lib/analytics';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import { imagePath } from 'constants/urls';
import { showBackups } from 'state/initial-state';

class ThemesPromoCard extends React.Component {
	static displayName = 'ThemesPromoCard';

	trackGetStarted = () => {
		analytics.tracks.recordJetpackClick( {
			target: 'themes-card',
			button: 'themes-get-started',
			plan: this.props.plan,
			type: 'upgrade'
		} );
	};

	trackComparePlans = () => {
		analytics.tracks.recordJetpackClick( {
			target: 'themes-card',
			button: 'themes-compare-all',
			plan: this.props.plan,
			type: 'upgrade'
		} );
	};

	render() {
		const classes = classNames(
				this.props.className,
				'jp-themes-card'
		);

		// Plan classes come through as `is-whatever-plan`, we need to strip off `is-` and `-plan` from the string to pass to the URL
		const plan = this.props.plan;
		const regex = /(?![is-])(.*)(?=-plan)/g;
		const urlFriendlyPlan = Array.isArray( plan.match( regex ) ) ? plan.match( regex )[ 0 ] : '';

		return (
			<div className={ classes }>
				<Card className="jp-apps-card__content">
					<div className="jp-apps-card__top">
						<img src={ imagePath + 'themes.svg' } alt={ __( ' Premium Themes' ) } />
					</div>

					<div className="jp-apps-card__description">
						<h3 className="jp-apps-card__header">{ __( 'Introducing Premium Themes' ) }</h3>
						{
							this.props.showBackups
							? __(
								'{{p}}To create a beautiful site that looks and works exactly how you want it to, Jetpack Professional gives you unlimited access to over 200 premium WordPress themes.{{/p}}' +
								"{{p}}Jetpack Professional is about more than just finding the perfect design. It's also about total peace of mind: real-time backups, automatic malware scanning, and priority support from our global team of experts guarantee that your site will always be safe and secure.{{/p}}",
								{
									components: {
										p: <p className="jp-apps-card__paragraph" />
									}
								}
							)
							: __(
								'{{p}}To create a beautiful site that looks and works exactly how you want it to, Jetpack Professional gives you unlimited access to over 200 premium WordPress themes.{{/p}}' +
								"{{p}}Jetpack Professional is about more than just finding the perfect design. It's also about total peace of mind knowing that you'll have priority support from our global team of experts should the need arise.{{/p}}",
								{
									components: {
										p: <p className="jp-apps-card__paragraph" />
									}
								}
							)
						}

						<p>
							<Button
								className="is-primary"
								onClick={ this.trackGetStarted }
								href={ 'https://jetpack.com/redirect/?source=upgrade-pro-' + urlFriendlyPlan + '&site=' + this.props.siteRawUrl }>
								{ __( 'Explore Professional' ) }
							</Button>
							&nbsp;
							<Button
								onClick={ this.trackComparePlans }
								href={ 'https://jetpack.com/redirect/?source=plans-compare-free' + '&site=' + this.props.siteRawUrl }>
								{ __( 'Compare All Plans' ) }
							</Button>
						</p>
					</div>
				</Card>
			</div>
						);
	}
}

ThemesPromoCard.propTypes = {
	className: PropTypes.string,
	plan: PropTypes.string
};

export default connect(
	( state ) => {
		return {
			showBackups: showBackups( state ),
		};
	}
)( ThemesPromoCard );

