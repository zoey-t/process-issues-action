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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInputs = void 0;
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
function getInputs() {
    return __awaiter(this, void 0, void 0, function* () {
        const res = {};
        const { owner, repo } = github.context.repo;
        // token
        res.token = core.getInput('token', { required: true });
        // publish label
        res.publishLabel = core.getInput('label', { required: true });
        core.debug(`publish-label = '${res.publishLabel}'`);
        if (!res.publishLabel) {
            throw new Error(`Invalid ${res.publishLabel}`);
        }
        // source repo
        const srcRepo = core.getInput('src-repo') || `${owner}/${repo}`;
        core.debug(`src-repo = ${srcRepo}`);
        let splitRepository = srcRepo.split('/');
        if (splitRepository.length !== 2 ||
            !splitRepository[0] ||
            !splitRepository[1]) {
            throw new Error(`Invalid src-repo '${res.srcRepo}'. Expected format {owner}/{repo}.`);
        }
        res.srcRepo = { owner: splitRepository[0], repo: splitRepository[1] };
        // target repo
        const targetRepo = core.getInput('target-repo') || `${owner}/${repo}`;
        core.debug(`target-repo = ${targetRepo}`);
        splitRepository = targetRepo.split('/');
        if (splitRepository.length !== 2 ||
            !splitRepository[0] ||
            !splitRepository[1]) {
            throw new Error(`Invalid target-repo '${res.targetRepo}'. Expected format {owner}/{repo}.`);
        }
        res.targetRepo = { owner: splitRepository[0], repo: splitRepository[1] };
        // is this a finding issue
        res.finding = (core.getInput('finding') || 'true') === 'true';
        res.bacth = (core.getInput('batch') || 'true') === 'true';
        return res;
    });
}
exports.getInputs = getInputs;
