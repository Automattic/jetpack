/**
 * External dependencies
 */
import classNames from 'classnames';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
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
	const postId = useSelect( select => select( 'core/editor' ).getCurrentPostId(), [] );

	const isTabActive = useCallback( tab => activeTab === tab, [ activeTab ] );

	const tabs = {
		'one-time': { title: __( 'One-Time', 'jetpack' ) },
		...( monthlyDonation.show && { '1 month': { title: __( 'Monthly', 'jetpack' ) } } ),
		...( annualDonation.show && { '1 year': { title: __( 'Yearly', 'jetpack' ) } } ),
	};

	// Updates plans.
	useEffect( () => {
		if (
			oneTimeDonation.planId === products[ 'one-time' ] &&
			monthlyDonation.planId === products[ '1 month' ] &&
			annualDonation.planId === products[ '1 year' ]
		) {
			return;
		}

		setAttributes( {
			oneTimeDonation: { ...oneTimeDonation, planId: products[ 'one-time' ] },
			monthlyDonation: { ...monthlyDonation, planId: products[ '1 month' ] },
			annualDonation: { ...annualDonation, planId: products[ '1 year' ] },
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
				<StripeNudge
					blockName="donations"
					postId={ postId }
					stripeConnectUrl={ stripeConnectUrl }
				/>
			) }
			<div className="donations__container">
				{ Object.keys( tabs ).length > 1 && (
					<div className="donations__nav">
						{ Object.entries( tabs ).map( ( [ interval, { title } ] ) => (
							<div
								role="button"
								tabIndex={ 0 }
								className={ classNames( 'donations__nav-item', {
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
