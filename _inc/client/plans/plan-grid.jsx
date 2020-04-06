/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';
import { includes, map, reduce } from 'lodash';

/**
 * Internal dependencies
 */
import analytics from 'lib/analytics';
import Button from 'components/button';
import { getSiteRawUrl, getUpgradeUrl, getUserId, showBackups } from 'state/initial-state';
import { getSitePlan, getAvailablePlans, isFetchingSiteData } from 'state/site/reducer';
import { getPlanDuration } from 'state/plans';
import { getPlanClass } from 'lib/plans/constants';
import { translate as __ } from 'i18n-calypso';
import TopButton from './top-button';
import FeatureItem from './feture-item';
import DurationSwitcher from './duration-switcher';

class PlanGrid extends React.Component {
	/**
	 * Memoized storage for plans to display according to highlighted features
	 */
	featuredPlans = false;

	UNSAFE_componentWillUpdate() {
		this.featuredPlans = false;
	}

	handleSeeFeaturesClick( planType ) {
		return () => {
			analytics.tracks.recordJetpackClick( {
				target: 'see-all-features-link',
				feature: 'plans-grid',
				extra: planType,
			} );
		};
	}

	render() {
		if ( ! this.props.plans || this.props.isFetchingData ) {
			return (
				<div className="plan-features">
					{ this.renderMobileCard() }
					{ this.renderSkeletonGrid() }
				</div>
			);
		}

		const length = Object.values( this.getPlans() ).length;
		const tableClasses = classNames( 'plan-features__table', `has-${ length }-cols` );

		return (
			<div className="plan-features">
				{ this.renderMobileCard() }
				<DurationSwitcher type="plans" />

				<div className="plan-features__content">
					<table className={ tableClasses }>
						<tbody>
							<tr>{ this.renderPlanHeaders() }</tr>
							<tr>{ this.renderPrices() }</tr>
							<tr>{ this.renderTopButtons() }</tr>
							{ this.renderPlanFeatureRows() }
							<tr>{ this.renderBottomButtons() }</tr>
						</tbody>
					</table>
				</div>
			</div>
		);
	}

	renderMobileCard() {
		const currently = __( 'You’re currently on Jetpack %(plan)s.', {
			args: { plan: this.props.sitePlan.product_name_short },
		} );
		const myPlanUrl = `https://wordpress.com/plans/my-plan/${ this.props.siteRawUrl }`;
		const plansUrl = `https://wordpress.com/plans/${ this.props.siteRawUrl }`;

		return (
			<div className="plans-mobile-notice dops-card">
				<h2>{ __( 'Your Plan' ) }</h2>
				<p>{ currently }</p>
				<Button href={ myPlanUrl }>{ __( 'Manage your plan' ) }</Button>
				<Button href={ plansUrl } primary>
					{ __( 'View all Jetpack plans' ) }
				</Button>
			</div>
		);
	}

	renderSkeletonGrid() {
		return (
			<div className="plan-grid-skeletons">
				<div className="plan-grid-skeletons__plan is-placeholder"></div>
				<div className="plan-grid-skeletons__plan is-placeholder"></div>
				<div className="plan-grid-skeletons__plan is-placeholder"></div>
			</div>
		);
	}

	/**
	 * We have different nomenclature around the various plans because of course we do. This normalizes it for internal use.
	 * @return {string} plan type
	 */
	getCurrentPlanType() {
		const planClass = getPlanClass( this.props.sitePlan.product_slug );
		// these are `is-TYPE-plan` (or empty string) so easy-peasy regex-squeezy
		return planClass.replace( /^is-/, '' ).replace( /-plan$/, '' );
	}

	/**
	 * Is the current plan an upgraded plan?
	 * @return {boolean} is upgraded
	 */
	isUpgraded() {
		return ! includes( [ '', 'free' ], this.getCurrentPlanType() );
	}

	/**
	 * Check if a plan type is currently active
	 * @param {string} planType plan type to check
	 * @return {boolean} is the current plan type
	 */
	isCurrentPlanType( planType ) {
		return this.getCurrentPlanType() === planType;
	}

