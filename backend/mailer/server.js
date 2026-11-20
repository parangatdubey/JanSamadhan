const express = require('express');
const cors = require('cors');
const { sendEmail } = require('./send_mail');

const app = express();
const PORT = process.env.MAILER_PORT || 5001;

app.use(cors());
app.use(express.json());

app.get('/api/mail/health', (req, res) => {
  res.json({ status: 'ok', service: 'JanSamadhan Nodemailer Microservice' });
});

app.post('/api/mail/send-otp', async (req, res) => {
  const { to, otp, name } = req.body;
  if (!to || !otp) {
    return res.status(400).json({ success: false, error: "Both 'to' and 'otp' are required." });
  }

  const result = await sendEmail({ to, type: 'otp', otp, name: name || 'Citizen' });
  if (result.success) {
    return res.json(result);
  } else {
    return res.status(500).json(result);
  }
});

app.post('/api/mail/send-complaint', async (req, res) => {
  const { to, name, complaint } = req.body;
  if (!to || !complaint) {
    return res.status(400).json({ success: false, error: "Both 'to' and 'complaint' are required." });
  }

  const result = await sendEmail({ to, type: 'complaint', name: name || 'Citizen', complaint });
  if (result.success) {
    return res.json(result);
  } else {
    return res.status(500).json(result);
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[Nodemailer Server] Running on http://127.0.0.1:${PORT}`);
  });
}

module.exports = app;
