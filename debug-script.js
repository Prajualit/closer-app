// EMERGENCY DEBUG SCRIPT
// Copy and paste this into your browser console on https://come-closer.vercel.app

console.log("🔍 Starting debug...");

// 1. Check what NEXT_PUBLIC_BACKEND_URL is set to
console.log("📡 Backend URL:", process.env.NEXT_PUBLIC_BACKEND_URL);

// 2. Test if backend is reachable
fetch(process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000')
  .then(response => {
    console.log("✅ Backend reachable:", response.status);
  })
  .catch(error => {
    console.log("❌ Backend NOT reachable:", error);
  });

// 3. Test login endpoint directly
const testLogin = async () => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/v1/users/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        username: 'testuser', // Replace with real username
        password: 'testpass'  // Replace with real password
      })
    });
    
    console.log("🔑 Login response status:", response.status);
    console.log("🍪 Set-Cookie headers:", response.headers.get('set-cookie'));
    
    if (response.ok) {
      const data = await response.json();
      console.log("✅ Login successful:", data);
    } else {
      const error = await response.text();
      console.log("❌ Login failed:", error);
    }
  } catch (error) {
    console.log("💥 Login request failed:", error);
  }
};

// Run the test (replace credentials with real ones)
// testLogin();
