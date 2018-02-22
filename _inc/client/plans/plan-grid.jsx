/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';
import map from 'lodash/map';
import reduce from 'lodash/reduce';
import includes from 'lodash/includes';

/**
 * Internal dependencies
 */
import Button from 'components/button';
import { getSiteRawUrl } from 'state/initial-state';
import { getSitePlan } from 'state/site/reducer';
import analytics from 'lib/analytics';
import { getPlanClass } from 'lib/plans/constants';

/**
 * TEMP
 */
import plansData from './plans-data';

class PlanGrid extends React.Component {

	/**
	 * Memoized storage for plans to display according to highlighted features
	 */
	featuredPlans = false;

	componentWillUpdate() {
		this.featuredPlans = false;
	}

	render() {
		// @todo something to show a placeholder while this sucka is loading
		const length = Object.values( this.getPlans() ).length;
		const tableClasses = classNames(
			'plan-features__table',
			`has-${ length }-cols`
		);

		return (
			<div className="plan-features">
				<div className="plan-features__content">
					<table className={ tableClasses }>
						<tbody>
							<tr>{ this.renderPlanHeaders() }</tr>
							<tr>{ this.renderPrices() }</tr>
							<tr>{ this.renderTopButtons() }</tr>
							{ this.renderPlanFeatureRows() }
						</tbody>
					</table>
				</div>
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
		let previousPlan;
		// reduce the .features member to only the highlighted features.
		const featuredPlans = reduce( this.props.plans, ( plans, plan, key ) => {
			// ignore the free plan
			if ( 'free' === key ) {
				previousPlan = plan;
				return plans;
			}
			const highlights = plan.highlight;
			const features = reduce( plan.features, ( highlightedFeatures, feature ) => {
				if ( includes( highlights, feature.id ) ) {
					highlightedFeatures.push( feature );
				}
				return highlightedFeatures;
			}, [] );
			features.push( {
				id: 'all-from-lower',
				name: `All ${ previousPlan.short_name } Features`,
				description: 'Very good things, Brett'
			} );
			plan.features = features;
			plans[ key ] = plan;
			previousPlan = plan;
			return plans;
		}, {} );

		this.featuredPlans = featuredPlans;
		return featuredPlans;
	}

	/**
	 * Create a <del> element that takes the monthly price * 12 months
	 * @param {object} price A price object from the API response
	 * @return {ReactElement} monthly price
	 */
	getYearlyPriceFromMonthly( price ) {
		const inflatedPrice = price.html.replace( price.amount, price.amount * 12 );
		const markup = { __html: inflatedPrice };
		// using dangerouslySetInnerHTML because formatting localized
		// currencies is best left to our server and it includes the <abbr> element
		/*eslint-disable react/no-danger*/
		return (
			<del className="plan-price__monthly" dangerouslySetInnerHTML={ markup } />
		);
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
		return map( this.getPlans(), ( plan, type ) => {
			const className = classNames(
				'plan-features__table-item',
				'plan-price'
			);

			if ( this.isCurrentPlanType( type ) ) {
				return (
					<td key={ 'price-' + type } className={ className }>
						<em>Your current plan</em>
					</td>
				);
			}
			// using dangerouslySetInnerHTML because formatting localized
			// currencies is best left to our server and it includes the <abbr> element
			/*eslint-disable react/no-danger*/
			return (
				<td key={ 'price-' + type } className={ className }>
					{ this.getYearlyPriceFromMonthly( plan.price.monthly ) }
					<span className="plan-price__yearly" dangerouslySetInnerHTML={ { __html: plan.price.yearly.html + ' per year' } } />
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
		return map( this.getPlans(), ( properties, planType ) => {
			const isActivePlan = this.isCurrentPlanType( planType );
			const url = isActivePlan
				? `https://wordpress.com/plans/my-plan/${ this.props.siteRawUrl }`
				: `https://wordpress.com/checkout/${ this.props.siteRawUrl }/${ planType }`;
			const isPrimary = planType === 'personal';
			const className = classNames(
				'plan-features__table-item',
				'has-border-bottom',
				'is-top-buttons'
			);
			if ( ! this.shouldRenderButton( planType ) ) {
				return (
					<td key={ 'button-' + planType } className={ className } />
				);
			}
			const clickHandler = () => {
				if ( ! isActivePlan ) {
					return;
				}
				analytics.tracks.recordJetpackClick( {
					target: `upgrade-${ planType }`,
					type: 'upgrade',
					plan: this.props.sitePlan.product_slug,
					page: 'Plans'
				} );
			};
			const text = isActivePlan
				? 'Manage Plan'
				: `Start with ${ properties.short_name }`;
			return (
				<td key={ 'button-' + planType } className={ className }>
					<Button href={ url } primary={ isPrimary } onClick={ clickHandler }>
						{ text }
					</Button>
				</td>
			);
		} );
	}

	/**
	 * Get the longest features list so we know how many rows to fill our table with
	 * @return {array} longest features list
	*/
	getLongestFeaturesList() {
		return reduce( this.getPlans(), ( longest, properties ) => {
			const currentFeatures = Object.keys( properties.features );
			return currentFeatures.length > longest.length ? currentFeatures : longest;
		}, [] );
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
			return this.renderFeatureItem( planType, rowIndex );
		} );
	}

	/**
	 * Render one feature item for a plan and row index
	 * @param {string} planType The plan type column
	 * @param {number} rowIndex The feature row index
	 * @return {ReactElement} a <td>
	 */
	renderFeatureItem( planType, rowIndex ) {
		const plan = this.getPlans()[ planType ];
		const item = plan.features[ rowIndex ];
		const key = planType + '-row-' + rowIndex;
		// empty?
		if ( typeof item === 'undefined' ) {
			return (
				<td key={ key } className="plan-features__table-item" />
			);
		}
		return (
			<td key={ key } className="plan-features__table-item has-partial-border">
				<div className="plan-features__item">{ item.name }</div>
			</td>
		);
	}

}

export default connect( ( state ) => {
	return {
		plans: plansData,
		siteRawUrl: getSiteRawUrl( state ),
		sitePlan: getSitePlan( state )
	};
}, null, )( PlanGrid );
