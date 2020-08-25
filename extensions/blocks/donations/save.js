/**
 * External dependencies
 */
import formatCurrency, { CURRENCIES } from '@automattic/format-currency';
import classNames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	getColorClassName,
	__experimentalGetGradientClass as getGradientClass,
	RichText,
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { minimumTransactionAmountForCurrency } from '../../shared/currencies';
import { isGradientAvailable } from './colors';

const getColorClassesAndStyles = ( {
	backgroundColor,
	customBackgroundColor,
	textColor,
	customTextColor,
	gradient,
	customGradient,
} ) => {
	const backgroundClass = getColorClassName( 'background-color', backgroundColor );
	const gradientClass = isGradientAvailable ? getGradientClass( gradient ) : undefined;
	const textClass = getColorClassName( 'color', textColor );

	const classes = {
		'has-text-color': textColor || customTextColor,
		[ textClass ]: textClass,
		'has-background': backgroundColor || gradient || customBackgroundColor || customGradient,
		[ backgroundClass ]: backgroundClass,
		[ gradientClass ]: gradientClass,
	};

	const styles = {
		background: customGradient || undefined,
		backgroundColor:
			backgroundClass || customGradient || gradient ? undefined : customBackgroundColor,
		color: textClass ? undefined : customTextColor,
	};
	return [ classes, styles ];
};

