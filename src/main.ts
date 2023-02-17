import { getInputs } from './input-helper'
import * as core from '@actions/core'
import * as github from '@actions/github'
import { process_finding_issue } from './finding'

async function run(): Promise<void> {
	try {
		let configs = await getInputs()
    process_finding_issue(configs);
	} catch (error) {
		if (error instanceof Error) core.setFailed(error.message)
	}
}

run()
