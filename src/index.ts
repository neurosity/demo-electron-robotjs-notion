import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { deviceId, email, password } from "./secrets"
import { Notion } from "@neurosity/notion";
import * as robot from "robotjs";
import { pipe } from "rxjs";
import { map, bufferCount, filter } from "rxjs/operators";

const label = "leftArm";

const notion = new Notion({
  deviceId
});

notion
  .login({
    email,
    password   
  })
  .then(() => {
    console.log("Logged in");
    const kMouseDown = "down";
    const kMouseUp = "up";
    let mouseState = kMouseUp;
    let releaseMouseTimeout: NodeJS.Timeout | null = null;

    const numberOfPredictionsPerChoice = 4;
    const threshold = 0.85;
    notion.predictions(label)
    .pipe(
      map((prediction: any) => prediction.probability),
      bufferCount(numberOfPredictionsPerChoice, 1),
      map((probabilities: number[]): number => {
        return (
          probabilities.reduce(
            (acc: number, probability: number) => acc + probability
          ) / probabilities.length
        );
      }),
      filter((averagedProbability: number) => averagedProbability > threshold)
    )
    .subscribe(averagedProbability => {
      
      if (mainWindow) {
        mainWindow.webContents.send('prediction', averagedProbability);
      }
      
      console.log(averagedProbability);
      // if (releaseMouseTimeout) {
      //   clearTimeout(releaseMouseTimeout);
      // }
      // releaseMouseTimeout = setTimeout(() => {
      //   robot.mouseToggle(kMouseUp);
      // }, 250); // ms
      // robot.mouseToggle(kMouseDown);    
      // console.log("Mouse toggled", mouseState, " at ", intent.timestamp);
    });
  })
  .catch(error => {
    console.log(error);
    throw new Error(error);
  });


// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

let mainWindow: BrowserWindow | null = null;

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    height: 1000,
    width: 1200,
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, '../src/index.html'));

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
