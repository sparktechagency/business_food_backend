

export const companyAccountCreatedByAdminEmail = (userData: any) => `
  <html>
    <head>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap');

        body {
          font-family: 'Inter', Arial, sans-serif;
          margin: 0;
          padding: 0;
          background-color: #f7f8fa;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          padding: 30px;
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.08);
        }
        h1 {
          color: #111827;
          font-size: 26px;
          margin-bottom: 20px;
          font-weight: 600;
        }
        p {
          color: #374151;
          font-size: 16px;
          line-height: 1.6;
          margin: 12px 0;
        }
        .credentials {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          padding: 18px;
          margin: 24px 0;
          border-radius: 8px;
        }
        .credentials p {
          margin: 6px 0;
          font-size: 15px;
        }
        strong {
          color: #111827;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background-color: #2563eb;
          color: #fff;
          text-decoration: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          transition: background-color 0.3s ease;
        }
        .button:hover {
          background-color: #1e40af;
        }
        footer {
          margin-top: 30px;
          font-size: 14px;
          color: #6b7280;
          text-align: center;
            background-color: #ffffffff;
        }
        .logo {
          text-align: center;
          margin-bottom: 24px;
        }
        .logo img {
          height: 50px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">
          <img src="https://i.ibb.co.com/HfrxM4Xf/Business-Food-Service.png" alt="Business Food Service Logo" />
        </div>
        <h1>Welcome to Business Food Service.</h1>
        <p>Hello <strong>${userData?.name}</strong>,</p>
        <p>An account has been created for you by our Admin team. Here are your login details:</p>
        
        <div class="credentials">
          <p><strong>Email:</strong> ${userData?.email}</p>
          <p><strong>Password:</strong> ${userData?.password}</p>
        </div>

       <p>👉 For your security, please log in as soon as possible and update your password.</p> 

<p>If you need any assistance or have questions, don’t hesitate to reach out to our support team at  
<a href="mailto:support@businessfood.com">support@businessfood.com</a>. We’re here to help!</p>

        <footer style="margin-top:20px; padding-top:15px; border-top:1px solid #e5e7eb; text-align:center;">
  <p style="font-size:13px; color:#6b7280; margin:5px 0;">
    Thank you for joining us,<br><strong>Business Food Service Team</strong>
  </p>
  <p style="font-size:12px; color:#9ca3af; margin:5px 0;">
    📧 <a href="mailto:support@businessfood.com" style="color:#2563eb; text-decoration:none;">support@businessfood.com</a>
  </p>
  <p style="font-size:11px; color:#9ca3af; margin-top:8px;">
    © ${new Date().getFullYear()} Business Food Service. All rights reserved.
  </p>
</footer>
      </div>
    </body>
  </html>
`;
