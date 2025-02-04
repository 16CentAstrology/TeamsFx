// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { BaseBuildDriver } from "./baseBuildDriver";
import { Service } from "typedi";
import { DriverContext } from "../interface/commonArgs";
import { FxError, Result } from "@microsoft/teamsfx-api";
import { hooks } from "@feathersjs/hooks";
import { addStartAndEndTelemetry } from "../middleware/addStartAndEndTelemetry";
import { TelemetryConstant } from "../../constant/commonConstant";
import { BaseBuildStepDriver } from "./baseBuildStepDriver";
import { getLocalizedString } from "../../../common/localizeUtils";

const ACTION_NAME = "cli/runNpmCommand";

@Service(ACTION_NAME)
export class NpmBuildDriver extends BaseBuildStepDriver {
  readonly description: string = getLocalizedString("driver.script.npmDescription");

  getImpl(args: unknown, context: DriverContext): BaseBuildDriver {
    return new NpmBuildDriverImpl(
      args,
      context,
      "https://aka.ms/teamsfx-actions/cli-run-npm-command"
    );
  }

  @hooks([addStartAndEndTelemetry(ACTION_NAME, TelemetryConstant.DEPLOY_COMPONENT_NAME)])
  async run(args: unknown, context: DriverContext): Promise<Result<Map<string, string>, FxError>> {
    return super.run(args, context);
  }
}

export class NpmBuildDriverImpl extends BaseBuildDriver {
  buildPrefix = "npm";
}
