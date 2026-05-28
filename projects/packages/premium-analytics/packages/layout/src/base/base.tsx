/**
 * External dependencies
 */
import { Stack } from '@wordpress/ui';

type BaseLayoutProps = {
	header: React.ReactNode;
	children: React.ReactNode;
};

/**
 *
 * @param root0
 * @param root0.header
 * @param root0.children
 */
export function BaseLayout( { header, children }: BaseLayoutProps ) {
	return (
		<Stack gap="lg" direction="column">
			<>{ header }</>
			<>{ children }</>
		</Stack>
	);
}
