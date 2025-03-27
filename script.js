const scanButton = document.getElementById("scanButton");
const filterSelect = document.getElementById("filterSelect");
const connectButton = document.getElementById("connectButton");
const disconnectButton = document.getElementById("disconnectButton");
const modeSelect = document.getElementById("modeSelect");
const saveToEepromButton = document.getElementById("saveToEepromButton");
const idInput = document.getElementById("flowerSerial");
const flowerIndex = document.getElementById("flowerIndex");
const saveConfigButton = document.getElementById("saveConfigButton");
const openButton = document.getElementById("openButton");
const closeButton = document.getElementById("closeButton");
const homeButton = document.getElementById("homeButton");
const messages = document.getElementById("messages");
const sensorStateContainer = document.getElementById("sensorStateContainer");

let device;
let server;
let modeReadcharacteristic;
let modeSelectcharacteristic;
let openClosecharacteristic;
let configReadcharacteristic;
let configSavecharacteristic;
let sensorReadcharacteristic;

const MAIN_SERVICE_UUID = "19b10000-e8f2-537e-4f6c-d104768a1214"; // Replace with your service UUID
const MODE_READ_CHARACTERISTIC_UUID = "19b10001-e8f2-537e-4f6c-d104768a1214"; // Replace with your characteristic UUID
const MODE_SELECT_CHARACTERISTIC_UUID = "19b10002-e8f2-537e-4f6c-d104768a1214"; // Replace with your characteristic UUID
const EEPROM_SAVE_CHARACTERISTIC_UUID = "19b10003-e8f2-537e-4f6c-d104768a1214"; // Add this line for EEPROM save characteristic
const OPEN_CLOSE_CHARACTERISTIC_UUID = "19b10004-e8f2-537e-4f6c-d104768a1214"; // Add this line for open/close characteristic

const CONFIG_SERVICE_UUID = "1f18bde0-ac02-4c37-8bf4-50dc2d9ac04f";
const CONFIG_READ_CHARACTERISTIC_UUID = "1f18bde1-ac02-4c37-8bf4-50dc2d9ac04f"; // New UUID for flower index
const CONFIG_SAVE_CHARACTERISTIC_UUID = "1f18bde2-ac02-4c37-8bf4-50dc2d9ac04f"; // New UUID for flower index
const SENSOR_READ_CHARACTERISTIC_UUID = "1f18bde3-ac02-4c37-8bf4-50dc2d9ac04f";

let bleServices;
let configService;
let readSensor;
scanButton.addEventListener("click", async () => {
  try {
    const filterName =
      filterSelect.value === "none" ? null : { name: filterSelect.value };
    console.log("filterName", filterName);
    device = await navigator.bluetooth.requestDevice({
      //   acceptAllDevices: true,
      filters: [{ namePrefix: "Whyixd" }],
      optionalServices: [
        "generic_access",
        "generic_attribute",
        MAIN_SERVICE_UUID, // Replace with your custom service UUID
        CONFIG_SERVICE_UUID,
        // Add more custom service UUIDs as needed
      ],
    });

    logMessage(`Device selected: ${device.name}`);
  } catch (error) {
    logMessage(`Error scanning: ${error}`, "error");
  }
});

connectButton.addEventListener("click", async () => {
  if (!device) {
    logMessage("Please scan for a device first.");
    return;
  }

  try {
    server = await device.gatt.connect();
    logMessage("Connected.");

    // Display device information
    logMessage(`Device Name: ${device.name}`);
    logMessage(`Device Address: ${device.id}`); // Using device.id as address

    // Display services (This part needs actual implementation based on your device)
    logMessage("Services: (Fetching...)");
    const services = await server.getPrimaryServices();
    services.forEach((service) => {
      logMessage(`  - ${service.uuid}`);
    });
    bleServices = services;
    // Display manufacturer data (This part needs actual implementation based on your device)
    logMessage("Manufacturer Data: (Not available in this example)");

    // Read mode and update select
    await readModeAndUpdateSelect();
    await readFlowerConfigAndUpdate();
    // await readSensorAndUpdate();
  } catch (error) {
    logMessage(`Error connecting: ${error}`, "error");
  }
});

disconnectButton.addEventListener("click", () => {
  if (!device) {
    logMessage("No device connected.");
    return;
  }

  if (device.gatt.connected) {
    device.gatt.disconnect();
    logMessage("Disconnected.");
    clearInterval(readSensor);
    readSensor = null;
  } else {
    logMessage("Device already disconnected.");
  }
});

saveConfigButton.addEventListener("click", async () => {
  const id = idInput.value;
  const index = flowerIndex.value ? parseInt(flowerIndex.value) : 0;

  if (!id) {
    logMessage("Please enter a valid ID.", "error");
    return;
  }

  try {
    await writeConfig(id, index);
    logMessage(`Config saved: Serial=${id}, Index=${index}`);
  } catch (error) {
    logMessage(`Error saving config: ${error}`, "error");
  }
});

openButton.addEventListener("click", async () => {
  logMessage("Opening...");
  // Implement the open function logic
  try {
    const service = await server.getPrimaryService(MAIN_SERVICE_UUID);
    openClosecharacteristic = await service.getCharacteristic(
      OPEN_CLOSE_CHARACTERISTIC_UUID
    );
    await writeOpenClose(1);
  } catch (error) {
    logMessage(`Error writing mode: ${error}`, "error");
  }
});

