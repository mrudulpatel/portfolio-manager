import { transporter } from "@/config/nodemailer";
import db from "@/firebase/firebase";
import { collection, getDocs } from "firebase/firestore";
import { NextResponse } from "next/server";

export async function GET(req, res) {
  const colRef = collection(db, "stocks");
  let stocks = [];
  let finalStocks = [];
  const querySnapshot = await getDocs(colRef);
  querySnapshot.forEach((doc) => {
    stocks.push(doc.data());
  });

  const fetchStockData = async (stocks) => {
    const promises = stocks.map(async (stock) => {
      try {
        console.log("Fetching data for: ", stock.symbol);
        const res = await fetch(
          `https://priceapi.moneycontrol.com/pricefeed/nse/equitycash/${stock.symbol}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            timeout: 100000, // 30 seconds
          }
        );

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        if (data && data.data !== null) {
          const {
            pricecurrent: price,
            "52L": low,
            "52H": high,
            company: companyName,
          } = data.data;

          let percentLessFromHigh = (
            ((parseFloat(data.data["52H"]).toFixed(2) -
              parseFloat(price).toFixed(2)) /
              parseFloat(data.data["52H"]).toFixed(2)) *
            100
          ).toFixed(2);

          let gain = (
            ((parseFloat(price).toFixed(2) - parseFloat(stock.buy).toFixed(2)) /
              parseFloat(stock.buy).toFixed(2)) *
            100
          ).toFixed(2);

          if (parseFloat(percentLessFromHigh).toFixed(2) > 25.0) {
            console.log("Sending mail for: ", stock.symbol);
            const res = await sendMail(
              companyName,
              price,
              percentLessFromHigh,
              gain
            );
            if (res) {
              console.log("Mail sent successfully");
            } else {
              console.log("Mail sending failed");
            }
          } else {
            console.log(
              "Stock is not less than 25% from high for: ",
              stock.symbol
            );
          }
          return {
            symbol: stock.symbol,
            percentLessFromHigh: parseFloat(percentLessFromHigh).toFixed(2),
            price: parseFloat(price).toFixed(2),
            low: parseFloat(low).toFixed(2),
            high: parseFloat(high).toFixed(2),
            companyName,
          };
        }
      } catch (error) {
        console.error("Error fetching data for", stock.symbol, error);
      }
    });

    // Use Promise.all to wait for all promises to resolve
    const finalStocks = await Promise.all(promises);
    return finalStocks.filter((stock) => stock); // Filter out undefined values
  };

  finalStocks = await fetchStockData(stocks);
  // console.log("Final Stocks: ", finalStocks);

  return NextResponse.json({ finalStocks });
}

const sendMail = async (stockName, price, percentLessFromHigh, gain) => {
  var mailOptions = {
    from: "Portfolio Manager <mrudulpatel0401@gmail.com>",
    to: "ncpatel25@gmail.com",
    cc: ["aaryapatel0619@gmail.com", "mrudulpatel04@gmail.com"],
    subject: `Stock Alert for ${stockName}`,
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Portfolio Update</title>
  
  <link href="https://cdn.tailwindcss.com" rel="stylesheet">
</head>
<body class="bg-gray-100 font-sans">
  <div class="max-w-xl mx-auto p-6 bg-white rounded shadow-md">
    <h1 class="text-2xl font-bold text-gray-800">Portfolio Update</h1>
    <p class="mt-4">Your stock <span class="font-semibold">${stockName}</span> (CMP: ${price}) in your portfolio is <span class="font-semibold">${percentLessFromHigh}%</span> less from 52-Week High.</p>
    <p class="mt-2">Your overall gain % is <span class="font-semibold">${gain}%</span>.</p>
    <p class="mt-2">To manage your portfolio <a href="https://www.moneycontrol.com/bestportfolio/wealth-management-tool/investments#port_top" class="text-blue-500 hover:underline">click here</a>.</p>
    <p class="mt-4">Please review your portfolio and manage your stocks accordingly.</p>
    <div class="mt-8 border-t border-gray-200 pt-4 text-sm text-gray-600">
      <p>Regards,</p>
      <p class="font-semibold">Portfolio Manager</p>
      <p>Mrudul Patel</p>
    </div>
  </div>
</body>
</html>`,
  };

  let res = undefined;

  await transporter
    .sendMail(mailOptions)
    .then(() => {
      res = true;
    })
    .catch((err) => {
      console.log(err);
      res = false;
    });

  return res;
};
