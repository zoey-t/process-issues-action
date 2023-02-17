import * as core from '@actions/core'
import * as github from '@actions/github'
import {IConfigs} from './config'

export async function getInputs(): Promise<IConfigs> {
	const res = {} as unknown as IConfigs
	const {owner, repo} = github.context.repo

	// token
	res.token = core.getInput('token', {required: true})

	// publish label
	res.publishLabel = core.getInput('publish-label', {required: true})
	core.debug(`publish-label = '${res.publishLabel}'`)
	if (!res.publishLabel) {
		throw new Error(`Invalid ${res.publishLabel}`)
	}

	// source repo
	const srcRepo = core.getInput('src-repo') || `${owner}/${repo}`
	core.debug(`src-repo = ${srcRepo}`)
	let splitRepository = srcRepo.split('/')
	if (
		splitRepository.length !== 2 ||
		!splitRepository[0] ||
		!splitRepository[1]
	) {
		throw new Error(
			`Invalid src-repo '${res.srcRepo}'. Expected format {owner}/{repo}.`
		)
	}
	res.srcRepo = {owner: splitRepository[0], repo: splitRepository[1]}
	// target repo
	const targetRepo = core.getInput('target-repo') || `${owner}/${repo}`
	core.debug(`target-repo = ${targetRepo}`)
	splitRepository = targetRepo.split('/')
	if (
		splitRepository.length !== 2 ||
		!splitRepository[0] ||
		!splitRepository[1]
	) {
		throw new Error(
			`Invalid target-repo '${res.targetRepo}'. Expected format {owner}/{repo}.`
		)
	}
	res.targetRepo = {owner: splitRepository[0], repo: splitRepository[1]}

	// is this a finding issue
	res.finding = (core.getInput('finding') || 'true') === 'true'

	res.bacth = (core.getInput('batch') || 'true') === 'true'

	return res
}
