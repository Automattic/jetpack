import { JetpackLogo } from '@automattic/jetpack-components';
import { Stack } from '@wordpress/ui';
import SubpageBreadcrumbs from '$features/ui/subpage-breadcrumbs/subpage-breadcrumbs';
import styles from './subpage-frame.module.scss';
import type { ReactNode } from 'react';

type SubpageFrameProps = {
	title: string;
	children: ReactNode;
};

/**
 * A breadcrumb header above the page content.
 *
 * @param props          - Component props.
 * @param props.title    - The page's title, shown as the current breadcrumb.
 * @param props.children - Page content.
 */
const SubpageFrame = ( { title, children }: SubpageFrameProps ) => (
	<div className={ styles.frame }>
		<Stack
			render={ <header /> }
			direction="row"
			gap="sm"
			align="center"
			className={ styles.header }
		>
			<div className={ styles.visual } aria-hidden="true">
				<JetpackLogo showText={ false } height={ 20 } />
			</div>
			<SubpageBreadcrumbs title={ title } />
		</Stack>
		<div className={ styles.content }>
			<div className={ styles.column }>{ children }</div>
		</div>
	</div>
);

export default SubpageFrame;
