#include "emscripten.h"
#include "clips.h" // IWYU pragma: keep
#include "reteutil.h"
#include "watch.h"

#ifndef __EMSCRIPTEN__
#define EMSCRIPTEN_KEEPALIVE
#define EM_ASM(...)
#endif

_Static_assert(sizeof(void*) == 4, "wasm32 only (we assume 4-byte pointers)");

EMSCRIPTEN_KEEPALIVE
void FlushOutput(Environment* env) {
	WriteString(env, STDOUT, "\n");
	EM_ASM (
		Module.flushOutput();
	);
}

EMSCRIPTEN_KEEPALIVE
void PrintGreeting(Environment* env) {
	WriteString(env, STDOUT, CommandLineData(env)->BannerString);
	WriteString(env, STDOUT, COMMAND_PROMPT);
	FlushOutput(env);
}

EMSCRIPTEN_KEEPALIVE
void LoadAndExecute(Environment* env, const char* str) {
	int len = strlen(str);
	char c[2]; c[1] = 0;
	for (int i = 0; i <= len; i++) {
		if (i < len) {
			c[0] = str[i];
			WriteString(env, STDOUT, c);
			ExpandCommandString(env,  str[i]);
		} else {
			WriteString(env, STDOUT, "\n");
			ExpandCommandString(env, '\n');
		}

		if (GetHaltExecution(env) == true) {
			SetHaltExecution(env, false);
			SetEvaluationError(env, false);
			FlushCommandString(env);
			WriteString(env, STDOUT, "\n");
			PrintPrompt(env);
		}

		ExecuteIfCommandComplete(env);
	}
	FlushOutput(env);
}

const struct {
    WatchItem wi;
    const char *name;
} watchStrings[] = {
	{ALL, "ALL"},
	{FACTS, "FACTS"},
	{INSTANCES, "INSTANCES"},
	{SLOTS, "SLOTS"},
	{RULES, "RULES"},
	{ACTIVATIONS, "ACTIVATIONS"},
	{MESSAGES, "MESSAGES"},
	{MESSAGE_HANDLERS, "MESSAGE_HANDLERS"},
	{GENERIC_FUNCTIONS, "GENERIC_FUNCTIONS"},
	{METHODS, "METHODS"},
	{DEFFUNCTIONS, "DEFFUNCTIONS"},
	{COMPILATIONS, "COMPILATIONS"},
	{STATISTICS, "STATISTICS"},
	{GLOBALS, "GLOBALS"},
	{FOCUS, "FOCUS"}
};

WatchItem StrToWatchItem(const char *str) {
	int n = sizeof(watchStrings) / sizeof(watchStrings[0]);
	for (int i = 0; i < n; i++) {
		if (!strcmp(str, watchStrings[i].name)) {
			return watchStrings[i].wi;
		}
	}
	EM_ASM({
		throw new Error(
			"Could not find watch item \"" + UTF8ToString($0) + "\" (address " + $0 + ")"
		);
	}, str);
	abort();
}

EMSCRIPTEN_KEEPALIVE
bool GetWatchFlag(Environment* env, const char* str) {
	WatchItem wi = StrToWatchItem(str);
	return GetWatchState(env, wi);
}

EMSCRIPTEN_KEEPALIVE
void SetWatchFlag(Environment* env, const char* str, bool b) {
	WatchItem wi = StrToWatchItem(str);
	SetWatchState(env, wi, b);
}

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wint-to-pointer-cast"
EMSCRIPTEN_KEEPALIVE
const char** GetFocusStackModuleNames(Environment* env) {
	int count = 0;
	for (FocalModule* focus = EngineData(env)->CurrentFocus; focus != NULL; focus = focus->next) {
		count++;
	}
	const char** names = malloc((1 + count) * sizeof(*names));
	names[0] = (const char*) count;
	int i = 1;
	for (FocalModule* focus = EngineData(env)->CurrentFocus; focus != NULL; focus = focus->next) {
		names[i++] = DefmoduleName(focus->theModule);
	}
	return names;
}

