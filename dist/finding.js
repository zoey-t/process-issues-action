"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.batch_processing_finding_issues = exports.process_issue = exports.process_finding_issue = void 0;
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
// import * as glob from 'glob'
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const mkdirp_1 = require("mkdirp");
const config_1 = require("./config");
// bc of issue trigger. src should be the same repo
function process_finding_issue(configs) {
    return __awaiter(this, void 0, void 0, function* () {
        // if(configs.finding != true) {
        // 	throw new Error(`not a finding issue`)
        // }
        const res = {};
        const octokit = github.getOctokit(configs.token);
        const srcRepo = configs.srcRepo;
        const issue = github.context.payload.issue;
        if (!issue) {
            throw new Error(`this action must be triggered by 'issue'`);
        }
        // issue number
        const issueNum = issue.number;
        // fetch issue that triggered the action
        const response = yield octokit.rest.issues.get({
            owner: srcRepo.owner,
            repo: srcRepo.repo,
            issue_number: issueNum
        });
        // get labels
        const { data: { labels } } = response;
        // check if it has publishlabel
        const publishLabelMatch = labels.find(label => label === configs.publishLabel ||
            (typeof label === 'object' && label.name === configs.publishLabel));
        if (!publishLabelMatch) {
            throw new Error(`issue does not contain publish label '${configs.publishLabel}'`);
        }
        const levelLabelMatch = labels.find(label => {
            // if label is a string
            if (Object.values(config_1.FindingLevel).includes(label.toString())) {
                res.level = label.toString();
                return true;
            }
            // if labels is an object
            if (typeof label === 'object' &&
                Object.values(config_1.FindingLevel).includes(label.name)) {
                res.level = label.name;
                return true;
            }
        });
        if (!levelLabelMatch) {
            throw new Error(`issue does not contain level label`);
        }
        let num = 1;
        core.info(`issue level ${res.level}`);
        const priorityLabel = labels.find(label => {
            if (Number(label)) {
                num = Number(label);
                return true;
            }
            if (typeof label === 'object' && Number(label.name)) {
                num = Number(label.name);
                return true;
            }
        });
        if (!num) {
            res.priority = 1;
        }
        else {
            res.priority = num;
        }
        core.info(`priority: ${res.priority}`);
        res.fileName = `${issueNum}-${res.priority}-finding-${res.level}.md`;
        core.info(`md file: ${res.fileName}`);
        res.md = issue.body || '';
        // create file
        const fullPath = path_1.default.join(res.fileName);
        const dirName = path_1.default.dirname(fullPath);
        fs_1.default.rmSync(dirName, { recursive: true, force: true });
        mkdirp_1.mkdirp.sync(dirName);
        fs_1.default.writeFileSync(fullPath, res.md);
        return res;
    });
}
exports.process_finding_issue = process_finding_issue;
function process_issue(configs) {
    return __awaiter(this, void 0, void 0, function* () {
        const octokit = github.getOctokit(configs.token);
        const srcRepo = configs.srcRepo;
        const issue = github.context.payload.issue;
        if (!issue) {
            throw new Error(`this action must be triggered by 'issue'`);
        }
        // issue number
        const issueNum = issue.number;
        // fetch issue that triggered the action
        const response = yield octokit.rest.issues.get({
            owner: srcRepo.owner,
            repo: srcRepo.repo,
            issue_number: issueNum
        });
        // get labels
        const { data: { labels, title, body } } = response;
        core.debug(`processing issue ${issue.number}`);
        // check if it has publishlabel
        const publishLabelMatch = labels.find(label => label === configs.publishLabel ||
            (typeof label === 'object' && label.name === configs.publishLabel));
        if (!publishLabelMatch) {
            throw new Error(`issue does not contain publish label '${configs.publishLabel}'`);
        }
        // If it's a doc issue
        const docLabelMatch = labels.find(label => {
            label === 'documentation' ||
                (typeof label === 'object' && label.name === 'documentation');
        });
        if (!docLabelMatch) {
            core.debug(`doc issue: ${issue.number}`);
            // create file
            const fullPath = path_1.default.join(`${title.trim()}.md`);
            const dirName = path_1.default.dirname(fullPath);
            fs_1.default.rmSync(dirName, { recursive: true, force: true });
            mkdirp_1.mkdirp.sync(dirName);
            fs_1.default.writeFileSync(fullPath, body || '0');
            //TODO: to current repo instead of target repo
            // octokit.rest.
            return;
        }
        // if it's a finding issue
        let level;
        const levelLabelMatch = labels.find(label => {
            // if label is a string
            if (Object.values(config_1.FindingLevel).includes(label.toString())) {
                level = label.toString();
                return true;
            }
            // if labels is an object
            if (typeof label === 'object' &&
                Object.values(config_1.FindingLevel).includes(label.name)) {
                level = label.name;
                return true;
            }
        });
        let priority;
        const priorityLabel = labels.find(label => {
            if (Number(label)) {
                priority = Number(label);
                return true;
            }
            if (typeof label === 'object' && Number(label.name)) {
                priority = Number(label.name);
                return true;
            }
        });
        const num = Number(priority);
        if (!num) {
            priority = 1;
        }
        if (!levelLabelMatch) {
            const fileName = `${issueNum}-${priority}-finding-${level}.md`;
            // finding_issues.push({
            // 	fileName: `${
            // 		issue.number
            // 	}-${priority}-finding-${levelLabelMatch?.toString()!}`,
            // 	level: levelLabelMatch?.toString()!,
            // 	priority: 0,
            // 	md: issue.body || ''
            // })
            core.info(`finding issue: ${fileName}`);
            const fullPath = path_1.default.join(`${title}.md`);
            const dirName = path_1.default.dirname(fullPath);
            fs_1.default.rmSync(dirName, { recursive: true, force: true });
            mkdirp_1.mkdirp.sync(dirName);
            fs_1.default.writeFileSync(fullPath, body || '0');
        }
    });
}
exports.process_issue = process_issue;
function batch_processing_finding_issues(configs) {
    return __awaiter(this, void 0, void 0, function* () {
        core.info(`batch processing all open issues with label '${configs.publishLabel}' at ${configs.srcRepo.owner}/${configs.srcRepo.repo}}`);
        // clean all existing files
        deleteMDs(path_1.default.dirname(''));
        const res = {};
        const octokit = github.getOctokit(configs.token);
        const issues = yield octokit.rest.issues.listForRepo({
            owner: configs.srcRepo.owner,
            repo: configs.srcRepo.repo,
            state: 'open',
            labels: `${configs.publishLabel}`
        });
        if (!issues) {
            throw new Error(`no matched issues!`);
        }
        for (const issue of issues.data) {
            // If it's a doc issue
            // check if it has publishlabel
            const docLabelMatch = issue.labels.find(label => label === 'documentation' ||
                (typeof label === 'object' && label.name === 'documentation'));
            if (docLabelMatch) {
                core.debug(`doc issue: ${issue.number}`);
                const fileName = issue.title;
                // doc_issues.push({
                // 	fileName: issue.title,
                // 	md: issue.body || ''
                // })
                // create file
                const fullPath = path_1.default.join(`${fileName.trim()}.md`);
                const dirName = path_1.default.dirname(fullPath);
                fs_1.default.rmSync(dirName, { recursive: true, force: true });
                mkdirp_1.mkdirp.sync(dirName);
                fs_1.default.writeFileSync(fullPath, issue.body || '');
            }
        }
        // const docs = await octokit.rest.issues.listForRepo({
        // 	owner: configs.srcRepo.owner,
        // 	repo: configs.srcRepo.repo,
        // 	state: 'open',
        // 	labels: `documentation`
        // })
        // core.info(`${docs.data.length} doc issues`)
        // if (docs) {
        // 	for (const issue of docs.data) {
        // 		core.debug(`processing issue ${issue.number}`)
        // 		// If it's a doc issue
        // 		// check if it has publishlabel
        // 		const publishLabelMatch = issue.labels.find(
        // 			label =>
        // 				label === configs.publishLabel ||
        // 				(typeof label === 'object' && label.name === configs.publishLabel)
        // 		)
        // 		if (!publishLabelMatch) {
        // 			continue
        // 		}
        // 		const docLabelMatch = issue.labels.find(label => {
        // 			label === 'documentation' ||
        // 				(typeof label === 'object' && label.name === 'documentation')
        // 		})
        // 		if (docLabelMatch) {
        // 			core.debug(`doc issue: ${issue.number}`)
        // 			const fileName = issue.title
        // 			// doc_issues.push({
        // 			// 	fileName: issue.title,
        // 			// 	md: issue.body || ''
        // 			// })
        // 			// create file
        // 			const fullPath = path.join(`${fileName.trim()}.md`)
        // 			const dirName = path.dirname(fullPath)
        // 			fs.rmSync(dirName, {recursive: true, force: true})
        // 			mkdirp.sync(dirName)
        // 			fs.writeFileSync(fullPath, issue.body || '')
        // 			//TODO: currently only write to current repo. not supporting write a targeting repo
        // 			// octokit.rest.
        // 		}
        // 	}
        // }
        const finding_issues = [];
        for (const issue of issues.data) {
            // open issue only
            if (issue.state !== 'open') {
                continue;
            }
            // check if it has publishlabel
            const publishLabelMatch = issue.labels.find(label => label === configs.publishLabel ||
                (typeof label === 'object' && label.name === configs.publishLabel));
            if (!publishLabelMatch) {
                continue;
            }
            core.debug(`processing issue ${issue.number}`);
            // if it's a finding issue
            let level;
            const levelLabelMatch = issue.labels.find(label => {
                // if label is a string
                if (Object.values(config_1.FindingLevel).includes(label.toString())) {
                    level = label.toString();
                    return true;
                }
                // if labels is an object
                if (typeof label === 'object' &&
                    Object.values(config_1.FindingLevel).includes(label.name)) {
                    level = label.name;
                    return true;
                }
            });
            let priority;
            const priorityLabel = issue.labels.find(label => {
                if (Number(label)) {
                    priority = Number(label);
                    return true;
                }
                if (typeof label === 'object' && Number(label.name)) {
                    priority = Number(label.name);
                    return true;
                }
            });
            const num = Number(priorityLabel);
            if (!num) {
                priority = 1;
            }
            if (levelLabelMatch) {
                const fileName = `${issue.number}-${priority}-finding-${level}.md`;
                finding_issues.push({
                    fileName,
                    level: level,
                    priority: priority || 1,
                    md: issue.body || ''
                });
                core.info(`finding issue: ${fileName}`);
                const fullPath = path_1.default.join(`${fileName}`);
                const dirName = path_1.default.dirname(fullPath);
                fs_1.default.rmSync(dirName, { recursive: true, force: true });
                mkdirp_1.mkdirp.sync(dirName);
                fs_1.default.writeFileSync(fullPath, issue.body || '');
            }
        }
        // const doc_issues = await octokit.rest.issues.listForRepo({
        // 	owner: configs.srcRepo.owner,
        // 	repo: configs.srcRepo.repo,
        // 	state: 'open',
        // 	labels:'high, medium, low, info, undetermined'
        // })
        return res;
    });
}
exports.batch_processing_finding_issues = batch_processing_finding_issues;
// clean all md files in root folder
function deleteMDs(dirPath) {
    const files = fs_1.default.readdirSync(dirPath);
    const reg = new RegExp('^.*.(md)$');
    for (const file of files) {
        if (reg.test(file)) {
            fs_1.default.rmSync(file);
        }
    }
}
