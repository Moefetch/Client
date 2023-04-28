import type {
  ISettings,
  IParam,
  ILogicSpecialParamsDictionary,
  ILogicSpecialSettingsDictionary,
  ILogicCategorySpecialParamsDictionary,
  IModelSpecialParam,
  ILogicCategorySpecialSettingsDictionary,
} from "./types";

import { defaultDatabase_url, stockSettings } from "./types";

export class Settings implements ISettings {
  public backend_url: string;
  public database_url: Setting;
  public stock_settings: {
    show_nsfw: IParam;
    blur_nsfw: IParam;
    show_hidden: IParam;
    thumbnail_list_to_left: IParam;
  };
  public special_params?: ILogicSpecialParamsDictionary;
  public special_settings?: ILogicSpecialSettingsDictionary;

  constructor(settings: ISettings) {
    this.backend_url = settings.backend_url;
    this.database_url = new Setting(settings.database_url);
    this.stock_settings = settings.stock_settings;

    if (settings.special_params) {
      this.special_params = this.specialParamsDictionaryProcess(
        settings.special_params
      );
    }
    if (settings.special_settings) {
      this.special_settings = this.SpecialSettingsDictionaryProcess(
        settings.special_settings
      );
    }
  }

  private SpecialSettingsDictionaryProcess(
    logicSpecialSettingsDictionary: ILogicSpecialSettingsDictionary
  ) {
    const specialParamsDictionary: {
      [logicCategory: string]: CategorySpecialSettings;
    } = {};
    for (const logicCategory in logicSpecialSettingsDictionary) {
      if (
        Object.prototype.hasOwnProperty.call(
          logicSpecialSettingsDictionary,
          logicCategory
        )
      ) {
        const element = logicSpecialSettingsDictionary[logicCategory];
        specialParamsDictionary[logicCategory] = new CategorySpecialSettings(
          element
        );
      }
    }
    return specialParamsDictionary;
  }

  private specialParamsDictionaryProcess(
    logicSpecialParamsDictionary: ILogicSpecialParamsDictionary
  ) {
    const specialParamsDictionary: {
      [logicCategory: string]: CategorySpecialParams;
    } = {};
    for (const logicCategory in logicSpecialParamsDictionary) {
      if (
        Object.prototype.hasOwnProperty.call(
          logicSpecialParamsDictionary,
          logicCategory
        )
      ) {
        const element = logicSpecialParamsDictionary[logicCategory];
        specialParamsDictionary[logicCategory] = new CategorySpecialParams(
          element
        );
      }
    }
    return specialParamsDictionary;
  }

  private compareSpecialSettingsToDefault(
    initialSettings: ISettings,
    divisionType: "special_settings" | "special_params",
    defaultSpecialSettingsOrParams: { [key: string]: any }
  ) {
    //the flow is get settings from default and if they dont exuist in settings object add (the else part is adding)
    let internalSettingVar = JSON.parse(JSON.stringify({ ...initialSettings }));
    for (const categoryName in defaultSpecialSettingsOrParams) {
      if (!internalSettingVar[divisionType]) {
        internalSettingVar[divisionType] = defaultSpecialSettingsOrParams;
      } else if (
        Object.prototype.hasOwnProperty.call(
          defaultSpecialSettingsOrParams,
          categoryName
        ) &&
        Object.prototype.hasOwnProperty.call(
          internalSettingVar[divisionType],
          categoryName
        )
      ) {
        const categoryInDefault = defaultSpecialSettingsOrParams[categoryName];
        for (const hostOrCategorySpecific in categoryInDefault) {
          if (
            Object.prototype.hasOwnProperty.call(
              categoryInDefault,
              hostOrCategorySpecific
            ) &&
            Object.prototype.hasOwnProperty.call(
              internalSettingVar[divisionType][categoryName],
              hostOrCategorySpecific
            )
          ) {
            if (
              (internalSettingVar[divisionType][categoryName] as any)[
                hostOrCategorySpecific
              ]
            ) {
              for (const setting in categoryInDefault[hostOrCategorySpecific]) {
                if (
                  Object.prototype.hasOwnProperty.call(
                    categoryInDefault[hostOrCategorySpecific],
                    setting
                  )
                ) {
                  const settingObj =
                    categoryInDefault[hostOrCategorySpecific][setting];
                  (internalSettingVar[divisionType][categoryName] as any)[
                    hostOrCategorySpecific
                  ][setting] =
                    (
                      (internalSettingVar[divisionType][categoryName] as any)[
                        hostOrCategorySpecific
                      ] as any
                    )[setting] ?? settingObj;
                }
              }
            }
          } else
            (internalSettingVar[divisionType][categoryName] as any)[
              hostOrCategorySpecific
            ] =
              defaultSpecialSettingsOrParams[categoryName][
                hostOrCategorySpecific
              ];
        }
      } else
        internalSettingVar[divisionType][categoryName] =
          defaultSpecialSettingsOrParams[categoryName];
    }
    if (!initialSettings[divisionType]) {
      initialSettings[divisionType] = internalSettingVar[divisionType];
    }
    if (
      Object.getPrototypeOf(initialSettings[divisionType]) !==
      Object.getPrototypeOf(internalSettingVar[divisionType])
    ) {
      Object.assign(initialSettings, internalSettingVar);
    }
    initialSettings.stock_settings = stockSettings;
    return internalSettingVar as typeof initialSettings;
  }
}

