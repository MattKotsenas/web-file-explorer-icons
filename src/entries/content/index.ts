import { defineContentScript } from 'wxt/sandbox';

// import { observe } from 'selector-observer';

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
	whenReady(document, () => {
		for (const replacement of replacements) {
			observeSelector(replacement.root, replacement.row, (el) => {
				replaceIconInRow(el, replacement);
			});
			// observe(replacement.row, {
			// 	async add(rowEl: HTMLElement) {
			// 		await replaceIconInRow(rowEl, replacement);
			// 	},
			// });
		}
	});

	const rawStyles = replacements.map(({ styles }) => styles || '').join('\n');
	flavor.watch(() => injectStyles(stylesEl, rawStyles));
	injectStyles(stylesEl, rawStyles);
}

function observeSelector(root: string, selector: string, callback) {
  const observer = new MutationObserver((mutationsList) => {
    for (const mutation of mutationsList) {
		mutation.addedNodes.forEach((node) => {
			if (node instanceof HTMLElement) {
				const match = node.closest(selector);
				if (match !== null) {
					callback(match);
				}
			}
			// for (const el of queryAllInSubtree(node, selector)) {
			// 	callback(el);
			// }
			// if (node instanceof Element && node.matches(selector)) {
			//   callback(node);
			// }
      });

	  if (mutation.target instanceof Element) {
			const match = mutation.target.closest(selector);
			if (match !== null) {
				callback(match);
			}
	  }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

function whenReady(document: Document, callback) {
  const readyState = document.readyState
  if (readyState === 'interactive' || readyState === 'complete') {
    callback()
  } else {
    document.addEventListener('DOMContentLoaded', callback)
  }
}

function queryAllInSubtree(subtreeRoot, selector) {
  return Array.from(document.querySelectorAll(selector))
              .filter(el => subtreeRoot.contains(el));
}

function isUnderSelector(node: HTMLElement, selector: string) {
  return node.closest(selector);
}