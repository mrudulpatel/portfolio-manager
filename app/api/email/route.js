import { transporter } from "@/config/nodemailer";
import { NextResponse } from "next/server";
import db from "@/firebase/firebase";
import { collection, getDocs } from "firebase/firestore";

export async function GET(req, res) {
  const colRef = collection(db, "stocks");
  let stocks = [];
  const querySnapshot = await getDocs(colRef);
  querySnapshot.forEach((doc) => {
    stocks.push(doc.data());
  });
  const data = await fetchStockDataForAll(stocks);

  // Define sendEmails function as mentioned before...

  // Usage
  if (data.length > 0) {
    console.log(data);
    const results = await sendEmails(data);

    const successMessages = [];
    const errorMessages = [];

    results.forEach((result) => {
      if (result.success) {
        successMessages.push(result.message);
      } else {
        errorMessages.push(result.message);
      }
    });

    successMessages.forEach((message) => {
      console.log(message);
    });

    errorMessages.forEach((errorMessage) => {
      console.error(errorMessage);
    });

    if (errorMessages.length === 0) {
      return NextResponse.json({ message: "All emails sent successfully" });
    } else {
      return NextResponse.json({
        error: "Some emails failed to send. Check the logs for details.",
      });
    }
  } else {
    console.log("No stocks to send mail");
    return NextResponse.json({ message: "No stocks to send mail" });
  }
}

const sendEmails = async (stocks) => {
  console.log(stocks);
  // Filter out undefined values
  let filteredArray = stocks.filter((item) => item !== undefined);
  console.log("Filtered Array: ", filteredArray);
  const emailPromises = filteredArray.map(
    async ({ companyName, price, percentLessFromHigh, gain }) => {
      console.log("Sending mail for: ", companyName);
      try {
        const info = await transporter.sendMail({
          from: "Portfolio Manager <mrudulpatel0401@gmail.com>",
          to: "ncpatel25@gmail.com",
          cc: ["aaryapatel0619@gmail.com", "mrudulpatel04@gmail.com"],
          subject: `Stock Alert: ${companyName}`,
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
                <p class="mt-4">Your stock <span class="font-semibold">${companyName}</span> (CMP: ${price}) in your portfolio is <span class="font-semibold">${percentLessFromHigh}%</span> less from 52-Week High.</p>
                <p class="mt-2">Your overall gain % is <span class="font-semibold">${gain}%</span>.</p>
                <p class="mt-2">To manage your portfolio <a href="https://portfolio-manager-nse.vercel.app" class="text-blue-500 hover:underline">click here</a>.</p>
                <p class="mt-4">Please review your portfolio and manage your stocks accordingly.</p>
                <div class="mt-8 border-t border-gray-200 pt-4 text-sm text-gray-600">
                <p>Regards,</p>
                <p class="font-semibold">Portfolio Manager</p>
                <p>Mrudul Patel</p>
                </div>
            </div>
            </body>
            </html>`,
        });
        return {
          success: true,
          message: `Mail sent successfully for ${companyName}`,
          info,
        };
      } catch (error) {
        return {
          success: false,
          message: `Failed to send mail for ${companyName}: ${error.message}`,
        };
      }
    }
  );

  return Promise.all(emailPromises);
};

const fetchStockData = async (stock) => {
  try {
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
        if (stock !== undefined) {
          return {
            companyName,
            price,
            percentLessFromHigh,
            gain,
          };
        }
      }
    }
  } catch (error) {
    console.error("Fetch error:", error);
    return null; // Return null in case of error
  }
};

const fetchStockDataForAll = async (stocks) => {
  const promises = stocks.map(fetchStockData);
  const results = await Promise.all(promises);
  const filteredResults = results.filter((result) => result !== null);
  return filteredResults;
};
