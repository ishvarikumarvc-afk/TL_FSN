(function(){
    let rawData = [];
    const panel = document.createElement('div');
    panel.style = 'position:fixed;top:10px;right:10px;z-index:9999;background:#111;padding:12px;border-radius:8px;display:flex;flex-direction:column;gap:8px;box-shadow:0 0 20px rgba(0,0,0,0.8);color:white;font-family:sans-serif;width:180px;border:2px solid #333;';
    
    const updateUI = () => {
        panel.innerHTML = `
            <div style="text-align:center;font-weight:bold;font-size:11px;color:#888;">TURBO MODE V3</div>
            <div style="font-size:14px;color:#00ff00;text-align:center;font-weight:bold;">SAVED: ${rawData.length}</div>
            <button id="btn-start" style="background:#2ecc71;color:white;border:none;padding:10px;border-radius:4px;cursor:pointer;font-weight:bold;">START SCAN</button>
            <button id="btn-dl" style="background:#e67e22;color:white;border:none;padding:8px;border-radius:4px;cursor:pointer;font-weight:bold;">DOWNLOAD</button>
        `;
        document.getElementById('btn-start').onclick = startAction;
        document.getElementById('btn-dl').onclick = processAndDownload;
    };

    async function startAction() {
        const inputStr = prompt("IDs paste karein:");
        if (!inputStr) return;
        const ids = inputStr.split(/[\n, ]+/).map(s => s.trim()).filter(s => s);
        for (const id of ids) {
            /* 1. Instant Close */
            const closeX = document.querySelector('button[id*="drawer"] span svg') || document.querySelector('.ant-drawer-close') || document.querySelector('svg.murv-icons');
            if (closeX) { (closeX.closest('button') || closeX.parentElement).click(); await new Promise(r => setTimeout(r, 250)); }
            const box = document.querySelector('#ncob-transfer-list-search');
            if (!box) break;
            /* 2. Super Fast Search */
            box.focus(); box.value = '';
            document.execCommand('insertText', false, id + "0");
            await new Promise(r => setTimeout(r, 150));
            box.setSelectionRange(box.value.length - 1, box.value.length);
            document.execCommand('delete', false);
            await new Promise(r => setTimeout(r, 500));
            const drop = document.querySelector('.hunkdo') || document.querySelector('[class*="SearchText"]');
            if (drop) drop.click();
            /* 3. Fast Row Click */
            let target = null;
            for (let j = 0; j < 15; j++) {
                target = Array.from(document.querySelectorAll('a, span, .ant-table-cell')).find(el => el.innerText.trim() === id);
                if (target) { target.click(); break; }
                await new Promise(r => setTimeout(r, 200));
            }
            /* 4. Instant Capture Logic */
            if (target) {
                for (let i = 0; i < 20; i++) {
                    const bodyText = document.body.innerText;
                    if (bodyText.includes("WID:") && bodyText.includes(id)) {
                        rawData.push({ id: id, content: bodyText });
                        updateUI();
                        break;
                    }
                    await new Promise(r => setTimeout(r, 200));
                }
            }
        }
        alert("Done! Captured: " + rawData.length);
    }

    function processAndDownload() {
        if (rawData.length === 0) return alert("No data!");
        let rows = rawData.map(entry => {
            let fsnMap = {};
            const items = entry.content.split("WID:");
            items.forEach((item, idx) => {
                if (idx === 0) return;
                let lines = item.split("\n").map(l => l.trim()).filter(l => l);
                let prevLines = items[idx-1].split("\n").map(l => l.trim()).filter(l => l);
                let fsn = prevLines[prevLines.length - 1] || "N/A";
                let qtyM = item.match(/(\d+)\s+(Created|Completed|Item Replaced|Item Not Found)/i) || item.match(/Qty:\s*(\d+)/i);
                let qty = qtyM ? parseInt(qtyM[1]) : 0;
                if(fsn.length > 5) fsnMap[fsn] = (fsnMap[fsn] || 0) + qty;
            });
            let sorted = Object.entries(fsnMap).sort((a,b) => b[1] - a[1]);
            return sorted.length > 0 ? `${entry.id},${sorted[0][0]},${sorted[0][1]}` : `${entry.id},NOT_FOUND,0`;
        });
        let csv = "Transfer ID,FSN,Qty\n" + rows.join("\n");
        let a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob([csv], {type:'text/csv'}));
        a.download = "Flipkart_Turbo_Final.csv";
        a.click();
    }

    document.body.appendChild(panel);
    updateUI();
})();
