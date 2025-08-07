// Quick test to check if Backend is running
const fetch = require('node-fetch');

async function testBackend() {
  try {
    console.log('Testing Backend server...');
    const response = await fetch('http://localhost:5001/health');
    const data = await response.json();
    console.log('✅ Backend is running:', data);
  } catch (error) {
    console.log('❌ Backend is not running:', error.message);
  }
}

testBackend();