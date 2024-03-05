"use client";
import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Cross2Icon } from "@radix-ui/react-icons";
import db from "@/firebase/firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  getDocs,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import {
  Table,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
  TableContainer,
} from "@mui/material";
import { useRouter } from "next/navigation";

const Dashboard = () => {
  const [stocks, setStocks] = React.useState([]);
  const [stocksPrev, setStocksPrev] = React.useState([]); // Previous stock data [price, high, low, priceChange]
  const [symbol, setSymbol] = React.useState("");
  const [quantity, setQuantity] = React.useState(0);
  const [buy, setBuy] = React.useState(0);
  const router = useRouter();

  const handleAddStock = (e) => {
    e.preventDefault();
    console.log("Add Stock", symbol, " ", quantity, " ", buy);
    const addStock = async () => {
      await addDoc(collection(db, "stocks"), {
        symbol: symbol,
        quantity: parseInt(quantity),
        buy: parseFloat(buy),
      }).then((docRef) => {
        document.getElementById("add_dialog_close").click();
        console.log("Document written with ID: ", docRef.id);
        alert("Stock Added Successfully");
      });
    };
    addStock();
    setSymbol("");
    setQuantity(0);
    setBuy(0);
  };

  const handleEditStock = (e) => {
    e.preventDefault();
    console.log("Edit Stock", symbol, " ", quantity, " ", buy);
    const colRef = collection(db, "stocks");
    getDocs(colRef).then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        if (doc.data().symbol === symbol) {
          const docRef = doc.ref;
          updateDoc(docRef, {
            quantity: parseInt(quantity),
            buy: parseFloat(buy),
          })
            .then(() => {
              document.getElementById("dialog_close").click();
            })
            .finally(() => {
              alert("Stock Updated Successfully");
              setSymbol("");
              setQuantity(0);
              setBuy(0);
            });
        }
      });
    });
  };

  React.useEffect(() => {
    const email = sessionStorage.getItem("email");
    if (email !== "ncpatel25@gmail.com") {
      router.push("/");
    }
  }, []);

  // Fetching stock data when component mounts
  React.useEffect(() => {
    const fetchData = async () => {
      const stocksCollection = collection(db, "stocks");
      onSnapshot(stocksCollection, async (snap) => {
        const promises = snap.docs.map(async (doc) => {
          const res = await fetch(
            `https://priceapi.moneycontrol.com/pricefeed/nse/equitycash/${
              doc.data().symbol
            }`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
              },
            }
          );
          //   console.log("Fetching Data for ", doc.data().symbol);
          const data = await res.json();
          if (data && data.data !== null) {
            const {
              pricecurrent: price,
              "52L": low,
              "52H": high,
              company: companyName,
              pricepercentchange: pricepercentchange,
              priceChange: priceChange,
            } = data.data;
            return {
              symbol: doc.data().symbol,
              quantity: doc.data().quantity,
              buy: doc.data().buy,
              price: price,
              high: high,
              low: low,
              priceChange: priceChange,
              pricepercentchange: pricepercentchange,
              className:
                parseFloat(priceChange) === 0.0
                  ? "!text-gray-800"
                  : parseFloat(priceChange) < 0.0
                  ? "!text-red-600"
                  : "!text-green-600",
              companyName: companyName,
            };
          }
          return null;
        });
        const stocksData = await Promise.all(promises);
        const filteredStocksData = stocksData.filter((stock) => stock !== null);
        setStocks(
          filteredStocksData.sort((a, b) => {
            const companyNameA = a.companyName.toUpperCase();
            const companyNameB = b.companyName.toUpperCase();

            if (companyNameA < companyNameB) {
              return -1;
            }
            if (companyNameA > companyNameB) {
              return 1;
            }
            return 0;
          })
        );
      });
    };
    fetchData();
  }, [db]);

  // Live update of stock data
  React.useEffect(() => {
    const interval = setInterval(() => {
      const fetchData = async () => {
        console.log("Updating data");
        const stocksCollection = collection(db, "stocks");
        onSnapshot(stocksCollection, async (snap) => {
          const promises = snap.docs.map(async (doc) => {
            const res = await fetch(
              `https://priceapi.moneycontrol.com/pricefeed/nse/equitycash/${
                doc.data().symbol
              }`,
              {
                method: "GET",
                headers: {
                  "Content-Type": "application/json",
                  Accept: "application/json",
                },
              }
            );
            const data = await res.json();
            if (data && data.data !== null) {
              const {
                pricecurrent: price,
                "52L": low,
                "52H": high,
                company: companyName,
                pricechange: priceChange,
                pricepercentchange: pricepercentchange,
              } = data.data;

              // Calculate price change from stocks array
              console.log("Stock name: ", doc.data().symbol);
              return {
                symbol: doc.data().symbol,
                quantity: doc.data().quantity,
                buy: doc.data().buy,
                price: price,
                high: high,
                pricepercentchange,
                low: low,
                className:
                  parseFloat(priceChange).toFixed(2) === 0.0
                    ? "!text-gray-800"
                    : parseFloat(priceChange).toFixed(2) < 0.0
                    ? "!text-red-600"
                    : "!text-green-600",
                priceChange: parseFloat(priceChange)?.toFixed(2),
                companyName: companyName,
              };
            }
            return null;
          });
          const stocksData = await Promise.all(promises);
          const filteredStocksData = stocksData.filter(
            (stock) => stock !== null
          );
          setStocks(
            filteredStocksData.sort((a, b) => {
              const companyNameA = a.companyName.toUpperCase();
              const companyNameB = b.companyName.toUpperCase();

              if (companyNameA < companyNameB) {
                return -1;
              }
              if (companyNameA > companyNameB) {
                return 1;
              }
              return 0;
            })
          );  
        });
        console.log("Data Updated");
      };
      fetchData();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen">
      {/* Navbar */}
      <nav
        className="flex sticky justify-between items-center h-16 text-white  shadow-sm"
        role="navigation"
      >
        <div className="flex flex-row items-center">
          <a href="/" className="pl-8 text-lg text-black dark:text-white">
            Portfolio Manager
          </a>
          <h1 className="text-lg ml-3 text-gray-800 dark:text-gray-400">
            ncpatel25@gmail.com
          </h1>
        </div>
        <div className="px-4 cursor-pointer md:hidden">
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16m-7 6h7"
            />
          </svg>
        </div>
        <div className="pr-8 md:block hidden">
          <Dialog.Root>
            <Dialog.Trigger asChild>
              <button className="hover:bg-blue-400 dark:hover:bg-blue-500 transition duration-100 ease-in-out inline-flex h-[35px] items-center justify-center rounded-[4px] bg-blue-200 px-[15px] font-medium leading-none text-black focus:shadow-black focus:outline-none">
                Add Stock
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className=" data-[state=open]:animate-overlayShow fixed inset-0" />
              <Dialog.Content className="data-[state=open]:animate-contentShow fixed top-[50%] left-[50%] max-h-[85vh] w-[90vw] max-w-[450px] translate-x-[-50%] translate-y-[-50%] rounded-[6px] bg-white text-black p-[25px]  focus:outline-none">
                <Dialog.Title className="m-0 text-[17px] font-medium">
                  Add New Stock
                </Dialog.Title>
                <Dialog.Description className="mt-[10px] mb-5 text-[15px] leading-normal"></Dialog.Description>
                <form onSubmit={handleAddStock}>
                  <fieldset className="mb-[15px] flex items-center gap-5">
                    <label
                      className="w-[140px] text-left text-[15px]"
                      htmlFor="Stock Symbol"
                    >
                      Stock Symbol Code (Moneycontrol)
                    </label>
                    <input
                      className="border inline-flex h-[35px] w-full flex-1 items-center justify-center rounded-[4px] px-[10px] text-[15px] leading-none  outline-none "
                      id="Stock Symbol"
                      type="text"
                      placeholder="Enter Stock Symbol Code (Moneycontrol)"
                      value={symbol}
                      onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                    />
                  </fieldset>
                  <fieldset className="mb-[15px] flex items-center gap-5">
                    <label
                      className="w-[140px] text-left text-[15px]"
                      htmlFor="Purchase Quantity"
                    >
                      Purchase Quantity
                    </label>
                    <input
                      className="border inline-flex h-[35px] w-full flex-1 items-center justify-center rounded-[4px] px-[10px] text-[15px] leading-none  outline-none "
                      id="Purchase Quantity"
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                    />
                  </fieldset>
                  <fieldset className="mb-[15px] flex items-center gap-5">
                    <label
                      className="w-[140px] text-left text-[15px]"
                      htmlFor="Buy Price"
                    >
                      Buy Price
                    </label>
                    <input
                      className="border inline-flex h-[35px] w-full flex-1 items-center justify-center rounded-[4px] px-[10px] text-[15px] leading-none  outline-none "
                      id="Buy Price"
                      type="text"
                      value={buy}
                      onChange={(e) => setBuy(e.target.value)}
                    />
                  </fieldset>
                  <div className="mt-[25px] flex justify-end">
                    <Dialog.Close
                      asChild
                      id="add_dialog_close"
                      onClick={() => {
                        setSymbol("");
                        setQuantity(0);
                        setBuy(0);
                      }}
                    >
                      <button className="bg-red-400 transition duration-100 ease-in-out hover:bg-red-500  inline-flex h-[35px] items-center justify-center rounded-[4px] px-[15px] font-medium leading-none  focus:outline-none">
                        Cancel
                      </button>
                    </Dialog.Close>
                    <button
                      type="submit"
                      className="bg-green-400 transition duration-100 ease-in-out  hover:bg-green-500 inline-flex h-[35px] items-center justify-center rounded-[4px] px-[15px] font-medium leading-none  focus:outline-none ml-2"
                    >
                      Add
                    </button>
                  </div>
                </form>
                <Dialog.Close asChild>
                  <button
                    className=" focus: absolute top-[10px] right-[10px] inline-flex h-[25px] w-[25px] appearance-none items-center justify-center rounded-full  focus:outline-none"
                    aria-label="Close"
                  >
                    <Cross2Icon />
                  </button>
                </Dialog.Close>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
          <Dialog.Root>
            <Dialog.Trigger asChild>
              <button className="ml-3 hover:bg-gray-400 dark:hover:bg-gray-400 inline-flex h-[35px] items-center justify-center rounded-[4px] bg-white px-[15px] font-medium leading-none  text-black  focus:outline-none">
                Sign Out
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className=" data-[state=open]:animate-overlayShow fixed inset-0" />
              <Dialog.Content className="data-[state=open]:animate-contentShow fixed top-[50%] left-[50%] max-h-[85vh] w-[90vw] max-w-[450px] translate-x-[-50%] translate-y-[-50%] rounded-[6px] bg-white text-black p-[25px]  focus:outline-none">
                <Dialog.Title className=" m-0 text-[17px] font-medium">
                  Sign Out
                </Dialog.Title>
                <Dialog.Description className=" mt-[10px] mb-5 text-[15px] leading-normal">
                  Are you sure you want to sign out?
                </Dialog.Description>
                <div className="mt-[25px] flex justify-end">
                  <Dialog.Close asChild>
                    <button
                      className="bg-green-500 transition duration-100 ease-in-out text-white hover:bg-green-600 focus:shadow-green-700 inline-flex h-[35px] items-center justify-center rounded-[4px] px-[15px] font-medium leading-none  focus:outline-none"
                      aria-label="Cancel"
                    >
                      Cancel
                    </button>
                  </Dialog.Close>
                  <button
                    onClick={() => {
                      router.push("/");
                    }}
                    className="bg-red-500 ml-3 transition duration-100 ease-in-out text-white hover:bg-red-600 focus:shadow-red-700 inline-flex h-[35px] items-center justify-center rounded-[4px] px-[15px] font-medium leading-none  focus:outline-none"
                  >
                    Yes
                  </button>
                </div>
                <Dialog.Close asChild>
                  <button
                    className=" focus: absolute top-[10px] right-[10px] inline-flex h-[25px] w-[25px] appearance-none items-center justify-center rounded-full  focus:outline-none"
                    aria-label="Close"
                  >
                    <Cross2Icon />
                  </button>
                </Dialog.Close>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </nav>
      <section className="flex flex-col max-h-[calc(100vh - 4rem)] items-center justify-center overflow-hidden">
        <TableContainer sx={{ maxHeight: "calc(100vh - 4rem) !important" }}>
          <Table
            stickyHeader
            sx={{ textAlign: "center !important" }}
            className="w-full border overflow-auto"
          >
            <TableHead sx={{ textAlign: "center !important" }}>
              <TableRow sx={{ textAlign: "center !important" }}>
                <TableCell
                  sx={{
                    background: "white",
                    color: "black !important",
                    textAlign: "center ",
                  }}
                  className="border-4 w-[fit-content]"
                >
                  Sr. No.
                </TableCell>
                <TableCell
                  sx={{
                    background: "white",
                    color: "black !important",
                    textAlign: "center ",
                  }}
                  className="border-4"
                >
                  Stock Name
                </TableCell>
                <TableCell
                  sx={{
                    background: "white",
                    color: "black !important",
                    textAlign: "center ",
                  }}
                  className="border-4"
                >
                  Current Price
                </TableCell>
                <TableCell
                  sx={{
                    background: "white",
                    color: "black !important",
                    textAlign: "center ",
                  }}
                  className="border-4"
                >
                  Price Change (%)
                </TableCell>
                <TableCell
                  sx={{
                    background: "white",
                    color: "black !important",
                    textAlign: "center ",
                  }}
                  className="border-4"
                >
                  52 Week High
                </TableCell>
                <TableCell
                  sx={{
                    background: "white",
                    color: "black !important",
                    textAlign: "center ",
                  }}
                  className="border-4"
                >
                  52 Week Low
                </TableCell>
                <TableCell
                  sx={{
                    background: "white",
                    color: "black !important",
                    textAlign: "center ",
                  }}
                  className="border-4"
                >
                  Quantity
                </TableCell>
                <TableCell
                  sx={{
                    background: "white",
                    color: "black !important",
                    textAlign: "center ",
                  }}
                  className="border-4"
                >
                  Buy Price
                </TableCell>
                <TableCell
                  sx={{
                    background: "white",
                    color: "black !important",
                    textAlign: "center ",
                  }}
                  className="border-4"
                >
                  % Less from high
                </TableCell>
                <TableCell
                  sx={{
                    background: "white",
                    color: "black !important",
                    textAlign: "center ",
                  }}
                  className="border-4"
                >
                  Latest Value
                </TableCell>
                <TableCell
                  sx={{
                    background: "white",
                    color: "black !important",
                    textAlign: "center ",
                  }}
                  className="border-4"
                >
                  Overall Gain/Loss %
                </TableCell>
                <TableCell
                  sx={{
                    background: "white",
                    color: "black !important",
                    textAlign: "center",
                  }}
                  className="border-4"
                >
                  Overall Gain/Loss (in ₹)
                </TableCell>
                <TableCell
                  sx={{
                    background: "white",
                    color: "black !important",
                    textAlign: "center ",
                  }}
                  className="border-4"
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody sx={{ textAlign: "center !important" }}>
              {stocks.length === 0 ? (
                <TableRow>
                  <TableCell className="text-black border-4 bg-white text-center" colSpan="13">
                    No Stocks Added
                  </TableCell>
                </TableRow>
              ) : (
                stocks.map((stock, index) => (
                  <TableRow
                    key={index}
                    className="text-black border-4 bg-white"
                  >
                    <TableCell
                      sx={{ textAlign: "center", fontSize: "15px" }}
                      className="border-4"
                    >
                      {index + 1}
                    </TableCell>
                    <TableCell
                      sx={{ textAlign: "center", fontSize: "15px" }}
                      className="border-4"
                    >
                      {stock.companyName}
                    </TableCell>
                    <TableCell
                      sx={{
                        textAlign: "center",
                        fontSize: "15px",
                        fontWeight: "bold",
                      }}
                      className={`border-4 ${stock.className}`}
                    >
                      {stock.price}
                    </TableCell>
                    <TableCell
                      sx={{
                        textAlign: "center",
                        fontSize: "15px",
                        fontWeight: "bold",
                      }}
                      className={`border-4 ${stock.className}`}
                    >
                      {parseFloat(stock?.pricepercentchange).toFixed(2)}%
                    </TableCell>

                    <TableCell
                      sx={{ textAlign: "center", fontSize: "15px" }}
                      className="border-4"
                    >
                      {stock.high}
                    </TableCell>
                    <TableCell
                      sx={{ textAlign: "center", fontSize: "15px" }}
                      className="border-4"
                    >
                      {stock.low}
                    </TableCell>
                    <TableCell
                      sx={{ textAlign: "center", fontSize: "15px" }}
                      className="border-4"
                    >
                      {stock.quantity}
                    </TableCell>
                    <TableCell
                      sx={{ textAlign: "center", fontSize: "15px" }}
                      className="border-4"
                    >
                      {stock.buy.toFixed(2)}
                    </TableCell>
                    <TableCell
                      sx={{
                        textAlign: "center",
                        fontSize: "15px",
                        fontWeight: "bold",
                      }}
                      className="border-4"
                    >
                      {(
                        ((stock.high - stock.price) / stock.high) *
                        100
                      ).toFixed(2)}
                    </TableCell>
                    <TableCell
                      sx={{ textAlign: "center", fontSize: "15px" }}
                      className="border-4"
                    >
                      {(stock.price * stock.quantity).toFixed(2)}
                    </TableCell>
                    <TableCell
                      sx={{ textAlign: "center", fontSize: "15px" }}
                      className="border-4"
                    >
                      {(((stock.price - stock.buy) / stock.buy) * 100).toFixed(
                        2
                      )}
                    </TableCell>
                    <TableCell
                      sx={{ textAlign: "center", fontSize: "15px" }}
                      className="border-4"
                    >
                      {(
                        stock.price * stock.quantity -
                        stock.buy * stock.quantity
                      ).toFixed(2)}
                    </TableCell>
                    <TableCell
                      sx={{ textAlign: "center" }}
                      className="border-4 p-2 flex items-center justify-around"
                    >
                      <button
                        className="bg-red-500 transition duration-100 ease-in-out border-red-500 hover:bg-red-400 text-white max-w-full p-2 rounded-md"
                        onClick={() => {
                          confirm(
                            `Are you sure you want to delete ${stock.companyName}?`
                          ) &&
                            (async () => {
                              const colRef = collection(db, "stocks");
                              const querySnapshot = await getDocs(colRef);
                              querySnapshot.forEach(async (doc) => {
                                if (doc.data().symbol === stock.symbol) {
                                  await deleteDoc(doc.ref).then(() => {
                                    alert("Stock Deleted Successfully");
                                  });
                                }
                              });
                            })();
                        }}
                      >
                        Delete
                      </button>
                      <Dialog.Root>
                        <Dialog.Trigger asChild className="">
                          <button
                            className="bg-green-700 transition duration-100 ease-in-out border-green-500 hover:bg-green-400 ml-2 text-white max-w-full p-2 rounded-md"
                            onClick={() => {
                              setSymbol(stock.symbol);
                              setQuantity(stock.quantity);
                              setBuy(stock.buy);
                            }}
                          >
                            Edit
                          </button>
                        </Dialog.Trigger>
                        <Dialog.Portal>
                          <Dialog.Overlay className=" data-[state=open]:animate-overlayShow fixed inset-0" />
                          <Dialog.Content className="data-[state=open]:animate-contentShow fixed top-[50%] left-[50%] max-h-[85vh] w-[90vw] max-w-[450px] translate-x-[-50%] translate-y-[-50%] rounded-[6px] bg-white text-black p-[25px] focus:outline-none">
                            <Dialog.Title className=" m-0 text-[17px] font-medium">
                              Edit {stock.companyName}
                            </Dialog.Title>
                            <Dialog.Description className=" mt-[10px] mb-5 text-[15px] leading-normal"></Dialog.Description>
                            <form onSubmit={handleEditStock}>
                              <fieldset className="mb-[15px] flex items-center gap-5">
                                <label
                                  className="w-[140px] text-left text-[15px]"
                                  htmlFor="Stock Symbol"
                                >
                                  Stock Symbol Code (moneycontrol)
                                </label>
                                <input
                                  className="border  inline-flex h-[35px] w-full flex-1 items-center justify-center rounded-[4px] px-[10px] text-[15px] leading-none  outline-none "
                                  id="Stock Symbol"
                                  type="text"
                                  readOnly
                                  value={symbol}
                                  onChange={(e) =>
                                    setSymbol(e.target.value.toUpperCase())
                                  }
                                />
                              </fieldset>
                              <fieldset className="mb-[15px] flex items-center gap-5">
                                <label
                                  className="w-[140px] text-left text-[15px]"
                                  htmlFor="Purchase Quantity"
                                >
                                  Purchase Quantity
                                </label>
                                <input
                                  className="border inline-flex h-[35px] w-full flex-1 items-center justify-center rounded-[4px] px-[10px] text-[15px] leading-none  outline-none "
                                  id="Purchase Quantity"
                                  type="number"
                                  value={quantity}
                                  onChange={(e) => setQuantity(e.target.value)}
                                />
                              </fieldset>
                              <fieldset className="mb-[15px] flex items-center gap-5">
                                <label
                                  className="w-[140px] text-left text-[15px]"
                                  htmlFor="Buy Price"
                                >
                                  Buy Price
                                </label>
                                <input
                                  className="border inline-flex h-[35px] w-full flex-1 items-center justify-center rounded-[4px] px-[10px] text-[15px] leading-none  outline-none "
                                  id="Buy Price"
                                  type="text"
                                  value={buy}
                                  onChange={(e) => setBuy(e.target.value)}
                                />
                              </fieldset>
                              <div className="mt-[25px] flex justify-end">
                                <Dialog.Close
                                  asChild
                                  id="dialog_close"
                                  onClick={() => {
                                    setSymbol("");
                                    setQuantity(0);
                                    setBuy(0);
                                  }}
                                >
                                  <button className="bg-red-500 hover:bg-red-600  inline-flex h-[35px] transition duration-100 ease-in-out items-center justify-center rounded-[4px] px-[15px] font-medium leading-none  focus:outline-none">
                                    Cancel
                                  </button>
                                </Dialog.Close>
                                <button
                                  type="submit"
                                  className="bg-green-400 ml-3 hover:bg-green-500 transition duration-100 ease-in-out inline-flex h-[35px] items-center justify-center rounded-[4px] px-[15px] font-medium leading-none  focus:outline-none"
                                >
                                  Update
                                </button>
                              </div>
                            </form>
                            <Dialog.Close
                              asChild
                              onClick={() => {
                                setSymbol("");
                                setQuantity(0);
                                setBuy(0);
                              }}
                            >
                              <button
                                className=" focus: absolute top-[10px] right-[10px] inline-flex h-[25px] w-[25px] appearance-none items-center justify-center rounded-full  focus:outline-none"
                                aria-label="Close"
                              >
                                <Cross2Icon />
                              </button>
                            </Dialog.Close>
                          </Dialog.Content>
                        </Dialog.Portal>
                      </Dialog.Root>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </section>
    </main>
  );
};

export default Dashboard;
