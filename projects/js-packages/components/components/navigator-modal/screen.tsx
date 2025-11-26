import { Flex, Navigator } from '@wordpress/components';
import clsx from 'clsx';
import { Footer, FooterProps } from './footer.tsx';
import { Header } from './header.tsx';
import styles from './styles.module.scss';
import { SharedProps } from './types.ts';

export type ScreenProps = Partial< SharedProps > & {
	/**
	 * The title of the screen.
	 */
	title?: string;

	/**
	 * The content of the screen.
	 */
	content?: React.ReactNode;

	/**
	 * The path of the screen.
	 */
	path: string;
	/**
	 * The sidebar content
	 */
	sidebar?: React.ReactNode;
	/**
	 * Whether the screen is locked or has a parent screen.
	 *
	 * When it's locked, it means there will be no navigation back to a previous screen.
	 */
	isScreenLocked?: boolean;
	/**
	 * The footer content
	 */
	footerContent?: React.ReactNode;

	/**
	 * The footer actions
	 */
	footerActions?: FooterProps[ 'actions' ];
};

/**
 * Renders a screen.
 *
 * @param {ScreenProps} props - Props
 *
 * @return The rendered screen.
 */
export function Screen( {
	path,
	className,
	title,
	content,
	sidebar,
	children,
	isScreenLocked,
	footerContent,
	footerActions,
}: ScreenProps ) {
	const hasFooter = Boolean( footerContent || ( footerActions && footerActions.length ) );

	return (
		<Navigator.Screen path={ path } className={ clsx( styles.screen, className ) }>
			<Flex direction="column" gap={ 0 }>
				<Header title={ title } isScreenLocked={ isScreenLocked } />

				<div className={ styles.body }>
					<Flex gap={ 0 } align="start">
						{ sidebar ? <div className={ styles.sidebar }>{ sidebar }</div> : null }
						<div className={ styles.content }>{ children || content }</div>
					</Flex>
				</div>
				{ hasFooter ? (
					<Footer actions={ footerActions } isScreenLocked={ isScreenLocked }>
						{ footerContent }
					</Footer>
				) : null }
			</Flex>
		</Navigator.Screen>
	);
}
