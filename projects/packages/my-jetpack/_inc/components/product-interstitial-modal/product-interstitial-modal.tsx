import { Text, Button, ThemeProvider, Col, Container } from '@automattic/jetpack-components';
import { Modal } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import { useCallback, useState, cloneElement, type FC } from 'react';
import LoadingBlock from '../loading-block';
import styles from './style.module.scss';

interface BaseProductInterstitialModalProps {
	/**
	 * Title of the modal
	 */
	title: string;
	/**
	 * Description of the modal
	 */
	description?: string;
	/**
	 * Custom trigger component to replace default button. It also handles the onOpen callback like the regular button.
	 */
	customModalTrigger?: React.ReactElement;
	/**
	 * Trigger button of the modal
	 */
	modalTriggerButtonLabel?: string;
	/**
	 * Variant of the trigger button
	 */
	modalTriggerButtonVariant?: 'primary' | 'secondary';
	/**
	 * Class name of the modal
	 */
	className?: string;
	/**
	 * Children of the modal, placed in the left column between the description and the price component
	 */
	children?: React.ReactNode;
	/**
	 * Secondary column of the modal, placed in the right column or the middle column (if hasAdditionalColumn is true)
	 */
	secondaryColumn?: React.ReactNode;
	/**
	 * Apply aspect ratio class when showing video in the secondary column
	 */
	isWithVideo?: boolean;
	/**
	 * Show additional column in the modal switching to three columns layout (additional column is always on the right)
	 */
	additionalColumn?: React.ReactNode;
	/**
	 * Loading state of the modal
	 */
	isLoading: boolean;
	/**
	 * On open callback of the modal
	 */
	onOpen?: () => void;
	/**
	 * On close callback of the modal
	 */
	onClose?: () => void;
	/**
	 * On click callback of the main modal button
	 */
	onModalMainButtonClick?: () => void;
	/**
	 * Is CTA button disabled
	 */
	isButtonDisabled?: boolean;
	/**
	 * Show an external link icon for the secondary button
	 */
	secondaryButtonHasExternalLink?: boolean;
	/**
	 * Href of the secondary button
	 */
	secondaryButtonHref?: string;
	/**
	 * Price component of the modal
	 */
	priceComponent?: React.ReactNode;
}

type WithMainCTAButton = BaseProductInterstitialModalProps & {
	/**
	 * Main button of the modal
	 */
	modalMainButton: React.ReactElement;
	/**
	 * Href of the CTA button in the modal
	 */
	buttonHref?: never;
	/**
	 * Label of the CTA button
	 */
	buttonLabel?: never;
	/**
	 * Show an external link icon for the CTA button
	 */
	buttonHasExternalLink?: never;
};

type WithMainCTAButtonHref = BaseProductInterstitialModalProps & {
	/**
	 * Main button of the modal
	 */
	modalMainButton?: never;
	/**
	 * Href of the CTA button in the modal
	 */
	buttonHref?: string;
	/**
	 * Label of the CTA button
	 */
	buttonLabel?: string;
	/**
	 * Show an external link icon for the CTA button
	 */
	buttonHasExternalLink?: boolean;
};

type ProductInterstitialModalProps = WithMainCTAButton | WithMainCTAButtonHref;

const ProductInterstitialModal: FC< ProductInterstitialModalProps > = props => {
	const {
		title,
		description,
		className,
		children,
		customModalTrigger,
		modalTriggerButtonLabel,
		modalTriggerButtonVariant = 'primary',
		onOpen,
		onClose,
		onModalMainButtonClick,
		modalMainButton,
		isButtonDisabled,
		buttonHasExternalLink = false,
		buttonHref,
		buttonLabel,
		secondaryButtonHasExternalLink = true,
		secondaryButtonHref,
		secondaryColumn,
		isWithVideo = true,
		additionalColumn = false,
		priceComponent,
		isLoading,
	} = props;

	const [ isOpen, setOpen ] = useState( false );
	const openModal = useCallback( () => {
		onOpen?.();
		setOpen( true );
	}, [ onOpen ] );
	const closeModal = useCallback( () => {
		onClose?.();
		setOpen( false );
	}, [ onClose ] );

	if ( ! title || ( ! modalTriggerButtonLabel && ! customModalTrigger ) ) {
		return null;
	}

	// Render trigger element
	const triggerElement = customModalTrigger ? (
		// Clone custom trigger and inject onClick handler
		cloneElement( customModalTrigger, { onClick: openModal } )
	) : (
		// Default button behavior
		<Button variant={ modalTriggerButtonVariant } onClick={ openModal }>
			{ modalTriggerButtonLabel }
		</Button>
	);

	const PrimaryButton =
		modalMainButton &&
		cloneElement( modalMainButton, {
			onClick: onModalMainButtonClick,
			buttonLabel,
			disabled: isButtonDisabled,
			isExternalLink: buttonHasExternalLink,
			href: buttonHref,
		} );

	return (
		<>
			<ThemeProvider>
				{ triggerElement }
				{ isOpen && (
					<Modal
						onRequestClose={ closeModal }
						className={ clsx( styles[ 'component-product-interstitial-modal' ], className ) }
						overlayClassName={ styles[ 'component-product-interstitial-modal__overlay' ] }
					>
						<Container
							className={ styles.wrapper }
							horizontalSpacing={ 1 }
							horizontalGap={ 2 }
							fluid={ false }
						>
							{
								// left column - always takes 33% of the width or the full width for small breakpoint
							 }
							<Col sm={ 4 } md={ 8 } lg={ 4 } className={ styles.primary }>
								<div className={ styles[ 'primary-content' ] }>
									<div className={ styles.header }>
										<Text variant="headline-small" className={ styles.title }>
											{ title }
										</Text>
									</div>
									{ isLoading ? (
										<LoadingBlock height="50px" width="100%" />
									) : (
										description && (
											<Text variant="body" className={ styles.description }>
												{ description }
											</Text>
										)
									) }
									{ children }
									{ isLoading ? (
										<LoadingBlock height="100px" width="100%" />
									) : (
										priceComponent && (
											<div className={ styles[ 'price-container' ] }>{ priceComponent }</div>
										)
									) }
								</div>
								<div className={ styles[ 'primary-footer' ] }>
									{ PrimaryButton }
									<Button
										variant="link"
										isExternalLink={ secondaryButtonHasExternalLink }
										href={ secondaryButtonHref }
									>
										{ __( 'Learn more', 'jetpack-my-jetpack' ) }
									</Button>
								</div>
							</Col>
							{
								// middle column for three columns layout and the right column for two columns layout
								// small breakpoint: takes full width
								// medium breakpoint: ~63% of the width without the additional column or 50% of the second row with the additional column
								// large breakpoint: 66% of the width without the additional column or 33% with the additional column
							 }
							<Col
								sm={ 4 }
								md={ additionalColumn ? 4 : 8 }
								lg={ additionalColumn ? 4 : 8 }
								className={ clsx( styles.secondary, {
									[ styles[ 'modal-with-video' ] ]: isWithVideo,
								} ) }
							>
								{ secondaryColumn }
							</Col>
							{
								// additional column for three columns layout
								// small breakpoint (max 4 cols): takes full width
								// medium breakpoint (max 8 cols): 50% of the second row width
								// large breakpoint (max 12 cols): 33% of the width
								additionalColumn && (
									<Col sm={ 4 } md={ 4 } lg={ 4 } className={ styles.additional }>
										{ additionalColumn }
									</Col>
								)
							}
						</Container>
					</Modal>
				) }
			</ThemeProvider>
		</>
	);
};

export default ProductInterstitialModal;