export class Setting implements IParam {
  public checkBoxDescription: string;
  public checkBoxValue: boolean;
  public containsString: boolean;
  public errorMessage?: string;
  public stringValue?: { stringPlaceholder: string; value: string };
  /**
   * checkValid
   */
  public checkIfValid: (
    enabledBool: boolean,
    stringValue?: string
  ) => string | undefined;
  /**
   * checkValid
   */
  public checkValid?: (
    enabledBool: boolean,
    stringValue?: string
  ) => string | undefined;

  constructor(setting: IParam) {
    this.checkBoxDescription = setting.checkBoxDescription;
    this.checkBoxValue = setting.checkBoxValue;
    this.containsString = setting.containsString;
    this.errorMessage = setting.errorMessage;
    this.stringValue = setting.stringValue;
    if (setting.checkValid) {
      this.checkValid = setting.checkValid;
    }
    this.checkIfValid = (enabledBool: boolean, stringValue?: string) => {
      if (setting.checkValid) {
        this.errorMessage = setting.checkValid(enabledBool, stringValue);
        console.log(setting.checkValid);

        return this.errorMessage;
      }
    };
  }
}

class CategorySpecialSettings
  implements ILogicCategorySpecialSettingsDictionary
{
  public specialCategorySettings?: { [setting: string]: Setting };
  public specialHostnameSpecificSettings?: {
    [hostname: string]: { [setting: string]: Setting };
  };

  constructor(
    logicCategorySpecialSettingsDictionary: ILogicCategorySpecialSettingsDictionary
  ) {
    if (logicCategorySpecialSettingsDictionary.specialCategorySettings) {
      this.specialCategorySettings = settingKeyValue(
        logicCategorySpecialSettingsDictionary.specialCategorySettings
      );
    }
    if (
      logicCategorySpecialSettingsDictionary.specialHostnameSpecificSettings
    ) {
      this.specialHostnameSpecificSettings = {};
      for (const hostName in logicCategorySpecialSettingsDictionary.specialHostnameSpecificSettings) {
        if (
          Object.prototype.hasOwnProperty.call(
            logicCategorySpecialSettingsDictionary.specialHostnameSpecificSettings,
            hostName
          )
        ) {
          const dictionaryObject =
            logicCategorySpecialSettingsDictionary
              .specialHostnameSpecificSettings[hostName];
          this.specialHostnameSpecificSettings[hostName] =
            settingKeyValue(dictionaryObject);
        }
      }
    }
  }
}

class CategorySpecialParams implements ILogicCategorySpecialParamsDictionary {
  public specialCategoryParams?: { [setting: string]: Setting };
  public specialHostnameSpecificParams?: {
    [hostname: string]: { [setting: string]: Setting };
  };

  constructor(
    logicCategorySpecialParamsDictionary: ILogicCategorySpecialParamsDictionary
  ) {
    if (logicCategorySpecialParamsDictionary.specialCategoryParams) {
      this.specialCategoryParams = settingKeyValue(
        logicCategorySpecialParamsDictionary.specialCategoryParams
      );
    }
    if (logicCategorySpecialParamsDictionary.specialHostnameSpecificParams) {
      this.specialHostnameSpecificParams = {};
      for (const hostName in logicCategorySpecialParamsDictionary.specialHostnameSpecificParams) {
        if (
          Object.prototype.hasOwnProperty.call(
            logicCategorySpecialParamsDictionary.specialHostnameSpecificParams,
            hostName
          )
        ) {
          const dictionaryObject =
            logicCategorySpecialParamsDictionary.specialHostnameSpecificParams[
              hostName
            ];
          this.specialHostnameSpecificParams[hostName] =
            settingKeyValue(dictionaryObject);
        }
      }
    }
  }
}

function settingKeyValue(dictionaryObject: IModelSpecialParam) {
  let outputKeyVal: { [setting: string]: Setting } = {};
  for (const settingsInSpecialParams in dictionaryObject) {
    if (
      Object.prototype.hasOwnProperty.call(
        dictionaryObject,
        settingsInSpecialParams
      )
    ) {
      outputKeyVal[settingsInSpecialParams] = new Setting(
        dictionaryObject[settingsInSpecialParams]
      );
    }
  }
  return outputKeyVal;
}

/**
 * getSettings
 */
export function getSettings() {
  let settings: ISettings | undefined;
  const localStorageSettingsJSONString = localStorage.getItem("settings");
  if (localStorageSettingsJSONString) {
    settings = JSON.parse(localStorageSettingsJSONString);
  }
  return (
    settings ??
    ({
      backend_url: "http://127.0.0.1:2234/",
      database_url: defaultDatabase_url,

      stock_settings: stockSettings,
      special_settings: {},
      special_params: {},
    } as ISettings)
  );
}
