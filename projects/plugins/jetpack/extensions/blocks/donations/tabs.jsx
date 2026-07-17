import { useCallback, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import Controls from './controls';
import Tab from './tab';
import { firstShownInterval } from './utils';

const Tabs = props => {
	const { attributes, products, setAttributes } = props;
	const { oneTimeDonation, monthlyDonation, annualDonation, defaultInterval } = attributes;
	const oneTimeShown = oneTimeDonation.show !== false;
	const fallbackInterval =
		firstShownInterval( oneTimeShown, monthlyDonation.show, annualDonation.show ) ?? 'one-time';
	const isDefaultShown =
		( defaultInterval === 'one-time' && oneTimeShown ) ||
		( defaultInterval === '1 month' && monthlyDonation.show ) ||
		( defaultInterval === '1 year' && annualDonation.show );
	const initialActiveTab = isDefaultShown ? defaultInterval : fallbackInterval;
	const [ activeTab, setActiveTab ] = useState( initialActiveTab );

	const isTabActive = useCallback( tab => activeTab === tab, [ activeTab ] );

	const tabs = {
		...( oneTimeShown && { 'one-time': { title: __( 'One-Time', 'jetpack' ) } } ),
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
			...( products[ 'one-time' ] && {
				oneTimeDonation: { ...oneTimeDonation, planId: products[ 'one-time' ] },
			} ),
			...( products[ '1 month' ] && {
				monthlyDonation: { ...monthlyDonation, planId: products[ '1 month' ] },
			} ),
			...( products[ '1 year' ] && {
				annualDonation: { ...annualDonation, planId: products[ '1 year' ] },
			} ),
		} );
	}, [ oneTimeDonation, monthlyDonation, annualDonation, setAttributes, products ] );

	// If the current active tab's interval is hidden, fall back to the first
	// still-shown interval. Tries one-time first, then monthly, then yearly.
	useEffect( () => {
		const fallback = firstShownInterval( oneTimeShown, monthlyDonation.show, annualDonation.show );
		if ( fallback === null ) {
			return;
		}
		if ( ! oneTimeShown && isTabActive( 'one-time' ) ) {
			setActiveTab( fallback );
		}
		if ( ! monthlyDonation.show && isTabActive( '1 month' ) ) {
			setActiveTab( fallback );
		}
		if ( ! annualDonation.show && isTabActive( '1 year' ) ) {
			setActiveTab( fallback );
		}
	}, [ oneTimeShown, monthlyDonation, annualDonation, setActiveTab, isTabActive ] );

	return (
		<>
			<div className="donations__container">
				{ Object.keys( tabs ).length > 1 && (
					<div className="donations__nav">
						{ Object.entries( tabs ).map( ( [ interval, { title } ] ) => (
							<div
								role="button"
								tabIndex={ 0 }
								className={ clsx( 'donations__nav-item', {
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
		</>
	);
};

export default Tabs;
