import { CommandRegistry } from "@lumino/commands";
import { MessageLoop } from "@lumino/messaging";
import { BoxPanel, DockLayout, DockPanel, Menu, MenuBar, Widget } from "@lumino/widgets";

import AgendaViewer from "./tabs/AgendaViewer.ts";
import BatchInput from "./tabs/BatchInput.ts"
import ConstructInspector from "./tabs/ConstructInspector.ts";
import FactBrowser from "./tabs/FactBrowser.ts";
import InstanceBrowser from "./tabs/InstanceBrowser.ts";
import Terminal from "./tabs/Terminal.ts"
import TabBase from "./tabs/TabBase.ts";

import exampleCollatz from "./examples/collatz.clp?raw"
import exampleSorting from "./examples/sort.clp?raw"
import { CLIPSWatchItems, Environment, Module } from "./logic.ts";

// commands & menubar menus

const commands = new CommandRegistry();

const themeMenu = new Menu({ commands });
themeMenu.title.label = "Theme";
const tabMenu = new Menu({ commands });
tabMenu.title.label = "Tabs";
const watchMenu = new Menu({ commands });
watchMenu.title.label = "Watch";
const exampleMenu = new Menu({ commands });
exampleMenu.title.label = "Examples";
const helpMenu = new Menu({ commands });
helpMenu.title.label = "Help";

// theme menu

const bodyClasses = document.body.classList;
commands.addCommand("theme:light", {
	label: "Light",
	execute: () => { bodyClasses.remove("dark"); },
});
themeMenu.addItem({ command: "theme:light" });

commands.addCommand("theme:dark", {
	label: "Dark",
	execute: () => { bodyClasses.add("dark"); },
});
themeMenu.addItem({ command: "theme:dark" });

// tabs & tab menu

const term = new Terminal();
const batch = new BatchInput();

const tabs: Array<TabBase> = [
	term,
	batch,
	new AgendaViewer(),
	new FactBrowser(),
	new InstanceBrowser(),
	new ConstructInspector(),
];

tabs.forEach((tab: TabBase) => {
	const canBeAdded = tab.title.closable;
	if (!canBeAdded) { return; }
	const tabName = tab.title.label;
	const commandId = "tab:" + tabName.toLowerCase().replace(" ", "-");
	commands.addCommand(commandId, {
		label: tabName,
		execute: () => {
			if (!tab.isAttached) {
				dock.addWidget(tab);
			}
		}
	});
	tabMenu.addItem({ command: commandId });
});

// watch menu

CLIPSWatchItems.forEach((str: string) => {
	const commandId = "watch:" + str.toLowerCase().replace(" ", "-");
	const enumName = str.toUpperCase().replace(" ", "_");
	const setter = () => { Module.SetWatchFlag(Environment, enumName, !getter()); }
	const getter = () => { return Module.GetWatchFlag(Environment, enumName); }
	commands.addCommand(commandId, {
		label: str,
		execute: setter,
		isToggled: getter
	});
	watchMenu.addItem({ command: commandId });
});

watchMenu.addItem({ type: "separator" });

commands.addCommand("watch:all", {
	label: "All", execute: () => { Module.SetWatchFlag(Environment, "ALL", true); }
});
watchMenu.addItem({ command: "watch:all" });

commands.addCommand("watch:none", {
	label: "None", execute: () => { Module.SetWatchFlag(Environment, "ALL", false); }
});
watchMenu.addItem({ command: "watch:none" });

// examples menu

([
	[ "Collatz", exampleCollatz ],
	[ "Sorting", exampleSorting ]
] as [string, string][]).forEach(([name, str]: [string, string]) => {
	const commandId = "example:" + name.toLowerCase().replace(" ", "-");
	commands.addCommand(commandId, {
		label: name,
		execute: () => {
			if (!batch.isAttached) {
				// TODO make this a bit smarter
				dock.addWidget(batch, { ref: term });
			}
			batch.setBatchInput(str.trim());
		}
	});
	exampleMenu.addItem({ command: commandId });
});

// help menu

commands.addCommand("help:clipspage", {
	label: "CLIPS homepage",
	execute: () => { window.open("https://clipsrules.net/"); }
});
helpMenu.addItem({ command: "help:clipspage" });

