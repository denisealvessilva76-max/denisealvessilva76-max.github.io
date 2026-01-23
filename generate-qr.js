const QRCode = require('qrcode');

const webUrl = 'https://8081-i84jlsmq8t12oldkdpl95-0fe92ffe.us2.manus.computer';

// Gerar QR Code para web (iOS e Android PWA)
QRCode.toFile('/home/ubuntu/canteiro-saudavel/QR_CODE_WEB.png', webUrl, {
  width: 800,
  margin: 2,
  color: {
    dark: '#0a7ea4',
    light: '#ffffff'
  }
}, (err) => {
  if (err) {
    console.error('Erro ao gerar QR Code Web:', err);
  } else {
    console.log('✅ QR Code Web gerado: QR_CODE_WEB.png');
    console.log('URL:', webUrl);
  }
});
