import GuidedTour from '../index';

export default {
	title: 'JS Packages/Components/GuidedTour',
	component: GuidedTour,
	argTypes: {},
};

const Template = args => {
	return (
		<div style={ { display: 'flex', alignItems: 'start', gap: '1rem', flexDirection: 'column' } }>
			<div className="abc">
				<input type="button" value="Button 1"></input>
			</div>
			<div className="def">
				<input type="button" value="Button 2"></input>
			</div>
			<div className="ghi">
				<input type="button" value="Button 3"></input>
			</div>
			<GuidedTour
				className="guided-tour"
				preferenceName="dashboard-tour"
				tours={ [
					{
						target: '.abc',
						title: 'tour title 1',
						description: 'This is button 1',
					},
					{
						target: '.def',
						title: 'tour title 2',
						description: 'This is button 2.',
					},
					{
						target: '.ghi',
						title: 'tour title 3',
						description: 'Finally, this is button 3.',
					},
				] }
				isDismissed={ false }
				hasFetched={ true }
				onEndTour={ () => {
					// eslint-disable-next-line no-console
					console.log( 'Tour ended' );
				} }
				onStartTour={ () => {
					// eslint-disable-next-line no-console
					console.log( 'Tour started' );
				} }
			/>
		</div>
	);
};

export const _Default = Template.bind( {} );
