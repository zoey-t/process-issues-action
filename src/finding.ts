import * as core from '@actions/core'
import * as github from '@actions/github'
import path from 'path'
import fs from 'fs'
import {mkdirp} from 'mkdirp'
import {FindingLevel, IConfigs, IDocMD, IFindingMD} from './config'

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
			res.level= label.toString()
			return true
		}

		// if labels is an object
		if (
			typeof label === 'object' &&
			(Object.values(FindingLevel) as string[]).includes(label.name!)
		) {
			res.level= label.name!
			return true
		}
	})

	if (!levelLabelMatch) {
		throw new Error(`issue does not contain level label`)
	}

	core.debug(`issue level ${res.level}`)

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
	res.md = issue.body || ''

	// create file
	const fullPath = path.join(res.fileName)
	const dirName = path.dirname(fullPath)
	fs.rmSync(dirName, {recursive: true, force: true})
	mkdirp.sync(dirName)
	fs.writeFileSync(fullPath, res.md)
	return res
}

export async function batch_processing_finding_issues(
	configs: IConfigs
): Promise<IFindingMD[]> {
	core.info(
		`batch processing all open issues with label '${configs.publishLabel}'`
	)
	const res = {} as unknown as IFindingMD[]
	const octokit = github.getOctokit(configs.token)
	const issues = await octokit.rest.issues.listForRepo({
		owner: configs.srcRepo.owner,
		repo: configs.srcRepo.repo,
		state: 'open',
		labels: `${configs.publishLabel}`
	})
	// findings
	const finding_issues: IFindingMD[] = []
	const doc_issues: IDocMD[] = []
	for (const issue of issues.data) {
		core.debug(`processing issue ${issue.number}`)

		// If it's a doc issue

		const docLabelMatch = issue.labels.find(label => {
			label === 'documentation' ||
				(typeof label === 'object' && label.name === 'documentation')
		})
		if (!docLabelMatch) {
			core.debug(`doc issue: ${issue.number}`)
			doc_issues.push({
				fileName: issue.title,
				md: issue.body || ''
			})

			// create file
			const fullPath = path.join(doc_issues.at(-1)!.fileName)
			const dirName = path.dirname(fullPath)
			fs.rmSync(dirName, {recursive: true, force: true})
			mkdirp.sync(dirName)
			// fs.writeFileSync(fullPath,issue.body)
			//TODO: to current repo instead of target repo
			// octokit.rest.
			continue
		}

		// if it's a finding issue

		const levelLabelMatch = issue.labels.find(label => {
			// if label is a string
			if (
				(Object.values(FindingLevel) as string[]).includes(label.toString())
			) {
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

		let priority
		const priorityLabel = issue.labels.find(label => {
			Number(label) || (typeof label === 'object' && Number(label.name))
		})
		const num = Number(priorityLabel)
		if (!num) {
			priority = 1
		} else {
			priority = num
		}
		if (!levelLabelMatch) {
			finding_issues.push({
				fileName: `${
					issue.number
				}-${priority}-finding-${levelLabelMatch?.toString()!}`,
				level: levelLabelMatch?.toString()!,
				priority: 0,
				md: issue.body || ''
			})

			core.debug(`finding issue: ${finding_issues.at(-1)}`)
		}
	}

	// const doc_issues = await octokit.rest.issues.listForRepo({
	// 	owner: configs.srcRepo.owner,
	// 	repo: configs.srcRepo.repo,
	// 	state: 'open',
	// 	labels:'high, medium, low, info, undetermined'
	// })

	return res
}
