const express = require("express");
const fs = require("fs");
const axios = require("axios");
const shelljs = require("shelljs");
const sequelize = require("./database/connection");
const PoeTrade = require("./database/model/PoeTrade");

const { Client, LocalAuth } = require("whatsapp-web.js");

require('dotenv').config()

process.title = "whatsapp-node-api";
global.client = new Client({
    puppeteer: {  args: ["--no-sandbox"] },
});

global.authed = false;

const app = express();

const port = process.env.PORT;
app.use(express.urlencoded({extended: false}))
app.use(express.json())

sequelize.authenticate().then(() => {
    console.log("Conexión a la base de datos establecida correctamente.");
})
.catch((error) => {
    console.error("Error al conectar a la base de datos:", error);
});

client.on("qr", (qr) => {
    console.log("qr");
    fs.writeFileSync("./components/last.qr", qr);
});

client.on("authenticated", () => {
    console.log("AUTH!");
    authed = true;

    try {
        fs.unlinkSync("./components/last.qr");
    } catch (err) {}
});

client.on("auth_failure", () => {
    console.log("AUTH Failed !");
    process.exit();
});

client.on("ready", () => {
    console.log("Client is ready!");
});

client.on("message", async (msg) => {
    if (process.env.WEBHOOK_ENABLED) {
        if (msg.hasMedia) {
            const attachmentData = await msg.downloadMedia();
            msg.attachmentData = attachmentData;
        }
        // axios.post(process.env.WEBHOOK_PATH, { msg });
    }
});
client.on("disconnected", () => {
    console.log("disconnected");
});

client.on("message", async (message) => {
  // var chatID = await client.getChatById();
  // var getChat = await message.getChat() ;
  // var getContact = await  message.getContact();
  // console.log('get chat', getChat);
  // console.log('getContact', getContact);
  console.log(message.from);
  //add tr/x/Filter
  switch (message.body.split("/")[0]) {
      case "add tr":
          console.log(message.body);
          let query = message.body.split("/")[2];

          var options = {
              method: "POST",
              url: `https://www.pathofexile.com/api/trade/search/Ancestor/${query}`,
              headers: {
                  Accept: "*/*",
                  "User-Agent":
                      "Thunder Client (https://www.thunderclient.com)",
              },
          };

          axios
              .request(options)
              .then(async (response) => {
                  //   console.log(response.data);

                  const createdTrade = await PoeTrade.create({
                      number_client: message.from,
                      query: response.data.id,
                      price_max: parseInt(message.body.split("/")[1]),
                  });
                  if (createdTrade) {
                      console.log("insert track with success", createdTrade);
                      client.sendMessage(
                          message.from,
                          "insert track with success"
                      );
                  }
              })
              .catch(function (error) {
                  console.error(error);
                  client.sendMessage(
                      message.from,
                      "no fue posible crear el tracker por favor intenta de nuevo"
                  );
              });

          break;

      case "list tr":
          try {
              const trades = await PoeTrade.findAll({
                  where: { number_client: message.from },
              });
              trades.forEach((trade) => {
                  client.sendMessage(
                      message.from,
                      `pathofexile.com/trade/search/Ancestor/${trade.query}`
                  );
              });
          } catch (error) {
              console.error(error);
          }
          break;

      case "delete tr":
          try {
              const deletedTradeCount = await PoeTrade.destroy({
                  where: { query: message.body.split("/")[1] },
              });
              if (deletedTradeCount > 0) {
                  client.sendMessage(
                      message.from,
                      `fue eliminado : ${message.body.split("/")[1]}`
                  );
              } else {
                  client.sendMessage(
                      message.from,
                      `No se encontró el trade para eliminar`
                  );
              }
          } catch (error) {
              console.error(error);
          }
          break;

      case "hello":
          client.sendMessage(message.from, "world");

          break;
      default:
          client.sendMessage(
              message.from,
              "comando invalido, puedes intentar con: add tr, list tr, delete tr"
          );
          break;
  }
});

client.initialize().catch(console.log);

var verifyItems = function () {
  var intr = setInterval(async function () {
      const timerCurrent = new Date(Date.now());

      try {
          const pendingRequest = await PoeTrade.findAll();
          console.log("entro en base");

          pendingRequest.forEach(async (track) => {
              var options = {
                  method: "POST",
                  url: `https://www.pathofexile.com/api/trade/search/Ancestor/${track.query}`,
                  headers: {
                      Accept: "*/*",
                      "User-Agent":
                          "Thunder Client (https://www.thunderclient.com)",
                  },
              };

              await axios
                  .request(options)
                  .then(async function (response) {
                      console.log("primer axios response: ", response.data);
                      var listResult =
                          response.data.result.length > 10
                              ? response.data.result.slice(0, 10)
                              : response.data.result;
                      var options = {
                          method: "GET",
                          url: `https://www.pathofexile.com/api/trade/fetch/${listResult.join()}`,
                          params: { query: response.data.id },
                          headers: {
                              Accept: "*/*",
                              "User-Agent":
                                  "Thunder Client (https://www.thunderclient.com)",
                          },
                      };

                      await axios
                          .request(options)
                          .then(function (response) {
                              // console.log('verificando response',response)
                              response.data.result.forEach((item) => {
                                  console.log("segundo axios: ");
                                  // console.log(response.data.result[0]);
                                  // console.log(
                                  //     response.result
                                  // );
                                  if (
                                      item.listing.price.amount <=
                                      track.price_max
                                  ) {
                                      client.sendMessage(
                                          track.number_client,
                                          `tu item esta disponible
                                          precio: ${item.listing.price.amount} ${item.listing.price.currency}
                                          `
                                      );
                                      client.sendMessage(
                                          track.number_client,
                                          `link: https://www.pathofexile.com/trade/search/Ancestor/${track.query}
                                          whisper: ${item.listing.whisper}`
                                      );
                                      client.sendMessage(
                                          track.number_client,
                                          `whisper: ${item.listing.whisper}`
                                      );
                                      client.sendMessage(
                                          track.number_client,
                                          `puede eliminar: puede usar el link https://wa.me/5511918987356?text=delete%20tr/${track.query}`
                                      );
                                      client.sendMessage(
                                          track.number_client,
                                          `o puede enviar:  delete tr/${track.query}`
                                      );
                                  }
                                  console.log(
                                      `precio: ${item.listing.price.amount} ${item.listing.price.currency}`
                                  );
                              });
                          })
                          .catch(function (error) {
                              console.error(error);
                          });
                  })
                  .catch(function (error) {
                      console.error(error);
                  });
          });
      } catch (error) {
          console.error(error);
      }
      console.log(timerCurrent.toTimeString());
  }, 120000); // 2min
};

verifyItems();

const chatRoute = require("./components/chatting");
const groupRoute = require("./components/group");
const authRoute = require("./components/auth");
const contactRoute = require("./components/contact");

app.use(function (req, res, next) {
    console.log(req.method + " : " + req.path);
    next();
});
app.use("/chat", chatRoute);
app.use("/group", groupRoute);
app.use("/auth", authRoute);
app.use("/contact", contactRoute);

app.listen(port, () => {
    console.log("Server Running Live on Port : " + `http://localhost:${port}`);
});
