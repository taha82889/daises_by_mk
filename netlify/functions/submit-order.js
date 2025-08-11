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
    const credentials = {
      type: process.env.GOOGLE_TYPE,
      project_id: process.env.GOOGLE_PROJECT_ID,
      private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
      private_key: process.env.GOOGLE_PRIVATE_KEY,
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      client_id: process.env.GOOGLE_CLIENT_ID,
      auth_uri: process.env.GOOGLE_AUTH_URI,
      token_uri: process.env.GOOGLE_TOKEN_URI,
      auth_provider_x509_cert_url: process.env.GOOGLE_AUTH_PROVIDER_CERT_URL,
      client_x509_cert_url: process.env.GOOGLE_CLIENT_CERT_URL,
      universe_domain: process.env.GOOGLE_UNIVERSE_DOMAIN,
  };

    const auth = new google.auth.GoogleAuth({
    credentials,
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
