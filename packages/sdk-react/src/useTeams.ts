// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { useEffect, useState } from "react";
import { unstable_batchedUpdates as batchedUpdates } from "react-dom";
import { app, pages } from "@microsoft/teams-js";
import {
  teamsDarkTheme,
  teamsHighContrastTheme,
  teamsTheme,
  ThemePrepared,
} from "@fluentui/react-northstar";

const getTheme = (): string | undefined => {
  const urlParams = new URLSearchParams(window.location.search);
  const theme = urlParams.get("theme");
  return theme == null ? undefined : theme;
};

/**
 * Microsoft Teams React hook
 * @param options optional options
 * @returns A tuple with properties and methods
 * properties:
 *  - inTeams: boolean = true if inside Microsoft Teams
 *  - fullscreen: boolean = true if in full screen mode
 *  - theme: Fluent UI Theme
 *  - themeString: string - representation of the theme (default, dark or contrast)
 *  - context - the Microsoft Teams JS SDK context
 * methods:
 *  - setTheme - manually set the theme
 */
export function useTeams(options?: {
  initialTheme?: string;
  setThemeHandler?: (theme?: string) => void;
}): [
  {
    inTeams?: boolean;
    fullScreen?: boolean;
    theme: ThemePrepared;
    themeString: string;
    context?: app.Context;
  },
  {
    setTheme: (theme: string | undefined) => void;
  }
] {
  const [inTeams, setInTeams] = useState<boolean | undefined>(undefined);
  const [fullScreen, setFullScreen] = useState<boolean | undefined>(undefined);
  const [theme, setTheme] = useState<ThemePrepared>(teamsTheme);
  const [themeString, setThemeString] = useState<string>("default");
  const [initialTheme] = useState<string | undefined>(
    options && options.initialTheme ? options.initialTheme : getTheme()
  );
  const [context, setContext] = useState<app.Context | undefined>(undefined);

  const themeChangeHandler = (theme: string | undefined) => {
    setThemeString(theme || "default");
    switch (theme) {
      case "dark":
        setTheme(teamsDarkTheme);
        break;
      case "contrast":
        setTheme(teamsHighContrastTheme);
        break;
      case "default":
      default:
        setTheme(teamsTheme);
    }
  };

  const overrideThemeHandler = options?.setThemeHandler
    ? options.setThemeHandler
    : themeChangeHandler;

  useEffect(() => {
    // set initial theme based on options or query string
    overrideThemeHandler(initialTheme);

    app
      .initialize()
      .then(() => {
        app
          .getContext()
          .then((context) => {
            batchedUpdates(() => {
              setInTeams(true);
              setContext(context);
              setFullScreen(context.page.isFullScreen);
            });
            overrideThemeHandler(context.app.theme);
            app.registerOnThemeChangeHandler(overrideThemeHandler);
            pages.registerFullScreenHandler((isFullScreen) => {
              setFullScreen(isFullScreen);
            });
          })
          .catch(() => {
            setInTeams(false);
          });
      })
      .catch(() => {
        setInTeams(false);
      });
  }, []);

  return [{ inTeams, fullScreen, theme, context, themeString }, { setTheme: overrideThemeHandler }];
}
