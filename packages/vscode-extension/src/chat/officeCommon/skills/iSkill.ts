// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
import {
  CancellationToken,
  ChatRequest,
  ChatResponseStream,
  LanguageModelChatUserMessage,
} from "vscode";
import { Spec } from "./spec";

export interface ISkill {
  name: string | undefined;
  capability: string | undefined;
  canInvoke: (request: ChatRequest, spec: Spec) => boolean;
  invoke: (
    languageModel: LanguageModelChatUserMessage,
    request: ChatRequest,
    response: ChatResponseStream,
    token: CancellationToken,
    spec: Spec
  ) => Promise<Spec | null>;
}
