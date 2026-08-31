import { Widget } from "@lumino/widgets";

export default abstract class TabBase extends Widget {

	private static concreteInstances: Map<Function, TabBase> = new Map();

	constructor(options: Widget.IOptions) {
		super(options);

		const ct = new.target as Function;
		if (TabBase.concreteInstances.has(ct)) {
			throw new Error(ct.name + " constructed twice!");
		}
		TabBase.concreteInstances.set(ct, this);

		this.addClass("content-tab");
		this.title.closable = true;
		this.id = this.getHardcodedClassName();
	}

	public static getInstance<T extends new (...args: any[]) => TabBase>(ct: T): InstanceType<T> {
		const instance = TabBase.concreteInstances.get(ct);
		if (!instance) {
			throw new Error(ct.name + " does not exist!");
		}
		return instance as InstanceType<T>;
	}

	public static updateBrowsers() {
		TabBase.concreteInstances.forEach((t: TabBase) => { t.onBrowserUpdate(); });
	}

	protected onBrowserUpdate() { return; }

	override dispose() {
		throw new Error("You're not supposed to call dispose() on a TabBase!");
	}

	// Unfortunately, new.target.name gets screwed up by minification
	protected abstract getHardcodedClassName(): string;
}

