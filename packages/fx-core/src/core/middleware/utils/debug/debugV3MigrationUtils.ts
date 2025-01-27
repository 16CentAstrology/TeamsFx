// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import fs from "fs-extra";
import { CommentArray, CommentJSONValue, CommentObject, assign, parse } from "comment-json";
import { FileType, namingConverterV3 } from "../MigrationUtils";
import { MigrationContext } from "../migrationContext";
import { readBicepContent } from "../v3MigrationUtils";
import { AzureSolutionSettings, ProjectSettings, SettingsFolderName } from "@microsoft/teamsfx-api";
import * as dotenv from "dotenv";
import * as os from "os";
import * as path from "path";

export async function readJsonCommentFile(filepath: string): Promise<CommentJSONValue | undefined> {
  if (await fs.pathExists(filepath)) {
    const content = await fs.readFile(filepath);
    const data = parse(content.toString());
    return data;
  }
}

export function isCommentObject(data: CommentJSONValue | undefined): data is CommentObject {
  return typeof data === "object" && !Array.isArray(data) && !!data;
}

export function isCommentArray(
  data: CommentJSONValue | undefined
): data is CommentArray<CommentJSONValue> {
  return Array.isArray(data);
}

export interface DebugPlaceholderMapping {
  tabDomain?: string;
  tabEndpoint?: string;
  tabIndexPath?: string;
  botDomain?: string;
  botEndpoint?: string;
}

export async function getPlaceholderMappings(
  context: MigrationContext
): Promise<DebugPlaceholderMapping> {
  const bicepContent = await readBicepContent(context);
  const getName = (name: string) => {
    const res = namingConverterV3(name, FileType.STATE, bicepContent);
    return res.isOk() ? res.value : undefined;
  };
  return {
    tabDomain: getName("state.fx-resource-frontend-hosting.domain"),
    tabEndpoint: getName("state.fx-resource-frontend-hosting.endpoint"),
    tabIndexPath: getName("state.fx-resource-frontend-hosting.indexPath"),
    botDomain: getName("state.fx-resource-bot.domain"),
    botEndpoint: getName("state.fx-resource-bot.siteEndpoint"),
  };
}

export class OldProjectSettingsHelper {
  public static includeTab(oldProjectSettings: ProjectSettings): boolean {
    return this.includePlugin(oldProjectSettings, "fx-resource-frontend-hosting");
  }

  public static includeBot(oldProjectSettings: ProjectSettings): boolean {
    return this.includePlugin(oldProjectSettings, "fx-resource-bot");
  }

  public static includeFunction(oldProjectSettings: ProjectSettings): boolean {
    return this.includePlugin(oldProjectSettings, "fx-resource-function");
  }

  public static includeFuncHostedBot(oldProjectSettings: ProjectSettings): boolean {
    return (
      this.includePlugin(oldProjectSettings, "fx-resource-bot") &&
      oldProjectSettings.pluginSettings?.["fx-resource-bot"]?.["host-type"] === "azure-function"
    );
  }

  public static includeSSO(oldProjectSettings: ProjectSettings): boolean {
    return this.includePlugin(oldProjectSettings, "fx-resource-aad-app-for-teams");
  }

  public static getFunctionName(oldProjectSettings: ProjectSettings): string | undefined {
    return oldProjectSettings.defaultFunctionName;
  }

  private static includePlugin(oldProjectSettings: ProjectSettings, pluginName: string): boolean {
    const azureSolutionSettings = oldProjectSettings.solutionSettings as AzureSolutionSettings;
    return azureSolutionSettings.activeResourcePlugins.includes(pluginName);
  }
}

export async function updateLocalEnv(
  context: MigrationContext,
  envs: { [key: string]: string }
): Promise<void> {
  if (Object.keys(envs).length === 0) {
    return;
  }
  await context.fsEnsureDir(SettingsFolderName);
  const localEnvPath = path.join(SettingsFolderName, ".env.local");
  if (!(await context.fsPathExists(localEnvPath))) {
    await context.fsCreateFile(localEnvPath);
  }
  const existingEnvs = dotenv.parse(
    await fs.readFile(path.join(context.projectPath, localEnvPath))
  );
  const content = Object.entries({ ...existingEnvs, ...envs })
    .map(([key, value]) => `${key}=${value}`)
    .join(os.EOL);
  await context.fsWriteFile(localEnvPath, content, {
    encoding: "utf-8",
  });
}

export function generateLabel(base: string, existingLabels: string[]): string {
  let prefix = 0;
  while (true) {
    const generatedLabel = base + (prefix > 0 ? ` ${prefix.toString()}` : "");
    if (!existingLabels.includes(generatedLabel)) {
      return generatedLabel;
    }
    prefix += 1;
  }
}

