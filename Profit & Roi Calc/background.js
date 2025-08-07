const KEEPA_API_KEY = "Your API Key"; // Replace with your API Key
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "fetchKeepa") {
    const asin = request.asin;
    if (!asin) {
      sendResponse({ error: "ASIN not valid." });
      return;
    }

    const url = `https://api.keepa.com/product?key=${KEEPA_API_KEY}&domain=1&asin=${asin}&stats=30&buybox=1&offers=20`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (!data || !data.products || data.products.length === 0) {
          sendResponse({ error: "Data not found." });
          return;
        }

        // Kirim data ke content.js
        sendResponse({ data });
      })
      .catch(err => {
        console.error("Fetch Keepa Error:", err);
        sendResponse({ error: err.toString() });
      });

    return true; // Penting agar sendResponse bisa dipanggil async
  }
});