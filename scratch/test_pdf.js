const app = require('../backend/src/app');
const http = require('http');
const { generateToken } = require('../backend/src/config/jwt');

const server = http.createServer(app);
server.listen(0, async () => {
  try {
    const port = server.address().port;
    const token = generateToken({ id: 'usr-admin-01', role: 'ADMIN' });

    // Test 1: Fetch PDF via query token
    const res = await fetch(`http://127.0.0.1:${port}/api/reports/pdf/insp-rec-01?token=${token}`);
    console.log('STATUS:', res.status);
    console.log('CONTENT-TYPE:', res.headers.get('content-type'));
    console.log('DISPOSITION:', res.headers.get('content-disposition'));
    const buf = Buffer.from(await res.arrayBuffer());
    console.log('PDF BUFFER LENGTH:', buf.length);
    console.log('HEADER:', buf.slice(0, 8).toString());

    if (res.status === 200 && buf.slice(0, 4).toString() === '%PDF') {
      console.log('SUCCESS: Real binary PDF generated and served perfectly!');
    } else {
      console.error('FAILED: PDF generation did not return valid PDF header');
    }
  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    server.close();
  }
});
