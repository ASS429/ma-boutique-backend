const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,  // ton Gmail
    pass: process.env.EMAIL_PASS   // ton mot de passe d’application
  }
});

/**
 * Envoie un email
 * @param {string} to - destinataire
 * @param {string} subject - objet
 * @param {string} text - texte brut
 */
async function sendEmail(to, subject, text) {
  try {
    await transporter.sendMail({
      from: `"Ma Boutique" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text
    });
    console.log("📧 Email envoyé à", to);
  } catch (err) {
    console.error("❌ Erreur envoi email:", err);
  }
}

module.exports = sendEmail;