export function createResourcesTask(label: string): CommentJSONValue {
  const comment = `{
    // Create the debug resources.
    // See https://aka.ms/teamsfx-provision-task to know the details and how to customize the args.
  }`;
  const task = {
    label,
    type: "teamsfx",
    command: "provision",
    args: {
      template: "${workspaceFolder}/teamsfx/app.local.yml",
      env: "local",
    },
  };
  return assign(parse(comment), task);
}

export function setUpLocalProjectsTask(label: string): CommentJSONValue {
  const comment = `{
    // Install tools and Build project.
    // See https://aka.ms/teamsfx-deploy-task to know the details and how to customize the args.
  }`;
  const task = {
    label,
    type: "teamsfx",
    command: "deploy",
    args: {
      template: "${workspaceFolder}/teamsfx/app.local.yml",
      env: "local",
    },
  };
  return assign(parse(comment), task);
}

export function startFrontendTask(label: string): CommentJSONValue {
  const task = {
    label,
    type: "shell",
    command: "node ../teamsfx/script/run.tab.js .. ../teamsfx/.env.local",
    isBackground: true,
    options: {
      cwd: "${workspaceFolder}/tabs",
    },
    problemMatcher: {
      pattern: {
        regexp: "^.*$",
        file: 0,
        location: 1,
        message: 2,
      },
      background: {
        activeOnStart: true,
        beginsPattern: ".*",
        endsPattern: "Compiled|Failed|compiled|failed",
      },
    },
  };
  return assign(parse("{}"), task);
}

export function startAuthTask(label: string): CommentJSONValue {
  const task = {
    label,
    type: "shell",
    command: "node teamsfx/script/run.auth.js . teamsfx/.env.local",
    isBackground: true,
    options: {
      cwd: "${workspaceFolder}",
      env: {
        PATH: "${command:fx-extension.get-dotnet-path}${env:PATH}",
      },
    },
    problemMatcher: {
      pattern: [
        {
          regexp: "^.*$",
          file: 0,
          location: 1,
          message: 2,
        },
      ],
      background: {
        activeOnStart: true,
        beginsPattern: ".*",
        endsPattern: ".*",
      },
    },
  };
  return assign(parse("{}"), task);
}

export function watchBackendTask(label: string): CommentJSONValue {
  const task = {
    label,
    type: "shell",
    command: "tsc --watch",
    isBackground: true,
    options: {
      cwd: "${workspaceFolder}/api",
    },
    problemMatcher: "$tsc-watch",
    presentation: {
      reveal: "silent",
    },
  };
  return assign(parse("{}"), task);
}

export function startBackendTask(label: string): CommentJSONValue {
  const task = {
    label,
    type: "shell",
    command: "node ../teamsfx/script/run.api.js .. ../teamsfx/.env.local",
    isBackground: true,
    options: {
      cwd: "${workspaceFolder}/api",
      env: {
        PATH: "${command:fx-extension.get-func-path}${env:PATH}",
      },
    },
    problemMatcher: {
      pattern: {
        regexp: "^.*$",
        file: 0,
        location: 1,
        message: 2,
      },
      background: {
        activeOnStart: true,
        beginsPattern: "^.*(Job host stopped|signaling restart).*$",
        endsPattern:
          "^.*(Worker process started and initialized|Host lock lease acquired by instance ID).*$",
      },
    },
    presentation: {
      reveal: "silent",
    },
  };
  return assign(parse("{}"), task);
}

export function startBotTask(label: string): CommentJSONValue {
  const task = {
    label,
    type: "shell",
    command: "node ../teamsfx/script/run.bot.js .. ../teamsfx/.env.local",
    isBackground: true,
    options: {
      cwd: "${workspaceFolder}/bot",
    },
    problemMatcher: {
      pattern: [
        {
          regexp: "^.*$",
          file: 0,
          location: 1,
          message: 2,
        },
      ],
      background: {
        activeOnStart: true,
        beginsPattern: "[nodemon] starting",
        endsPattern: "restify listening to|Bot/ME service listening at|[nodemon] app crashed",
      },
    },
  };
  return assign(parse("{}"), task);
}

export async function saveRunScript(
  context: MigrationContext,
  filename: string,
  script: string
): Promise<void> {
  await context.fsEnsureDir(path.join(SettingsFolderName, "script"));
  const runScriptPath = path.join(SettingsFolderName, "script", filename);
  if (!(await context.fsPathExists(runScriptPath))) {
    await context.fsCreateFile(runScriptPath);
  }
  await context.fsWriteFile(runScriptPath, script);
}
