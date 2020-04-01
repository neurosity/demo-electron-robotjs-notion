"use strict";
exports.__esModule = true;
var electron_1 = require("electron");
var path = require("path");
var secrets_1 = require("./secrets");
var notion_1 = require("@neurosity/notion");
var operators_1 = require("rxjs/operators");
var label = "leftArm";
var notion = new notion_1.Notion({
    deviceId: secrets_1.deviceId
});
notion
    .login({
    email: secrets_1.email,
    password: secrets_1.password
})
    .then(function () {
    console.log("Logged in");
    var kMouseDown = "down";
    var kMouseUp = "up";
    var mouseState = kMouseUp;
    var releaseMouseTimeout = null;
    var numberOfPredictionsPerChoice = 4;
    var threshold = 0.85;
    notion.predictions(label)
        .pipe(operators_1.map(function (prediction) { return prediction.probability; }), operators_1.bufferCount(numberOfPredictionsPerChoice, 1), operators_1.map(function (probabilities) {
        return (probabilities.reduce(function (acc, probability) { return acc + probability; }) / probabilities.length);
    }), operators_1.filter(function (averagedProbability) { return averagedProbability > threshold; }))
        .subscribe(function (averagedProbability) {
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
})["catch"](function (error) {
    console.log(error);
    throw new Error(error);
});
// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
    electron_1.app.quit();
}
var mainWindow = null;
var createWindow = function () {
    // Create the browser window.
    mainWindow = new electron_1.BrowserWindow({
        height: 1000,
        width: 1200
    });
    // and load the index.html of the app.
    mainWindow.loadFile(path.join(__dirname, '../src/index.html'));
    // Open the DevTools.
    mainWindow.webContents.openDevTools();
};
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
electron_1.app.on('ready', createWindow);
// Quit when all windows are closed.
electron_1.app.on('window-all-closed', function () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
electron_1.app.on('activate', function () {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (electron_1.BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
//# sourceMappingURL=index.js.map