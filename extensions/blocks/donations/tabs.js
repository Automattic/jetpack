/**
 * External dependencies
 */
import classNames from 'classnames';

/**
 * WordPress dependencies
 */
import { useCallback, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Controls from './controls';
import Tab from './tab';
import StripeNudge from '../../shared/components/stripe-nudge';

const Tabs = props => {
	const { attributes, className, products, setAttributes, shouldUpgrade, stripeConnectUrl } = props;
	const { oneTimeDonation, monthlyDonation, annualDonation } = attributes;
	const [ activeTab, setActiveTab ] = useState( 'one-time' );

	const isTabActive = useCallback( tab => activeTab === tab, [ activeTab ] );

	const tabs = {
		'one-time': { title: __( 'One-Time', 'jetpack' ) },
		...( monthlyDonation.show && { '1 month': { title: __( 'Monthly', 'jetpack' ) } } ),
		...( annualDonation.show && { '1 year': { title: __( 'Yearly', 'jetpack' ) } } ),
	};

	// Sets the plans when the block is inserted.
	useEffect( () => {
		// Since there is no setting for disabling the one-time option, we can assume that the block has been just
		// inserted if the plan id for the one-time donation is not set.
		if ( oneTimeDonation.planId ) {
			return;
		}

		setAttributes( {
			oneTimeDonation: { ...oneTimeDonation, planId: products[ 'one-time' ] },
			monthlyDonation: { ...monthlyDonation, planId: products[ '1 month' ] },
			annualDonation: { ...annualDonation, planId: products[ '1 year' ] },
		} );
	}, [ oneTimeDonation, monthlyDonation, annualDonation, products, setAttributes ] );

	// Sets the plans when Stripe has been connected (we use fake plans while Stripe is not connected so user can still try the block).
	useEffect( () => {
		if ( products[ 'one-time' ] === -1 || oneTimeDonation.planId !== -1 ) {
			return;
		}

		setAttributes( {
			oneTimeDonation: { ...oneTimeDonation, planId: products[ 'one-time' ] },
			...( monthlyDonation.show && {
				monthlyDonation: { ...monthlyDonation, planId: products[ '1 month' ] },
			} ),
			...( annualDonation.show && {
				annualDonation: { ...annualDonation, planId: products[ '1 year' ] },
			} ),
		} );
	}, [ oneTimeDonation, monthlyDonation, annualDonation, setAttributes, products ] );

	// Activates the one-time tab if the interval of the current active tab is disabled.
	useEffect( () => {
		if ( ! monthlyDonation.show && isTabActive( '1 month' ) ) {
			setActiveTab( 'one-time' );
		}

		if ( ! annualDonation.show && isTabActive( '1 year' ) ) {
			setActiveTab( 'one-time' );
		}
	}, [ monthlyDonation, annualDonation, setActiveTab, isTabActive ] );

	return (
		<div className={ className }>
			{ ! shouldUpgrade && stripeConnectUrl && (
				<StripeNudge blockName="donations" stripeConnectUrl={ stripeConnectUrl } />
			) }
			<div className="donations__container">
				{ Object.keys( tabs ).length > 1 && (
					<div className="donations__nav">
						{ Object.entries( tabs ).map( ( [ interval, { title } ] ) => (
							<div
								role="button"
								tabIndex={ 0 }
								className={ classNames( 'donations__nav-item', 'wp-block-button__link', {
									'is-active': isTabActive( interval ),
								} ) }
								onClick={ () => setActiveTab( interval ) }
								onKeyDown={ () => setActiveTab( interval ) }
								key={ `jetpack-donations-nav-item-${ interval } ` }
							>
								{ title }
							</div>
						) ) }
					</div>
				) }
				<div className="donations__content">
					<Tab activeTab={ activeTab } attributes={ attributes } setAttributes={ setAttributes } />
				</div>
			</div>
			<Controls { ...props } />
		</div>
	);
};

export default Tabs;
