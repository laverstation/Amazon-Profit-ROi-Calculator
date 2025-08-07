(function () {
    const asinMatch = window.location.href.match(/\/dp\/([A-Z0-9]{10})/);
    if (!asinMatch) return;
    const asin = asinMatch[1];

    const panel = document.createElement("div");
    panel.id = "keepa-extension-panel";
    panel.innerHTML = `
    <h4>📦 Keepa Amazon Data</h4>
    <p><strong>ASIN:</strong> <span id="asin">${asin}</span></p>
    <p><strong>Buy Box:</strong> $<span id="buyboxs">...</span></p>
    <p><strong>New 3rd Party FBA:</strong> $<span id="fba">...</span></p>
    <p><strong>Referral %:</strong> <span id="ref-percent">...</span>%</p>
    <p><strong>Referral Fee:</strong> $<span id="ref-fee">...</span></p>
    <p><strong>Pick & Pack Fee:</strong> $<span id="pack-fee">...</span></p>
    <p><strong>Monthly Sold:</strong> <span id="month-sold">...</span></p>

    <label for="cog"><strong>CoG ($):</strong></label>
    <input type="number" id="cog" placeholder="Cost of Goods" step="0.01" style="width: 100%; margin: 5px 0;" />
    <button id="calc-btn" style="width: 100%;">Calculate</button>

    <p><strong>Profit:</strong> $<span id="profit">-</span></p>
    <p><strong>ROI:</strong> <span id="roi">-</span>%</p>
  `;
    const titleElement = document.getElementById("title");
    if (titleElement && titleElement.parentElement) {
        titleElement.parentElement.appendChild(panel);
    }

    chrome.runtime.sendMessage({ action: "fetchKeepa", asin }, (response) => {
        if (!response?.data) return;

        const product = response.data.products?.[0];
        if (!product || !product.csv) return;

        const csv = product.csv;

        const getLastValidCents = (arr) => {
            if (!Array.isArray(arr)) return 0;
            for (let i = arr.length - 1; i >= 0; i--) {
                if (typeof arr[i] === "number" && arr[i] > 0) return arr[i];
            }
            return 0;
        };


        const newFbaCents = getLastValidCents(csv[10]); // take the lowest price data from csv for the time being New FBA not current FBA

        const referralPercent = product.referralFeePercentage ?? 0; // take data from the product referralFeePercentage section ?? it means if there is none return the value 0
        const pickPack = (product.fbaFees?.pickAndPackFee ?? 0) / 100; // Take the data from the product section of fbaFees (this is an array), then take the pickAndPackFee section and divide it by 100 because the value is cents.
        const monthSold = product.monthlySold ?? 0;

        const stats = product.stats;
        const buyBox = (stats?.buyBoxPrice > 0) ? stats.buyBoxPrice / 100 : 0; // ? meaning if else, if the condition before ? and else after ?
        const newFba = newFbaCents / 100;

        const usedPrice = buyBox > 0 ? buyBox : newFba;
        const referralFee = usedPrice * referralPercent / 100;

        // Tampilkan ke UI
        document.getElementById('buyboxs').textContent = buyBox.toFixed(2);
        document.getElementById('fba').textContent = newFba.toFixed(2);
        document.getElementById('ref-percent').textContent = referralPercent.toFixed(2);
        document.getElementById('ref-fee').textContent = referralFee.toFixed(2);
        document.getElementById('pack-fee').textContent = pickPack.toFixed(2);
        document.getElementById('month-sold').textContent = monthSold.toFixed(0);

        // Kalkulasi Profit dan ROI
        document.getElementById('calc-btn').addEventListener('click', () => {
            const cog = parseFloat(document.getElementById('cog').value || "0");
            if (isNaN(cog) || cog <= 0) {
                alert("Input your CoG (Buy Price).");
                return;
            }

            const profit = usedPrice - cog - referralFee - pickPack;
            const roi = (profit / cog) * 100;

            document.getElementById('profit').textContent = profit.toFixed(2);
            document.getElementById('roi').textContent = isFinite(roi) ? roi.toFixed(2) : "0.00";
        });
    });
})();