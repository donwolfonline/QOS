const QRCode = require('qrcode');
const path = require('path');

const payloadObj = {
  uri: "http://127.0.0.1:8000/tactical_guestbook.qos",
  sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  capabilities: {
    network: false,
    fs_read: false,
    fs_write: false,
    gpu: false,
    state_read: true,
    state_write: true
  },
  entrypoint: "_start"
};

const base64Json = Buffer.from(JSON.stringify(payloadObj)).toString('base64');
const payload = `qos-exec://${base64Json}`;
const outputPath = path.join(__dirname, 'trigger_qr.png');

QRCode.toFile(outputPath, payload, {
  color: {
    dark: '#00F0FF',  // Cyan/Neon glow for the tactical feel
    light: '#000000'  // Black background
  }
}, function (err) {
  if (err) throw err;
  console.log('✅ Generated test trigger QR code at', outputPath);
  console.log('Payload:', payload);
});
