import * as core from '@actions/core'
import * as github from '@actions/github'
import {FindingLevel, IConfigs, IFindingMD} from './config'

export async function process_finding_issue(
	configs: IConfigs
): Promise<IFindingMD> {
	// if(configs.finding != true) {
	// 	throw new Error(`not a finding issue`)
	// }
	const res = {} as unknown as IFindingMD
	const octokit = github.getOctokit(configs.token)
	const srcRepo = configs.srcRepo

	const issue = github.context.payload.issue
	if (!issue) {
		throw new Error(`this action must be triggered by 'issue'`)
	}

	// issue number
	const issueNum = issue.number
	// fetch issue that triggered the action
	const response = await octokit.rest.issues.get({
		owner: srcRepo.owner,
		repo: srcRepo.repo,
		issue_number: issueNum
	})

	// get labels
	const {
		data: {labels}
	} = response

	// check if it has publishlabel
	const publishLabelMatch = labels.find(
		label =>
			label === configs.publishLabel ||
			(typeof label === 'object' && label.name === configs.publishLabel)
	)

	if (!publishLabelMatch) {
		throw new Error(
			`issue does not contain publish label '${configs.publishLabel}'`
		)
	}

	const levelLabelMatch = labels.find(label => {
		// if label is a string
		if ((Object.values(FindingLevel) as string[]).includes(label.toString())) {
			return true
		}

		// if labels is an object
		if (
			typeof label === 'object' &&
			(Object.values(FindingLevel) as string[]).includes(label.name!)
		) {
			return true
		}
	})

	if (!levelLabelMatch) {
		throw new Error(`issue does not contain level label`)
	}

	res.level = levelLabelMatch.toString()
	console.debug(`issue level ${res.level}`)

	const priorityLabel = labels.find(label => {
		Number(label) || (typeof label === 'object' && Number(label.name))
	})
	const num = Number(priorityLabel)
	if (!num) {
		res.priority = 1
	} else {
		res.priority = num
	}

	res.priority = Number(priorityLabel)

	res.fileName = `${issueNum}-${res.priority}-finding-${res.level}`
	return res
}

export async function batch_processing_finding_issues(
	config: IConfigs
): Promise<IFindingMD[]> {
	const res = {} as unknown as IFindingMD[]

	return res
}
