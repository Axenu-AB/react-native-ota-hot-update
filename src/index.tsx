import { NativeModules, Platform } from 'react-native';

const LINKING_ERROR =
  `The package 'react-native-ota-hot-update' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

// @ts-expect-error
const isTurboModuleEnabled = global.__turboModuleProxy != null;

const OtaHotUpdateModule = isTurboModuleEnabled
  ? require('./NativeOtaHotUpdate').default
  : NativeModules.OtaHotUpdate;

const RNhotupdate = OtaHotUpdateModule
  ? OtaHotUpdateModule
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      }
    );

function setupBundlePath(path: string, extension?: string): Promise<boolean> {
  return RNhotupdate.setupBundlePath(path, extension);
}
function deleteBundlePath(): Promise<boolean> {
  return RNhotupdate.deleteBundle(1);
}
function getCurrentVersion(): Promise<string> {
  return RNhotupdate.getCurrentVersion(0);
}
async function getVersionAsNumber() {
  const rawVersion = await getCurrentVersion();
  return rawVersion;
}
function setCurrentVersion(version: string): Promise<boolean> {
  return RNhotupdate.setCurrentVersion(version);
}
async function resetApp() {
  RNhotupdate.restart();
}
function removeBundle(restartAfterRemoved?: boolean) {
  deleteBundlePath().then((data) => {
    if (data && restartAfterRemoved) {
      setTimeout(() => {
        resetApp();
      }, 300);
      setCurrentVersion('0');
    }
  });
}

async function setBundleAsActive(
  filePath: string,
  version: string,
  restartAfterSet?: boolean
) {
  setupBundlePath(filePath).then((success) => {
    if (success) {
      setCurrentVersion(version);
      if (restartAfterSet) {
        setTimeout(() => {
          resetApp();
        }, 300);
      }
    }
  });
}

export default {
  setupBundlePath,
  removeUpdate: removeBundle,
  resetApp,
  getCurrentVersion: getVersionAsNumber,
  setCurrentVersion,
  setBundleAsActive,
};
