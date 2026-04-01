javascript:(function(){
const patterns={ipv4:/\b(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)\b/g,defanged_ip: /\b\d{1,3}(\[\.\]|\(\.\)|\s?dot\s?)\d{1,3}(\[\.\]|\(\.\)|\s?dot\s?)\d{1,3}(\[\.\]|\(\.\)|\s?dot\s?)\d{1,3}\b/gi,ipv6:/\b(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|::1|([0-9a-fA-F]{1,4}:){1,7}:)\b/g,md5:/\b[a-fA-F0-9]{32}\b/g,sha1:/\b[a-fA-F0-9]{40}\b/g,sha256:/\b[a-fA-F0-9]{64}\b/g,url:/\bhttps?:\/\/[^\s"'<>]+/gi,defanged:/\b(?:hxxps?:\/\/)?[a-zA-Z0-9.-]+(?:\[\.\][a-zA-Z0-9.-]+)+\b/gi,domain:/\b[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g};

const colors={ipv4:"#4FC3F7",defanged_ip: "#90CAF9",ipv6:"#4DD0E1",md5:"#CE93D8",sha1:"#BA68C8",sha256:"#8E24AA",url:"#FFB74D",defanged:"#FFD54F",domain:"#81C784"};

const seen=new Map();
const results=[];

function refang(str){
  return str
    .replace(/^hxxp/i,"http")
    .replace(/\[\.\]|\(\.\)|\s?dot\s?/gi,".");
}

function addIOC(type,value,context){
const key=type+"|"+value;
if(seen.has(key))return;
const entry={type,value,refanged:refang(value),context:context.trim(),node:null};
seen.set(key,entry);
results.push(entry);
}

function highlightNode(node){
  let originalText = node.nodeValue;
  let newHTML = "";
  let lastIndex = 0;
  let hasMatch = false;
  const combined = new RegExp(
    Object.entries(patterns)
      .map(([type, r]) => `(?<${type}>${r.source})`)
      .join("|"),
    "gi"
  );
  let match;
  while((match = combined.exec(originalText)) !== null){
    hasMatch = true;
    const matchText = match[0];
    const offset = match.index;
    let type = Object.keys(match.groups).find(t => match.groups[t]);
    newHTML += originalText.substring(lastIndex, offset);
    const context = originalText.substring(
      Math.max(0, offset - 30),
      offset + matchText.length + 30
    );

    addIOC(type, matchText, context);
    newHTML += `<mark data-ioc="${type}|${matchText}" style="background:${colors[type]};color:black;padding:1px 2px;border-radius:2px;">${matchText}</mark>`;

    lastIndex = offset + matchText.length;
  }
  if(hasMatch){
    newHTML += originalText.substring(lastIndex);

    const span = document.createElement("span");
    span.innerHTML = newHTML;
    node.replaceWith(span);
  }
}

function walk(node){
if(node.nodeType===3){highlightNode(node);}
else if(node.nodeType===1){
if(["SCRIPT","STYLE","NOSCRIPT"].includes(node.tagName))return;
node.childNodes.forEach(walk);
}
}

walk(document.body);

document.querySelectorAll("mark[data-ioc]").forEach(el=>{
const key=el.dataset.ioc;
if(seen.has(key)){seen.get(key).node=el;}
});

const box=document.createElement("div");
box.style="position:fixed;top:10px;left:10px;width:340px;max-height:90vh;overflow:auto;background:#0d1117;color:#e6edf3;font-size:12px;padding:12px;z-index:999999;border:1px solid #30363d;border-radius:8px;font-family:Arial,sans-serif;";

function makeButton(label){
const btn=document.createElement("button");
btn.innerText=label;
btn.style="background:#21262d;color:#e6edf3;border:1px solid #30363d;border-radius:6px;padding:2px 6px;cursor:pointer;margin-right:4px;";
btn.onmouseover=()=>btn.style.background="#30363d";
btn.onmouseout=()=>btn.style.background="#21262d";
return btn;
}

const title=document.createElement("div");
title.innerText="IOC Finder";
title.style="font-weight:bold;font-size:14px;margin-bottom:8px;";
box.appendChild(title);

const grouped={};
results.forEach(i=>{if(!grouped[i.type])grouped[i.type]=[];grouped[i.type].push(i);});

Object.entries(grouped).forEach(([type, items])=>{
  const headerRow = document.createElement("div");
  headerRow.style = "margin-top:10px; display:flex; align-items:center; justify-content:space-between;";

  const header = document.createElement("div");
  header.innerText = `${type.toUpperCase()} (${items.length})`;
  header.style = `color:${colors[type]};font-weight:bold;`;

  const copyAllBtn = makeButton("Copy All");

  copyAllBtn.onclick = ()=>{
    const sorted = items
      .map(i => i.value)
      .sort((a,b)=>a.localeCompare(b));

    const text = sorted.join("\n");

    navigator.clipboard.writeText(text);

    copyAllBtn.innerText = "✓";
    setTimeout(()=>copyAllBtn.innerText="Copy All",1000);
  };

  headerRow.appendChild(header);
  headerRow.appendChild(copyAllBtn);
  box.appendChild(headerRow);

  items.forEach(ioc=>{
    const row = document.createElement("div");
    row.style = "margin:4px 0; display:flex; align-items:center; flex-wrap:wrap;";

    const goBtn = makeButton("Go");
    goBtn.onclick = ()=>{
      if(ioc.node){
        ioc.node.scrollIntoView({behavior:"smooth",block:"center"});
        ioc.node.style.outline = "2px solid red";
        setTimeout(()=>ioc.node.style.outline="",1500);
      }
    };

    const copyBtn = makeButton("Copy");
    copyBtn.onclick = ()=>{
      navigator.clipboard.writeText(ioc.value);
      copyBtn.innerText = "✓";
      setTimeout(()=>copyBtn.innerText="Copy",800);
    };

    const text = document.createElement("span");
    text.innerText = ioc.value;
    text.style = "margin-left:4px; word-break:break-all;";

    row.appendChild(goBtn);
    row.appendChild(copyBtn);
    row.appendChild(text);
    box.appendChild(row);
  });
});

const exportBtn=makeButton("Export JSON");
exportBtn.style.marginTop="10px";

exportBtn.onclick=()=>{
const clean=results.map(({type,value,refanged,context})=>({type,value,refanged,context}));
const blob=new Blob([JSON.stringify(clean,null,2)],{type:"application/json"});
const a=document.createElement("a");
a.href=URL.createObjectURL(blob);
a.download="iocs.json";
a.click();
};

box.appendChild(exportBtn);
document.body.appendChild(box);

})();
