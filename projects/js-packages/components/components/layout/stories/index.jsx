/**
 * Internal dependencies
 */
import Container from '../container';
import Col from '../col';
import Text from '../../text';
import styles from './styles.module.scss';
import useBreakpointMatch from '../use-breakpoint-match';

const Layout = ( { items, fluid, horizontalGap, horizontalSpacing } ) => {
	return (
		<Container
			className={ styles.container }
			horizontalSpacing={ horizontalSpacing }
			fluid={ fluid }
			horizontalGap={ horizontalGap }
		>
			{ items.map( ( { sm, lg, md } ) => (
				<Col sm={ sm } md={ md } lg={ lg } className={ styles.col }>
					{ Number.isInteger( sm ) ? `sm=${ sm } ` : '' }
					{ Number.isInteger( md ) ? `md=${ md } ` : '' }
					{ Number.isInteger( lg ) ? `lg=${ lg } ` : '' }
				</Col>
			) ) }
			<Col>
				<Container fluid horizontalSpacing={ 0 } horizontalGap={ 1 }>
					<Col className={ styles.col }>Composition Example</Col>
					<Col className={ styles.col }>Composition Example</Col>
				</Container>
			</Col>
		</Container>
	);
};

export default {
	title: 'JS Packages/Components/Layout',
	component: Layout,
};

const Template = args => <Layout { ...args } />;
export const Default = Template.bind( {} );
Default.args = {
	fluid: false,
	horizontalSpacing: 10,
	horizontalGap: 5,
	items: [
		{
			sm: 2,
			md: 5,
			lg: 4,
		},
		{
			sm: 2,
			md: 3,
			lg: 8,
		},
		{
			sm: 2,
			md: 3,
			lg: 8,
		},
		{
			sm: 2,
			md: 5,
			lg: 4,
		},
		{
			sm: 2,
			md: 5,
			lg: 4,
		},
		{
			sm: 2,
			md: 3,
			lg: 8,
		},
	],
};

export const BreakpointMatch = () => {
	const [
		isSm,
		isGtSm,
		isMd,
		isLtOrMd,
		isLtMd,
		isGtOrMd,
		isGtMd,
		isLessThanLg,
		isLg,
	] = useBreakpointMatch(
		[ 'sm', 'sm', 'md', 'md', 'md', 'md', 'md', 'lg', 'lg' ],
		[ null, '>', null, '<=', '<', '>=', '>', '<', null ]
	);

	return (
		<Container>
			{ /* SMALL */ }
			<Text variant="headline-small">Small</Text>
			<Col>
				<Text variant="title-small">Is Small</Text>
				<Text className={ isSm ? styles.yes : styles.no }>{ isSm ? 'Yes' : 'False' }</Text>
			</Col>
			<Col>
				<Text variant="title-small">Is greater than Small</Text>
				<Text className={ isGtSm ? styles.yes : styles.no }>{ isGtSm ? 'Yes' : 'False' }</Text>
			</Col>
			{ /* MEDIUM */ }
			<Text variant="headline-small">Medium</Text>
			<Col>
				<Text variant="title-small">Is Medium</Text>
				<Text className={ isMd ? styles.yes : styles.no }>{ isMd ? 'Yes' : 'False' }</Text>
			</Col>
			<Col>
				<Text variant="title-small">Is less then Medium</Text>
				<Text className={ isLtMd ? styles.yes : styles.no }>{ isLtMd ? 'Yes' : 'False' }</Text>
			</Col>
			<Col>
				<Text variant="title-small">Is less then OR Medium</Text>
				<Text className={ isLtOrMd ? styles.yes : styles.no }>{ isLtOrMd ? 'Yes' : 'False' }</Text>
			</Col>
			<Col>
				<Text variant="title-small">Is greater then Medium</Text>
				<Text className={ isGtMd ? styles.yes : styles.no }>{ isGtMd ? 'Yes' : 'False' }</Text>
			</Col>
			<Col>
				<Text variant="title-small">Is greater then OR Medium</Text>
				<Text className={ isGtOrMd ? styles.yes : styles.no }>{ isGtOrMd ? 'Yes' : 'False' }</Text>
			</Col>
			{ /* LARGE */ }
			<Text variant="headline-small">Large</Text>
			<Col>
				<Text variant="title-small">Is Large</Text>
				<Text className={ isLg ? styles.yes : styles.no }>{ isLg ? 'Yes' : 'False' }</Text>
			</Col>
			<Col>
				<Text variant="title-small">Is less than Large</Text>
				<Text className={ isLessThanLg ? styles.yes : styles.no }>
					{ isLessThanLg ? 'Yes' : 'False' }
				</Text>
			</Col>
		</Container>
	);
};
