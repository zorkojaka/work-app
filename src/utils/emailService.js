import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "inteligentdoo@gmail.com", // Zamenjaj s svojim emailom
    pass: "Salusdd1", // Uporabi geslo za aplikacije
  },
});

export const sendUserCredentials = async (email, username, password) => {
  const mailOptions = {
    from: "inteligentdoo@gmail.com",
    to: email,
    subject: "Dostop do aplikacije",
    text: `Pozdravljeni,\n\nVaši prijavni podatki za aplikacijo:\nUporabniško ime: ${username}\nGeslo: ${password}\n\nPrijavite se na: https://tvoja-aplikacija.com/login\n\nPo prvem prijavljanju si spremenite geslo.`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email poslan na ${email}`);
    return true;
  } catch (error) {
    console.error("Napaka pri pošiljanju emaila:", error);
    return false;
  }
};
