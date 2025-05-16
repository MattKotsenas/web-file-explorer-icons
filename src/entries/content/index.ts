import { defineContentScript } from 'wxt/sandbox';

import { observe } from 'selector-observer';

import { type ReplacementSelectorSet, matches, sites } from '@/sites';
import { flavor } from '@/storage';
import { createStylesElement } from '@/utils';
import { injectStyles, replaceIconInRow } from './lib';

export default defineContentScript({
	// Make sure `matches` URLs are updated in wxt.config.ts as well.
	matches: matches,
	runAt: 'document_start',

	main() {
		const stylesEl = createStylesElement();

		for (const site of sites) {
			if (site.domains.includes(window.location.hostname)) {
				runReplacements(site.replacements, stylesEl);
				// Assume URLs only have one matching site implementation. Can change this in the future.
				return;
			}
		}

		/* No matching domain. */
		const replacements = sites.flatMap((site) => site.replacements);
		runReplacements(replacements, stylesEl);
	},
});

function runReplacements(
	replacements: Array<ReplacementSelectorSet>,
	stylesEl: Element,
) {
	// Monitor DOM elements that match a CSS selector.
	for (const replacement of replacements) {
		observe(replacement.row, {
			initialize(el: HTMLElement) {
				const subtreeObserver = observeElementSubtree(el, async (element: HTMLElement) => {
					await replaceIconInRow(element, replacement);
				});

				return {
					async add() {
						await replaceIconInRow(el, replacement);
					},
					remove() {
						subtreeObserver.disconnect();
					}
				}
			}
		});
	}

	const rawStyles = replacements.map(({ styles }) => styles || '').join('\n');
	flavor.watch(() => injectStyles(stylesEl, rawStyles));
	injectStyles(stylesEl, rawStyles);
}

function observeElementSubtree(el: HTMLElement, callback:Function) {
	const subtreeObserver = new MutationObserver(async (mutationsList) => {
		for (const mutation of mutationsList) {
			if (
				mutation.type === 'childList' &&
				mutation.addedNodes.length === 0 &&
				mutation.removedNodes.length > 0
			) {
				// Skip pure node removals
				continue;
			}
			await callback(el);
			break;
		}
	});

	subtreeObserver.observe(el, {
		attributes: true,
		childList: true,
		subtree: true,
		characterData: true,
	});

	return subtreeObserver;
}