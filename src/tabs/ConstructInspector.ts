import TabBase from "./TabBase.ts";
import htmlSrc from "./ConstructInspector.html?raw"

import { getDeftemplateText, getDefclassText, getDefruleText } from "../data.ts";

export default class ConstructInspector extends TabBase {

	private textArea: HTMLTextAreaElement;

	constructor() {
		const node = document.createElement("div");
		node.innerHTML = htmlSrc;

		super({node: node});

		this.title.label = "Construct Inspector";

		this.textArea = node.querySelector("#constructText") as HTMLTextAreaElement;
	}

	protected override getHardcodedClassName(): string {
		return "ConstructInspector";
	}

	public showDeftemplate(moduleName: string, templateName: string) {
		this.textArea.value = getDeftemplateText(moduleName, templateName);
	}

	public showDefclass(moduleName: string, className: string) {
		this.textArea.value = getDefclassText(moduleName, className);
	}

	public showDefrule(moduleName: string, ruleName: string) {
		this.textArea.value = getDefruleText(moduleName, ruleName);
	}
}
