/**
 * External dependencies
 */
import classNames from 'classnames';

/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Context from './context';
import Controls from './controls';
import Tab from './tab';
import StripeNudge from '../../shared/components/stripe-nudge';
import { minimumTransactionAmountForCurrency } from '../../shared/currencies';

const Tabs = props => {
	const { attributes, className, products, setAttributes, shouldUpgrade, stripeConnectUrl } = props;
	const { currency, oneTimePlanId, monthlyPlanId, annuallyPlanId, chooseAmountText } = attributes;
	const [ activeTab, setActiveTab ] = useState( 'one-time' );
	const [ previousCurrency, setPreviousCurrency ] = useState( currency );

	const isTabActive = tab => activeTab === tab;
	const minAmount = minimumTransactionAmountForCurrency( currency );

	const tabs = {
		'one-time': { title: __( 'One-Time', 'jetpack' ) },
		...( monthlyPlanId && { '1 month': { title: __( 'Monthly', 'jetpack' ) } } ),
		...( annuallyPlanId && { '1 year': { title: __( 'Yearly', 'jetpack' ) } } ),
	};

	// Sets the plans when the block is inserted.
	useEffect( () => {
		// Since there is no setting for disabling the one-time option, we can assume that the block has been just
		// inserted if the attribute `oneTimePlanId` is not set.
		if ( oneTimePlanId ) {
			return;
		}

		setAttributes( {
			oneTimePlanId: products[ 'one-time' ],
			monthlyPlanId: products[ '1 month' ],
			annuallyPlanId: products[ '1 year' ],
		} );
	}, [ oneTimePlanId, products, setAttributes ] );

	// Sets the plans when Stripe has been connected (we use fake plans while Stripe is not connected so user can still try the block).
	useEffect( () => {
		if ( oneTimePlanId === -1 ) {
			setAttributes( {
				oneTimePlanId: products[ 'one-time' ],
				...( monthlyPlanId && { monthlyPlanId: products[ '1 month' ] } ),
				...( annuallyPlanId && { annuallyPlanId: products[ '1 year' ] } ),
			} );
		}
	}, [ oneTimePlanId, monthlyPlanId, annuallyPlanId, setAttributes, products ] );

	// Activates the one-time tab if the interval of the current active tab is disabled.
	useEffect( () => {
		if ( ! monthlyPlanId && isTabActive( '1 month' ) ) {
			setActiveTab( 'one-time' );
		}

		if ( ! annuallyPlanId && isTabActive( '1 year' ) ) {
			setActiveTab( 'one-time' );
		}
	}, [ monthlyPlanId, annuallyPlanId, setActiveTab, isTabActive ] );

	// Updates the amounts and choose amount text attributes when the currency changes.
	useEffect( () => {
		if ( previousCurrency === currency ) {
			return;
		}
		setPreviousCurrency( currency );
		setAttributes( {
			amounts: [
				minAmount * 10, // 1st tier (USD 5)
				minAmount * 30, // 2nd tier (USD 15)
				minAmount * 200, // 3rd tier (USD 100)
			],
			chooseAmountText: chooseAmountText.replace( `(${ previousCurrency })`, `(${ currency })` ),
		} );
	}, [ currency, previousCurrency, minAmount, chooseAmountText, setAttributes ] );

	return (
		<div className={ className }>
			{ ! shouldUpgrade && stripeConnectUrl && (
				<StripeNudge blockName="donations" stripeConnectUrl={ stripeConnectUrl } />
			) }
			<div className="donations__container">
				{ Object.keys( tabs ).length > 1 && (
					<div className="donations__tabs">
						{ Object.entries( tabs ).map( ( [ interval, { title } ] ) => (
							<Button
								className={ classNames( 'donations__tab', {
									'is-active': isTabActive( interval ),
								} ) }
								onClick={ () => setActiveTab( interval ) }
							>
								{ title }
							</Button>
						) ) }
					</div>
				) }
				<div className="donations__content">
					<Context.Provider value={ { activeTab } }>
						{ Object.keys( tabs ).map( interval => (
							<Tab { ...props } interval={ interval } />
						) ) }
					</Context.Provider>
				</div>
			</div>
			<Controls { ...props } />
		</div>
	);
};

export default Tabs;
