# Family Email Update - Troubleshooting Guide

## ✅ Backend Status: WORKING CORRECTLY

All backend tests passed successfully. The issue is likely in the frontend or API request format.

## 🔧 Common Issues & Solutions

### 1. **Request Format**
Make sure you're sending the request with correct format:

```javascript
// ✅ CORRECT
const updateData = {
  name: "John Doe",
  room: "101",
  age: 75,
  familyEmails: ["family1@example.com", "family2@example.com"], // Array format
  // ... other fields
};

// ❌ WRONG
const updateData = {
  familyEmails: "family1@example.com,family2@example.com", // String format
};
```

### 2. **HTTP Headers**
Ensure proper headers are set:

```javascript
// ✅ CORRECT
const response = await fetch(`/api/residents/${residentId}`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(updateData)
});
```

### 3. **Authorization**
Make sure you're logged in as **admin**:
- Only admin users can update residents
- Check your JWT token is valid
- Verify your role is 'admin'

### 4. **Email Validation**
Emails must be valid format:
```javascript
// ✅ VALID
["user@example.com", "test@domain.org"]

// ❌ INVALID
["invalid-email", "missing@domain"]
```

## 🧪 Test Your Request

Use this curl command to test directly:

```bash
curl -X PUT http://localhost:5000/api/residents/RESIDENT_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Test Resident",
    "room": "101",
    "age": 75,
    "familyEmails": ["test1@example.com", "test2@example.com"]
  }'
```

## 🔍 Debug Steps

1. **Check Network Tab** in browser dev tools
2. **Verify request payload** is correct JSON
3. **Check response status** and error messages
4. **Confirm user role** is admin
5. **Test with Postman** or similar tool

## 📝 Example Working Request

```javascript
// Frontend example
const updateResident = async (residentId, data) => {
  try {
    const response = await fetch(`/api/residents/${residentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        ...data,
        familyEmails: data.familyEmails || [] // Ensure it's an array
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Update failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Update error:', error);
    throw error;
  }
};
```

## 🚨 If Still Not Working

1. Check server logs for errors
2. Verify database connection
3. Test with the debug scripts provided
4. Check if validation middleware is blocking the request

The backend is confirmed working - focus on frontend implementation!