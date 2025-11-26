import { Button, Flex, FlexBlock, FlexItem, useNavigator } from '@wordpress/components';
import { useContext } from 'react';
import { NavigatorModalContext } from './context.ts';
import styles from './styles.module.scss';
import { SharedProps } from './types.ts';

export type FooterProps = SharedProps & {
	actions?: Array< React.ComponentProps< typeof Button > >;
	isScreenLocked?: boolean;
};

/**
 * Renders a footer.
 *
 * @param {FooterProps} props - Props
 *
 * @return The rendered footer.
 */
export function Footer( { children, actions, isScreenLocked }: FooterProps ) {
	const navigator = useNavigator();
	const context = useContext( NavigatorModalContext );

	return (
		<Flex className={ styles.footer }>
			<FlexBlock>{ children }</FlexBlock>
			{ actions ? (
				<FlexItem>
					<Flex>
						{ actions.map( ( { onClick, ...actionProps }, index ) => (
							<Button
								// eslint-disable-next-line react/jsx-no-bind
								onClick={ event => {
									onClick?.( event );

									if ( ! isScreenLocked ) {
										navigator.goBack();
									} else {
										context.onClose?.();
									}
								} }
								key={ index }
								{ ...actionProps }
							/>
						) ) }
					</Flex>
				</FlexItem>
			) : null }
		</Flex>
	);
}
