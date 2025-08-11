const { google } = require('googleapis');
const path = require('path');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' })
    };
  }

  try {
    const { name, contact, email, address, city, order_details, total_amount } = JSON.parse(event.body);
     if (!process.env.GOOGLE_CREDENTIALS) {
      throw new Error("Google credentials not set in environment variables");
    }

    // Parse the credentials from the environment variable
    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);

    const auth = new google.auth.GoogleAuth({
      credentials: credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = '1qRTJASdTQ3wGKcWCwkK7oI9g-xl0HeTt4PnC5wEsT8M';

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Sheet1!A:H',
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [[
          name,
          contact,
          email,
          address,
          city,
          order_details,
          total_amount,
          new Date().toLocaleString()
        ]]
      }
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Order saved successfully!' })
    };

  } catch (error) {
    console.error('Error saving order:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to save order.' })
    };
  }
};
