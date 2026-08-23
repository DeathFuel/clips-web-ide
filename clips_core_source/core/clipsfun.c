#include "emscripten.h"
#include "clips.h" // IWYU pragma: keep
#include "reteutil.h"
#include "watch.h"

#ifndef __EMSCRIPTEN__
#define EMSCRIPTEN_KEEPALIVE
#define EM_ASM(...)
#endif

_Static_assert(sizeof(void*) == 4, "wasm32 only (we assume 4-byte pointers elsewhere)");

EMSCRIPTEN_KEEPALIVE
void FlushOutput(Environment* env) {
	WriteString(env, STDOUT, "\n");
	EM_ASM (
		Module.removeLastPrintedChar();
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

EMSCRIPTEN_KEEPALIVE
const char** GetFocusStackModuleNames(Environment* env) {
	int count = 0;
	for (FocalModule* focus = EngineData(env)->CurrentFocus; focus != NULL; focus = focus->next) {
		count++;
	}
	const char** names = malloc((1 + count) * sizeof(*names));
	int i = 0;
	for (FocalModule* focus = EngineData(env)->CurrentFocus; focus != NULL; focus = focus->next) {
		names[i++] = DefmoduleName(focus->theModule);
	}
	names[count] = 0;
	return names;
}

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

	// Memory layout: salience, rule name pointer, basis string pointer
	// Terminates with a phony salience value of 0x7FFFFFFF because said values range from -10k to 10k by default
	// Awful, but it works because pointers are guaranteed to be 32-bit here.
	int32_t* data = malloc((1 + 3 * count) * sizeof(*data));

	int i = 0;
	for (Activation* act = moduleItem->agenda; act != NULL; act = GetNextActivation(env, act)) {
		StringBuilder* sb = CreateStringBuilder(env, 16);
		OpenStringBuilderDestination(env, "tmp", sb);
		PrintPartialMatch(env, "tmp", act->basis);
		CloseStringBuilderDestination(env, "tmp");
		data[0 + 3 * i] = act->salience;
		data[1 + 3 * i] = (int32_t) act->theRule->header.name->contents;
		data[2 + 3 * i] = (int32_t) SBCopy(sb);
		SBDispose(sb);
		i++;
	}

	data[3 * count] = 0x7FFFFFFF;
	return data;
}
#pragma clang diagnostic pop

EMSCRIPTEN_KEEPALIVE
const char** GetDefmoduleNames(Environment* env) {
	int count = 0;
	for (Defmodule* module = GetNextDefmodule(env, NULL); module != NULL; module = GetNextDefmodule(env, module)) {
		count++;
	}
	const char** names = malloc((1 + count) * sizeof(*names));
	int i = 0;
	for (Defmodule* module = GetNextDefmodule(env, NULL); module != NULL; module = GetNextDefmodule(env, module)) {
		names[i++] = DefmoduleName(module);
	}
	names[count] = 0;
	return names;
}

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wpointer-to-int-cast"
EMSCRIPTEN_KEEPALIVE
int32_t* GetModuleFacts(Environment* env, const char* moduleName) {
	Defmodule* module = FindDefmodule(env, moduleName);

	SaveCurrentModule(env);
	SetCurrentModule(env, module);

	int count = 0;
	for (Fact* fact = GetNextFactInScope(env, NULL); fact != NULL; fact = GetNextFactInScope(env, fact)) {
		count++;
	}

	// Memory layout: fact index, template string pointer, slot string array pointer (zero if slots are implied), value string array pointer (zero if there are no values)
	// Ends with fake fact index -1
	int32_t* data = malloc((1 + 4 * count) * sizeof(*data));
	int i = 0;
	for (Fact* fact = GetNextFactInScope(env, NULL); fact != NULL; fact = GetNextFactInScope(env, fact)) {
		const char** slotNames = 0;
		char** values = 0;

		// TODO clean up this garbage or find a better way to do this
		if (fact->whichDeftemplate->implied) { // ordered fact
			Multifield *multifield = fact->theProposition.contents[0].multifieldValue;
			values = malloc((1 + multifield->length) * sizeof(*values));
			for (int j = 0; j < multifield->length; j++) {
				StringBuilder* sb = CreateStringBuilder(env, 16);
				OpenStringBuilderDestination(env, "tmp", sb);
				PrintAtom(env, "tmp", multifield->contents[j].header->type, multifield->contents[j].value);
				CloseStringBuilderDestination(env, "tmp");
				values[j] = SBCopy(sb);
				SBDispose(sb);
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
				StringBuilder* sb = CreateStringBuilder(env, 16);
				OpenStringBuilderDestination(env, "tmp", sb);
				if (slot->multislot == false) {
					PrintAtom(env, "tmp", ((TypeHeader *) cv.value)->type, cv.value);
				} else {
					struct multifield *segment = (Multifield *)cv.value;
					if (segment->length > 0) {
						PrintMultifieldDriver(env, "tmp", segment, 0, segment->length, false);
					}
				}
				CloseStringBuilderDestination(env, "tmp");
				values[j] = SBCopy(sb);
				SBDispose(sb);
				j++;
			}
			values[slotCount] = 0;
		}

		data[0 + 4 * i] = fact->factIndex;
		data[1 + 4 * i] = (int32_t) fact->whichDeftemplate->header.name->contents;
		data[2 + 4 * i] = (int32_t) slotNames;
		data[3 + 4 * i] = (int32_t) values;
		i++;
	}

	RestoreCurrentModule(env);
	data[4 * count] = -1;
	return data;
}
#pragma clang diagnostic pop
