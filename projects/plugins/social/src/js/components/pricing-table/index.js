import { useBreakpointMatch } from '@automattic/jetpack-components';
import styles from './styles.module.scss';

const PricingTableValue = ( { label, value } ) => {
	const [ isLg ] = useBreakpointMatch( 'lg' );

	const isIncluded = typeof value === 'object' ? value.value : value;

	if ( ! isLg && ! isIncluded ) {
		return <></>;
	}

	const customLabel = typeof value === 'object' ? value.label : null;
	const defaultLabel = isIncluded ? 'Included' : 'Not included';

	label = isLg ? defaultLabel : label;

	return (
		<span data-check={ isIncluded } className={ styles.value }>
			{ customLabel || label }
		</span>
	);
};

const PricingTable = () => {
	const [ isLg ] = useBreakpointMatch( 'lg' );

	const headers = [ <span>Header 1</span>, <span>Header 2</span> ];

	const table = [
		{
			label: 'Number of shares',
			values: [
				{
					value: true,
					label: isLg ? <strong>Up to 1000</strong> : <strong>Up to 1000 shares per month</strong>,
				},
				{ value: true, label: isLg ? 'Up to 30' : 'Up to 30 shares per month' },
			],
		},
		{ label: 'Twitter, Facebook, LinkedIn & Tumblr', values: [ true, true ] },
		{ label: 'Custom excerpts', values: [ true, true ] },
		{
			label: isLg
				? 'Schedule publishing to social channels'
				: 'Schedule publishing to social media channels',
			values: [ true, true ],
		},
		{ label: 'Priority support', values: [ true, false ] },
	];

	const labels = table.map( item => item.label );
	const values = table.map( item => item.values );

	return (
		<div
			className={ styles.container }
			style={ { '--rows': values.length + 1, '--columns': headers.length + 1 } }
		>
			<div className={ styles.table }>
				<div>Title</div>
				{ labels.map( label => (
					<span className={ styles.value }>{ label }</span>
				) ) }
				{ headers.map( ( header, i ) => (
					<>
						<div data-heading>{ header }</div>
						{ table.map( row => (
							<PricingTableValue label={ row.label } value={ row.values[ i ] } />
						) ) }
					</>
				) ) }
			</div>
		</div>
	);
};

export default PricingTable;