	/**
	 * Get the plans we want, calculated to exclude the free plan and only contain the highlighted features we want to display
	 * @return {object} list of plans
	 */
	getPlans() {
		if ( this.featuredPlans ) {
			return this.featuredPlans;
		}
		// reduce the .features member to only the highlighted features.
		const featuredPlans = reduce(
			this.props.plans,
			( plans, plan, key ) => {
				// ignore the free plan
				if ( 'free' === key ) {
					return plans;
				}
				const highlights = plan.highlight;
				plan.features = reduce(
					plan.features,
					( highlightedFeatures, feature ) => {
						if ( includes( highlights, feature.id ) ) {
							highlightedFeatures.push( feature );
						}
						return highlightedFeatures;
					},
					[]
				);
				plans[ key ] = plan;
				return plans;
			},
			{}
		);

		this.featuredPlans = featuredPlans;
		return featuredPlans;
	}

	/**
	 * Renders our plan headers
	 * @return {ReactElement} needed <td> headers
	 */
	renderPlanHeaders() {
		return map( this.getPlans(), ( plan, type ) => {
			const className = classNames(
				'plan-features__table-item',
				'is-header',
				'has-border-top',
				`is-${ type }-plan`
			);
			return (
				<td key={ 'plan-header-' + type } className={ className }>
					<header className="plan-features__header">
						<h3 className="plan-features__header-title">{ plan.short_name }</h3>
						<div className="plan-features__description">{ plan.tagline }</div>
					</header>
				</td>
			);
		} );
	}

	/**
	 * Render our plan prices
	 * @return {ReactElement} needed <td>s for prices
	 */
	renderPrices() {
		const { planDuration } = this.props;
		return map( this.getPlans(), ( plan, type ) => {
			const className = classNames( 'plan-features__table-item', 'plan-price' );

			if ( this.isCurrentPlanType( type ) ) {
				return (
					<td key={ 'price-' + type } className={ className }>
						{ plan.strings.current }
					</td>
				);
			}
			// don't show prices for a lower plan
			if ( ! this.shouldRenderButton( type ) ) {
				return <td key={ 'price-' + type } className={ className } />;
			}
			// using dangerouslySetInnerHTML because formatting localized
			// currencies is best left to our server and it includes the <abbr> element
			/*eslint-disable react/no-danger*/
			return (
				<td key={ 'price-' + type } className={ className }>
					<span
						className="plan-price__yearly"
						dangerouslySetInnerHTML={ { __html: plan.price[ planDuration ].per } }
					/>
				</td>
			);
		} );
	}

	/**
	 * Should we render a button for this plan?
	 * @param {string} planType the plan type
	 * @return {boolean} render it
	 */
	shouldRenderButton( planType ) {
		// don't show the button if we already have a higher plan type
		const plans = Object.keys( this.props.plans );
		const currentPlanIndex = plans.indexOf( this.getCurrentPlanType() );
		const requestedIndex = plans.indexOf( planType );
		return requestedIndex >= currentPlanIndex;
	}

	/**
	 * Renders the buttons we need to buy stuff
	 * @return {ReactElement} <td>s with buttons
	 */
	renderTopButtons() {
		const { planDuration } = this.props.planDuration;
		return map( this.getPlans(), ( plan, planType ) => {
			const { siteRawUrl, plansUpgradeUrl, sitePlan } = this.props;
			const isActivePlan = this.isCurrentPlanType( planType );
			const buttonText = isActivePlan ? plan.strings.manage : plan.strings.upgrade;
			let planTypeWithPeriod = planType;
			if ( planDuration === 'monthly' ) {
				planTypeWithPeriod += '-monthly';
			}

			return (
				<TopButton
					key={ planType }
					buttonText={ buttonText }
					planType={ planType }
					isActivePlan={ isActivePlan }
					isPrimary={ this.isPrimary( planType, plan ) }
					shouldRenderButton={ this.shouldRenderButton( planType ) }
					siteRawUrl={ siteRawUrl }
					plansUpgradeUrl={ plansUpgradeUrl( planTypeWithPeriod ) }
					productSlug={ sitePlan.product_slug }
				/>
			);
		} );
	}