const Save = ( { attributes } ) => {
	const {
		currency,
		oneTimeDonation,
		monthlyDonation,
		annualDonation,
		showCustomAmount,
		chooseAmountText,
		customAmountText,
		backgroundColor,
		customBackgroundColor,
		textColor,
		customTextColor,
		gradient,
		customGradient,
		tabBackgroundColor,
		customTabBackgroundColor,
		tabTextColor,
		customTabTextColor,
		tabGradient,
		customTabGradient,
		amountsBackgroundColor,
		customAmountsBackgroundColor,
		amountsTextColor,
		customAmountsTextColor,
		buttonBackgroundColor,
		customButtonBackgroundColor,
		buttonTextColor,
		customButtonTextColor,
		buttonGradient,
		customButtonGradient,
	} = attributes;

	if ( ! oneTimeDonation || ! oneTimeDonation.show || oneTimeDonation.planId === -1 ) {
		return null;
	}

	const tabs = {
		'one-time': { title: __( 'One-Time', 'jetpack' ) },
		...( monthlyDonation.show && { '1 month': { title: __( 'Monthly', 'jetpack' ) } } ),
		...( annualDonation.show && { '1 year': { title: __( 'Yearly', 'jetpack' ) } } ),
	};

	const [ classes, style ] = getColorClassesAndStyles( {
		backgroundColor,
		customBackgroundColor,
		textColor,
		customTextColor,
		gradient,
		customGradient,
	} );

	const [ tabClasses, tabStyle ] = getColorClassesAndStyles( {
		backgroundColor: tabBackgroundColor,
		customBackgroundColor: customTabBackgroundColor,
		textColor: tabTextColor,
		customTextColor: customTabTextColor,
		gradient: tabGradient,
		customGradient: customTabGradient,
	} );

	const [ amountsClasses, amountsStyle ] = getColorClassesAndStyles( {
		backgroundColor: amountsBackgroundColor,
		customBackgroundColor: customAmountsBackgroundColor,
		textColor: amountsTextColor,
		customTextColor: customAmountsTextColor,
	} );

	const [ buttonClasses, buttonStyle ] = getColorClassesAndStyles( {
		backgroundColor: buttonBackgroundColor,
		customBackgroundColor: customButtonBackgroundColor,
		textColor: buttonTextColor,
		customTextColor: customButtonTextColor,
		gradient: buttonGradient,
		customGradient: customButtonGradient,
	} );

	return (
		<div className={ classNames( classes ) } style={ style }>
			<div className="donations__container">
				{ Object.keys( tabs ).length > 1 && (
					<div className="donations__nav">
						{ Object.entries( tabs ).map( ( [ interval, { title } ] ) => (
							<div
								role="button"
								tabIndex={ 0 }
								className={ classNames( 'donations__nav-item', tabClasses ) }
								key={ `jetpack-donations-nav-item-${ interval } ` }
								data-interval={ interval }
								style={ tabStyle }
							>
								{ title }
							</div>
						) ) }
					</div>
				) }
				<div className="donations__content">
					<div className="donations__tab">
						<RichText.Content
							tagName="h4"
							className="donations__one-time-item"
							value={ oneTimeDonation.heading }
						/>
						{ monthlyDonation.show && (
							<RichText.Content
								tagName="h4"
								className="donations__monthly-item"
								value={ monthlyDonation.heading }
							/>
						) }
						{ annualDonation.show && (
							<RichText.Content
								tagName="h4"
								className="donations__annual-item"
								value={ annualDonation.heading }
							/>
						) }
						<RichText.Content tagName="p" value={ chooseAmountText } />
						<div className="donations__amounts donations__one-time-item">
							{ oneTimeDonation.amounts.map( amount => (
								<div
									className={ classNames( 'donations__amount', amountsClasses ) }
									data-amount={ amount }
									style={ amountsStyle }
								>
									{ formatCurrency( amount, currency ) }
								</div>
							) ) }
						</div>
						{ monthlyDonation.show && (
							<div className="donations__amounts donations__monthly-item">
								{ monthlyDonation.amounts.map( amount => (
									<div
										className={ classNames( 'donations__amount', amountsClasses ) }
										data-amount={ amount }
										style={ amountsStyle }
									>
										{ formatCurrency( amount, currency ) }
									</div>
								) ) }
							</div>
						) }
						{ annualDonation.show && (
							<div className="donations__amounts donations__annual-item">
								{ annualDonation.amounts.map( amount => (
									<div
										className={ classNames( 'donations__amount', amountsClasses ) }
										data-amount={ amount }
										style={ amountsStyle }
									>
										{ formatCurrency( amount, currency ) }
									</div>
								) ) }
							</div>
						) }
						{ showCustomAmount && (
							<>
								<RichText.Content tagName="p" value={ customAmountText } />
								<div
									className={ classNames(
										'donations__amount',
										'donations__custom-amount',
										amountsClasses
									) }
								>
									{ CURRENCIES[ currency ].symbol }
									<div
										className="donations__amount-value"
										data-currency={ currency }
										data-empty-text={ formatCurrency(
											minimumTransactionAmountForCurrency( currency ) * 100,
											currency,
											{ symbol: '' }
										) }
										style={ amountsStyle }
									/>
								</div>
							</>
						) }
						<div className="donations__separator">——</div>
						<RichText.Content
							tagName="p"
							className="donations__one-time-item"
							value={ oneTimeDonation.extraText }
						/>
						{ monthlyDonation.show && (
							<RichText.Content
								tagName="p"
								className="donations__monthly-item"
								value={ monthlyDonation.extraText }
							/>
						) }
						{ annualDonation.show && (
							<RichText.Content
								tagName="p"
								className="donations__annual-item"
								value={ annualDonation.extraText }
							/>
						) }
						<div className="wp-block-button donations__donate-button-wrapper donations__one-time-item">
							<RichText.Content
								tagName="a"
								className={ classNames(
									'wp-block-button__link',
									'donations__donate-button',
									'donations__one-time-item',
									buttonClasses
								) }
								value={ oneTimeDonation.buttonText }
								style={ buttonStyle }
							/>
						</div>
						{ monthlyDonation.show && (
							<div className="wp-block-button donations__donate-button-wrapper donations__monthly-item">
								<RichText.Content
									tagName="a"
									className={ classNames(
										'wp-block-button__link',
										'donations__donate-button',
										'donations__monthly-item',
										buttonClasses
									) }
									value={ monthlyDonation.buttonText }
									style={ buttonStyle }
								/>
							</div>
						) }
						{ annualDonation.show && (
							<div className="wp-block-button donations__donate-button-wrapper donations__annual-item">
								<RichText.Content
									tagName="a"
									className={ classNames(
										'wp-block-button__link',
										'donations__donate-button',
										'donations__annual-item',
										buttonClasses
									) }
									value={ annualDonation.buttonText }
									style={ buttonStyle }
								/>
							</div>
						) }
					</div>
				</div>
			</div>
		</div>
	);
};

export default Save;
