import { Text, Button, ThemeProvider, Col, Container } from '@automattic/jetpack-components';
import { Modal } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import { useCallback, useState, type FC } from 'react';
import styles from './style.module.scss';

interface ProductInterstitialModalProps {
	title: string;
	hideCloseButton?: boolean;
	triggerButton?: React.ReactNode;
	className?: string;
	children?: React.ReactNode;
	secondaryColumn?: React.ReactNode;
	additionalColumn?: React.ReactNode;
	onOpen?: () => void;
	onClose?: () => void;
	onClick?: () => void;
	secondaryButtonExternalLink?: boolean;
	secondaryButtonHref?: string;
	buttonDisabled?: boolean;
	buttonExternalLink?: boolean;
	buttonHref?: string;
	buttonContent?: string;
}

const ProductInterstitialModal: FC< ProductInterstitialModalProps > = props => {
	const {
		title,
		className,
		children,
		triggerButton,
		onOpen,
		onClose,
		onClick,
		buttonDisabled,
		buttonExternalLink,
		buttonHref,
		buttonContent,
		secondaryButtonExternalLink,
		secondaryButtonHref,
		secondaryColumn,
		additionalColumn = false,
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

	if ( ! title || ! children || ! triggerButton ) {
		return null;
	}

	return (
		<>
			<ThemeProvider>
				{
					// TODO: use any component as a trigger
				 }
				<Button variant="secondary" onClick={ openModal }>
					{ triggerButton }
				</Button>
				{ isOpen && (
					<Modal
						onRequestClose={ closeModal }
						className={ clsx( styles[ 'component-product-interstitial-modal' ], className ) }
					>
						<Container
							className={ styles.wrapper }
							horizontalSpacing={ 0 }
							horizontalGap={ 1 }
							fluid={ false }
						>
							{
								// left column - always takes 33% of the width or the full with for small breakpoint
							 }
							<Col sm={ 4 } md={ 8 } lg={ 4 } className={ styles.primary }>
								<div className={ styles[ 'primary-content' ] }>
									<div className={ styles.header }>
										<Text variant="headline-small" className={ styles.title }>
											{ title }
										</Text>
									</div>
									{ children }
								</div>
								<div className={ styles[ 'primary-footer' ] }>
									<Button
										variant="primary"
										className={ styles[ 'action-button' ] }
										disabled={ buttonDisabled }
										onClick={ onClick }
										isExternalLink={ buttonExternalLink }
										href={ buttonHref }
									>
										{ buttonContent }
									</Button>
									<Button
										variant="link"
										isExternalLink={ secondaryButtonExternalLink }
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
								md={ additionalColumn ? 4 : 5 }
								lg={ additionalColumn ? 4 : 8 }
								className={ styles.secondary }
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
