import {getInputs} from './input-helper'
import * as core from '@actions/core'
// import * as github from '@actions/github'
import {batch_processing_finding_issues, process_issue} from './finding'

async function run(): Promise<void> {
	try {
		const configs = await getInputs()
		if (configs.batch === true) {
			await batch_processing_finding_issues(configs)
		} else {
			await process_issue(configs)
		}

		// core.info(`file name ${finding_md.fileName}`)
		// core.debug(`${finding_md.md}`)
	} catch (error) {
		if (error instanceof Error) core.setFailed(error.message)
	}
}

run()
