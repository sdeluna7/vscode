/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { IOutputTransformContribution, IOutput, IRenderOutput } from 'vs/workbench/contrib/notebook/common/notebookCommon';
import { NotebookRegistry } from 'vs/workbench/contrib/notebook/browser/notebookRegistry';
import { onUnexpectedError } from 'vs/base/common/errors';
import { NotebookHandler } from 'vs/workbench/contrib/notebook/browser/notebookBrowser';

export class OutputRenderer {
	protected readonly _contributions: { [key: string]: IOutputTransformContribution; };
	protected readonly _mimeTypeMapping: { [key: string]: IOutputTransformContribution; };

	constructor(
		private readonly notebookHandler: NotebookHandler,
		private readonly instantiationService: IInstantiationService
	) {
		this._contributions = {};
		this._mimeTypeMapping = {};

		let contributions = NotebookRegistry.getOutputTransformContributions();

		for (const desc of contributions) {
			try {
				const contribution = this.instantiationService.createInstance(desc.ctor, notebookHandler);
				this._contributions[desc.id] = contribution;
				desc.types.forEach(mimeType => {
					this._mimeTypeMapping[mimeType] = contribution;
				});
			} catch (err) {
				onUnexpectedError(err);
			}
		}
	}

	renderNoop(output: IOutput, container: HTMLElement): IRenderOutput {
		const contentNode = document.createElement('p');

		contentNode.innerText = `No renderer could be found for output. It has the following output type: ${output.output_type}`;
		container.appendChild(contentNode);
		return {
			hasDynamicHeight: false
		};
	}

	render(output: IOutput, container: HTMLElement): IRenderOutput {
		let transform = this._mimeTypeMapping[output.output_type];

		if (transform) {
			return transform.render(output, container);
		} else {
			return this.renderNoop(output, container);
		}
	}
}