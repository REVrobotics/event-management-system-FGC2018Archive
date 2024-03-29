const {ipcMain, app} = require("electron");
const path = require("path");
const fs = require("fs");
const logger = require("./logger");
const appDataPath = app.getPath("appData") + path.sep + app.getName();

ipcMain.on("store-set-all", (event, config) => {
  const filePath = path.join(appDataPath, config.file);
  fs.writeFile(filePath, JSON.stringify(config.data), (err) => {
    if (err) {
      logger.error(err);
      event.sender.send("store-set-all-error", err);
    } else {
      event.sender.send("store-set-all-success", config.data);
    }
  });
});

ipcMain.on("store-get-all", (event, file) => {
  const filePath = path.join(appDataPath, file);
  fs.readFile(filePath, (err, data) => {
    if (err) {
      logger.error(err);
      event.sender.send("store-get-all-error", JSON.stringify(err));
    } else {
      event.sender.send("store-get-all-success", JSON.parse(data.toString()));
    }
  });
});

ipcMain.on("store-set", (event, options) => {
  const filePath = path.join(appDataPath, options.file);
  fs.readFile(filePath, (readErr, data) => {
    if (readErr) {
      logger.error(readErr);
      event.sender.send("store-set-error", readErr);
    } else {
      const storeJSON = JSON.parse(data.toString());
      if (typeof storeJSON[options.key] === "undefined") {
        storeJSON[options.key] = {};
      }
      storeJSON[options.key] = options.data;
      fs.writeFile(filePath, JSON.stringify(storeJSON), (writeErr) => {
        if (writeErr) {
          logger.error(writeErr);
          event.sender.send("store-set-error", writeErr);
        } else {
          event.sender.send("store-set-success", storeJSON);
        }
      });
    }
  });
});