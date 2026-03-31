import { writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { DefaultArtifactClient } from '@actions/artifact';
import * as core from '@actions/core';
import { evaluate } from '@automattic/jetpack-agent-experience-eval';

/**
 * GitHub Action entry point. Runs evaluation and uploads artifact.
 */
async function run(): Promise< void > {
	try {
		const apiKey = core.getInput( 'anthropic_api_key', { required: true } );
		const model = core.getInput( 'model' ) || 'claude-sonnet-4-6';
		const outputPath = core.getInput( 'output_path' ) || 'agent-experience-eval.json';
		const uploadArtifact = core.getInput( 'upload_artifact' ) !== 'false';
		const artifactName = core.getInput( 'artifact_name' ) || 'agent-experience-eval';
		const retentionDays = parseInt( core.getInput( 'artifact_retention_days' ) || '30', 10 );

		core.info( 'Starting agent experience evaluation...' );

		const metadata = await evaluate( {
			repoRoot: process.cwd(),
			apiKey,
			model,
		} );

		// Ensure parent directory exists
		await mkdir( dirname( outputPath ), { recursive: true } );

		// Write full metadata to disk
		await writeFile( outputPath, JSON.stringify( metadata, null, 2 ) );

		// Set outputs
		core.setOutput( 'score', metadata.result.score );
		core.setOutput( 'grade', metadata.result.grade );
		core.setOutput( 'json_path', outputPath );

		core.info( `Score: ${ metadata.result.score }/100 (Grade ${ metadata.result.grade })` );
		core.info( `Discovered ${ metadata.discovery.length } AI instruction files` );
		const { issues = [], recommendations = [] } = metadata.result;
		core.info( `${ issues.length } issues, ${ recommendations.length } recommendations` );
		core.info(
			`Tokens: ${ metadata.usage.inputTokens } input, ${ metadata.usage.outputTokens } output`
		);

		if ( metadata.promptTruncated ) {
			core.warning( 'Prompt was truncated due to size — evaluation may be incomplete' );
		}

		// Upload artifact if requested
		if ( uploadArtifact ) {
			const client = new DefaultArtifactClient();
			await client.uploadArtifact( artifactName, [ outputPath ], '.', {
				retentionDays,
			} );
			core.info( `Uploaded artifact: ${ artifactName }` );
		}
	} catch ( error: unknown ) {
		if ( error instanceof Error ) {
			core.setFailed( error.message );
		} else {
			core.setFailed( 'An unexpected error occurred' );
		}
	}
}

run();
