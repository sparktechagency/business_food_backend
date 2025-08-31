export const companyAccountCreatedByAdminEmail = (userData: any) => `
  <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 0;
          background-color: #f4f4f4;
        }
        .container {
          max-width: 600px;
          margin: 20px auto;
          padding: 20px;
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        h1 {
          color: #333;
          font-size: 24px;
          margin-bottom: 15px;
        }
        p {
          color: #555;
          font-size: 16px;
          line-height: 1.6;
        }
        .credentials {
          background-color: #f9f9f9;
          border: 1px solid #ddd;
          padding: 15px;
          margin: 20px 0;
          border-radius: 6px;
        }
        strong {
          color: #000;
        }
        .button {
          display: inline-block;
          padding: 10px 20px;
          margin-top: 20px;
          background-color: #007bff;
          color: #fff;
          text-decoration: none;
          border-radius: 5px;
          font-size: 16px;
        }
        .button:hover {
          background-color: #0056b3;
        }
        footer {
          margin-top: 20px;
          font-size: 14px;
          color: #777;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Welcome to Business Food Service 🎉</h1>
        <p>Hello <strong>${userData?.name}</strong>,</p>
        <p>An account has been created for you by our Admin team. Please find your login details below:</p>
        
        <div class="credentials">
          <p><strong>Email:</strong> ${userData?.email}</p>
          <p><strong>Password:</strong> ${userData?.password}</p>
        </div>

        <p>👉 For security reasons, we strongly recommend that you log in immediately and change your password.</p> 

        <p>If you have any questions or need assistance, please reach out to us at 
          <a href="mailto:support@businessfood.com">support@businessfood.com</a>.
        </p>

        <footer>
          <p>Thank you for joining us,<br>Business Food Service Team</p>
        </footer>
      </div>
    </body>
  </html>
`;