EMSCRIPTEN_KEEPALIVE
const char** GetDefmoduleNames(Environment* env) {
	int count = 0;
	for (Defmodule* module = GetNextDefmodule(env, NULL); module != NULL; module = GetNextDefmodule(env, module)) {
		count++;
	}
	const char** names = malloc((1 + count) * sizeof(*names));
	names[0] = (const char*) count;
	int i = 1;
	for (Defmodule* module = GetNextDefmodule(env, NULL); module != NULL; module = GetNextDefmodule(env, module)) {
		names[i++] = DefmoduleName(module);
	}
	return names;
}
#pragma clang diagnostic pop

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wpointer-to-int-cast"
EMSCRIPTEN_KEEPALIVE
int32_t* GetModuleAgenda(Environment* env, const char* moduleName) {
	Defmodule* module = FindDefmodule(env, moduleName);

	SaveCurrentModule(env);
	SetCurrentModule(env, module);
	struct defruleModule *moduleItem = GetModuleItem(env, NULL, DefruleData(env)->DefruleModuleIndex);
	RestoreCurrentModule(env);

	int count = 0;
	for (Activation* act = moduleItem->agenda; act != NULL; act = GetNextActivation(env, act)) {
		count++;
	}

	// Memory layout: salience, rule name pointer, basis string pointer (freed)
	int32_t* data = malloc((1 + 3 * count) * sizeof(*data));
	data[0] = count;

	int i = 0;
	StringBuilder* sb = CreateStringBuilder(env, 16);
	OpenStringBuilderDestination(env, "tmp", sb);
	for (Activation* act = moduleItem->agenda; act != NULL; act = GetNextActivation(env, act)) {
		PrintPartialMatch(env, "tmp", act->basis);
		data[1 + 3 * i] = act->salience;
		data[2 + 3 * i] = (int32_t) act->theRule->header.name->contents;
		data[3 + 3 * i] = (int32_t) SBCopy(sb);
		SBReset(sb);
		i++;
	}
	CloseStringBuilderDestination(env, "tmp");
	SBDispose(sb);

	return data;
}

EMSCRIPTEN_KEEPALIVE
int32_t* GetModuleFacts(Environment* env, const char* moduleName) {
	Defmodule* module = FindDefmodule(env, moduleName);

	SaveCurrentModule(env);
	SetCurrentModule(env, module);

	int count = 0;
	for (Fact* fact = GetNextFactInScope(env, NULL); fact != NULL; fact = GetNextFactInScope(env, fact)) {
		count++;
	}

	// Memory layout:
	// - fact index
	// - template string pointer
	// - null-terminated slot string array pointer (zero if slots are implied; freed, contents NOT freed)
	// - null-terminated value string array pointer (zero if there are no values; freed, all contents freed)
	int32_t* data = malloc((1 + 4 * count) * sizeof(*data));
	data[0] = count;

	int i = 0;
	StringBuilder* sb = CreateStringBuilder(env, 16);
	OpenStringBuilderDestination(env, "tmp", sb);
	for (Fact* fact = GetNextFactInScope(env, NULL); fact != NULL; fact = GetNextFactInScope(env, fact)) {
		const char** slotNames;
		char** values;

		if (fact->whichDeftemplate->implied) { // ordered fact; mark slotNames as empty with a null ptr
			Multifield *multifield = fact->theProposition.contents[0].multifieldValue;
			slotNames = 0;
			values = malloc((1 + multifield->length) * sizeof(*values));

			for (int j = 0; j < multifield->length; j++) {
				PrintAtom(env, "tmp", multifield->contents[j].header->type, multifield->contents[j].value);
				values[j] = SBCopy(sb);
				SBReset(sb);
			}

			values[multifield->length] = 0;
		} else { // deftemplate fact
			int slotCount = 0;
			for (struct templateSlot *slot = fact->whichDeftemplate->slotList; slot != NULL; slot = slot->next) {
				slotCount++;
			}
			slotNames = malloc(slotCount * sizeof(*values));
			values = malloc((1 + slotCount) * sizeof(*values));

			int j = 0;
			for (struct templateSlot *slot = fact->whichDeftemplate->slotList; slot != NULL; slot = slot->next) {
				slotNames[j] = slot->slotName->contents;
				CLIPSValue cv;
				GetFactSlot(fact, slot->slotName->contents, &cv);

				if (slot->multislot == false) {
					PrintAtom(env, "tmp", ((TypeHeader *) cv.value)->type, cv.value);
				} else {
					struct multifield *segment = (Multifield *)cv.value;
					PrintMultifieldDriver(env, "tmp", segment, 0, segment->length, true);
				}
				values[j] = SBCopy(sb);
				SBReset(sb);
				j++;
			}

			values[slotCount] = 0;
		}

		data[1 + 4 * i] = fact->factIndex;
		data[2 + 4 * i] = (int32_t) fact->whichDeftemplate->header.name->contents;
		data[3 + 4 * i] = (int32_t) slotNames;
		data[4 + 4 * i] = (int32_t) values;
		i++;
	}
	CloseStringBuilderDestination(env, "tmp");
	SBDispose(sb);

	RestoreCurrentModule(env);
	return data;
}

