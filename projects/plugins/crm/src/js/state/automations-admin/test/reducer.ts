import { Step, Workflow } from 'crm/state/automations-admin/types';
import { hydrateWorkflows, activateWorkflow, deactivateWorkflow, setAttribute } from '../actions';
import { workflows, WorkflowState } from '../reducer';
import { getWorkflow, workflowOne, workflowThree, workflowTwo, getStep } from './util/data';

describe( 'Automations Admin Reducer', () => {
	describe( 'workflows', () => {
		describe( 'hydrateWorkflows', () => {
			test( 'creates the state when hydrating empty', () => {
				const inputWorkflows = [ workflowOne, workflowTwo ];

				const action = hydrateWorkflows( inputWorkflows );
				const state = workflows( {}, action );

				expect( state ).toEqual( {
					[ workflowOne.id ]: workflowOne,
					[ workflowTwo.id ]: workflowTwo,
				} );
			} );

			test( 'replaces the state when hydrating with existing state', () => {
				const inputWorkflows = [ workflowOne, workflowTwo ];
				const initialState = { [ workflowThree.id ]: workflowThree };

				const action = hydrateWorkflows( inputWorkflows );
				const state = workflows( initialState, action );

				expect( Object.keys( state ).map( key => Number( key ) ) ).toEqual( [
					workflowOne.id,
					workflowTwo.id,
				] );
				expect( state[ workflowOne.id ] ).toMatchObject( workflowOne );
				expect( state[ workflowTwo.id ] ).toMatchObject( workflowTwo );
			} );
		} );

		describe( 'activation and deactivation', () => {
			let initialState: WorkflowState;
			let activeWorkflow: Workflow;
			let inactiveWorkflow: Workflow;
			const activeWorkflowId = 1;
			const inactiveWorkflowId = 2;
			const nonExistingWorkflowId = 3;

			beforeEach( () => {
				activeWorkflow = getWorkflow( activeWorkflowId, 'Active Workflow', { active: true } );
				inactiveWorkflow = getWorkflow( inactiveWorkflowId, 'Inactive Workflow', {
					active: false,
				} );
				initialState = workflows( {}, hydrateWorkflows( [ activeWorkflow, inactiveWorkflow ] ) );
			} );

			describe( 'activateWorkflow', () => {
				test( 'activates the selected workflow if it was inactive', () => {
					const action = activateWorkflow( inactiveWorkflowId );
					const newState = workflows( initialState, action );
					expect( newState[ inactiveWorkflowId ].active ).toBe( true );
				} );

				test( 'leaves the selected workflow active if it was active', () => {
					const action = activateWorkflow( activeWorkflowId );
					const newState = workflows( initialState, action );
					expect( newState[ activeWorkflowId ].active ).toBe( true );
				} );

				test( 'does not alter the state of an unselected workflow', () => {
					const action = activateWorkflow( activeWorkflowId );
					const newState = workflows( initialState, action );
					expect( newState[ inactiveWorkflowId ].active ).toBe( false );
				} );

				test( 'does not alter anything if the selected workflow does not exist', () => {
					const action = activateWorkflow( nonExistingWorkflowId );
					const newState = workflows( initialState, action );
					expect( newState[ activeWorkflowId ].active ).toBe( true );
					expect( newState[ inactiveWorkflowId ].active ).toBe( false );
				} );
			} );

			describe( 'deactivateWorkflow', () => {
				test( 'deactivates the selected workflow if it was active', () => {
					const action = deactivateWorkflow( activeWorkflowId );
					const newState = workflows( initialState, action );
					expect( newState[ activeWorkflowId ].active ).toBe( false );
				} );

				test( 'leaves the selected workflow inactive if it was inactive', () => {
					const action = deactivateWorkflow( inactiveWorkflowId );
					const newState = workflows( initialState, action );
					expect( newState[ inactiveWorkflowId ].active ).toBe( false );
				} );

				test( 'does not alter the state of an unselected workflow', () => {
					const action = deactivateWorkflow( inactiveWorkflowId );
					const newState = workflows( initialState, action );
					expect( newState[ activeWorkflowId ].active ).toBe( true );
				} );

				test( 'does not alter anything if the selected workflow does not exist', () => {
					const action = deactivateWorkflow( nonExistingWorkflowId );
					const newState = workflows( initialState, action );
					expect( newState[ activeWorkflowId ].active ).toBe( true );
					expect( newState[ inactiveWorkflowId ].active ).toBe( false );
				} );
			} );
		} );

		describe( 'setAttribute', () => {
			let initialState: WorkflowState;
			let stepOne: Step;
			let stepTwo: Step;
			let stepThree: Step;
			let workflow: Workflow;

			const stepOneInitialAttributes = {
				stepOneUnchangedKey: 'stepOneUnchangedValue',
				stepOneChangedKey: 'stepOneChangedValue',
			};
			const stepTwoInitialAttributes = {
				stepTwoUnchangedKey: 'stepTwoUnchangedValue',
				stepTwoChangedKey: 'stepTwoChangedValue',
			};
			const stepThreeInitialAttributes = {
				stepThreeUnchangedKey: 'stepThreeUnchangedValue',
				stepThreeChangedKey: 'stepThreeChangedValue',
			};

			beforeEach( () => {
				stepOne = getStep( 'step_one', 'Step One', {
					attributes: stepOneInitialAttributes,
				} );
				stepTwo = getStep( 'step_two', 'Step Two', {
					attributes: stepTwoInitialAttributes,
				} );
				stepThree = getStep( 'step_three', 'Step Three', {
					attributes: stepThreeInitialAttributes,
				} );
				stepOne.next_step = stepTwo.id;
				stepTwo.next_step = stepThree.id;
				workflow = getWorkflow( 1, 'Workflow', {
					initial_step: stepOne.id,
					steps: {
						[ stepOne.id ]: stepOne,
						[ stepTwo.id ]: stepTwo,
						[ stepThree.id ]: stepThree,
					},
				} );
				initialState = {
					[ workflow.id ]: workflow,
				};
			} );

			test( 'does not alter state if the workflow is not found', () => {
				const action = setAttribute( -1, stepOne.id, 'key', 'value' );

				const newState = workflows( initialState, action );

				expect( newState ).toEqual( initialState );
			} );

			test( 'does not alter state if the step is not found', () => {
				const action = setAttribute( 1, 'null', 'key', 'value' );

				const newState = workflows( initialState, action );

				expect( newState ).toEqual( initialState );
			} );

			test( 'sets the attributes on the initial step', () => {
				const newAttributeValue = 'newValue';

				const action = setAttribute(
					workflow.id,
					stepOne.id,
					'stepOneChangedKey',
					newAttributeValue
				);
				const newState = workflows( initialState, action );

				expect( newState[ workflow.id ].steps[ stepOne.id ].attributes ).toEqual( {
					...stepOneInitialAttributes,
					stepOneChangedKey: newAttributeValue,
				} );
				expect( newState[ workflow.id ].steps[ stepTwo.id ].attributes ).toEqual(
					stepTwoInitialAttributes
				);
				expect( newState[ workflow.id ].steps[ stepThree.id ].attributes ).toEqual(
					stepThreeInitialAttributes
				);
			} );

			test( 'sets the attributes on a middle step', () => {
				const newAttributeValue = 'newValue';

				const action = setAttribute(
					workflow.id,
					stepTwo.id,
					'stepTwoChangedKey',
					newAttributeValue
				);
				const newState = workflows( initialState, action );

				expect( newState[ workflow.id ].steps[ stepOne.id ].attributes ).toEqual(
					stepOneInitialAttributes
				);
				expect( newState[ workflow.id ].steps[ stepTwo.id ].attributes ).toEqual( {
					...stepTwoInitialAttributes,
					stepTwoChangedKey: newAttributeValue,
				} );
				expect( newState[ workflow.id ].steps[ stepThree.id ].attributes ).toEqual(
					stepThreeInitialAttributes
				);
			} );

			test( 'sets the attributes on a final step', () => {
				const newAttributeValue = 'newValue';

				const action = setAttribute(
					workflow.id,
					stepThree.id,
					'stepThreeChangedKey',
					newAttributeValue
				);
				const newState = workflows( initialState, action );

				expect( newState[ workflow.id ].steps[ stepOne.id ].attributes ).toEqual(
					stepOneInitialAttributes
				);
				expect( newState[ workflow.id ].steps[ stepTwo.id ].attributes ).toEqual(
					stepTwoInitialAttributes
				);
				expect( newState[ workflow.id ].steps[ stepThree.id ].attributes ).toEqual( {
					...stepThreeInitialAttributes,
					stepThreeChangedKey: newAttributeValue,
				} );
			} );
		} );
	} );
} );
