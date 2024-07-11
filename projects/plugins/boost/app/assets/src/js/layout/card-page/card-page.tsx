import Footer from '$layout/footer/footer';
import Header from '$layout/header/header';
import ActivateLicense from '$features/activate-license/activate-license';
import BackButton from '$features/ui/back-button/back-button';
import JetpackLogo from '$svg/jetpack-green';
import clsx from 'clsx';
import styles from './card-page.module.scss';

type CardPageProps = {
	children: React.ReactNode;
	showActivateLicense?: boolean;
	showBackButton?: boolean;
	sidebarItem?: React.ReactNode;
	footerNote?: string;
};

const CardPage = ( {
	children,
	showActivateLicense = true,
	showBackButton = true,
	footerNote,
	sidebarItem,
}: CardPageProps ) => {
	return (
		<div id="jb-dashboard" className="jb-dashboard">
			<Header>{ showActivateLicense && <ActivateLicense /> }</Header>

			<div className={ styles.body }>
				<div className={ 'jb-container jb-container--fixed mt-2' }>
					{ showBackButton && <BackButton /> }
					<div className={ styles.card }>
						<div className={ styles.content }>
							<JetpackLogo />
							{ children }
						</div>

						<div className={ clsx( styles.cta, 'px-2 my-4' ) }>{ sidebarItem }</div>
					</div>
					{ footerNote && <footer className={ styles[ 'footer-note' ] }>{ footerNote }</footer> }
				</div>
			</div>

			<div className={ styles.footer }>
				<Footer />
			</div>
		</div>
	);
};

export default CardPage;
