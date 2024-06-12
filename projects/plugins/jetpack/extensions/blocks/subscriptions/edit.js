import { numberFormat, ThemeProvider } from '@automattic/jetpack-components';
import { useModuleStatus } from '@automattic/jetpack-shared-extension-utils';
import {
	BlockControls,
	InspectorControls,
	RichText,
	withColors,
	withFontSizes,
	useBlockProps,
	__experimentalUseGradient as useGradient, // eslint-disable-line wpcalypso/no-unsafe-wp-apis
} from '@wordpress/block-editor';
import { TextControl, Toolbar, withFallbackStyles } from '@wordpress/components';
import { compose, usePrevious } from '@wordpress/compose';
import { useSelect, withSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { _n, sprintf } from '@wordpress/i18n';
import clsx from 'clsx';
import { isEqual } from 'lodash';
import { getActiveStyleName } from '../../shared/block-styles';
import { getValidatedAttributes } from '../../shared/get-validated-attributes';
import { isNewsletterFeatureEnabled } from '../../shared/memberships/edit';
import GetAddPaidPlanButton from '../../shared/memberships/utils';
import './view.scss';
import { store as membershipProductsStore } from '../../store/membership-products';
import metadata from './block.json';
import {
	DEFAULT_BORDER_RADIUS_VALUE,
	DEFAULT_BORDER_WEIGHT_VALUE,
	DEFAULT_PADDING_VALUE,
	DEFAULT_SPACING_VALUE,
	DEFAULT_FONTSIZE_VALUE,
	DEFAULT_SUBSCRIBE_PLACEHOLDER,
	DEFAULT_SUBMIT_BUTTON_LABEL,
	DEFAULT_SUCCESS_MESSAGE,
} from './constants';
import SubscriptionControls from './controls';
import { SubscriptionsPlaceholder } from './subscription-placeholder';
import SubscriptionSkeletonLoader from './subscription-skeleton-loader';

const { getComputedStyle } = window;
const isGradientAvailable = !! useGradient;
const name = metadata.name.replace( 'jetpack/', '' );

const applyFallbackStyles = withFallbackStyles( ( node, ownProps ) => {
	const { buttonBackgroundColor, textColor } = ownProps;
	const buttonBackgroundColorValue = buttonBackgroundColor && buttonBackgroundColor.color;
	const textColorValue = textColor && textColor.color;

	const buttonNode = node.querySelector( '.wp-block-jetpack-subscriptions__button' );

	return {
		fallbackButtonBackgroundColor:
			buttonBackgroundColorValue || ! node
				? undefined
				: buttonNode && getComputedStyle( buttonNode ).backgroundColor,
		fallbackTextColor:
			textColorValue || ! node ? undefined : buttonNode && getComputedStyle( buttonNode ).color,
	};
} );

export function SubscriptionEdit( props ) {
	const {
		attributes,
		setAttributes,
		emailFieldBackgroundColor,
		buttonBackgroundColor,
		setButtonBackgroundColor,
		fallbackButtonBackgroundColor,
		textColor,
		fallbackTextColor,
		setTextColor,
		borderColor,
		setBorderColor,
		fontSize,
		hasTierPlans,
	} = props;

	const blockProps = useBlockProps();
	const { isLoadingModules, isChangingStatus, isModuleActive, changeStatus } =
		useModuleStatus( name );

	const validatedAttributes = getValidatedAttributes( metadata.attributes, attributes );
	if ( ! isEqual( validatedAttributes, attributes ) ) {
		setAttributes( validatedAttributes );
	}

	const {
		borderRadius,
		borderWeight,
		buttonWidth,
		className,
		includeSocialFollowers,
		padding,
		spacing,
		submitButtonText = DEFAULT_SUBMIT_BUTTON_LABEL,
		subscribePlaceholder = DEFAULT_SUBSCRIBE_PLACEHOLDER,
		showSubscribersTotal,
		buttonOnNewLine,
		successMessage = DEFAULT_SUCCESS_MESSAGE,
	} = validatedAttributes;

	const activeStyleName = getActiveStyleName( metadata.styles, className );

	const { subscriberCount, subscriberCountString } = useSelect( select => {
		if ( ! isModuleActive ) {
			return {
				subscriberCounts: 0,
				subscriberCountString: '',
			};
		}
		const { emailSubscribers, socialFollowers } =
			select( membershipProductsStore ).getSubscriberCounts();
		let count = emailSubscribers;
		if ( includeSocialFollowers ) {
			count += socialFollowers;
		}

		return {
			subscriberCount: count,
			subscriberCountString: sprintf(
				/* translators: Placeholder is a number of subscribers. */
				_n( 'Join %s other subscriber', 'Join %s other subscribers', count, 'jetpack' ),
				numberFormat( count, { notation: 'compact', maximumFractionDigits: 1 } )
			),
		};
	} );

	const emailFieldGradient = isGradientAvailable
		? useGradient( {
				gradientAttribute: 'emailFieldGradient',
				customGradientAttribute: 'customEmailFieldGradient',
		  } )
		: {};
	const buttonGradient = isGradientAvailable
		? useGradient( {
				gradientAttribute: 'buttonGradient',
				customGradientAttribute: 'customButtonGradient',
		  } )
		: {};

	const sharedClasses = {
		'no-border-radius': borderRadius === 0,
		[ fontSize.class ]: fontSize.class,
		'has-text-color': textColor.color,
		[ textColor.class ]: textColor.class,
	};

	const emailFieldClasses = {
		...sharedClasses,
		'has-background': emailFieldBackgroundColor.color || emailFieldGradient.gradientValue,
		[ emailFieldBackgroundColor.class ]:
			! emailFieldGradient.gradientValue && emailFieldBackgroundColor.class,
		[ emailFieldGradient.gradientClass ]: emailFieldGradient.gradientClass,
	};

	const buttonClasses = {
		...sharedClasses,
		'has-background': buttonBackgroundColor.color || buttonGradient.gradientValue,
		[ buttonBackgroundColor.class ]: ! buttonGradient.gradientValue && buttonBackgroundColor.class,
		[ buttonGradient.gradientClass ]: buttonGradient.gradientClass,
	};

	const getPaddingStyleValue = paddingValue => {
		const value = paddingValue ? paddingValue : DEFAULT_PADDING_VALUE;

		return (
			value +
			'px ' +
			Math.round( value * 1.5 ) +
			'px ' +
			value +
			'px ' +
			Math.round( value * 1.5 ) +
			'px'
		);
	};

	const getSpacingStyleValue = spacingValue => {
		return spacingValue ? spacingValue : DEFAULT_SPACING_VALUE;
	};

	const sharedStyles = {
		color: textColor.color,
		borderColor: borderColor.color,
		borderRadius: borderRadius ? borderRadius + 'px' : DEFAULT_BORDER_RADIUS_VALUE + 'px',
		borderWidth: borderWeight ? borderWeight + 'px' : DEFAULT_BORDER_WEIGHT_VALUE + 'px',
		fontSize: fontSize.size ? fontSize.size : DEFAULT_FONTSIZE_VALUE,
		padding: getPaddingStyleValue( padding ),
	};

	const cssVars = {
		'--subscribe-block-border-radius': borderRadius
			? borderRadius + 'px'
			: DEFAULT_BORDER_RADIUS_VALUE + 'px',
	};

	const emailFieldStyles = {
		...sharedStyles,
		...( ! emailFieldBackgroundColor.color && emailFieldGradient.gradientValue
			? { background: emailFieldGradient.gradientValue }
			: { backgroundColor: emailFieldBackgroundColor.color } ),
	};

	const buttonStyles = {
		...sharedStyles,
		...( ! buttonBackgroundColor.color && buttonGradient.gradientValue
			? { background: buttonGradient.gradientValue }
			: { backgroundColor: buttonBackgroundColor.color } ),
		width: buttonWidth,
	};

	if ( activeStyleName !== 'button' ) {
		if ( buttonOnNewLine ) {
			buttonStyles.marginTop = getSpacingStyleValue( spacing ) + 'px';
		} else {
			buttonStyles.marginLeft = getSpacingStyleValue( spacing ) + 'px';
		}
	}

	const previousButtonBackgroundColor = usePrevious( buttonBackgroundColor );

	useEffect( () => {
		if ( ! isModuleActive ) {
			return;
		}
		if (
			previousButtonBackgroundColor?.color !== borderColor?.color ||
			borderColor?.color === buttonBackgroundColor?.color
		) {
			return;
		}
		setBorderColor( buttonBackgroundColor.color );
	}, [
		buttonBackgroundColor,
		previousButtonBackgroundColor,
		borderColor,
		setBorderColor,
		isModuleActive,
	] );

	let content;

	if ( isLoadingModules ) {
		content = <SubscriptionSkeletonLoader />;
	} else if ( ! isModuleActive ) {
		content = (
			<SubscriptionsPlaceholder
				changeStatus={ changeStatus }
				isModuleActive={ isModuleActive }
				isLoading={ isChangingStatus }
			/>
		);
	} else {
		content = (
			<>
				<InspectorControls>
					<SubscriptionControls
						buttonBackgroundColor={ buttonBackgroundColor }
						borderColor={ borderColor }
						buttonGradient={ buttonGradient }
						borderRadius={ borderRadius }
						borderWeight={ borderWeight }
						buttonOnNewLine={ buttonOnNewLine }
						emailFieldBackgroundColor={ emailFieldBackgroundColor }
						fallbackButtonBackgroundColor={ fallbackButtonBackgroundColor }
						fallbackTextColor={ fallbackTextColor }
						fontSize={ fontSize }
						includeSocialFollowers={ includeSocialFollowers }
						isGradientAvailable={ isGradientAvailable }
						padding={ padding }
						setAttributes={ setAttributes }
						setBorderColor={ setBorderColor }
						setButtonBackgroundColor={ setButtonBackgroundColor }
						setTextColor={ setTextColor }
						showSubscribersTotal={ showSubscribersTotal }
						spacing={ spacing }
						subscriberCount={ subscriberCount }
						textColor={ textColor }
						buttonWidth={ buttonWidth }
						subscribePlaceholder={ subscribePlaceholder }
						submitButtonText={ submitButtonText }
						successMessage={ successMessage }
					/>
				</InspectorControls>
				{ isNewsletterFeatureEnabled() && (
					<BlockControls>
						<Toolbar>
							<GetAddPaidPlanButton context={ 'toolbar' } hasTierPlans={ hasTierPlans } />
						</Toolbar>
					</BlockControls>
				) }

				<div style={ cssVars }>
					<div className="wp-block-jetpack-subscriptions__container is-not-subscriber">
						<div className="wp-block-jetpack-subscriptions__form" role="form">
							<div className="wp-block-jetpack-subscriptions__form-elements">
								{ activeStyleName !== 'button' && (
									<TextControl
										placeholder={ subscribePlaceholder }
										disabled={ true }
										className={ clsx(
											emailFieldClasses,
											'wp-block-jetpack-subscriptions__textfield'
										) }
										style={ emailFieldStyles }
									/>
								) }
								<RichText
									className={ clsx(
										buttonClasses,
										'wp-block-jetpack-subscriptions__button',
										'wp-block-button__link'
									) }
									onChange={ value => setAttributes( { submitButtonText: value } ) }
									style={ buttonStyles }
									value={ submitButtonText }
									withoutInteractiveFormatting
									allowedFormats={ [ 'core/bold', 'core/italic', 'core/strikethrough' ] }
								/>
							</div>
						</div>
					</div>
					{ showSubscribersTotal && (
						<div className="wp-block-jetpack-subscriptions__subscount">
							{ subscriberCountString }
						</div>
					) }
				</div>
			</>
		);
	}

	return (
		<div
			{ ...blockProps }
			className={ clsx(
				blockProps.className,
				'wp-block-jetpack-subscriptions__container',
				'wp-block-jetpack-subscriptions__supports-newline',
				buttonOnNewLine ? 'wp-block-jetpack-subscriptions__use-newline' : undefined,
				showSubscribersTotal ? 'wp-block-jetpack-subscriptions__show-subs' : undefined
			) }
		>
			{ content }
		</div>
	);
}

const withThemeProvider = WrappedComponent => props => (
	<ThemeProvider>
		<WrappedComponent { ...props } />
	</ThemeProvider>
);

export default compose( [
	withSelect( select => {
		const newsletterPlans = select( 'jetpack/membership-products' )?.getNewsletterTierProducts();
		return {
			hasTierPlans: newsletterPlans?.length !== 0,
		};
	} ),
	withColors(
		{ emailFieldBackgroundColor: 'backgroundColor' },
		{ buttonBackgroundColor: 'backgroundColor' },
		{ textColor: 'color' },
		'borderColor'
	),
	withFontSizes( 'fontSize' ),
	applyFallbackStyles,
	withThemeProvider,
] )( SubscriptionEdit );
