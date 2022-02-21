import "mocha";
import * as chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { Platform } from "@microsoft/teamsfx-api";
import * as uuid from "uuid";
import { MockedV2Context } from "../util";
import {
  setupLocalDebugSettings,
  configLocalDebugSettings,
  setupLocalEnvironment,
  configLocalEnvironment,
} from "../../../../src/plugins/solution/fx-solution/debug/provisionLocal";
import * as path from "path";
import {
  setDataForLocal,
  setPostDataForLocal,
} from "../../../../src/plugins/solution/fx-solution/v2/provisionLocal";

chai.use(chaiAsPromised);

describe("solution.debug.provisionLocal", () => {
  describe("setupLocalDebugSettings", () => {
    it("happy path", async () => {
      const projectSetting = {
        appName: "",
        projectId: uuid.v4(),
        solutionSettings: {
          name: "fx-solution-azure",
          hostType: "Azure",
          capabilities: ["Tab"],
          azureResources: ["function"],
          activeResourcePlugins: ["fx-resource-simple-auth"],
        },
        programmingLanguage: "typescript",
      };
      const inputs = {
        platform: Platform.VSCode,
        projectPath: path.resolve(__dirname, `./data/${projectSetting.projectId}`),
      };
      const v2Context = new MockedV2Context(projectSetting);
      const result = await setupLocalDebugSettings(v2Context, inputs, {
        auth: {},
        frontend: {},
        backend: {},
      });
      chai.assert.isTrue(result.isOk());
    });

    it("partial local settings", async () => {
      const projectSetting = {
        appName: "",
        projectId: uuid.v4(),
        solutionSettings: {
          name: "fx-solution-azure",
          hostType: "Azure",
          capabilities: ["Tab"],
          azureResources: ["function"],
          activeResourcePlugins: ["fx-resource-simple-auth"],
        },
        programmingLanguage: "typescript",
      };
      const inputs = {
        platform: Platform.VSCode,
        projectPath: path.resolve(__dirname, `./data/${projectSetting.projectId}`),
      };
      const v2Context = new MockedV2Context(projectSetting);
      const localSettings = {
        foo: {},
        bar: {},
      } as any;
      const result = await setupLocalDebugSettings(v2Context, inputs, localSettings);
      chai.assert.isTrue(result.isOk());
      chai.assert.isDefined(localSettings.auth);
      chai.assert.isDefined(localSettings.frontend);
      chai.assert.isDefined(localSettings.backend);
    });
  });

  describe("configLocalDebugSettings", () => {
    it("happy path", async () => {
      const projectSetting = {
        appName: "",
        projectId: uuid.v4(),
        solutionSettings: {
          name: "",
          version: "",
          activeResourcePlugins: [],
        },
        programmingLanguage: "typescript",
      };
      const inputs = {
        platform: Platform.VSCode,
        projectPath: path.resolve(__dirname, `./data/${projectSetting.projectId}`),
      };
      const v2Context = new MockedV2Context(projectSetting);
      const result = await configLocalDebugSettings(v2Context, inputs, {
        teamsApp: {},
        auth: {},
        frontend: {},
        backend: {},
      });
      chai.assert.isTrue(result.isOk());
    });
  });

  describe("setupLocalEnvironment", () => {
    it("happy path", async () => {
      const projectSetting = {
        appName: "",
        projectId: uuid.v4(),
        solutionSettings: {
          name: "",
          version: "",
          hostType: "Azure",
          activeResourcePlugins: [],
          azureResources: ["function"],
          capabilities: ["Tab", "Bot", "MessagingExtension"],
        },
        programmingLanguage: "typescript",
      };
      const inputs = {
        platform: Platform.VSCode,
        projectPath: path.resolve(__dirname, `./data/${projectSetting.projectId}`),
        checkerInfo: { skipNgrok: true },
      };
      const v2Context = new MockedV2Context(projectSetting);
      const envInfo = {
        envName: "default",
        config: {},
        state: {
          solution: {},
          "fx-resource-bot": {
            siteEndPoint: "https://www.test.com",
          },
        },
      };
      const result = await setupLocalEnvironment(v2Context, inputs, envInfo);
      chai.assert.isTrue(result.isOk());
    });
  });

  describe("setDataForLocal", () => {
    it("happy path", async () => {
      const envInfo = {
        envName: "default",
        config: {},
        state: {
          solution: {},
          "fx-resource-bot": {
            siteEndPoint: "https://www.test.com",
          },
          "fx-resource-aad-app-for-teams": {
            clientId: "id",
          },
          "fx-resource-frontend-hosting": {},
        },
      };

      const localSettings = {
        auth: {
          clientId: "id",
        },
        frontend: {},
        teamsApp: {},
      };
      setDataForLocal(envInfo, localSettings);
      setPostDataForLocal(envInfo, localSettings);
      chai.assert.equal(
        localSettings.auth.clientId,
        envInfo.state["fx-resource-aad-app-for-teams"].clientId
      );
    });
  });

  describe("configLocalEnvironment", () => {
    it("happy path", async () => {
      const projectSetting = {
        appName: "",
        projectId: uuid.v4(),
        solutionSettings: {
          name: "",
          version: "",
          hostType: "Azure",
          activeResourcePlugins: [],
          azureResources: ["function"],
          capabilities: ["Tab", "Bot", "MessagingExtension"],
        },
        programmingLanguage: "typescript",
      };
      const inputs = {
        platform: Platform.VSCode,
        projectPath: path.resolve(__dirname, `./data/${projectSetting.projectId}`),
        checkerInfo: { skipNgrok: true },
      };
      const v2Context = new MockedV2Context(projectSetting);
      const envInfo = {
        envName: "default",
        config: {},
        state: {
          solution: {},
          "fx-resource-bot": {
            siteEndPoint: "https://www.test.com",
          },
        },
      };
      const result = await configLocalEnvironment(v2Context, inputs, envInfo);
      chai.assert.isTrue(result.isOk());
    });
  });
});
