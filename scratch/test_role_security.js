const { generateToken, verifyToken } = require('../backend/src/config/jwt');
const authenticateJWT = require('../backend/src/middleware/authMiddleware');
const db = require('../backend/src/config/db');
const { TABLES, ROLES } = require('../backend/src/models/schema');
const { seedDatabase } = require('../backend/src/seed/seedData');

console.log('====================================================');
console.log('TESTING JWT AUTHENTICATION & ROLE SECURITY BARRIERS');
console.log('====================================================\n');

seedDatabase();

// 1. Test Valid Token Generation & Verification
const testUser = {
  id: 'usr-admin-01',
  username: 'admin',
  email: 'admin@inspectra.gov.in',
  role: ROLES.DIRECTOR
};

const token = generateToken(testUser);
console.log('[1] Token Generated Successfully. Length:', token.length);

const decoded = verifyToken(token);
console.log('    Decoded User ID:  ', decoded.id);
console.log('    Decoded Email:    ', decoded.email);
console.log('    Decoded Role:     ', decoded.role);

if (decoded.id !== testUser.id || decoded.role !== ROLES.DIRECTOR) {
  throw new Error('JWT payload mismatch');
}
console.log('    ✓ JWT Signing & Verification: PASSED');

// 2. Test Middleware with Missing Header
const mockReqMissing = { headers: {}, query: {} };
let statusCalled = null;
let jsonCalled = null;
const mockRes = {
  status: (code) => {
    statusCalled = code;
    return {
      json: (data) => {
        jsonCalled = data;
      }
    };
  }
};

authenticateJWT(mockReqMissing, mockRes, () => {});
console.log('\n[2] Request without Token:');
console.log('    Status Code:', statusCalled);
console.log('    Response:   ', jsonCalled);

if (statusCalled !== 401 || !jsonCalled.error.includes('Missing Authorization')) {
  throw new Error('Expected 401 for missing token');
}
console.log('    ✓ Protected endpoint rejected unauthenticated request: PASSED');

// 3. Test Middleware with Invalid / Corrupt Token
const mockReqInvalid = { headers: { authorization: 'Bearer this.is.corrupted' }, query: {} };
authenticateJWT(mockReqInvalid, mockRes, () => {});
console.log('\n[3] Request with Corrupted Token:');
console.log('    Status Code:', statusCalled);
console.log('    Response:   ', jsonCalled);

if (statusCalled !== 401 || !jsonCalled.error.includes('Invalid, expired')) {
  throw new Error('Expected 401 for corrupted token');
}
console.log('    ✓ Corrupted token rejected: PASSED');

// 4. Test Middleware with Valid Authenticated Inspector Token
const inspectorUser = db.getAll(TABLES.USERS).find(u => u.role === ROLES.INSPECTOR);
const inspectorToken = generateToken(inspectorUser);
let nextCalled = false;
const mockReqValid = { headers: { authorization: `Bearer ${inspectorToken}` }, query: {} };

authenticateJWT(mockReqValid, mockRes, () => {
  nextCalled = true;
});

console.log('\n[4] Request with Valid Inspector Token:');
console.log('    Next middleware invoked:', nextCalled);
console.log('    req.user populated:     ', mockReqValid.user);

if (!nextCalled || mockReqValid.user.role !== ROLES.INSPECTOR) {
  throw new Error('Expected middleware to pass for valid inspector token');
}
console.log('    ✓ Valid token successfully authorized and context attached: PASSED');

console.log('\n====================================================');
console.log('ALL JWT & ROLE SECURITY TESTS PASSED (100%)');
console.log('====================================================');
