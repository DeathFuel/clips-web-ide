import makeModule from "./clips.js"
import type { MainModule } from "./emcc-tsd";
import TabBase from "./tabs/TabBase.ts";

export const CLIPSWatchItems = [
	"Activations", "Compilations", "Deffunctions",
	"Facts", "Focus", "Generic Functions", "Globals",
	"Instances", "Message Handlers", "Messages",
	"Methods", "Rules", "Slots", "Statistics"
];

const loadingScreen = document.getElementById("loading-screen");

let outputLog: HTMLTextAreaElement;
let outputBuffer = "";

function output(text: string) {
	outputBuffer = outputBuffer + text + "\n";
}

function flushOutput() {
	outputBuffer = outputBuffer.slice(0, -1);
	if (!outputLog) {
		outputLog = document.getElementById("outputLog") as HTMLTextAreaElement;
	}
	if (outputLog) {
		outputLog.value = outputBuffer;
		outputLog.scrollTop = outputLog.scrollHeight;
	} else {
		console.error("Output flushed with output log missing! Message:\n" + outputBuffer);
	}
}

// Wrap or compose some Module functions that require extra processing, have side effects, or take string arguments. Other exported functions are called directly.
interface ExtendedModule extends MainModule {
	RecreateEnvironment(): void;
	LoadAndExecute(env: number, str: string): void;
	GetModuleAgenda(env: number, str: string): number;
	GetModuleFacts(env: number, str: string): number;
	GetModuleInstances(env: number, str: string): number;
	GetDeftemplateText(env: number, moduleName: string, name: string): number;
	GetDefclassText(env: number, moduleName: string, name: string): number;
	GetDefruleText(env: number, moduleName: string, name: string): number;
	SetWatchFlag(env: number, str: string, b: boolean): void;
	GetWatchFlag(env: number, str: string): boolean;
};

let Module: ExtendedModule;
try {
	Module = await makeModule({
		"print": output,
		"printErr": output,
		"flushOutput": flushOutput,
		"onRuntimeInitialized": () => { loadingScreen?.remove(); }
	}) as ExtendedModule;
} catch (e: any) {
	if (loadingScreen) {
		loadingScreen.textContent = e.toString();
	}
	throw e;
}
let Environment = Module._CreateEnvironment();

// Keep only the user's watch states for convenience
Module.RecreateEnvironment = () => {
	const watchStates: boolean[] = [];
	CLIPSWatchItems.forEach((str: string) => {
		const enumName = str.toUpperCase().replace(" ", "_");
		watchStates.push(Module.GetWatchFlag(Environment, enumName));
	});

	Module._DestroyEnvironment(Environment);
	Environment = Module._CreateEnvironment();
	outputBuffer = "";

	for (let i = 0; i < CLIPSWatchItems.length; i++) {
		const str = CLIPSWatchItems[i];
		const enumName = str.toUpperCase().replace(" ", "_");
		Module.SetWatchFlag(Environment, enumName, watchStates[i]);
	}
};
Module.LoadAndExecute = (env: number, str: string) => {
	Module.ccall("LoadAndExecute", "void", ["number", "string"], [env, str]);
	TabBase.updateBrowsers();
};
Module.GetModuleAgenda = Module.cwrap("GetModuleAgenda", "number", ["number", "string"]);
Module.GetModuleFacts = Module.cwrap("GetModuleFacts", "number", ["number", "string"]);
Module.GetModuleInstances = Module.cwrap("GetModuleInstances", "number", ["number", "string"]);
Module.GetDeftemplateText = Module.cwrap("GetDeftemplateText", "number", ["number", "string", "string"]);
Module.GetDefclassText = Module.cwrap("GetDefclassText", "number", ["number", "string", "string"]);
Module.GetDefruleText = Module.cwrap("GetDefruleText", "number", ["number", "string", "string"]);
Module.SetWatchFlag = Module.cwrap("SetWatchFlag", "void", ["number", "string", "boolean"]);
Module.GetWatchFlag = Module.cwrap("GetWatchFlag", "boolean", ["number", "string"]);

export { Module, Environment };
