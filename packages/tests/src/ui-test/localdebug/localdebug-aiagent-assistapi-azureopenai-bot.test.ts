// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * @author Ivan Chen <v-ivanchen@microsoft.com>
 */
import * as path from "path";
import { startDebugging, waitForTerminal } from "../../utils/vscodeOperation";
import {
  initPage,
  validateWelcomeAndReplyBot,
} from "../../utils/playwrightOperation";
import { LocalDebugTestContext } from "./localdebugContext";
import {
  Timeout,
  LocalDebugTaskLabel,
  DebugItemSelect,
  ValidationContent,
} from "../../utils/constants";
import { Env, OpenAiKey } from "../../utils/env";
import { it } from "../../utils/it";
import {
  editDotEnvFile,
  modifyFileContext,
  validateFileExist,
} from "../../utils/commonUtils";
import { Executor } from "../../utils/executor";
import os from "os";

describe("Local Debug Tests", function () {
  this.timeout(Timeout.testCase);
  let localDebugTestContext: LocalDebugTestContext;

  beforeEach(async function () {
    // ensure workbench is ready
    this.timeout(Timeout.prepareTestCase);
    localDebugTestContext = new LocalDebugTestContext("aiagent", {
      lang: "javascript",
      customCeopilotAgent: "custom-copilot-agent-assistants-api",
      llmServiceType: "llm-service-azure-openai",
    });
    await localDebugTestContext.before();
  });

  afterEach(async function () {
    this.timeout(Timeout.finishTestCase);
    await localDebugTestContext.after(false, true);
  });

  it(
    "[auto][Javascript][Azure OpenAI]Local debug for AI Agent - Build with Assistants API",
    {
      testPlanCaseId: 30570629,
      author: "v-ivanchen@microsoft.com",
    },
    async function () {
      const projectPath = path.resolve(
        localDebugTestContext.testRootFolder,
        localDebugTestContext.appName
      );
      validateFileExist(projectPath, "src/index.js");
      const envPath = path.resolve(projectPath, "env", ".env.local.user");
      const isRealKey = OpenAiKey.azureOpenAiKey ? true : false;
      const azureOpenAiKey = OpenAiKey.azureOpenAiKey
        ? OpenAiKey.azureOpenAiKey
        : "fake";
      const azureOpenAiEndpoint = OpenAiKey.azureOpenAiEndpoint
        ? OpenAiKey.azureOpenAiEndpoint
        : "https://test.com";
      const azureOpenAiModelDeploymentName =
        OpenAiKey.azureOpenAiModelDeploymentName
          ? OpenAiKey.azureOpenAiModelDeploymentName
          : "fake";
      editDotEnvFile(envPath, "SECRET_AZURE_OPENAI_API_KEY", azureOpenAiKey);
      editDotEnvFile(envPath, "AZURE_OPENAI_ENDPOINT", azureOpenAiEndpoint);
      editDotEnvFile(
        envPath,
        "AZURE_OPENAI_MODEL_DEPLOYMENT_NAME",
        azureOpenAiModelDeploymentName
      );
      const creatorFile = path.resolve(projectPath, "src", "creator.js");
      await modifyFileContext(
        creatorFile,
        'const azureOpenAIEndpoint="";',
        `const azureOpenAIEndpoint="${azureOpenAiEndpoint}";`
      );
      modifyFileContext(
        creatorFile,
        'const azureOpenAIDeploymentName="";',
        `const azureOpenAIDeploymentName="${azureOpenAiModelDeploymentName}";`
      );

      if (isRealKey) {
        console.log("Start to create azure assistant id");
        const installCmd = `npm install`;
        const { success } = await Executor.execute(
          installCmd,
          projectPath,
          process.env,
          undefined,
          "npm warn"
        );
        if (!success) {
          throw new Error("Failed to install packages");
        }

        let insertDataCmd = "";
        if (os.type() === "Windows_NT") {
          insertDataCmd = `npm run assistant:create -- ${azureOpenAiKey}`;
        } else {
          insertDataCmd = `npm run assistant:create -- '${azureOpenAiKey}'`;
        }
        const { success: insertDataSuccess, stdout: log } =
          await Executor.execute(insertDataCmd, projectPath);
        // get assistant id from log string
        const assistantId = log.match(
          /Created a new assistant with an ID of: (.*)/
        )?.[1];
        if (!insertDataSuccess) {
          throw new Error("Failed to create assistant");
        }
        editDotEnvFile(envPath, "AZURE_OPENAI_ASSISTANT_ID", assistantId ?? "");
      } else {
        editDotEnvFile(envPath, "AZURE_OPENAI_ASSISTANT_ID", "fake");
      }

      await startDebugging(DebugItemSelect.DebugInTeamsUsingChrome);

      await waitForTerminal(LocalDebugTaskLabel.StartLocalTunnel);
      await waitForTerminal(LocalDebugTaskLabel.StartBotApp, "Bot Started");

      const teamsAppId = await localDebugTestContext.getTeamsAppId();
      const page = await initPage(
        localDebugTestContext.context!,
        teamsAppId,
        Env.username,
        Env.password
      );
      await localDebugTestContext.validateLocalStateForBot();
      if (isRealKey) {
        await validateWelcomeAndReplyBot(page, {
          hasWelcomeMessage: false,
          hasCommandReplyValidation: true,
          botCommand:
            "I need to solve the equation `3x + 11 = 14`. Can you help me?",
          expectedWelcomeMessage:
            ValidationContent.AiAssistantBotWelcomeInstruction,
          expectedReplyMessage: "x = 1",
          timeout: Timeout.longTimeWait,
        });
      } else {
        await validateWelcomeAndReplyBot(page, {
          hasWelcomeMessage: false,
          hasCommandReplyValidation: true,
          botCommand: "helloWorld",
          expectedWelcomeMessage:
            ValidationContent.AiAssistantBotWelcomeInstruction,
          expectedReplyMessage: ValidationContent.AiBotErrorMessage2,
          timeout: Timeout.longTimeWait,
        });
      }
    }
  );
});