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
exports.batch_processing_finding_issues = exports.process_finding_issue = void 0;
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const mkdirp_1 = require("mkdirp");
const config_1 = require("./config");
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
                return true;
            }
            // if labels is an object
            if (typeof label === 'object' &&
                Object.values(config_1.FindingLevel).includes(label.name)) {
                return true;
            }
        });
        if (!levelLabelMatch) {
            throw new Error(`issue does not contain level label`);
        }
        res.level = levelLabelMatch.toString();
        core.debug(`issue level ${res.level}`);
        const priorityLabel = labels.find(label => {
            Number(label) || (typeof label === 'object' && Number(label.name));
        });
        const num = Number(priorityLabel);
        if (!num) {
            res.priority = 1;
        }
        else {
            res.priority = num;
        }
        res.priority = Number(priorityLabel);
        res.fileName = `${issueNum}-${res.priority}-finding-${res.level}`;
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
function batch_processing_finding_issues(configs) {
    return __awaiter(this, void 0, void 0, function* () {
        core.info(`batch processing all open issues with label '${configs.publishLabel}'`);
        const res = {};
        const octokit = github.getOctokit(configs.token);
        const issues = yield octokit.rest.issues.listForRepo({
            owner: configs.srcRepo.owner,
            repo: configs.srcRepo.repo,
            state: 'open',
            labels: `${configs.publishLabel}`
        });
        // findings
        const finding_issues = [];
        const doc_issues = [];
        for (const issue of issues.data) {
            core.debug(`processing issue ${issue.number}`);
            // If it's a doc issue
            const docLabelMatch = issue.labels.find(label => {
                label === 'documentation' ||
                    (typeof label === 'object' && label.name === 'documentation');
            });
            if (!docLabelMatch) {
                core.debug(`doc issue: ${issue.number}`);
                doc_issues.push({
                    fileName: issue.title,
                    md: issue.body || ''
                });
                // create file
                const fullPath = path_1.default.join(doc_issues.at(-1).fileName);
                const dirName = path_1.default.dirname(fullPath);
                fs_1.default.rmSync(dirName, { recursive: true, force: true });
                mkdirp_1.mkdirp.sync(dirName);
                // fs.writeFileSync(fullPath,issue.body)
                //TODO: to current repo instead of target repo
                // octokit.rest.
                continue;
            }
            // if it's a finding issue
            const levelLabelMatch = issue.labels.find(label => {
                // if label is a string
                if (Object.values(config_1.FindingLevel).includes(label.toString())) {
                    return true;
                }
                // if labels is an object
                if (typeof label === 'object' &&
                    Object.values(config_1.FindingLevel).includes(label.name)) {
                    return true;
                }
            });
            let priority;
            const priorityLabel = issue.labels.find(label => {
                Number(label) || (typeof label === 'object' && Number(label.name));
            });
            const num = Number(priorityLabel);
            if (!num) {
                priority = 1;
            }
            else {
                priority = num;
            }
            if (!levelLabelMatch) {
                finding_issues.push({
                    fileName: `${issue.number}-${priority}-finding-${levelLabelMatch === null || levelLabelMatch === void 0 ? void 0 : levelLabelMatch.toString()}`,
                    level: levelLabelMatch === null || levelLabelMatch === void 0 ? void 0 : levelLabelMatch.toString(),
                    priority: 0,
                    md: issue.body || ''
                });
                core.debug(`finding issue: ${finding_issues.at(-1)}`);
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
