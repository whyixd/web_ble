const scanButton = document.getElementById("scanButton");
const filterSelect = document.getElementById("filterSelect");
const connectButton = document.getElementById("connectButton");
const disconnectButton = document.getElementById("disconnectButton");
const modeSelect = document.getElementById("modeSelect");
const saveToEepromButton = document.getElementById("saveToEepromButton");
const idInput = document.getElementById("idInput");
const setIdButton = document.getElementById("setIdButton");
const openButton = document.getElementById("openButton");
const closeButton = document.getElementById("closeButton");
const messages = document.getElementById("messages");

let device;
let server;
let modeReadcharacteristic;
let modeSelectcharacteristic;

const MAIN_SERVICE_UUID = "19b10000-e8f2-537e-4f6c-d104768a1214"; // Replace with your service UUID
const MODE_READ_CHARACTERISTIC_UUID = "19b10001-e8f2-537e-4f6c-d104768a1214"; // Replace with your characteristic UUID
const MODE_SELECT_CHARACTERISTIC_UUID = "19b10002-e8f2-537e-4f6c-d104768a1214"; // Replace with your characteristic UUID
const EEPROM_SAVE_CHARACTERISTIC_UUID = "19b10003-e8f2-537e-4f6c-d104768a1214"; // Add this line for EEPROM save characteristic
let bleServices;

// Check browser compatibility at the beginning
document.addEventListener("DOMContentLoaded", function () {
  checkBrowserCompatibility();
});

// function checkBrowserCompatibility() {
//   if (!navigator.bluetooth) {
//     var userAgent = navigator.userAgent || navigator.vendor || window.opera;

//     // Check if device is iOS
//     if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
//       // Check if Bluefy is installed using URL scheme
//       // Bluefy is not installed, offer to download
//       var confirmDownload = confirm(
//         "This feature requires the Bluefy browser with Web Bluetooth support. Would you like to download it from the App Store?"
//       );
//       if (confirmDownload) {
//         window.location.href =
//           "https://apps.apple.com/us/app/bluefy-web-ble-browser/id1492822055";
//       }
//       // Bluefy is installed, offer to open in Bluefy
//       // var openInBluefy = confirm(
//       //   "Would you like to open this page in Bluefy browser for Web Bluetooth support?"
//       // );
//       // if (openInBluefy) {
//       //   // Open current page in Bluefy
//       //   const currentUrl = window.location.href;
//       //   window.location.href = `bluefy://${currentUrl}`;
//       // }
//     }
//   } else {
//     // Not iOS but doesn't support Web Bluetooth
//     alert(
//       "Your browser doesn't support Web Bluetooth. Please use a compatible browser."
//     );
//   }
// }

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
        "19b10000-e8f2-537e-4f6c-d104768a1214", // Replace with your custom service UUID
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
  } else {
    logMessage("Device already disconnected.");
  }
});

setIdButton.addEventListener("click", async () => {
  const id = idInput.value;
  logMessage(`Setting ID: ${id}`);
  // Implement the logic to send the ID to the device
});

openButton.addEventListener("click", () => {
  logMessage("Opening...");
  // Implement the open function logic
});

closeButton.addEventListener("click", () => {
  logMessage("Closing...");
  // Implement the close function logic
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

async function writeMode(value) {
  try {
    const mode = new Uint8Array([value]);
    await modeSelectcharacteristic.writeValue(mode);
    logMessage(`Mode set to ${value}`);
  } catch (error) {
    logMessage(`Error writing mode: ${error}`, "error");
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
