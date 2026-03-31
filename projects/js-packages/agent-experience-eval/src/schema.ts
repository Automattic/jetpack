import { z } from 'zod/v4';

const criterionSchema = z.object( {
	score: z.number().min( 0 ),
	max: z.number(),
	notes: z.string(),
} );

export const evaluationResultSchema = z.object( {
	version: z.literal( 1 ),
	score: z.number().min( 0 ).max( 100 ),
	grade: z.enum( [ 'A', 'B', 'C', 'D', 'F' ] ),
	files_found: z.array( z.string() ),
	criteria: z.object( {
		commands_workflows: criterionSchema,
		architecture_clarity: criterionSchema,
		non_obvious_patterns: criterionSchema,
		conciseness: criterionSchema,
		currency: criterionSchema,
		actionability: criterionSchema,
	} ),
	issues: z.array( z.string() ),
	recommendations: z.array( z.string() ),
} );

export type EvaluationResult = z.infer< typeof evaluationResultSchema >;
export type CriterionResult = z.infer< typeof criterionSchema >;
