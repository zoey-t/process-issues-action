import {getInputs} from './input-helper'
import * as core from '@actions/core'
// import * as github from '@actions/github'
import {process_issue} from './finding'

async function run(): Promise<void> {
	try {
		const configs = await getInputs()
		const issue_md = await process_issue(configs)
		// core.info(`file name ${finding_md.fileName}`)
		// core.debug(`${finding_md.md}`)
	} catch (error) {
		if (error instanceof Error) core.setFailed(error.message)
	}
}

run()