closeButton.addEventListener("click", async () => {
  logMessage("Closing...");
  // Implement the close function logic
  try {
    const service = await server.getPrimaryService(MAIN_SERVICE_UUID);
    openClosecharacteristic = await service.getCharacteristic(
      OPEN_CLOSE_CHARACTERISTIC_UUID
    );
    await writeOpenClose(0);
  } catch (error) {
    logMessage(`Error writing mode: ${error}`, "error");
  }
});

// Add home button event listener
homeButton.addEventListener("click", async () => {
  logMessage("Homing...");
  try {
    const service = await server.getPrimaryService(MAIN_SERVICE_UUID);
    openClosecharacteristic = await service.getCharacteristic(
      OPEN_CLOSE_CHARACTERISTIC_UUID
    );
    await writeOpenClose(2); // Using value 2 for home command
  } catch (error) {
    logMessage(`Error sending home command: ${error}`, "error");
  }
});

async function readModeAndUpdateSelect() {
  try {
    const service = await server.getPrimaryService(MAIN_SERVICE_UUID);
    modeReadcharacteristic = await service.getCharacteristic(
      MODE_READ_CHARACTERISTIC_UUID
    );
    const value = await modeReadcharacteristic.readValue();
    let modeValue = value.getUint8(0); // Assuming mode is a single byte

    // Convert ASCII to number
    // modeValue = modeValue - 48;

    // Update the select dropdown
    switch (modeValue) {
      case 1:
        modeSelect.value = "mode1";
        break;
      case 2:
        modeSelect.value = "mode2";
        break;
      case 3:
        modeSelect.value = "mode3";
        break;
      default:
        logMessage(`Unknown mode value: ${modeValue}`);
    }
  } catch (error) {
    logMessage(`Error reading mode: ${error}`, "error");
  }
}

async function readFlowerConfigAndUpdate() {
  try {
    const service = await server.getPrimaryService(CONFIG_SERVICE_UUID);
    configReadcharacteristic = await service.getCharacteristic(
      CONFIG_READ_CHARACTERISTIC_UUID
    );
    const value = await configReadcharacteristic.readValue();
    let serial = value.getInt8(0); // Assuming mode is a single byte
    let index = value.getInt8(4); // Assuming mode is a single byte
    console.log("config:", serial, index);
    idInput.value = serial;
    flowerIndex.value = index;
  } catch (error) {
    logMessage(`Error reading mode: ${error}`, "error");
  }
}

// async function readSensorAndUpdate() {
//   if (!server) {
//     // logMessage("Please connect to a device first.");
//     return;
//   }
//   try {
//     const service = await server.getPrimaryService(CONFIG_SERVICE_UUID);
//     sensorReadcharacteristic = await service.getCharacteristic(
//       SENSOR_READ_CHARACTERISTIC_UUID
//     );
//     const value = await sensorReadcharacteristic.readValue();
//     let result = value;
//     console.log("sensor:", result);
//   } catch (error) {
//     logMessage(`Error reading mode: ${error}`, "error");
//   }
// }
async function writeConfig(serial, index) {
  try {
    const service = await server.getPrimaryService(CONFIG_SERVICE_UUID);
    configSavecharacteristic = await service.getCharacteristic(
      CONFIG_SAVE_CHARACTERISTIC_UUID
    );
    const config = new Uint8Array([serial, index]);
    await configSavecharacteristic.writeValue(config);
    logMessage(`Config set to ${config}`);
  } catch (error) {
    logMessage(`Error writing mode: ${error}`, "error");
  }
}
async function writeMode(value) {
  try {
    const mode = new Uint8Array([value]);
    await modeSelectcharacteristic.writeValue(mode);
    logMessage(`Mode set to ${value}`);
  } catch (error) {
    logMessage(`Error writing mode: ${error}`, "error");
  }
}

async function writeOpenClose(value) {
  try {
    const mode = new Uint8Array([value]);
    await openClosecharacteristic.writeValue(mode);
    logMessage(`Open Close ${value}`);
  } catch (error) {
    logMessage(`Error open close: ${error}`, "error");
  }
}

function logMessage(message, type = "info") {
  if (type === "info") {
    messages.innerHTML += `<p ">${message}</p>`;
  } else if (type === "error") {
    messages.innerHTML += `<p style="color:red">${message}</p>`;
  }
}

// Add event listener for mode select change
modeSelect.addEventListener("change", async () => {
  if (!server) {
    logMessage("Please connect to a device first.");
    return;
  }

  try {
    const service = await server.getPrimaryService(MAIN_SERVICE_UUID);
    modeSelectcharacteristic = await service.getCharacteristic(
      MODE_SELECT_CHARACTERISTIC_UUID
    );

    let modeValue;
    switch (modeSelect.value) {
      case "mode1":
        modeValue = 1;
        break;
      case "mode2":
        modeValue = 2;
        break;
      case "mode3":
        modeValue = 3;
        break;
    }

    await writeMode(modeValue);
  } catch (error) {
    logMessage(`Error setting mode: ${error}`, "error");
  }
});

// Add event listener for save to EEPROM button
saveToEepromButton.addEventListener("click", async () => {
  if (!server) {
    logMessage("Please connect to a device first.");
    return;
  }

  try {
    const service = await server.getPrimaryService(MAIN_SERVICE_UUID);
    const eepromCharacteristic = await service.getCharacteristic(
      EEPROM_SAVE_CHARACTERISTIC_UUID
    );

    // Send a command to save current settings to EEPROM
    await eepromCharacteristic.writeValue(new Uint8Array([1])); // 1 means "save"
    logMessage("Settings saved to EEPROM");
  } catch (error) {
    logMessage(`Error saving to EEPROM: ${error}`, "error");
  }
});
