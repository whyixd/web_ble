const scanButton = document.getElementById("scanButton");
const filterSelect = document.getElementById("filterSelect");
const connectButton = document.getElementById("connectButton");
const disconnectButton = document.getElementById("disconnectButton");
const modeSelect = document.getElementById("modeSelect");
const idInput = document.getElementById("idInput");
const setIdButton = document.getElementById("setIdButton");
const openButton = document.getElementById("openButton");
const closeButton = document.getElementById("closeButton");
const messages = document.getElementById("messages");

let device;
let server;
let characteristic;

scanButton.addEventListener("click", async () => {
  try {
    const filterName =
      filterSelect.value === "none" ? null : { name: filterSelect.value };
    console.log("filterName", filterName);
    device = await navigator.bluetooth.requestDevice({
      //   acceptAllDevices: true,
      filters: [{ name: "ESP32" }],
      optionalServices: [
        "generic_access",
        "generic_attribute",
        "19b10000-e8f2-537e-4f6c-d104768a1214", // Replace with your custom service UUID
        // Add more custom service UUIDs as needed
      ],
    });

    logMessage(`Device selected: ${device.name}`);
  } catch (error) {
    logMessage(`Error scanning: ${error}`);
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

    // Display manufacturer data (This part needs actual implementation based on your device)
    logMessage("Manufacturer Data: (Not available in this example)");
  } catch (error) {
    logMessage(`Error connecting: ${error}`);
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

function logMessage(message) {
  messages.innerHTML += `<p>${message}</p>`;
}