	/**
	 * Check if a plan should be highlighted as primary in the CTAs
	 * @param {string} planType the plan type to check for primariness
	 * @param {object} plan the plan object to check for primariness
	 * @return {boolean} plan is primary
	 */
	isPrimary( planType, plan ) {
		// if we're upgraded, step it up a level
		if ( this.isUpgraded() ) {
			const currentPlanType = this.getCurrentPlanType();
			const planKeys = Object.keys( this.getPlans() );
			const currentPlanIndex = planKeys.indexOf( currentPlanType );
			// want the next one
			return planKeys.indexOf( planType ) === planKeys.indexOf( planKeys[ currentPlanIndex + 1 ] );
		}
		// not upgraded: do what the API says.
		return plan.is_featured;
	}

	/**
	 * Renders the buttons we need to view more features on jetpack.com
	 * @return {ReactElement} <td>s with buttons
	 */
	renderBottomButtons() {
		return map( this.getPlans(), ( plan, planType ) => {
			return (
				<td
					key={ 'bottom-' + planType }
					className="plan-features__table-item is-bottom-buttons has-border-bottom"
				>
					<a
						href={ this.props.plansLearnMoreUpgradeUrl }
						onClick={ this.handleSeeFeaturesClick( planType ) }
					>
						{ plan.strings.see_all }
					</a>
				</td>
			);
		} );
	}

	/**
	 * Get the longest features list so we know how many rows to fill our table with
	 * @return {array} longest features list
	 */
	getLongestFeaturesList() {
		return reduce(
			this.getPlans(),
			( longest, properties ) => {
				const currentFeatures = Object.keys( properties.features );
				return currentFeatures.length > longest.length ? currentFeatures : longest;
			},
			[]
		);
	}

	/**
	 * Render all of the feature rows in the table
	 * @return {ReactElement} feature rows
	 */
	renderPlanFeatureRows() {
		return map( this.getLongestFeaturesList(), ( feature, rowIndex ) => {
			return (
				<tr key={ 'row-' + rowIndex } className="plan-features-row">
					{ this.renderPlanFeatureColumns( rowIndex ) }
				</tr>
			);
		} );
	}

	/**
	 * Render a specificially indexed feature row of <td>
	 * @param {number} rowIndex The feature row index to render
	 * @return {ReactElement} some <td> elements for the row
	 */
	renderPlanFeatureColumns( rowIndex ) {
		return map( this.getPlans(), ( properties, planType ) => {
			const key = planType + '-row-' + rowIndex;
			const feature = properties.features[ rowIndex ];
			const backupFeatureIds = [ 'backups', 'malware-scan', 'real-time-backups' ];
			const hideBackupFeature =
				! this.props.showBackups && feature && includes( backupFeatureIds, feature.id );

			return (
				<FeatureItem
					key={ planType }
					itemKey={ key }
					feature={ feature }
					hideBackupFeature={ hideBackupFeature }
					siteRawUrl={ this.props.siteRawUrl }
					userId={ this.props.userId }
					productSlug={ this.props.sitePlan.product_slug }
				/>
			);
		} );
	}
}

export default connect( state => {
	const userId = getUserId( state );
	return {
		plans: getAvailablePlans( state ),
		siteRawUrl: getSiteRawUrl( state ),
		sitePlan: getSitePlan( state ),
		userId,
		showBackups: showBackups( state ),
		planDuration: getPlanDuration( state ),
		plansUpgradeUrl: planType => getUpgradeUrl( state, `plans-${ planType }`, userId ),
		plansLearnMoreUpgradeUrl: getUpgradeUrl( state, 'plans-learn-more', userId ),
		isFetchingData: isFetchingSiteData( state ),
	};
}, null )( PlanGrid );