commands.addCommand("help:source", {
	label: "View source code",
	execute: () => { window.open("https://github.com/DeathFuel/clips-web-ide/"); }
});
helpMenu.addItem({ command: "help:source" });

// widget layout serialization, deserialization, saving, defaults...

const defaultLayout = {
    "type": "split-area",
    "orientation": "horizontal",
    "sizes": [ 0.25, 0.375, 0.375 ],
    "children": [
        {
            "type": "split-area",
            "orientation": "vertical",
            "sizes": [ 0.25, 0.25, 0.25, 0.25 ],
            "children": [
                { "type": "tab-area", "currentIndex": 0, "widgets": [ "AgendaViewer" ] },
                { "type": "tab-area", "currentIndex": 0, "widgets": [ "FactBrowser" ] },
                { "type": "tab-area", "currentIndex": 0, "widgets": [ "InstanceBrowser" ] },
                { "type": "tab-area", "currentIndex": 0, "widgets": [ "ConstructInspector" ] }
            ]
        },
        { "type": "tab-area", "currentIndex": 0, "widgets": [ "BatchInput" ] },
        { "type": "tab-area", "currentIndex": 0, "widgets": [ "Terminal" ] }
    ]
}

function mapLayoutIDs(area: DockLayout.AreaConfig | null): any {
	if (!area) return null;
	if (area.type === "tab-area") {
		return {
			type: "tab-area",
			currentIndex: area.currentIndex,
			widgets: area.widgets.map((w: Widget) => w.id)
		};
	}
	return {
		type: "split-area",
		orientation: area.orientation,
		sizes: area.sizes,
		children: area.children.map(mapLayoutIDs)
	};
}

const idToTab: Map<string, TabBase> = new Map();
tabs.forEach((t: TabBase) => { idToTab.set(t.id, t); });

function unmapLayoutIDs(area: any): DockLayout.AreaConfig | null {
	if (!area) return null;
	if (area.type === "tab-area") {
		return {
			type: "tab-area",
			currentIndex: area.currentIndex,
			widgets: area.widgets.map((id: string) => idToTab.get(id))
		};
	}
	return {
		type: "split-area",
		orientation: area.orientation,
		sizes: area.sizes,
		children: area.children ? area.children.map(unmapLayoutIDs) : []
	};
}

// main dockpanel, continued layout logic

const dock = new DockPanel();
dock.addWidget(term);
dock.id = "dock";

const savedLayout = localStorage.getItem("savedLayout");
const parsedLayout = savedLayout ? JSON.parse(savedLayout) : null;
if (parsedLayout) {
	try {
		dock.restoreLayout({ main: unmapLayoutIDs(parsedLayout) });
	} catch {
		dock.restoreLayout({ main: unmapLayoutIDs(defaultLayout) });
	}
} else {
	dock.restoreLayout({ main: unmapLayoutIDs(defaultLayout) });
}

dock.layoutModified.connect(() => {
	localStorage.setItem(
		"savedLayout",
		JSON.stringify(mapLayoutIDs(dock.saveLayout().main))
	);
});

tabMenu.addItem({ type: "separator" });
commands.addCommand("tab:reset-layout", {
	label: "Reset layout",
	execute: () => {
		dock.restoreLayout({ main: unmapLayoutIDs(defaultLayout) });
	}
});
tabMenu.addItem({ command: "tab:reset-layout" });

// menubar and everything else

const bar = new MenuBar();
bar.addMenu(themeMenu);
bar.addMenu(tabMenu);
bar.addMenu(watchMenu);
bar.addMenu(exampleMenu);
bar.addMenu(helpMenu);
bar.id = "menuBar";

const main = new BoxPanel({ direction: "left-to-right", spacing: 0 });
main.id = "main";
main.addWidget(dock);

window.addEventListener("resize", () => {
	MessageLoop.postMessage(bar, new Widget.ResizeMessage(-1, -1));
	main.update();
});

Widget.attach(bar, document.body);
Widget.attach(main, document.body);

term.setupOutputLog();
TabBase.updateBrowsers();
