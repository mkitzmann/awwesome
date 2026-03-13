import type { Config } from '../types';
import { config } from '../config';

export const appConfig: Config = {
	requestDelay: config.requestDelay,
	urls: config.urls,
	lowCommitCount: config.lowCommitCount,
	chunkSize: config.chunkSize
};