EMSCRIPTEN_KEEPALIVE
int32_t* GetModuleInstances(Environment* env, const char* moduleName) {
	Defmodule* module = FindDefmodule(env, moduleName);

	SaveCurrentModule(env);
	SetCurrentModule(env, module);

	int count = 0;
	for (Instance* instance = GetNextInstanceInScope(env, NULL); instance != NULL; instance = GetNextInstanceInScope(env, instance)) {
		count++;
	}

	// Memory layout:
	// - instance name pointer (not freed)
	// - class name pointer (not freed)
	// - slot string array pointer (freed, contents NOT freed)
	// - null-terminated value string array pointer (freed, all contents freed)
	int32_t* data = malloc((1 + 4 * count) * sizeof(*data));
	data[0] = count;

	int i = 0;
	StringBuilder* sb = CreateStringBuilder(env, 16);
	OpenStringBuilderDestination(env, "tmp", sb);
	for (Instance* instance = GetNextInstanceInScope(env, NULL); instance != NULL; instance = GetNextInstanceInScope(env, instance)) {
		Defclass* cls = InstanceClass(instance);

		CLIPSValue slotNames;
		ClassSlots(cls, &slotNames, true);

		int slotCount = slotNames.multifieldValue->length;
		const char** slotNamePtrs = malloc(slotCount * sizeof(*slotNamePtrs));
		char** values = malloc((1 + slotCount) * sizeof(*values));

		for (int j = 0; j < slotCount; j++) {
			const char* slotName = slotNames.multifieldValue->contents[j].lexemeValue->contents;
			slotNamePtrs[j] = slotName;

			CLIPSValue slotValue;

			if (DirectGetSlot(instance, slotName, &slotValue) == GSE_NO_ERROR) {
				if (slotValue.value != NULL && ((TypeHeader *) slotValue.value)->type == MULTIFIELD_TYPE) {
					struct multifield *segment = (Multifield *)slotValue.value;
					PrintMultifieldDriver(env, "tmp", segment, 0, segment->length, true);
				} else if (slotValue.value != NULL) {
					PrintAtom(env, "tmp", ((TypeHeader *) slotValue.value)->type, slotValue.value);
				}

			}

			values[j] = SBCopy(sb);
			SBReset(sb);
		}

		values[slotCount] = 0;

		data[1 + 4 * i] = (int32_t) InstanceName(instance);
		data[2 + 4 * i] = (int32_t) DefclassName(cls);
		data[3 + 4 * i] = (int32_t) slotNamePtrs;
		data[4 + 4 * i] = (int32_t) values;
		i++;
	}

	CloseStringBuilderDestination(env, "tmp");
	SBDispose(sb);

	RestoreCurrentModule(env);
	return data;
}
#pragma clang diagnostic pop

EMSCRIPTEN_KEEPALIVE
const char* GetDeftemplateText(Environment* env, const char* moduleName, const char* templateName) {
	Defmodule* module = FindDefmodule(env, moduleName);
	if (module == NULL) { return NULL; }

	SaveCurrentModule(env);
	SetCurrentModule(env, module);
	Deftemplate* dt = FindDeftemplate(env, templateName);
	RestoreCurrentModule(env);

	if (dt == NULL) { return NULL; }
	if (dt->implied) {
		// deviate from the Java IDE, which would just show nothing
		return "[fact has implied deftemplate]";
	}
	return DeftemplatePPForm(dt);
}

EMSCRIPTEN_KEEPALIVE
const char* GetDefclassText(Environment* env, const char* moduleName, const char* className) {
	Defmodule* module = FindDefmodule(env, moduleName);
	if (module == NULL) { return NULL; }

	SaveCurrentModule(env);
	SetCurrentModule(env, module);
	// not using FindDefclass here because it doesn't search in imported modules per the comment in its source
	Defclass* cls = LookupDefclassInScope(env, className);
	RestoreCurrentModule(env);

	if (cls == NULL) { return NULL; }
	return DefclassPPForm(cls);
}

EMSCRIPTEN_KEEPALIVE
const char* GetDefruleText(Environment* env, const char* moduleName, const char* ruleName) {
	Defmodule* module = FindDefmodule(env, moduleName);
	if (module == NULL) { return NULL; }

	SaveCurrentModule(env);
	SetCurrentModule(env, module);
	Defrule* rule = FindDefrule(env, ruleName);
	RestoreCurrentModule(env);

	if (rule == NULL) { return NULL; }
	return DefrulePPForm(rule);
}
