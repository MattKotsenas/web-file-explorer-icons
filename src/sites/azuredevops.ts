import type { ReplacementSelectorSet, Site } from './index.js';

const mainRepositoryImplementation: ReplacementSelectorSet = {
	row: 'table[aria-label="Files table"] tr td:nth-of-type(2)',
	filename: 'a',
	icon: '.fabric-icon',
	isDirectory: (_rowEl, _fileNameEl, iconEl) =>
		iconEl.classList.contains('repos-folder-icon'),
	isSubmodule: (_rowEl, _fileNameEl, iconEl) =>
		iconEl.classList.contains('repos-submodule'),
	isCollapsable: (_rowEl, _fileNameEl, _iconEl) => false,
};

const repositorySideTreeImplementation: ReplacementSelectorSet = {
	row: 'table[aria-label="File explorer tree"] tr td:nth-of-type(2) .repos-file-explorer-tree-cell',
	filename: 'a',
	icon: '.fabric-icon:not(.bolt-tree-expand-button)',
	isDirectory: (_rowEl, _fileNameEl, iconEl) =>
		iconEl.classList.contains('repos-folder-icon'),
	isSubmodule: (_rowEl, _fileNameEl, iconEl) =>
		iconEl.classList.contains('repos-submodule'),
	isCollapsable: (_rowEl, _fileNameEl, _iconEl) =>
		repositorySideTreeImplementation.isDirectory(_rowEl, _fileNameEl, _iconEl),
};

const directoryContentsHeaderImplementation: ReplacementSelectorSet = {
	row: 'div:has(+ [data-qa="repository-directory"]), div:has(+ .rah-static [data-qa="repository-directory"])',
	filename:
		'div:has(span[aria-label="Directory,"] svg) + span > span:last-of-type',
	icon: 'span[aria-label="Directory,"] svg',
	isDirectory: (_rowEl, _fileNameEl, _iconEl) => true,
	isSubmodule: (_rowEl, _fileNameEl, _iconEl) => false,
	isCollapsable: (_rowEl, _fileNameEl, _iconEl) => false,
};

export const azuredevops: Site = {
	domains: ['dev.azure.com'],
	replacements: [
		mainRepositoryImplementation,
		//fileContentsHeaderImplementation,
		//directoryContentsHeaderImplementation,
		repositorySideTreeImplementation,
	],
};
